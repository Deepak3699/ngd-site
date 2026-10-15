/**
 * _config.js — reads site.config.json (single source of truth for contact details)
 * with three layers of safety so nothing can ever crash a request:
 *
 *   1. static require()   → bundled by Vercel's file tracer
 *   2. fs read of a couple of likely paths (local dev, self-hosting)
 *   3. hardcoded defaults + optional env overrides
 */
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const DEFAULTS = {
  brand: 'NGD — NextGenDev Solutions',
  email: 'hello@ngdsolutions.com',
  phone: '',
  whatsapp: '',
  whatsappDisplay: '',
  whatsappMessage: "Hi NGD! I'd like to talk about a project.",
  hours: 'Mon–Fri, 9am–6pm',
  location: 'Remote-first, worldwide',
  instagram: '',
  linkedin: '',
  x: '',
  github: '',
  notifications: { whatsappTo: '', emailTo: '' },
};

function fromFile() {
  const require = createRequire(import.meta.url);
  try {
    // eslint-disable-next-line global-require
    return require('../site.config.json');
  } catch {
    /* fall through */
  }
  for (const candidate of [
    path.join(process.cwd(), 'site.config.json'),
    path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'site.config.json'),
  ]) {
    try {
      if (fs.existsSync(candidate)) return JSON.parse(fs.readFileSync(candidate, 'utf8'));
    } catch {
      /* keep trying */
    }
  }
  return {};
}

const file = fromFile();

export const siteConfig = {
  ...DEFAULTS,
  ...file,
  // env wins, so you can change numbers without touching the repo
  email: process.env.SITE_EMAIL || file.email || DEFAULTS.email,
  phone: process.env.SITE_PHONE || file.phone || DEFAULTS.phone,
  whatsapp: process.env.SITE_WHATSAPP || file.whatsapp || DEFAULTS.whatsapp,
  whatsappDisplay: process.env.SITE_WHATSAPP_DISPLAY || file.whatsappDisplay || file.whatsapp || DEFAULTS.whatsappDisplay,
  notifications: {
    ...DEFAULTS.notifications,
    ...(file.notifications || {}),
    whatsappTo: process.env.ALERT_WHATSAPP_TO || (file.notifications && file.notifications.whatsappTo) || '',
    emailTo: process.env.NOTIFY_EMAIL || (file.notifications && file.notifications.emailTo) || file.email || DEFAULTS.email,
  },
};

export const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

/** wa.me deep link with an optional prefilled message. */
export function whatsappLink(number = siteConfig.whatsapp, message = siteConfig.whatsappMessage) {
  const digits = digitsOnly(number);
  if (!digits) return '';
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

/** Best-effort guess of where the admin lives, for log lines + the dashboard. */
export const adminPath = () => (process.env.ADMIN_PATH || '/admin').trim();
