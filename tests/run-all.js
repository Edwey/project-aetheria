/**
 * Test runner - discovers tests/unit/*.test.js and runs them.
 * Usage: node tests/run-all.js
 */
import { readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), 'unit');
const files = (await readdir(root)).filter((f) => f.endsWith('.test.js')).sort();

let passed = 0;
let failed = 0;
const failures = [];

for (const f of files) {
  const mod = await import(pathToFileURL(join(root, f)).href);
  const exported = mod.tests ?? mod.default ?? {};
  const entries = Array.isArray(exported)
    ? exported.map((fn) => [fn.name ?? 'anon', fn])
    : Object.entries(exported);
  for (const [name, fn] of entries) {
    if (typeof fn !== 'function') continue;
    try {
      await fn();
      passed += 1;
      console.log(`ok - ${f} :: ${name}`);
    } catch (err) {
      failed += 1;
      failures.push(`${f} :: ${name}: ${err?.message ?? err}`);
      console.error(`FAIL - ${f} :: ${name}: ${err?.stack ?? err}`);
    }
  }
}

console.log(`\n${passed} passed, ${failed} failed, ${files.length} files`);
if (failed > 0) {
  console.error('Failures:\n' + failures.join('\n'));
  process.exit(1);
}
