-- ─────────────────────────────────────────────────────────────
--  NGD — Neon / Postgres schema
--  You normally do NOT need to run this by hand: the API creates
--  these tables automatically on first request (api/_db.js).
--  It is here so you can run it manually from the Neon SQL editor
--  or with `npm run init-db`.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leads (
  id             BIGSERIAL PRIMARY KEY,
  ref            TEXT UNIQUE NOT NULL,                 -- e.g. NGD-1A2B3C4D
  category       TEXT NOT NULL CHECK (category IN ('student', 'client')),
  name           TEXT,
  email          TEXT,
  phone          TEXT,
  -- student-only fields
  college        TEXT,
  course         TEXT,
  study_year     TEXT,
  student_need   TEXT,
  -- business / "other" fields
  company        TEXT,
  role           TEXT,
  website        TEXT,
  industry       TEXT,
  client_need    TEXT,
  budget         TEXT,
  timeline       TEXT,
  -- shared
  message        TEXT,
  source_section TEXT,                                 -- which form/section it came from
  page_url       TEXT,
  user_agent     TEXT,
  ip_hash        TEXT,                                 -- sha256(salt + ip), never the raw IP
  meta           JSONB NOT NULL DEFAULT '{}'::jsonb,
  status         TEXT NOT NULL DEFAULT 'new',          -- new | contacted | won | lost | archived
  admin_note     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_category_idx ON leads (category);
CREATE INDEX IF NOT EXISTS leads_created_idx  ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_status_idx   ON leads (status);
CREATE INDEX IF NOT EXISTS leads_email_idx    ON leads (lower(email));

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  username   TEXT,
  user_agent TEXT,
  ip_hash    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
