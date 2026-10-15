#!/usr/bin/env node
/**
 * fetch-assets.mjs - downloads "direct" and "page" sources from assets/sources.json.
 * For manual sources (itch.io, Patreon, Drive) it prints exact steps instead.
 * Verifies what it fetched (zip magic + size) into assets/raw/FETCH_REPORT.json.
 *
 * Usage:
 *   node scripts/fetch-assets.mjs            # everything downloadable
 *   node scripts/fetch-assets.mjs --only=kenney-nature-kit
 */
import { readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const only = onlyArg ? onlyArg.slice('--only='.length) : null;

const sources = JSON.parse(await readFile(new URL('../assets/sources.json', import.meta.url), 'utf8'));

await mkdir(new URL('../assets/raw/', import.meta.url), { recursive: true });
await mkdir(new URL('../public/assets/models/', import.meta.url), { recursive: true });

const rawUrl = (id) => new URL(`../assets/raw/${id}.zip`, import.meta.url);

async function fetchPageZip(pageUrl) {
  const res = await fetch(pageUrl, { redirect: 'follow' });
  if (!res.ok) throw new Error(`page HTTP ${res.status}`);
  const html = await res.text();
  const m = html.match(/https:\/\/kenney\.nl\/media\/pages\/assets\/[^"'\s]+\.zip/);
  if (!m) throw new Error('no kenney .zip link found on page');
  return m[0];
}

const report = { fetchedAt: new Date().toISOString(), manual: [], downloaded: [], skipped: [], failed: [] };

for (const s of sources) {
  if (only && s.id !== only) continue;
  console.log(`- [${s.license}] ${s.name} (${s.download})`);
  if (s.download === 'manual') {
    console.log(`  MANUAL: ${s.manualSteps ?? 'see sources.json'}`);
    console.log(`  Drop zip into: ${s.dropFolder ?? 'assets/raw/'}`);
    report.manual.push(s.id);
    continue;
  }
  try {
    const dest = rawUrl(s.id);
    if (existsSync(dest)) {
      const st = await stat(dest);
      console.log(`  exists (${(st.size / 1048576).toFixed(1)} MB), skipping`);
      report.skipped.push({ id: s.id, bytes: st.size });
      continue;
    }
    const zipUrl = s.download === 'direct' && s.url ? s.url : await fetchPageZip(s.page);
    console.log(`  GET ${zipUrl}`);
    const res = await fetch(zipUrl, { redirect: 'follow' });
    if (!res.ok) throw new Error(`zip HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 4 || buf[0] !== 0x50 || buf[1] !== 0x4b) throw new Error('not a zip (bad magic)');
    await writeFile(dest, buf);
    console.log(`  saved ${(buf.length / 1048576).toFixed(1)} MB -> assets/raw/${s.id}.zip`);
    report.downloaded.push({ id: s.id, bytes: buf.length, url: zipUrl });
  } catch (err) {
    console.error(`  FAILED: ${err.message}`);
    report.failed.push({ id: s.id, error: err.message });
  }
}

await writeFile(new URL('../assets/raw/FETCH_REPORT.json', import.meta.url), JSON.stringify(report, null, 2));
console.log('Wrote assets/raw/FETCH_REPORT.json');
if (report.failed.length > 0) process.exitCode = 1;
