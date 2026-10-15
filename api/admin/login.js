/**
 * POST /api/admin/login — team-aware.
 * Body: { username?, password }
 * With a single owner login configured, username may be omitted.
 */
import { clean, fail, json, methodNotAllowed, ok, rateLimit, clientIp, readBody } from '../_http.js';
import { authEnabled, findMember, startSession, publicTeam } from '../_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  if (!authEnabled()) {
    return ok(res, { open: true, team: [], message: 'Admin is open — set ADMIN_PASSWORD to require a login.' });
  }

  const limit = rateLimit(`login:${clientIp(req)}`, 8, 5 * 60_000);
  if (!limit.allowed) {
    return json(
      res,
      429,
      { ok: false, error: { code: 'rate_limited', message: 'Too many attempts. Try again in a few minutes.' } },
      { 'Retry-After': String(limit.retryAfter) }
    );
  }

  const body = await readBody(req);
  const username = clean(body.username, 60);
  const password = String(body.password || '');

  const result = findMember(username, password);
  if (!result.ok) {
    await new Promise((r) => setTimeout(r, 400)); // slow down brute force
    return fail(res, 401, 'invalid_credentials', 'Incorrect username or password.');
  }

  const { cookie } = await startSession(req, result.member);
  return ok(
    res,
    { open: false, user: { username: result.member.username, name: result.member.name, role: result.member.role }, team: publicTeam() },
    { 'Set-Cookie': cookie }
  );
}
