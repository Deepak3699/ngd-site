/**
 * GET /api/admin/activity — the team worklog (newest first).
 *   ?leadId=12   → just that response
 *   (no params)  → the whole team's recent activity
 */
import { fail, getQuery, methodNotAllowed, ok } from '../_http.js';
import { currentAdmin } from '../_auth.js';
import { listEvents, recentEvents } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const admin = await currentAdmin(req);
  if (!admin.authed) return fail(res, 401, 'unauthorized', 'Please sign in.');

  try {
    const { leadId, limit } = getQuery(req);
    const events = leadId ? await listEvents(leadId, limit) : await recentEvents(limit);
    return ok(res, { events });
  } catch (err) {
    console.error('[admin/activity]', err);
    return fail(res, 500, 'server_error', 'Could not load activity.');
  }
}
