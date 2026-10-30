/**
 * GET /api/admin/export?category=student|client|all&status=...&q=...
 * Streams a CSV (Excel/Sheets friendly, UTF-8 BOM included).
 */
import { clean, fail, getQuery } from '../_http.js';
import { currentAdmin } from '../_auth.js';
import { listLeads } from '../_db.js';

const HEADERS = [
  'ref', 'category', 'status', 'created_at',
  'name', 'email', 'phone',
  'college', 'course', 'study_year', 'student_need',
  'company', 'role', 'industry', 'client_need', 'budget', 'timeline', 'website',
  'message', 'source_section', 'admin_note',
];

const csvCell = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value).replace(/\r?\n/g, ' ').trim();
  return /[",;]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

export default async function handler(req, res) {
  const admin = await currentAdmin(req);
  if (!admin.authed) return fail(res, 401, 'unauthorized', 'Please sign in first.');

  const q = getQuery(req);
  const category = ['student', 'client'].includes(q.category) ? q.category : 'all';
  const statuses = ['new', 'contacted', 'won', 'lost', 'archived'];

  try {
    const { items } = await listLeads({
      category,
      status: statuses.includes(q.status) ? q.status : 'all',
      source: clean(q.source, 60) || 'all',
      q: clean(q.q, 120),
      page: 1,
      limit: 100,
      sort: 'newest',
    });

    const rows = items.map((l) => HEADERS.map((h) => csvCell(l[h])).join(','));
    const csv = '\uFEFF' + [HEADERS.join(','), ...rows].join('\r\n');

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ngd-${category}-responses-${new Date().toISOString().slice(0, 10)}.csv"`
    );
    res.setHeader('Cache-Control', 'no-store');
    return res.end(csv);
  } catch (err) {
    console.error('[admin/export]', err);
    return fail(res, 500, 'server_error', 'Could not build the CSV.');
  }
}
