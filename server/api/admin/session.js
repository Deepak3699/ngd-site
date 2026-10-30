/**
 * GET /api/admin/session — who am I, is login on, which alerts are live.
 */
import { methodNotAllowed, ok } from '../_http.js';
import { currentAdmin, authEnabled, publicTeam } from '../_auth.js';
import { DB_MODE } from '../_db.js';
import { notificationStatus } from '../_notify.js';
import { siteConfig, adminPath } from '../_config.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const admin = await currentAdmin(req);

  return ok(res, {
    authed: admin.authed,
    open: false,
    configured: authEnabled(),
    user: admin.user || null,
    team: publicTeam(),
    dbMode: DB_MODE,
    adminPath: adminPath(),
    notifications: notificationStatus(),
    contact: {
      email: siteConfig.email,
      whatsapp: siteConfig.whatsapp,
      whatsappDisplay: siteConfig.whatsappDisplay,
      phone: siteConfig.phone,
    },
  });
}
