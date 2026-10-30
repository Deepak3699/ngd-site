/**
 * _http.js — tiny, dependency-free request/response helpers that work both on
 * Vercel Serverless Functions (Node runtime) and on the local dev server.
 *
 * Prefix "_" means Vercel will NOT expose this file as an API route.
 */
import crypto from 'node:crypto';

const MAX_BODY_BYTES = 128 * 1024;

/* ------------------------------------------------------------------ */
/* Request parsing                                                     */
/* ------------------------------------------------------------------ */

export function getUrl(req) {
  return new URL(req.url || '/', 'http://localhost');
}

export function getQuery(req) {
  const url = getUrl(req);
  const out = {};
  for (const [k, v] of url.searchParams.entries()) out[k] = v;
  // Vercel also pre-parses query params onto req.query — prefer that when present.
  if (req.query && typeof req.query === 'object') {
    for (const [k, v] of Object.entries(req.query)) {
      if (v !== undefined && v !== null) out[k] = Array.isArray(v) ? String(v[0]) : String(v);
    }
  }
  return out;
}

export async function readBody(req) {
  // Vercel pre-parses JSON bodies; local dev server does not.
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  let size = 0;
  const chunks = [];
  try {
    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) return {};
      chunks.push(chunk);
    }
  } catch {
    return {};
  }
  if (!chunks.length) return {};

  const raw = Buffer.concat(chunks).toString('utf8');
  const type = String(req.headers?.['content-type'] || '');
  if (type.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw));
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/* ------------------------------------------------------------------ */
/* Response helpers                                                    */
/* ------------------------------------------------------------------ */

export function json(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  res.end(body);
}

export const ok = (res, data = {}, extraHeaders) =>
  json(res, 200, { ok: true, ...data }, extraHeaders);

export const fail = (res, status = 400, code = 'bad_request', message = 'Something went wrong.') =>
  json(res, status, { ok: false, error: { code, message } });

export function methodNotAllowed(res, allow = ['POST']) {
  return json(
    res,
    405,
    { ok: false, error: { code: 'method_not_allowed', message: `Use ${allow.join(' / ')}.` } },
    { Allow: allow.join(', ') }
  );
}

/* ------------------------------------------------------------------ */
/* Cookies                                                             */
/* ------------------------------------------------------------------ */

export function parseCookies(req) {
  const header = req.headers?.cookie || '';
  const out = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    if (!k) return;
    try {
      out[k] = decodeURIComponent(part.slice(idx + 1).trim());
    } catch {
      out[k] = part.slice(idx + 1).trim();
    }
  });
  return out;
}

export function buildCookie(name, value, { maxAge = 0, secure = true } = {}) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
  ];
  if (maxAge > 0) parts.push(`Max-Age=${maxAge}`);
  else parts.push('Max-Age=0');
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

/* ------------------------------------------------------------------ */
/* Security / plumbing                                                 */
/* ------------------------------------------------------------------ */

export const ADMIN_COOKIE = 'ngd_admin';

export function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

/** Hash an IP so we never store raw addresses (basic privacy hygiene). */
export function hashIp(req) {
  const raw =
    (req.headers?.['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.headers?.['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown';
  const salt = process.env.IP_SALT || 'ngd-default-salt';
  return sha256(`${salt}:${raw}`).slice(0, 32);
}

export function clientIp(req) {
  return (
    (req.headers?.['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.headers?.['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

export function userAgent(req) {
  return String(req.headers?.['user-agent'] || '').slice(0, 300);
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function referenceId() {
  const stamp = Date.now().toString(36).slice(-5).toUpperCase();
  const rand = crypto.randomBytes(3).toString('hex').slice(0, 4).toUpperCase();
  return `NGD-${stamp}${rand}`;
}

/* ------------------------------------------------------------------ */
/* Naive in-memory rate limiting (per warm instance — good enough)      */
/* ------------------------------------------------------------------ */

const buckets = new Map();

export function rateLimit(key, limit = 12, windowMs = 60_000) {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now - entry.start > windowMs) {
    buckets.set(key, { start: now, count: 1 });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }
  entry.count += 1;
  if (entry.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.start + windowMs - now) / 1000),
    };
  }
  return { allowed: true, remaining: limit - entry.count, retryAfter: 0 };
}

/* Trim the map so a long-lived instance does not leak memory. */
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of buckets) if (now - v.start > 10 * 60_000) buckets.delete(k);
}, 5 * 60_000).unref?.();

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export const LIMITS = {
  name: 90,
  email: 160,
  phone: 30,
  short: 120,
  text: 2000,
};

export function clean(value, max = LIMITS.short) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(value || '').trim());
}

export function isPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}
