/** POST /api/admin/logout — clears the admin session cookie + DB row. */
import { methodNotAllowed, ok } from '../_http.js';
import { endSession } from '../_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  const cookie = await endSession(req);
  return ok(res, { loggedOut: true }, { 'Set-Cookie': cookie });
}
