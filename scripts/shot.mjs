#!/usr/bin/env node
/**
 * shot.mjs - Playwright visual check: serves dist/ (or dev), loads the game,
 * captures console errors + screenshots.
 *
 * Usage:
 *   npm run shot -- [out.png]        # serves dist/ on :4173 automatically
 *   node scripts/shot.mjs out.png --url=http://localhost:5173/
 */
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const out = process.argv[2] ?? 'screenshots/boot.png';
const urlArg = process.argv.find((a) => a.startsWith('--url='));
let url = urlArg ? urlArg.slice(6) : null;
let server = null;

await mkdir('screenshots', { recursive: true });

if (!url) {
  url = 'http://localhost:4173/';
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', '4173', '--strictPort'], { stdio: 'pipe' });
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('preview server did not start')), 20000);
    server.stdout.on('data', (d) => { if (String(d).includes('4173')) { clearTimeout(t); resolve(); } });
    server.stderr.on('data', () => {});
    server.on('exit', () => reject(new Error('preview server exited')));
  });
}

const { chromium } = await import('@playwright/test');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(6000); // let terrain build + first frames render
await page.screenshot({ path: out });

const canvasPixels = await page.evaluate(() => {
  const c = document.getElementById('c');
  if (!c) return { present: false };
  const t = document.createElement('canvas');
  t.width = 32; t.height = 32;
  t.getContext('2d').drawImage(c, 0, 0, 32, 32);
  const d = t.getContext('2d').getImageData(0, 0, 32, 32).data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) sum += d[i] + d[i + 1] + d[i + 2];
  return { present: true, w: c.width, h: c.height, mean: sum / (32 * 32 * 3) };
});

console.log(JSON.stringify({ out, errors: errors.slice(0, 10), canvasPixels }, null, 1));
await browser.close();
if (server) server.kill();
if (errors.length > 0) process.exitCode = 2;
