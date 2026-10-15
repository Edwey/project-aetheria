#!/usr/bin/env node
/**
 * fetch-itch.mjs - Playwright attempt at the two manual asset sources.
 * Quaternius pack page -> itch.io -> free download into assets/raw/.
 * KayKit itch.io -> list nature/hat packs, read license lines, download CC0 ones.
 * Anything needing a human (login, captcha, payment, ambiguous license) is
 * reported, never bypassed. Usage: node scripts/fetch-itch.mjs [--only=quaternius|kaykit]
 */
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const only = (process.argv.find((a) => a.startsWith('--only=')) ?? '').slice(7) || null;
await mkdir('assets/raw', { recursive: true });

const { chromium } = await import('@playwright/test');
const browser = await chromium.launch();
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  acceptDownloads: true,
});
const page = await ctx.newPage();
const report = { at: new Date().toISOString(), downloaded: [], skipped: [], needsHuman: [] };

async function tryDownloadFlow(startUrl, destPath, label) {
  console.log(`== ${label}: ${startUrl}`);
  try {
    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.route('**/*.{png,jpg,jpeg,webp,svg,woff,woff2,css,js}', r => r.abort());
    await page.waitForTimeout(2000);

    // quaternius itch.io has a purchase page with claim wall
    // step 1: click "No thanks, just take me to the downloads" bypass
    const claim = page.locator('a.direct_download_btn, a:has-text("No thanks"), a:has-text("claim")').first();
    if (await claim.count()) {
      console.log('   clicking claim bypass...');
      await claim.click();
      await page.waitForTimeout(3000);
    }

    // step 2: click the download element (fragment link or button)
    const dlBtn = page.locator('#game_download_1533060, [href="#game_download_1533060"], a:has-text("Download"), button:has-text("Download")').first();
    if (await dlBtn.count()) {
      const dl = page.waitForEvent('download', { timeout: 60000 }).catch(() => null);
      await dlBtn.click({ force: true });
      await page.waitForTimeout(3000);
      const download = await dl;
      if (download) {
        await download.saveAs(destPath);
        report.downloaded.push({ label, destPath });
        console.log(`   saved -> ${destPath}`);
        return;
      }
    }

    // fallback: generic download button
    const btn = page.locator('a:has-text("Download"), button:has-text("Download")').first();
    if (await btn.count()) {
      const dl = page.waitForEvent('download', { timeout: 60000 }).catch(() => null);
      await btn.click({ force: true });
      await page.waitForTimeout(3000);
      const download = await dl;
      if (download) {
        await download.saveAs(destPath);
        report.downloaded.push({ label, destPath });
        console.log(`   saved -> ${destPath}`);
        return;
      }
    }

    report.needsHuman.push({ label, reason: 'no download element found', url: page.url() });
    console.log('   no download element found - needs human');
  } catch (err) {
    report.needsHuman.push({ label, reason: String(err).slice(0, 200), url: startUrl });
    console.log(`   FAILED: ${err.message?.slice(0, 160)}`);
  }
}

if (!only || only === 'quaternius') {
  // the itch.io link hides behind a "Download" panel -> "Download on Itch.io" button -> popup
  // buttons are not rendered (display:none); must click via evaluate() to bypass visibility
  try {
    await page.goto('https://quaternius.com/packs/stylizednaturemegakit.html', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);

    // open the Download panel via evaluate (bypasses visibility)
    await page.evaluate(() => { const b = document.getElementById('button3'); if (b) b.click(); });
    await page.waitForTimeout(1500);

    // click the Itch button via evaluate, catch the popup
    const [popup] = await Promise.all([
      ctx.waitForEvent('page', { timeout: 20000 }).catch(() => null),
      page.evaluate(() => { const b = document.getElementById('button2'); if (b) b.click(); }),
    ]);
    console.log('quaternius itch popup:', popup?.url() ?? 'none');
    if (!popup || !popup.url().includes('itch.io')) {
      report.needsHuman.push({ label: 'quaternius', reason: 'itch popup did not open to itch.io', url: page.url() });
    } else {
      // the popup opens the main pack page; we need the /purchase page for the claim bypass + download
      const purchaseUrl = popup.url().replace(/\/$/, '') + '/purchase';
      console.log('navigating to purchase page:', purchaseUrl);
      await tryDownloadFlow(purchaseUrl, 'assets/raw/quaternius-stylized-nature.zip', 'quaternius-stylized-nature');
      await popup.close().catch(() => {});
    }
  } catch (err) {
    report.needsHuman.push({ label: 'quaternius', reason: String(err).slice(0, 200), url: 'https://quaternius.com/packs/stylizednaturemegakit.html' });
  }
}

if (!only || only === 'kaykit') {
  try {
    await page.goto('https://kaylousberg.itch.io/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    const games = await page.locator('.game_cell a.game_link, a.title').evaluateAll((els) => els.map((e) => ({ t: e.textContent.trim(), h: e.href })));
    console.log('kaykit entries:', JSON.stringify(games.slice(0, 20), null, 1).slice(0, 1500));
    const picks = games.filter((g) => /forest|nature|tree|hat|prop/i.test(g.t)).slice(0, 4);
    for (const p of picks) {
      await page.goto(p.h, { waitUntil: 'domcontentloaded', timeout: 45000 });
      const body = (await page.locator('body').innerText()).slice(0, 4000);
      const lic = body.match(/licen[cs]e[^.\n]{0,120}/gi) ?? [];
      console.log(`-- ${p.t}: license hints: ${JSON.stringify(lic.slice(0, 3))}`);
      const cc0 = /CC0/i.test(lic.join(' '));
      if (!cc0) {
        report.needsHuman.push({ label: `kaykit:${p.t}`, reason: 'CC0 not confirmed on page - human must verify', url: p.h });
        continue;
      }
      const dest = `assets/raw/kaykit-${p.t.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.zip`;
      if (!existsSync(dest)) await tryDownloadFlow(p.h, dest, `kaykit:${p.t}`);
      else report.skipped.push(dest);
    }
  } catch (err) {
    report.needsHuman.push({ label: 'kaykit', reason: String(err).slice(0, 200), url: 'https://kaylousberg.itch.io/' });
  }
}

console.log(JSON.stringify(report, null, 1));
await browser.close();