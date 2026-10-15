/**
 * server.js — zero-dependency local dev server.
 *
 * It emulates what Vercel does in production:
 *   • /api/<name>   →  api/<name>.js  (default-exported handler)
 *   • everything else → static file from /public
 *   • /admin        →  public/admin/index.html
 *
 * Run:  npm run dev   (http://localhost:3000)
 *
 * Nothing here is used on Vercel — there the same api/*.js files are deployed as
 * serverless functions automatically.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

/* ----------------------------- .env loading -----------------------------
   Runs FIRST, so PORT / ADMIN_PATH / ADMIN_PASSWORD below already see the
   values from .env.local (or .env) exactly like Vercel's environment does. */
for (const file of ['.env.local', '.env']) {
  const filePath = path.join(ROOT, file);
  if (!fs.existsSync(filePath)) continue;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    const key = match[1];
    let value = match[2].replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
  console.log(`[env] loaded ${file}`);
}

const PUBLIC_DIR = path.join(ROOT, 'public');
const API_DIR = path.join(ROOT, 'api');
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

/**
 * Optional secret path for the admin app — mirrors middleware.js, so what you
 * click locally is exactly what Vercel serves.
 */
const ADMIN_PATH = (() => {
  const raw = (process.env.ADMIN_PATH || '/admin').trim();
  let p = raw.startsWith('/') ? raw : '/' + raw;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
})();
const adminIsHidden = ADMIN_PATH !== '/admin';

/* --------------------------- .env.local loading --------------------------- */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.csv': 'text/csv; charset=utf-8',
};

const handlerCache = new Map();

async function loadHandler(filePath) {
  if (handlerCache.has(filePath)) return handlerCache.get(filePath);
  const promise = import(pathToFileURL(filePath).href).then((mod) => mod.default);
  handlerCache.set(filePath, promise);
  return promise;
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';

  // ---- admin routing: secret path in, real path hidden --------------------
  if (adminIsHidden) {
    if (rel === '/admin' || rel === '/admin/' || rel.startsWith('/admin/')) {
      return notFound(res);
    }
    if (rel === ADMIN_PATH || rel === ADMIN_PATH + '/' || rel.startsWith(ADMIN_PATH + '/')) {
      if (rel === ADMIN_PATH) return redirect(res, ADMIN_PATH + '/');
      const directTarget = path.join(PUBLIC_DIR, rel);
      if (!fs.existsSync(directTarget)) {
        rel = '/admin' + rel.slice(ADMIN_PATH.length);
        if (rel === '/admin' || rel === '/admin/') rel = '/admin/index.html';
      }
    }
  } else if (rel === '/admin') {
    return redirect(res, '/admin/');
  } else if (rel === '/admin/') {
    rel = '/admin/index.html';
  }

  const resolved = path.join(PUBLIC_DIR, rel);
  if (!resolved.startsWith(PUBLIC_DIR)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  let target = resolved;
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    target = path.join(target, 'index.html');
  }
  if (!fs.existsSync(target)) return notFound(res, rel);

  const ext = path.extname(target).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  fs.createReadStream(target).pipe(res);
}

function redirect(res, to) {
  res.writeHead(308, { Location: to, 'Cache-Control': 'no-store' });
  res.end();
}

function notFound(res, rel) {
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(
    '<!doctype html><meta charset="utf-8"><title>404 — Not Found</title>' +
      '<body style="background:#0A0A0F;color:#E8E8EF;font:16px system-ui;display:grid;place-items:center;height:100vh;margin:0">' +
      '<div style="text-align:center"><h1 style="margin:0 0 8px;font-size:40px">404</h1>' +
      '<p style="opacity:.55">This page could not be found.</p>' +
      '<p style="opacity:.55"><a style="color:#8FB6FF" href="/">Back to home</a></p>' +
      (rel ? `<p style="opacity:.25;font-size:12px">${rel}</p>` : '') +
      '</div></body>'
  );
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const started = Date.now();

  res.on('finish', () => {
    console.log(`${req.method} ${pathname} → ${res.statusCode} (${Date.now() - started}ms)`);
  });

  if (!pathname.startsWith('/api/')) return serveStatic(req, res, pathname);

  const rel = pathname.slice('/api/'.length).replace(/\/+$/, '');
  const safe = rel.split('/').filter((seg) => seg && seg !== '..' && !seg.startsWith('.'));
  if (!safe.length || safe.some((seg) => seg.startsWith('_'))) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: false, error: { code: 'not_found', message: 'Unknown API route.' } }));
  }

  const filePath = path.join(API_DIR, safe.join('/') + '.js');
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: false, error: { code: 'not_found', message: 'Unknown API route.' } }));
  }

  try {
    const handler = await loadHandler(filePath);
    if (typeof handler !== 'function') throw new Error('Handler has no default export.');
    await handler(req, res);
  } catch (err) {
    console.error(`[api error] ${pathname}`, err);
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: { code: 'server_error', message: String(err?.message || err) } }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  NGD site   →  http://localhost:${PORT}`);
  console.log(`  Admin      →  http://localhost:${PORT}${ADMIN_PATH}${adminIsHidden ? '   (secret path — /admin returns 404)' : ''}`);
  console.log(`  Health     →  http://localhost:${PORT}/api/health`);
  console.log(`  DB mode    →  ${process.env.DATABASE_URL ? 'neon' : 'dev-file (.dev-data/store.json)'}`);
  console.log(`  Login      →  ${process.env.ADMIN_PASSWORD || process.env.TEAM_MEMBERS ? 'ON' : 'OFF (set ADMIN_PASSWORD or TEAM_MEMBERS)'}`);
  console.log(`  Alerts     →  ${[process.env.RESEND_API_KEY && 'email', (process.env.WHATSAPP_TOKEN || process.env.CALLMEBOT_APIKEY) && 'whatsapp', process.env.NOTIFY_WEBHOOK && 'webhook'].filter(Boolean).join(' + ') || 'none configured'}\n`);
});
