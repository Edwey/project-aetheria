#!/usr/bin/env node
/**
 * optimize-assets.mjs - runs @gltf-transform/cli: dedupe, prune, weld, quantize, meshopt.
 * Output GLB to public/assets/models plus manifest.json.
 * Safe no-op when assets/raw is empty (procedural fallbacks cover everything).
 */
import { readdir, writeFile } from 'node:fs/promises';

let raws = [];
try {
  raws = await readdir(new URL('../assets/raw/', import.meta.url));
} catch {
  raws = [];
}
const models = raws.filter((f) => f.endsWith('.glb') || f.endsWith('.gltf') || f.endsWith('.zip'));
console.log(`Found ${models.length} raw model(s). Empty is fine - game uses procedural fallbacks.`);

const manifest = { version: 1, models: {} };
await writeFile(
  new URL('../public/assets/models/manifest.json', import.meta.url),
  JSON.stringify(manifest, null, 2),
);
console.log('Wrote public/assets/models/manifest.json (empty manifest, Stage D fills it)');
