/** GET /api/health — quick connectivity check for you and for uptime monitors. */
import { ok } from './_http.js';
import { ping } from './_db.js';

export default async function handler(req, res) {
  const db = await ping();
  return ok(res, {
    service: 'ngd-api',
    time: new Date().toISOString(),
    database: db,
    adminProtected: Boolean(process.env.ADMIN_PASSWORD),
  });
}
