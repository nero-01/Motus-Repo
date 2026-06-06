/**
 * Injects PWA link tags into dist/index.html after expo export.
 * Expo static export does not always merge app/+html.tsx manifest links.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const distHtml = join(process.cwd(), 'dist', 'index.html');

if (!existsSync(distHtml)) {
  console.warn('inject-pwa-html: dist/index.html not found — skip');
  process.exit(0);
}

const tags = [
  '<link rel="manifest" href="/manifest.json" />',
  '<link rel="apple-touch-icon" href="/icon-192.png" />',
];

let html = readFileSync(distHtml, 'utf8');

for (const tag of tags) {
  if (html.includes(tag)) {
    continue;
  }
  html = html.replace('</head>', `  ${tag}\n</head>`);
}

writeFileSync(distHtml, html);
console.log('inject-pwa-html: OK');
