import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', locale: 'en-US', viewport: { width: 1366, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
await page.goto('https://quaternius.itch.io/stylized-nature-megakit', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(4000);
await page.screenshot({ path: 'screenshots/quat-itch.png' });

// dump visible buttons/links
const links = await page.locator('a, button').evaluateAll((els) => els.map(e => ({ t: (e.textContent||'').trim().slice(0,60), tag: e.tagName.toLowerCase(), cls: e.className, href: e.href })));
console.log('clickable:', JSON.stringify(links.filter(x => /download|claim|free|no thanks/i.test(x.t)).slice(0, 15), null, 1));

// find the download button
const btn = page.locator('a:has-text("Download"), button:has-text("Download"), [class*="download"]').first();
if (await btn.count()) {
  console.log('found download btn:', await btn.textContent());
  const dl = page.waitForEvent('download', { timeout: 60000 }).catch(() => null);
  await btn.click({ force: true });
  await page.waitForTimeout(3000);
  const download = await dl;
  if (download) {
    console.log('DOWNLOAD STARTED:', download.suggestedFilename());
    await download.saveAs('assets/raw/quaternius-stylized-nature.zip');
    console.log('SAVED');
  } else {
    console.log('no download event - checking for claim wall');
    const claim = page.locator('a:has-text("No thanks"), a:has-text("claim"), button:has-text("No thanks")').first();
    if (await claim.count()) {
      console.log('claim button found:', await claim.textContent());
      await claim.click();
      await page.waitForTimeout(2000);
      const btn2 = page.locator('a:has-text("Download"), button:has-text("Download")').first();
      const dl2 = page.waitForEvent('download', { timeout: 60000 }).catch(() => null);
      await btn2.click({ force: true });
      const download2 = await dl2;
      if (download2) {
        console.log('DOWNLOAD AFTER CLAIM:', download2.suggestedFilename());
        await download2.saveAs('assets/raw/quaternius-stylized-nature.zip');
      } else {
        console.log('still no download');
      }
    }
  }
} else {
  console.log('no download button found');
}

await browser.close();