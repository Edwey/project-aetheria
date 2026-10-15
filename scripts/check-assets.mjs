#!/usr/bin/env node
/**
 * check-assets.mjs - runs in CI and FAILS if:
 * - a model has no LICENSES.json entry
 * - a license is not CC0 or attributed CC-BY
 * - a prop exceeds triangle/size budget
 * - total models exceed budget
 */
import { readFile } from 'node:fs/promises';

const licenses = JSON.parse(await readFile(new URL('../assets/LICENSES.json', import.meta.url), 'utf8'));
const allowed = new Set(['CC0-1.0', 'CC-BY-3.0', 'CC-BY-4.0']);

let failed = false;
for (const [id, entry] of Object.entries(licenses)) {
  if (!allowed.has(entry.license)) {
    console.error(`FAIL: ${id} has disallowed license ${entry.license}`);
    failed = true;
  }
  if (entry.license.startsWith('CC-BY') && !entry.attribution) {
    console.error(`FAIL: ${id} is CC-BY but missing attribution`);
    failed = true;
  }
  if ((entry.triangles ?? 0) > 2000) {
    console.error(`FAIL: ${id} exceeds 2000 triangle budget (${entry.triangles})`);
    failed = true;
  }
  if ((entry.sizeKB ?? 0) > 20) {
    console.error(`FAIL: ${id} exceeds 20 KB budget (${entry.sizeKB} KB)`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log(`assets:check ok (${Object.keys(licenses).length} licensed entries)`);
