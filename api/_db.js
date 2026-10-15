/**
 * _db.js — the single data layer for the whole app.
 *
 * Production  : Neon Postgres via @neondatabase/serverless (HTTP driver, perfect
 *               for Vercel / edge — no connection pool to babysit).
 * Local dev   : if DATABASE_URL is missing, everything transparently falls back to
 *               a JSON file store (.dev-data/store.json) so you can click through
 *               the site + admin panel before Neon is wired up.
 *
 * Tables are created automatically on first use (idempotent), so you never have
 * to remember to run a migration.
 */
import fs from 'node:fs';
import path from 'node:path';
import { referenceId } from './_http.js';

const DEV_DIR = path.resolve(process.cwd(), '.dev-data');
const DEV_FILE = path.join(DEV_DIR, 'store.json');

export const DB_MODE = process.env.DATABASE_URL ? 'neon' : 'dev-file';
export const hasNeon = () => DB_MODE === 'neon';

/* ------------------------------------------------------------------ */
/* Neon client (lazy)                                                  */
/* ------------------------------------------------------------------ */

let _sql = null;
export async function getSql() {
  if (!hasNeon()) return null;
  if (_sql) return _sql;
  const { neon, neonConfig } = await import('@neondatabase/serverless');

  // Node 20 does not ship every fetch option Vercel's runtime has; disabling
  // the cache keeps requests clean in local/self-hosted environments.
  try {
    neonConfig.fetchConnectionCache = false;
  } catch {
    /* noop */
  }
  _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

/* ------------------------------------------------------------------ */
/* Dev file store                                                      */
/* ------------------------------------------------------------------ */

const EMPTY_STORE = { seq: 0, eventSeq: 0, leads: [], sessions: [], events: [] };

function readStore() {
  try {
    const raw = fs.readFileSync(DEV_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...structuredClone(EMPTY_STORE), ...parsed };
  } catch {
    return structuredClone(EMPTY_STORE);
  }
}

function writeStore(data) {
  fs.mkdirSync(DEV_DIR, { recursive: true });
  fs.writeFileSync(DEV_FILE, JSON.stringify(data, null, 2));
}

/* ------------------------------------------------------------------ */
/* Schema                                                             */
/* ------------------------------------------------------------------ */

let schemaReady = null;

export function ensureSchema() {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    if (!hasNeon()) {
      if (!fs.existsSync(DEV_FILE)) writeStore(structuredClone(EMPTY_STORE));
      return;
    }
    const sql = await getSql();
    await sql`
      CREATE TABLE IF NOT EXISTS leads (
        id             BIGSERIAL PRIMARY KEY,
        ref            TEXT UNIQUE NOT NULL,
        category       TEXT NOT NULL CHECK (category IN ('student', 'client')),
        name           TEXT,
        email          TEXT,
        phone          TEXT,
        college        TEXT,
        course         TEXT,
        study_year     TEXT,
        student_need   TEXT,
        company        TEXT,
        role           TEXT,
        website        TEXT,
        industry       TEXT,
        client_need    TEXT,
        budget         TEXT,
        timeline       TEXT,
        message        TEXT,
        source_section TEXT,
        page_url       TEXT,
        user_agent     TEXT,
        ip_hash        TEXT,
        meta           JSONB NOT NULL DEFAULT '{}'::jsonb,
        status         TEXT NOT NULL DEFAULT 'new',
        admin_note     TEXT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS leads_category_idx ON leads (category)`;
    await sql`CREATE INDEX IF NOT EXISTS leads_created_idx  ON leads (created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS leads_status_idx   ON leads (status)`;
    await sql`CREATE INDEX IF NOT EXISTS leads_email_idx    ON leads (lower(email))`;

    /* team + worklog columns (safe to run on an existing table) */
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to TEXT`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ`;
    await sql`CREATE INDEX IF NOT EXISTS leads_assigned_idx ON leads (assigned_to)`;

    await sql`
      CREATE TABLE IF NOT EXISTS lead_events (
        id         BIGSERIAL PRIMARY KEY,
        lead_id    BIGINT,
        actor      TEXT,
        actor_name TEXT,
        action     TEXT NOT NULL,
        detail     TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS lead_events_lead_idx ON lead_events (lead_id, created_at DESC)`;

    await sql`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        token_hash TEXT PRIMARY KEY,
        username   TEXT,
        user_agent TEXT,
        ip_hash    TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_seen  TIMESTAMPTZ NOT NULL DEFAULT now(),
        expires_at TIMESTAMPTZ NOT NULL
      )
    `;
  })().catch((err) => {
    schemaReady = null; // allow a retry on the next request
    throw err;
  });
  return schemaReady;
}

