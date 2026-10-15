#!/usr/bin/env node
/**
 * generate-credits.mjs - generates docs/CREDITS.md from assets/LICENSES.json.
 * NEVER hand-edit docs/CREDITS.md.
 */
import { readFile, writeFile } from 'node:fs/promises';

const licenses = JSON.parse(await readFile(new URL('../assets/LICENSES.json', import.meta.url), 'utf8'));

const lines = ['# CREDITS.md (auto-generated - do not hand-edit)', '', 'Generated from assets/LICENSES.json.', ''];
for (const [id, e] of Object.entries(licenses)) {
  lines.push(`- **${id}** - ${e.name ?? id} by ${e.author ?? 'unknown'} (${e.license})`);
  if (e.attribution) lines.push(`  - ${e.attribution}`);
}
lines.push('');
await writeFile(new URL('../docs/CREDITS.md', import.meta.url), lines.join('\n'));
console.log('Generated docs/CREDITS.md');
