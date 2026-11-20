import { afterEach, describe, expect, it } from 'vitest';
import { getSession } from '../../server/api/_db.js';
import { parseCookies, sha256 } from '../../server/api/_http.js';

process.env.DATABASE_URL = '';

const auth = await import('../../server/api/_auth.js');

afterEach(() => {
  delete process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_USERNAME;
  delete process.env.ADMIN_NAME;
  delete process.env.TEAM_MEMBERS;
});

describe('_auth', () => {
  it('findMember is closed when nothing is configured', () => {
    expect(auth.authEnabled()).toBe(false);
    expect(auth.findMember('anyone', 'anything')).toEqual({ ok: false, open: false });
  });

  it('single-owner login: username is optional when ADMIN_USERNAME is unset', () => {
    process.env.ADMIN_PASSWORD = 'secret-pass';
    expect(auth.authEnabled()).toBe(true);

    const ok = auth.findMember('admin', 'secret-pass');
    expect(ok.ok).toBe(true);
    expect(ok.open).toBe(false);
    expect(ok.member.role).toBe('admin');

    expect(auth.findMember('someone', 'secret-pass').ok).toBe(true); // owner is optional
    expect(auth.findMember('admin', 'wrong').ok).toBe(false);
    expect(auth.findMember('admin', '').ok).toBe(false);
  });

  it('team logins with per-member roles', () => {
    process.env.TEAM_MEMBERS = JSON.stringify([
      { username: 'Ali', password: 'pw-ali', name: 'Ali Khan', role: 'admin' },
      { username: 'sara', password: 'pw-sara', name: 'Sara' },
    ]);
    expect(auth.team().map((m) => m.role)).toEqual(['admin', 'member']);
    expect(auth.publicTeam().map((m) => m.username)).toEqual(['Ali', 'sara']);

    expect(auth.findMember('ali', 'pw-ali').member.username).toBe('Ali'); // roster keeps the configured case
    expect(auth.findMember('sara', 'pw-sara').member.role).toBe('member');
    expect(auth.findMember('ali', 'nope').ok).toBe(false);
  });

  it('invalid TEAM_MEMBERS JSON is ignored', () => {
    process.env.TEAM_MEMBERS = 'not json at all';
    expect(auth.team()).toEqual([]);
    expect(auth.authEnabled()).toBe(false);
  });

  it('currentAdmin is locked when login is not configured', async () => {
    const admin = await auth.currentAdmin({ headers: {} });
    expect(admin.authed).toBe(false);
    expect(admin.open).toBe(false);
    expect(admin.user).toBeNull();
  });

  it('startSession issues a cookie whose session is retrievable, then deletes it', async () => {
    process.env.ADMIN_PASSWORD = 'secret-pass';
    const { cookie } = await auth.startSession({ headers: {} }, { username: 'devil', name: 'Devil', role: 'admin' });
    expect(cookie).toContain('ngd_admin=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');

    const token = parseCookies({ headers: { cookie } }).ngd_admin;
    expect(token).toBeTruthy();
    const session = await getSession(sha256(token));
    expect(session?.username).toBe('devil');

    await auth.endSession({ headers: { cookie } });
    expect(await getSession(sha256(token))).toBeNull();
  });
});
