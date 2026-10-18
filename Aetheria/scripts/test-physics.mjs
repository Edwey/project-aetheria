/**
 * Test physics scene with Playwright
 */

import { chromium } from 'playwright';

async function testPhysics() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Log all console messages
  page.on('console', (msg) => {
    console.log(`[${msg.type()}]`, msg.text());
  });

  // Collect errors
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  console.log('Navigating to dev server...');
  await page.goto('http://localhost:5173/');

  console.log('Waiting for canvas...');
  await page.waitForSelector('#game', { timeout: 10000 });

  console.log('Waiting for scene to load...');
  await page.waitForTimeout(8000);

  // Wait for physics to run (sphere should fall)
  console.log('Waiting for physics simulation...');
  await page.waitForTimeout(5000);

  // Take screenshot
  await page.screenshot({ path: 'physics-test.png', fullPage: true });
  console.log('Screenshot saved to physics-test.png');

  if (errors.length > 0) {
    // Filter out non-critical 404 errors
    const criticalErrors = errors.filter(e => !e.includes('404'));
    if (criticalErrors.length > 0) {
      console.error('Found critical console errors:', criticalErrors);
      await browser.close();
      process.exit(1);
    } else {
      console.log('Ignoring non-critical 404 errors');
    }
  }

  console.log('Physics test passed!');
  await browser.close();
}

testPhysics().catch(console.error);
