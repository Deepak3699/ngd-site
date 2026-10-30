/**
 * POST /api/leads — public endpoint. Every form on the site funnels through here.
 *
 * Body: { category: 'student' | 'client', ...fields, sourceSection, meta }
 * Response: { ok: true, ref, id, duplicate? }
 */
import {
  clean,
  clientIp,
  fail,
  getQuery,
  hashIp,
  isEmail,
  isPhone,
  json,
  LIMITS,
  methodNotAllowed,
  normalizeEmail,
  ok,
  rateLimit,
  readBody,
  referenceId,
  userAgent,
} from './_http.js';
import { addEvent, createLead, findDupeLead } from './_db.js';
import { notifyNewLead } from './_notify.js';

const CATEGORIES = new Set(['student', 'client']);

const STUDENT_NEEDS = new Set([
  'Portfolio Website', 'Final-Year Project', 'Mentorship', 'Internship Track', 'Other / Not sure',
]);
const CLIENT_NEEDS = new Set([
  'Brand & Design', 'Website / Landing Page', 'Web App / Platform', 'Mobile App',
  'Digital Marketing', 'SEO & Content', 'AI & Automation', 'Something else',
]);

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return ok(res, {});
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const body = await readBody(req);

  /* ---------- spam gates ---------- */
  // 1. honeypot field hidden in the markup — real users never fill it.
  if (clean(body.website_url || body.hp, 200)) {
    return ok(res, { ref: referenceId(), spam: true });
  }
  // 2. forms report how long the visitor spent before submitting (<1.2s = bot).
  const elapsed = Number(body.elapsedMs);
  if (Number.isFinite(elapsed) && elapsed > 0 && elapsed < 1200) {
    return ok(res, { ref: referenceId(), spam: true });
  }

  const limit = rateLimit(`lead:${clientIp(req)}`, 8, 60_000);
  if (!limit.allowed) {
    return json(
      res,
      429,
      { ok: false, error: { code: 'rate_limited', message: 'Too many submissions. Please try again in a minute.' } },
      { 'Retry-After': String(limit.retryAfter) }
    );
  }

  /* ---------- validation ---------- */
  const category = clean(body.category, 20).toLowerCase();
  if (!CATEGORIES.has(category)) {
    const label = body.categoryLabel ? ` ("${clean(body.categoryLabel, 40)}")` : '';
    return fail(res, 422, 'invalid_category', `Please choose whether you are a Student or a Business / Other${label}.`);
  }

  const name = clean(body.name, LIMITS.name);
  const email = normalizeEmail(clean(body.email, LIMITS.email));
  const phone = clean(body.phone, LIMITS.phone);
  const message = clean(body.message, LIMITS.text);

  const errors = {};
  if (name.length < 2) errors.name = 'Please enter your full name.';
  if (!isEmail(email)) errors.email = 'Please enter a valid email address.';
  if (phone && !isPhone(phone)) errors.phone = 'Please enter a valid phone number (or leave it blank).';
  if (message.length > LIMITS.text) errors.message = 'Message is too long.';

  if (category === 'student') {
    const studentNeed = clean(body.studentNeed, LIMITS.short);
    if (studentNeed && !STUDENT_NEEDS.has(studentNeed)) errors.studentNeed = 'Unknown option.';
  } else {
    const clientNeed = clean(body.clientNeed, LIMITS.short);
    if (clientNeed && !CLIENT_NEEDS.has(clientNeed)) errors.clientNeed = 'Unknown option.';
  }

  if (Object.keys(errors).length) {
    return json(res, 422, {
      ok: false,
      error: { code: 'validation_failed', message: 'Please fix the highlighted fields.', fields: errors },
    });
  }

  /* ---------- duplicate guard ---------- */
  try {
    const dupe = await findDupeLead(email, category, 45);
    if (dupe) return ok(res, { ref: dupe.ref, id: dupe.id, duplicate: true });
  } catch {
    /* never block a real submission because of the dupe check */
  }

  /* ---------- persist ---------- */
  const ref = referenceId();
  const record = {
    ref,
    category,
    name,
    email,
    phone: phone || null,
    college: category === 'student' ? clean(body.college, LIMITS.short) || null : null,
    course: category === 'student' ? clean(body.course, LIMITS.short) || null : null,
    study_year: category === 'student' ? clean(body.studyYear, 40) || null : null,
    student_need: category === 'student' ? clean(body.studentNeed, LIMITS.short) || null : null,
    company: category === 'client' ? clean(body.company, LIMITS.short) || null : null,
    role: category === 'client' ? clean(body.role, LIMITS.short) || null : null,
    website: category === 'client' ? clean(body.companyWebsite, 200) || null : null,
    industry: category === 'client' ? clean(body.industry, LIMITS.short) || null : null,
    client_need: category === 'client' ? clean(body.clientNeed, LIMITS.short) || null : null,
    budget: category === 'client' ? clean(body.budget, 60) || null : null,
    timeline: category === 'client' ? clean(body.timeline, 60) || null : null,
    message: message || null,
    source_section: clean(body.sourceSection, 60) || 'contact',
    page_url: clean(body.pageUrl, 300) || null,
    user_agent: userAgent(req),
    ip_hash: hashIp(req),
    meta: {
      ...(typeof body.meta === 'object' && body.meta ? body.meta : {}),
      query: getQuery(req).src || null,
      referrer: clean(body.referrer, 300) || null,
    },
  };

  try {
    const created = await createLead(record);

    // Log it + ping you on WhatsApp / email. Never blocks the visitor.
    try {
      await addEvent({ leadId: created.id, actor: 'website', actorName: 'Website form', action: 'created', detail: category });
    } catch { /* worklog is best-effort */ }

    try {
      const alerts = await notifyNewLead(created);
      const sent = Object.entries(alerts).filter(([, v]) => v === 'sent').map(([k]) => k);
      if (sent.length) console.log(`[leads] alerts sent via ${sent.join(', ')} for ${created.ref}`);
    } catch (err) {
      console.error('[leads] notification failed (submission still saved):', err?.message || err);
    }

    return ok(res, {
      ref: created.ref,
      id: created.id,
      category,
      message:
        category === 'student'
          ? "You're on the list. Expect a reply within 24 hours with next steps and student pricing."
          : "Thanks — we'll reply within 24 hours with a scoped plan and fixed price.",
    });
  } catch (err) {
    console.error('[leads] insert failed:', err);
    return fail(res, 500, 'server_error', 'We could not save your enquiry. Please email hello@ngdsolutions.com.');
  }
}
