/** GET /api/admin/stats — 14-day submission series + breakdowns for the dashboard. */
import { fail, getQuery, methodNotAllowed, ok } from '../_http.js';
import { currentAdmin } from '../_auth.js';
import { statsForAdmin } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const admin = await currentAdmin(req);
  if (!admin.authed) return fail(res, 401, 'unauthorized', 'Please sign in again.');

  const days = Math.min(Math.max(parseInt(getQuery(req).days, 10) || 14, 7), 60);
  try {
    const stats = await statsForAdmin(days);
    return ok(res, { stats });
  } catch (err) {
    console.error('[admin/stats]', err);
    return fail(res, 500, 'server_error', 'Could not load stats.');
  }
}
