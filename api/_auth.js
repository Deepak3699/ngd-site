/**
 * _auth.js — team logins for the admin dashboard.
 *
 * Configure either:
 *
 *   • one owner login (simplest)
 *       ADMIN_USERNAME=you
 *       ADMIN_PASSWORD=…
 *
 *   • a team (each person gets their own login, so the activity log and the
 *     "assigned to" column actually mean something)
 *       TEAM_MEMBERS=[{"username":"ali","password":"…","name":"Ali Khan","role":"admin"},
 *                     {"username":"sara","password":"…","name":"Sara","role":"member"}]
 *
 *   roles → "admin"  : everything, including deleting responses + managing notes of others
 *           "member" : see everything, update status, assign, write notes — but cannot delete
 *
 * If neither is set the dashboard stays open (and says so, loudly).
 */
import {
  ADMIN_COOKIE,
  buildCookie,
  parseCookies,
  sha256,
  randomToken,
  userAgent,
  hashIp,
} from './_http.js';
import { createSession, getSession, touchSession, deleteSession } from './_db.js';

export const COOKIE_NAME = ADMIN_COOKIE;
const SESSION_DAYS = 7;

/* ------------------------------------------------------------------ */
/* Team roster                                                         */
/* ------------------------------------------------------------------ */

function parseTeamEnv() {
  const raw = process.env.TEAM_MEMBERS;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m) => m && m.username && m.password)
      .map((m) => ({
        username: String(m.username).trim().slice(0, 40),
        password: String(m.password),
        name: String(m.name || m.username).slice(0, 60),
        role: m.role === 'admin' ? 'admin' : 'member',
      }));
  } catch (err) {
    console.error('[auth] TEAM_MEMBERS is not valid JSON — ignoring it.', err.message);
    return [];
  }
}

export function team() {
  const members = parseTeamEnv();
  if (members.length) {
    // a member listed as owner also gets admin rights via ADMIN_USERNAME
    return members;
  }
  if (process.env.ADMIN_PASSWORD) {
    return [{
      username: (process.env.ADMIN_USERNAME || 'admin').trim(),
      password: process.env.ADMIN_PASSWORD,
      name: (process.env.ADMIN_NAME || process.env.ADMIN_USERNAME || 'Admin').trim(),
      role: 'admin',
    }];
  }
  return [];
}

/** Roster safe to show in the UI (never exposes passwords). */
export function publicTeam() {
  return team().map((m) => ({ username: m.username, name: m.name, role: m.role }));
}

export const authEnabled = () => team().length > 0;

/* ------------------------------------------------------------------ */
/* Login                                                               */
/* ------------------------------------------------------------------ */

export function findMember(username, password) {
  const list = team();
  if (!list.length) return { ok: true, member: { username: 'open', name: 'Open access', role: 'admin' }, open: true };

  const wanted = String(username || '').trim().toLowerCase();
  const given = sha256(password || '');

  // If a single owner login is configured, username is optional.
  const candidates = list.filter((m) =>
    list.length === 1 && !process.env.ADMIN_USERNAME
      ? true
      : m.username.toLowerCase() === wanted
  );

  for (const member of candidates) {
    if (sha256(member.password) === given) {
      return { ok: true, member, open: false };
    }
  }
  return { ok: false, open: false };
}

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

export async function currentAdmin(req) {
  if (!authEnabled()) {
    return { authed: true, open: true, user: { username: 'open', name: 'Open access', role: 'admin' } };
  }

  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return { authed: false, open: false, user: null };

  const session = await getSession(sha256(token));
  if (!session) return { authed: false, open: false, user: null };

  await touchSession(sha256(token));

  const member = team().find((m) => m.username === session.username);
  return {
    authed: true,
    open: false,
    user: {
      username: session.username || 'admin',
      name: (member && member.name) || session.username || 'Admin',
      role: (member && member.role) || 'admin',
    },
  };
}

export async function startSession(req, member) {
  const token = randomToken(32);
  const expires = await createSession({
    tokenHash: sha256(token),
    username: member.username,
    userAgentValue: userAgent(req),
    ipHash: hashIp(req),
    days: SESSION_DAYS,
  });
  const cookie = buildCookie(COOKIE_NAME, token, {
    maxAge: SESSION_DAYS * 86_400,
    secure: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL),
  });
  return { cookie, expires };
}

export async function endSession(req) {
  const token = parseCookies(req)[COOKIE_NAME];
  if (token) await deleteSession(sha256(token));
  return buildCookie(COOKIE_NAME, '', {
    maxAge: 0,
    secure: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL),
  });
}

/** Convenience guard for write endpoints. */
export function canDelete(user) {
  return !user || user.role === 'admin';
}
