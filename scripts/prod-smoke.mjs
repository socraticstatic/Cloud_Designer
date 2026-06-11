// Production-bundle smoke check. The Playwright suite runs against the
// dev server, which does not chunk - a chunking bug once shipped a
// production build that crashed before first paint (TDZ ReferenceError
// from a cycle split across manual chunks) while every test was green.
// This script serves the BUILT bundle and fails the pipeline unless the
// app actually paints in a fresh headless browser.
//
// Usage: node scripts/prod-smoke.mjs   (requires `npm run build` first)

import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const PORT = 4199;
const URL = `http://localhost:${PORT}/Cloud_Designer/`;

const preview = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: 'ignore',
  detached: false
});

const fail = (msg) => {
  console.error(`PROD SMOKE FAILED: ${msg}`);
  preview.kill();
  process.exit(1);
};

await new Promise(r => setTimeout(r, 2500));

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e).slice(0, 300)));

try {
  await page.goto(URL, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  const painted = await page.evaluate(() => document.body.innerText.length > 50);
  if (errors.length > 0) fail(`page errors: ${errors.join(' | ')}`);
  if (!painted) fail('page loaded but painted no content');
  console.log('prod smoke OK: bundle paints with zero page errors');
} catch (e) {
  fail(e.message);
} finally {
  await browser.close();
  preview.kill();
}
