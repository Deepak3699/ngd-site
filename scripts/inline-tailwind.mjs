/**
 * Inlines the compiled Tailwind stylesheet into public/index.html.
 *
 * Why: the page then works as a *single self-contained file* (double-click it,
 * host it anywhere, preview it in tools that can't fetch sibling assets) while
 * still being instantly cacheable when served. The source of truth stays
 * `src/input.css` + `tailwind.config.js`.
 */
import fs from 'node:fs';

const htmlPath = 'public/index.html';
const cssPath = 'public/assets/tailwind.css';

if (!fs.existsSync(cssPath)) {
  console.error('✗ ' + cssPath + ' not found — run `npm run css` first.');
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf8');
const linkRe = /[ \t]*<link rel="stylesheet" href="\/assets\/tailwind\.css" \/>[^<]*<[^>]*>/;
const looseRe = /[ \t]*<link rel="stylesheet" href="\/assets\/tailwind\.css" \/>\n[^\n]*\n/;

if (!linkRe.test(html) && !looseRe.test(html)) {
  if (html.includes('tailwind.css') === false) {
    console.log('• nothing to inline — link already replaced.');
    process.exit(0);
  }
}

const css = fs.readFileSync(cssPath, 'utf8');
const replacement = `<style id="tailwind">${css}</style>\n`;

html = html.replace(linkRe, replacement);
if (html.includes('/assets/tailwind.css')) {
  html = html.replace(looseRe, replacement);
}

fs.writeFileSync(htmlPath, html);
console.log('✓ inlined compiled Tailwind (' + (css.length / 1024).toFixed(1) + ' KB) into ' + htmlPath);
