/**
 * middleware.js — Vercel Edge Middleware.
 *
 * Two jobs, both driven by the ADMIN_PATH environment variable:
 *
 *   1. HIDE the admin app. Set ADMIN_PATH=/ngd-control-8241 and /admin (plus
 *      /admin/anything) returns a plain 404 for the whole world. Only your
 *      secret path serves the dashboard.
 *
 *   2. REWRITE the secret path onto the real /admin/* files, so the browser
 *      never learns the real location and links inside the page keep working.
 *
 * If ADMIN_PATH is not set, nothing changes: the dashboard lives at /admin.
 *
 * Note: this runs on Vercel only. `server.js` implements the same behaviour for
 * local development, so `npm run dev` matches production.
 */
import { NextResponse } from 'next/server';

export const config = {
  // everything except static assets we know are public
  matcher: ['/((?!assets/|favicon.svg).*)'],
};

const REAL_ADMIN = '/admin';

export default function middleware(request) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;

    const secret = (process.env.ADMIN_PATH || '').trim();
    const hideAt = secret && secret !== REAL_ADMIN ? normalize(secret) : '';

    // 1. the real path is off-limits while a secret path is configured
    if (hideAt && (pathname === REAL_ADMIN || pathname.startsWith(REAL_ADMIN + '/'))) {
      return notFound();
    }

    // 2. the secret path (and its assets) map onto the real admin app
    if (hideAt && (pathname === hideAt || pathname.startsWith(hideAt + '/'))) {
      // a bare "/secret" would break the relative ?css/js links, so send the
      // browser to "/secret/" first (and keep the pretty URL in the address bar)
      if (pathname === hideAt) return NextResponse.redirect(new URL(hideAt + '/', url), 308);
      const rest = pathname.slice(hideAt.length);
      const target = new URL(REAL_ADMIN + (rest === '/' ? '/index.html' : rest), url);
      const response = NextResponse.rewrite(target);
      // the dashboard must never be indexed or cached
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }

    // 3. no secret path configured → the dashboard simply lives at /admin
    if (!hideAt && (pathname === REAL_ADMIN || pathname === REAL_ADMIN + '/')) {
      if (pathname === REAL_ADMIN) return NextResponse.redirect(new URL(REAL_ADMIN + '/', url), 308);
      const response = NextResponse.rewrite(new URL(REAL_ADMIN + '/index.html', url));
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }

    return NextResponse.next();
  } catch (err) {
    // never break the site because of a middleware hiccup
    console.error('[middleware]', err);
    return NextResponse.next();
  }
}

function normalize(value) {
  let path = value.startsWith('/') ? value : '/' + value;
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path;
}

function notFound() {
  return new NextResponse(
    '<!doctype html><meta charset="utf-8"><title>404 — Not Found</title>' +
      '<body style="margin:0;background:#0A0A0F;color:#E8E8EF;font:16px/1.6 system-ui;display:grid;place-items:center;min-height:100vh">' +
      '<div style="text-align:center"><h1 style="margin:0 0 8px;font-size:40px">404</h1>' +
      '<p style="opacity:.55">This page could not be found.</p>' +
      '<p><a href="/" style="color:#8FB6FF">Back to home</a></p></div></body>',
    { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
