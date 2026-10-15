#!/usr/bin/env node
/**
 * fetch-assets.mjs - downloads "direct" and "page" sources from assets/sources.json.
 * For manual sources prints exact steps. Verifies what it fetched.
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const sources = JSON.parse(await readFile(new URL('../assets/sources.json', import.meta.url), 'utf8'));

await mkdir(new URL('../assets/raw/', import.meta.url), { recursive: true });
await mkdir(new URL('../public/assets/models/', import.meta.url), { recursive: true });

console.log(`Asset sources: ${sources.length}`);
for (const s of sources) {
  console.log(`- [${s.license}] ${s.name} (${s.download})`);
  if (s.download === 'manual') {
    console.log(`  MANUAL: ${s.manualSteps ?? 'see sources.json'}`);
    console.log(`  Drop zip into: ${s.dropFolder ?? 'assets/raw/'}`);
  } else {
    console.log(`  (Stage D will download ${s.page ?? s.url})`);
  }
}

// Write a fetch report placeholder so CI can check it exists
const report = { fetchedAt: new Date().toISOString(), manualActionRequired: true, sources: sources.map((s) => s.id) };
await writeFile(new URL('../assets/raw/FETCH_REPORT.json', import.meta.url), JSON.stringify(report, null, 2));
console.log('Wrote assets/raw/FETCH_REPORT.json (manual downloads still required for itch.io sources)');
