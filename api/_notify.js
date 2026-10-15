/**
 * _notify.js — "a new enquiry just landed" alerts.
 *
 * Every channel is optional and independent. Configure whichever you have and
 * the rest stay silent. Nothing here can ever fail a form submission: each send
 * is wrapped in try/catch and capped with a short timeout.
 *
 *  EMAIL
 *    RESEND_API_KEY      → Resend (https://resend.com) — 1 API key, no SMTP
 *    NOTIFY_FROM         → optional "from" (default onboarding@resend.dev)
 *  WHATSAPP
 *    1. Official Meta Cloud API
 *         WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, ALERT_WHATSAPP_TO
 *    2. CallMeBot (free, 2-minute setup, no business verification)
 *         CALLMEBOT_PHONE, CALLMEBOT_APIKEY
 *  ANYTHING ELSE
 *    NOTIFY_WEBHOOK      → POSTs JSON (Slack, Discord, Zapier, Make, n8n…)
 */
import { siteConfig } from './_config.js';

const TIMEOUT_MS = 5000;

function withTimeout(promise, ms = TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('notification timed out')), ms)),
  ]);
}

export function notificationStatus() {
  const whatsappChannel = process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID
    ? 'meta-cloud-api'
    : process.env.CALLMEBOT_APIKEY && process.env.CALLMEBOT_PHONE
      ? 'callmebot'
      : null;

  const emailChannel = process.env.RESEND_API_KEY ? 'resend' : null;

  return {
    email: { on: Boolean(emailChannel), channel: emailChannel, to: mask(siteConfig.notifications.emailTo) },
    whatsapp: {
      on: Boolean(whatsappChannel),
      channel: whatsappChannel,
      to: mask(siteConfig.notifications.whatsappTo),
    },
    webhook: { on: Boolean(process.env.NOTIFY_WEBHOOK), channel: process.env.NOTIFY_WEBHOOK ? 'webhook' : null },
  };
}

function mask(value) {
  const str = String(value || '');
  if (str.length <= 5) return str;
  return str.slice(0, 3) + '•'.repeat(Math.min(str.length - 5, 6)) + str.slice(-2);
}

/* ------------------------------------------------------------------ */
/* Message building                                                    */
/* ------------------------------------------------------------------ */

function summarise(lead) {
  const isStudent = lead.category === 'student';
  const lines = [
    `${isStudent ? '🎓 New STUDENT enquiry' : '🏢 New BUSINESS enquiry'} — ${lead.ref}`,
    `Name: ${lead.name || '—'}`,
    `Email: ${lead.email || '—'}`,
  ];
  if (lead.phone) lines.push(`Phone: ${lead.phone}`);

  if (isStudent) {
    const bits = [lead.college, lead.course, lead.study_year].filter(Boolean).join(' · ');
    if (bits) lines.push(`Student: ${bits}`);
    if (lead.student_need) lines.push(`Needs: ${lead.student_need}`);
  } else {
    const bits = [lead.company, lead.role].filter(Boolean).join(' · ');
    if (bits) lines.push(`Company: ${bits}`);
    if (lead.client_need) lines.push(`Needs: ${lead.client_need}`);
    if (lead.budget) lines.push(`Budget: ${lead.budget}`);
    if (lead.timeline) lines.push(`Timeline: ${lead.timeline}`);
  }

  if (lead.message) lines.push(`Message: ${String(lead.message).slice(0, 400)}`);
  lines.push(`Source: ${lead.source_section || 'website'}`);
  return { subject: `${isStudent ? '🎓 Student' : '🏢 Business'} enquiry · ${lead.name || lead.email} · ${lead.ref}`, text: lines.join('\n') };
}

/* ------------------------------------------------------------------ */
/* Channels                                                            */
/* ------------------------------------------------------------------ */

async function sendResend(subject, text) {
  const to = siteConfig.notifications.emailTo;
  if (!to) throw new Error('no NOTIFY_EMAIL configured');

  const res = await withTimeout(fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.NOTIFY_FROM || 'NGD Website <onboarding@resend.dev>',
      to: [to],
      subject,
      text,
      html: `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:14px;line-height:1.6;white-space:pre-wrap">${escapeHtml(text)}</div>`,
    }),
  }));

  if (!res.ok) throw new Error(`resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function sendMetaWhatsApp(text) {
  const to = siteConfig.notifications.whatsappTo;
  const res = await withTimeout(fetch(
    `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { preview_url: false, body: text },
      }),
    }
  ));
  if (!res.ok) throw new Error(`meta whatsapp ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function sendCallMeBot(text) {
  const url = new URL('https://api.callmebot.com/whatsapp.php');
  url.searchParams.set('phone', process.env.CALLMEBOT_PHONE);
  url.searchParams.set('text', text.slice(0, 900));
  url.searchParams.set('apikey', process.env.CALLMEBOT_APIKEY);
  const res = await withTimeout(fetch(url, { method: 'GET' }));
  if (!res.ok) throw new Error(`callmebot ${res.status}`);
}

async function sendWebhook(payload) {
  const res = await withTimeout(fetch(process.env.NOTIFY_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }));
  if (!res.ok) throw new Error(`webhook ${res.status}`);
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ------------------------------------------------------------------ */
/* Public entry point                                                  */
/* ------------------------------------------------------------------ */

/**
 * Fire alerts for a freshly created lead. Never throws.
 * @returns {Promise<{email:string, whatsapp:string, webhook:string}>} per-channel result
 */
export async function notifyNewLead(lead) {
  const { subject, text } = summarise(lead);
  const results = { email: 'off', whatsapp: 'off', webhook: 'off' };

  const jobs = [];

  if (process.env.RESEND_API_KEY) {
    jobs.push(
      sendResend(subject, text)
        .then(() => { results.email = 'sent'; })
        .catch((err) => { results.email = `failed (${err.message})`; console.error('[notify:email]', err.message); })
    );
  }

  if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID && siteConfig.notifications.whatsappTo) {
    jobs.push(
      sendMetaWhatsApp(text)
        .then(() => { results.whatsapp = 'sent'; })
        .catch((err) => { results.whatsapp = `failed (${err.message})`; console.error('[notify:whatsapp]', err.message); })
    );
  } else if (process.env.CALLMEBOT_APIKEY && process.env.CALLMEBOT_PHONE) {
    jobs.push(
      sendCallMeBot(text)
        .then(() => { results.whatsapp = 'sent'; })
        .catch((err) => { results.whatsapp = `failed (${err.message})`; console.error('[notify:whatsapp]', err.message); })
    );
  }

  if (process.env.NOTIFY_WEBHOOK) {
    jobs.push(
      sendWebhook({ subject, text, lead })
        .then(() => { results.webhook = 'sent'; })
        .catch((err) => { results.webhook = `failed (${err.message})`; console.error('[notify:webhook]', err.message); })
    );
  }

  if (jobs.length) await Promise.all(jobs);
  return results;
}