/* ------------------------------------------------------------------ */
/* Leads                                                               */
/* ------------------------------------------------------------------ */

const LEAD_COLUMNS = [
  'category', 'name', 'email', 'phone',
  'college', 'course', 'study_year', 'student_need',
  'company', 'role', 'website', 'industry', 'client_need', 'budget', 'timeline',
  'message', 'source_section', 'page_url', 'user_agent', 'ip_hash',
];

export async function createLead(input) {
  await ensureSchema();
  const row = {};
  for (const col of LEAD_COLUMNS) row[col] = input[col] ?? null;
  row.meta = input.meta ? JSON.stringify(input.meta) : '{}';

  if (!hasNeon()) {
    const store = readStore();
    store.seq += 1;
    const record = {
      id: store.seq,
      ref: input.ref,
      ...row,
      meta: input.meta || {},
      status: 'new',
      admin_note: null,
      assigned_to: null,
      assigned_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.leads.unshift(record);
    writeStore(store);
    return record;
  }

  const sql = await getSql();

  const insert = (ref) => sql`
    INSERT INTO leads (
      ref, category, name, email, phone,
      college, course, study_year, student_need,
      company, role, website, industry, client_need, budget, timeline,
      message, source_section, page_url, user_agent, ip_hash, meta
    ) VALUES (
      ${ref}, ${row.category}, ${row.name}, ${row.email}, ${row.phone},
      ${row.college}, ${row.course}, ${row.study_year}, ${row.student_need},
      ${row.company}, ${row.role}, ${row.website}, ${row.industry}, ${row.client_need}, ${row.budget}, ${row.timeline},
      ${row.message}, ${row.source_section}, ${row.page_url}, ${row.user_agent}, ${row.ip_hash},
      ${row.meta}::jsonb
    )
    RETURNING *
  `;

  // `ref` is unique — in the unlikely event of a collision, generate a fresh one
  // and try again instead of showing the visitor an error.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const [created] = await insert(attempt === 0 ? input.ref : referenceId());
      return created;
    } catch (err) {
      const code = err?.code || err?.cause?.code;
      const isRefClash = code === '23505' && /ref/i.test(String(err?.detail || err?.message || ''));
      if (!isRefClash || attempt === 2) throw err;
      console.warn('[db] ref collision, retrying with a new reference id');
    }
  }
  return null;
}


