/**
 * Admin lead management (all routes require a session when a login is configured).
 *
 *   GET    /api/admin/leads?category=&status=&source=&assignee=&q=&page=&limit=&sort=
 *   PATCH  /api/admin/leads   { id, status? | adminNote? | assignedTo? }
 *   DELETE /api/admin/leads?id=12            (admins only)
 *   GET    /api/admin/leads?id=12&events=1   → single response + its activity log
 */
import { clean, fail, getQuery, methodNotAllowed, ok, readBody } from '../_http.js';
import { canDelete, currentAdmin } from '../_auth.js';
import { addEvent, assignLead, deleteLead, listEvents, listLeads, updateLead } from '../_db.js';

export const STATUSES = ['new', 'contacted', 'won', 'lost', 'archived'];

export default async function handler(req, res) {
  const admin = await currentAdmin(req);
  if (!admin.authed) return fail(res, 401, 'unauthorized', 'Please sign in to view responses.');

  if (req.method === 'GET') return list(req, res, admin);
  if (req.method === 'PATCH' || req.method === 'PUT') return update(req, res, admin);
  if (req.method === 'DELETE') return remove(req, res, admin);
  return methodNotAllowed(res, ['GET', 'PATCH', 'DELETE']);
}

async function list(req, res, admin) {
  const q = getQuery(req);

  // single response + activity log
  if (q.id) {
    const id = parseInt(q.id, 10);
    if (!Number.isFinite(id)) return fail(res, 422, 'invalid_id', 'Pass ?id=<number>.');
    try {
      const { items } = await listLeads({ category: 'all', status: 'all', page: 1, limit: 100 });
      const item = items.find((i) => Number(i.id) === id) || null;
      const events = item ? await listEvents(id) : [];
      if (!item) return fail(res, 404, 'not_found', 'That response no longer exists.');
      return ok(res, { item, events });
    } catch (err) {
      console.error('[admin/leads] detail failed:', err);
      return fail(res, 500, 'server_error', 'Could not load that response.');
    }
  }

  const category = ['student', 'client'].includes(q.category) ? q.category : 'all';
  const status = STATUSES.includes(q.status) ? q.status : 'all';
  const assignee = ['all', 'me', 'unassigned'].includes(q.assignee) || clean(q.assignee, 60) ? clean(q.assignee, 60) || 'all' : 'all';

  try {
    const result = await listLeads({
      category,
      status,
      source: clean(q.source, 60) || 'all',
      assignee,
      viewer: admin.user?.username || '',
      q: clean(q.q, 120),
      page: q.page,
      limit: q.limit,
      sort: q.sort === 'oldest' ? 'oldest' : 'newest',
    });
    return ok(res, {
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      counts: result.counts,
      filters: { category, status, assignee },
    });
  } catch (err) {
    console.error('[admin/leads] list failed:', err);
    return fail(res, 500, 'server_error', 'Could not load responses.');
  }
}

async function update(req, res, admin) {
  const body = await readBody(req);
  const id = parseInt(body.id ?? getQuery(req).id, 10);
  if (!Number.isFinite(id)) return fail(res, 422, 'invalid_id', 'A numeric lead id is required.');

  const actor = { username: admin.user?.username, name: admin.user?.name };
  const touched = {};

  try {
    if (body.status !== undefined) {
      const status = clean(body.status, 20).toLowerCase();
      if (!STATUSES.includes(status)) {
        return fail(res, 422, 'invalid_status', `Status must be one of: ${STATUSES.join(', ')}.`);
      }
      const updated = await updateLead(id, { status, actor });
      if (!updated) return fail(res, 404, 'not_found', 'That response no longer exists.');
      touched.status = status;
    }

    if (body.adminNote !== undefined) {
      const updated = await updateLead(id, { adminNote: clean(body.adminNote, 1000), actor });
      if (!updated) return fail(res, 404, 'not_found', 'That response no longer exists.');
      touched.adminNote = true;
    }

    if (body.assignedTo !== undefined) {
      // "" / null / "unassigned" clears it; "me" claims it for the signed-in user
      const raw = clean(body.assignedTo, 60);
      const target = raw === 'me' ? actor.username : raw === 'unassigned' ? '' : raw;
      const updated = await assignLead(id, target, actor);
      if (!updated) return fail(res, 404, 'not_found', 'That response no longer exists.');
      touched.assignedTo = target || null;
    }

    if (!Object.keys(touched).length) {
      return fail(res, 422, 'nothing_to_update', 'Send status, adminNote and/or assignedTo.');
    }

    return ok(res, { updated: touched });
  } catch (err) {
    console.error('[admin/leads] update failed:', err);
    return fail(res, 500, 'server_error', 'Could not update that response.');
  }
}

async function remove(req, res, admin) {
  if (!canDelete(admin.user)) {
    return fail(res, 403, 'forbidden', 'Only an admin can delete responses. Ask your team owner.');
  }
  const id = parseInt(getQuery(req).id, 10);
  if (!Number.isFinite(id)) return fail(res, 422, 'invalid_id', 'Pass ?id=<number>.');
  try {
    const done = await deleteLead(id);
    if (!done) return fail(res, 404, 'not_found', 'That response no longer exists.');
    await addEvent({
      leadId: id,
      actor: admin.user?.username,
      actorName: admin.user?.name,
      action: 'deleted',
      detail: `by ${admin.user?.name || admin.user?.username || 'admin'}`,
    });
    return ok(res, { deleted: id });
  } catch (err) {
    console.error('[admin/leads] delete failed:', err);
    return fail(res, 500, 'server_error', 'Could not delete that response.');
  }
}
