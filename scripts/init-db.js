/**
 * npm run init-db — creates the tables in Neon (idempotent).
 * Reads DATABASE_URL from .env.local / .env or the shell.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const file of ['.env.local', '.env']) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

if (!process.env.DATABASE_URL) {
  console.error('✗ DATABASE_URL is not set. Add it to .env.local first.');
  process.exit(1);
}

const { ensureSchema, ping } = await import('../server/api/_db.js');
const result = await ping();
if (!result.ok) {
  console.error('✗ Could not reach Neon:', result.error);
  process.exit(1);
}
await ensureSchema();
console.log('✓ Neon schema ready (leads, admin_sessions).');
