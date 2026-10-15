/**
 * build.mjs — cross-platform build runner.
 * Automatically handles python/python3 differences between Windows and Linux/Vercel.
 */
import { spawnSync } from 'node:child_process';

const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

console.log('1/3 Building homepage markup & injecting SEO/GEO/AEO schemas...');
const p1 = spawnSync(pythonCmd, ['scripts/build-homepage.py'], { stdio: 'inherit', shell: true });
if (p1.status !== 0) process.exit(p1.status || 1);

console.log('\n2/3 Compiling Tailwind CSS...');
const p2 = spawnSync('npm', ['run', 'css'], { stdio: 'inherit', shell: true });
if (p2.status !== 0) process.exit(p2.status || 1);

console.log('\n3/3 Inlining compiled styles into single-bundle HTML...');
const p3 = spawnSync('node', ['scripts/inline-tailwind.mjs'], { stdio: 'inherit', shell: true });
if (p3.status !== 0) process.exit(p3.status || 1);

console.log('\n✓ Build complete: public/index.html is ready for production!');
