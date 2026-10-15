#!/usr/bin/env node
/**
 * check-assets.mjs - runs in CI and FAILS if:
 * - a manifest model/sound has no LICENSES.json entry
 * - a license is not CC0 or attributed CC-BY
 * - a prop exceeds triangle/size budget (2,000 tris, 20 KB per file)
 * - total staged models exceed the 4 MB gzipped budget (checked uncompressed here)
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

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
}

let stagedKB = 0;
const manifestUrl = new URL('../public/assets/models/manifest.json', import.meta.url);
if (existsSync(manifestUrl)) {
  const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
  for (const [id, m] of Object.entries(manifest.models ?? {})) {
    if (!licenses[id]) {
      console.error(`FAIL: model ${id} has no LICENSES.json entry`);
      failed = true;
    }
    if ((m.triangles ?? 0) > 2000) {
      console.error(`FAIL: ${id} exceeds 2000 triangle budget (${m.triangles})`);
      failed = true;
    }
    if ((m.sizeKB ?? 0) > 20) {
      console.error(`FAIL: ${id} exceeds 20 KB budget (${m.sizeKB} KB)`);
      failed = true;
    }
    stagedKB += (m.sizeKB ?? 0) + (m.textureKB ?? 0);
  }
  for (const [id] of Object.entries(manifest.sounds ?? {})) {
    if (!licenses[id]) {
      console.error(`FAIL: sound ${id} has no LICENSES.json entry`);
      failed = true;
    }
  }
  for (const [id, s] of Object.entries(manifest.sounds ?? {})) stagedKB += s.sizeKB ?? 0;
  if (stagedKB > 4096) {
    console.error(`FAIL: staged assets exceed 4 MB budget (${stagedKB} KB)`);
    failed = true;
  }
  console.log(`manifest: ${Object.keys(manifest.models ?? {}).length} models, ${Object.keys(manifest.sounds ?? {}).length} sounds, ${stagedKB} KB staged`);
}

if (failed) process.exit(1);
console.log(`assets:check ok (${Object.keys(licenses).length} licensed entries)`);