/** Duplicate guard: same email + category posted seconds apart. */
export async function findDupeLead(email, category, seconds = 45) {
  await ensureSchema();
  if (!email) return null;
  if (!hasNeon()) {
    const store = readStore();
    const cutoff = Date.now() - seconds * 1000;
    return (
      store.leads.find(
        (l) =>
          l.email?.toLowerCase() === email.toLowerCase() &&
          l.category === category &&
          new Date(l.created_at).getTime() > cutoff
      ) || null
    );
  }
  const sql = await getSql();
  const rows = await sql`
    SELECT * FROM leads
    WHERE lower(email) = ${email.toLowerCase()}
      AND category = ${category}
      AND created_at > now() - ${`${seconds} seconds`}::interval
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function listLeads({
  category = 'all',
  status = 'all',
  source = 'all',
  assignee = 'all',
  viewer = '',
  q = '',
  page = 1,
  limit = 20,
  sort = 'newest',
} = {}) {
  await ensureSchema();
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;
  const who = assignee === 'me' ? viewer : assignee;

  if (!hasNeon()) {
    const store = readStore();
    let rows = store.leads.slice();
    if (category !== 'all') rows = rows.filter((r) => r.category === category);
    if (status !== 'all') rows = rows.filter((r) => (r.status || 'new') === status);
    if (source !== 'all') rows = rows.filter((r) => (r.source_section || '') === source);
    if (who && who !== 'all') {
      rows = who === 'unassigned'
        ? rows.filter((r) => !r.assigned_to)
        : rows.filter((r) => r.assigned_to === who);
    }
    if (q) {
      const needle = q.toLowerCase();
      rows = rows.filter((r) =>
        [r.name, r.email, r.phone, r.college, r.company, r.message, r.ref, r.student_need, r.client_need]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(needle))
      );
    }
    rows.sort((a, b) =>
      sort === 'oldest'
        ? new Date(a.created_at) - new Date(b.created_at)
        : new Date(b.created_at) - new Date(a.created_at)
    );
    const total = rows.length;
    const all = store.leads;
    const counts = {
      all: all.length,
      student: all.filter((r) => r.category === 'student').length,
      client: all.filter((r) => r.category === 'client').length,
      new: all.filter((r) => (r.status || 'new') === 'new').length,
      contacted: all.filter((r) => r.status === 'contacted').length,
      won: all.filter((r) => r.status === 'won').length,
      today: all.filter((r) => Date.now() - new Date(r.created_at).getTime() < 86_400_000).length,
      unassigned: all.filter((r) => !r.assigned_to).length,
      mine: viewer ? all.filter((r) => r.assigned_to === viewer).length : 0,
    };
    return { items: rows.slice(offset, offset + safeLimit), total, page: safePage, limit: safeLimit, counts };
  }

  const sql = await getSql();
  const where = [];
  const params = [];
  if (category !== 'all') {
    params.push(category);
    where.push(`category = $${params.length}`);
  }
  if (status !== 'all') {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (source !== 'all') {
    params.push(source);
    where.push(`source_section = $${params.length}`);
  }
  if (who && who !== 'all') {
    if (who === 'unassigned') {
      where.push('assigned_to IS NULL');
    } else {
      params.push(who);
      where.push(`assigned_to = $${params.length}`);
    }
  }
  if (q) {
    params.push(`%${q}%`);
    const p = `$${params.length}`;
    where.push(
      `(name ILIKE ${p} OR email ILIKE ${p} OR phone ILIKE ${p} OR college ILIKE ${p} OR company ILIKE ${p} OR message ILIKE ${p} OR ref ILIKE ${p} OR student_need ILIKE ${p} OR client_need ILIKE ${p})`
    );
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderSql = sort === 'oldest' ? 'ORDER BY created_at ASC' : 'ORDER BY created_at DESC';

  const items = await sql.query(
    `SELECT * FROM leads ${whereSql} ${orderSql} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, safeLimit, offset]
  );

  const [totals] = await sql.query(
    `SELECT
       COUNT(*)::int AS all,
       COUNT(*) FILTER (WHERE category = 'student')::int AS student,
       COUNT(*) FILTER (WHERE category = 'client')::int  AS client,
       COUNT(*) FILTER (WHERE status = 'new')::int       AS new,
       COUNT(*) FILTER (WHERE status = 'contacted')::int AS contacted,
       COUNT(*) FILTER (WHERE status = 'won')::int       AS won,
       COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours')::int AS today,
       COUNT(*) FILTER (WHERE assigned_to IS NULL)::int  AS unassigned,
       COUNT(*) FILTER (WHERE assigned_to = $2)::int     AS mine
     FROM leads
     WHERE $1 = 'all' OR ($1 <> 'all' AND category = $1)`,
    [category, viewer || '']
  );

  const [{ total }] = await sql.query(`SELECT COUNT(*)::int AS total FROM leads ${whereSql}`, params);

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    counts: {
      all: totals?.all ?? 0,
      student: totals?.student ?? 0,
      client: totals?.client ?? 0,
      new: totals?.new ?? 0,
      contacted: totals?.contacted ?? 0,
      won: totals?.won ?? 0,
      today: totals?.today ?? 0,
      unassigned: totals?.unassigned ?? 0,
      mine: totals?.mine ?? 0,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Assignment + activity log                                           */
/* ------------------------------------------------------------------ */

export async function assignLead(id, assignee, actor = {}) {
  await ensureSchema();
  const numericId = parseInt(id, 10);
  if (!Number.isFinite(numericId)) return null;
  const value = assignee ? String(assignee).slice(0, 60) : null;

  if (!hasNeon()) {
    const store = readStore();
    const found = store.leads.find((l) => l.id === numericId);
    if (!found) return null;
    found.assigned_to = value;
    found.assigned_at = value ? new Date().toISOString() : null;
    found.updated_at = new Date().toISOString();
    writeStore(store);
    await addEvent({ leadId: numericId, actor: actor.username, actorName: actor.name, action: value ? 'assigned' : 'unassigned', detail: value || 'nobody' });
    return found;
  }

  const sql = await getSql();
  const rows = await sql`
    UPDATE leads
    SET assigned_to = ${value},
        assigned_at = ${value ? new Date().toISOString() : null},
        updated_at = now()
    WHERE id = ${numericId}
    RETURNING *
  `;
  if (rows[0]) {
    await addEvent({
      leadId: numericId,
      actor: actor.username,
      actorName: actor.name,
      action: value ? 'assigned' : 'unassigned',
      detail: value || 'nobody',
    });
  }
  return rows[0] || null;
}

export async function addEvent({ leadId, actor, actorName, action, detail }) {
  await ensureSchema();
  const payload = {
    lead_id: Number(leadId) || null,
    actor: actor || null,
    actor_name: actorName || null,
    action: String(action || 'update').slice(0, 40),
    detail: detail ? String(detail).slice(0, 500) : null,
  };

  if (!hasNeon()) {
    const store = readStore();
    store.eventSeq = (store.eventSeq || 0) + 1;
    store.events = store.events || [];
    const record = { id: store.eventSeq, ...payload, created_at: new Date().toISOString() };
    store.events.unshift(record);
    store.events = store.events.slice(0, 5000);
    writeStore(store);
    return record;
  }

  const sql = await getSql();
  const [row] = await sql`
    INSERT INTO lead_events (lead_id, actor, actor_name, action, detail)
    VALUES (${payload.lead_id}, ${payload.actor}, ${payload.actor_name}, ${payload.action}, ${payload.detail})
    RETURNING *
  `;
  return row;
}

export async function listEvents(leadId, limit = 40) {
  await ensureSchema();
  const numericId = parseInt(leadId, 10);
  if (!Number.isFinite(numericId)) return [];
  const take = Math.min(Math.max(parseInt(limit, 10) || 40, 1), 200);

  if (!hasNeon()) {
    const store = readStore();
    return (store.events || [])
      .filter((e) => e.lead_id === numericId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, take);
  }

  const sql = await getSql();
  return sql.query(
    `SELECT * FROM lead_events WHERE lead_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [numericId, take]
  );
}

export async function recentEvents(limit = 25) {
  await ensureSchema();
  const take = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 100);

  if (!hasNeon()) {
    const store = readStore();
    return (store.events || [])
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, take);
  }
  const sql = await getSql();
  return sql.query(`SELECT * FROM lead_events ORDER BY created_at DESC LIMIT $1`, [take]);
}

export async function updateLead(id, { status, adminNote, actor } = {}) {
  await ensureSchema();
  const numericId = parseInt(id, 10);
  if (!Number.isFinite(numericId)) return null;

  if (!hasNeon()) {
    const store = readStore();
    const found = store.leads.find((l) => l.id === numericId);
    if (!found) return null;
    if (status !== undefined) found.status = status;
    if (adminNote !== undefined) found.admin_note = adminNote;
    found.updated_at = new Date().toISOString();
    writeStore(store);
    if (status !== undefined) {
      await addEvent({ leadId: numericId, actor: actor?.username, actorName: actor?.name, action: 'status', detail: status });
    }
    if (adminNote !== undefined) {
      await addEvent({ leadId: numericId, actor: actor?.username, actorName: actor?.name, action: 'note', detail: adminNote || '(cleared)' });
    }
    return found;
  }

  const sql = await getSql();
  const rows = await sql`
    UPDATE leads
    SET status     = COALESCE(${status ?? null}, status),
        admin_note = COALESCE(${adminNote ?? null}, admin_note),
        updated_at = now()
    WHERE id = ${numericId}
    RETURNING *
  `;
  if (rows[0]) {
    if (status !== undefined) {
      await addEvent({ leadId: numericId, actor: actor?.username, actorName: actor?.name, action: 'status', detail: status });
    }
    if (adminNote !== undefined) {
      await addEvent({ leadId: numericId, actor: actor?.username, actorName: actor?.name, action: 'note', detail: adminNote || '(cleared)' });
    }
  }
  return rows[0] || null;
}

export async function deleteLead(id) {
  await ensureSchema();
  const numericId = parseInt(id, 10);
  if (!Number.isFinite(numericId)) return false;

  if (!hasNeon()) {
    const store = readStore();
    const before = store.leads.length;
    store.leads = store.leads.filter((l) => l.id !== numericId);
    writeStore(store);
    return store.leads.length < before;
  }
  const sql = await getSql();
  const rows = await sql`DELETE FROM leads WHERE id = ${numericId} RETURNING id`;
  return rows.length > 0;
}

export async function statsForAdmin(days = 14) {
  await ensureSchema();

  if (!hasNeon()) {
    const store = readStore();
    return buildStats(store.leads, days);
  }

  const sql = await getSql();
  const daily = await sql`
    SELECT to_char(created_at::date, 'YYYY-MM-DD') AS day,
           COUNT(*) FILTER (WHERE category = 'student')::int AS student,
           COUNT(*) FILTER (WHERE category = 'client')::int  AS client
    FROM leads
    WHERE created_at > now() - ${`${days} days`}::interval
    GROUP BY 1
    ORDER BY 1
  `;
  const needs = await sql`
    SELECT COALESCE(NULLIF(student_need, ''), NULLIF(client_need, ''), 'Not specified') AS label,
           COUNT(*)::int AS count
    FROM leads
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 8
  `;
  const sources = await sql`
    SELECT COALESCE(NULLIF(source_section, ''), 'unknown') AS label, COUNT(*)::int AS count
    FROM leads GROUP BY 1 ORDER BY 2 DESC LIMIT 8
  `;
  const statuses = await sql`
    SELECT COALESCE(status, 'new') AS label, COUNT(*)::int AS count
    FROM leads GROUP BY 1 ORDER BY 2 DESC
  `;

  const byDay = new Map(daily.map((r) => [r.day, r]));
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    const hit = byDay.get(d);
    series.push({ day: d, student: hit?.student || 0, client: hit?.client || 0 });
  }
  return { series, needs, sources, statuses };
}

function buildStats(leads, days) {
  const byDay = new Map();
  for (const l of leads) {
    const day = String(l.created_at).slice(0, 10);
    const entry = byDay.get(day) || { student: 0, client: 0 };
    entry[l.category] = (entry[l.category] || 0) + 1;
    byDay.set(day, entry);
  }
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    const hit = byDay.get(d);
    series.push({ day: d, student: hit?.student || 0, client: hit?.client || 0 });
  }
  const tally = (fn) => {
    const map = new Map();
    for (const l of leads) {
      const key = fn(l) || 'Not specified';
      map.set(key, (map.get(key) || 0) + 1);
    }
    return [...map.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  };
  return {
    series,
    needs: tally((l) => l.student_need || l.client_need),
    sources: tally((l) => l.source_section),
    statuses: tally((l) => l.status || 'new'),
  };
}

/* ------------------------------------------------------------------ */
/* Admin sessions                                                      */
/* ------------------------------------------------------------------ */

export async function createSession({ tokenHash, username = null, userAgentValue = null, ipHash = null, days = 7 }) {
  await ensureSchema();
  const expires = new Date(Date.now() + days * 86_400_000);

  if (!hasNeon()) {
    const store = readStore();
    store.sessions = store.sessions.filter((s) => new Date(s.expires_at).getTime() > Date.now());
    store.sessions.push({
      token_hash: tokenHash,
      username,
      user_agent: userAgentValue,
      ip_hash: ipHash,
      created_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      expires_at: expires.toISOString(),
    });
    writeStore(store);
    return expires;
  }

  const sql = await getSql();
  await sql`DELETE FROM admin_sessions WHERE expires_at < now()`;
  await sql`
    INSERT INTO admin_sessions (token_hash, username, user_agent, ip_hash, expires_at)
    VALUES (${tokenHash}, ${username}, ${userAgentValue}, ${ipHash}, ${expires})
  `;
  return expires;
}

export async function getSession(tokenHash) {
  if (!tokenHash) return null;
  await ensureSchema();

  if (!hasNeon()) {
    const store = readStore();
    const found = store.sessions.find(
      (s) => s.token_hash === tokenHash && new Date(s.expires_at).getTime() > Date.now()
    );
    return found || null;
  }
  const sql = await getSql();
  const rows = await sql`
    SELECT token_hash, username, expires_at FROM admin_sessions
    WHERE token_hash = ${tokenHash} AND expires_at > now()
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function touchSession(tokenHash) {
  if (!tokenHash) return;
  if (!hasNeon()) return;
  try {
    const sql = await getSql();
    await sql`UPDATE admin_sessions SET last_seen = now() WHERE token_hash = ${tokenHash}`;
  } catch {
    /* non-critical */
  }
}

export async function deleteSession(tokenHash) {
  if (!tokenHash) return;
  await ensureSchema();
  if (!hasNeon()) {
    const store = readStore();
    store.sessions = store.sessions.filter((s) => s.token_hash !== tokenHash);
    writeStore(store);
    return;
  }
  const sql = await getSql();
  await sql`DELETE FROM admin_sessions WHERE token_hash = ${tokenHash}`;
}

/* ------------------------------------------------------------------ */
/* Health                                                              */
/* ------------------------------------------------------------------ */

export async function ping() {
  try {
    await ensureSchema();
    if (!hasNeon()) return { mode: DB_MODE, ok: true };
    const sql = await getSql();
    await sql`SELECT 1`;
    return { mode: DB_MODE, ok: true };
  } catch (err) {
    return { mode: DB_MODE, ok: false, error: String(err?.message || err) };
  }
}
