#!/usr/bin/env node
/**
 * view-app.mjs - Opens the app with Playwright and takes a screenshot
 */
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();
await page.goto('http://localhost:5174');

// Wait for the app to load
await page.waitForTimeout(3000);

// Take a screenshot
await page.screenshot({ path: 'app-screenshot.png', fullPage: true });

console.log('Screenshot saved to app-screenshot.png');
console.log('Browser is open - press Ctrl+C to close');

// Keep browser open for manual inspection
await new Promise(() => {});
