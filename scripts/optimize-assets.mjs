#!/usr/bin/env node
/**
 * optimize-assets.mjs - extracts the curated set from assets/raw/*.zip,
 * runs @gltf-transform/cli (dedupe, prune, weld, quantize), writes GLB to
 * public/assets/models plus manifest.json (single source for manifest ids).
 * Safe no-op when a zip is missing (procedural fallbacks cover everything).
 *
 * Curated set mirrors Prompt.txt section 10 "Models used by the game".
 */
import { mkdir, copyFile, writeFile, readFile, stat, readdir, rename } from 'node:fs/promises';
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('../', import.meta.url);
const RAW = new URL('../assets/raw/', import.meta.url);
const OUT_MODELS = new URL('../public/assets/models/', import.meta.url);
const OUT_SOUNDS = new URL('../public/assets/sounds/', import.meta.url);

// [manifestId, zipFile, entryPathInZip, outPath, textureEntryInZip|null, textureOutPath|null]
// Textured kits keep their relative Textures/colormap.png layout (GLB URIs are relative).
const MODELS = [
  ['tree-oak', 'kenney-nature-kit.zip', 'Models/GLTF format/tree_detailed.glb', 'tree-oak.glb', null, null],
  ['tree-pine', 'kenney-nature-kit.zip', 'Models/GLTF format/tree_cone.glb', 'tree-pine.glb', null, null],
  ['rock', 'kenney-nature-kit.zip', 'Models/GLTF format/rock_smallA.glb', 'rock.glb', null, null],
  ['mushroom', 'kenney-nature-kit.zip', 'Models/GLTF format/mushroom_red.glb', 'mushroom.glb', null, null],
  ['flower', 'kenney-nature-kit.zip', 'Models/GLTF format/flower_redA.glb', 'flower.glb', null, null],
  ['cactus', 'kenney-nature-kit.zip', 'Models/GLTF format/cactus_tall.glb', 'cactus.glb', null, null],
  ['workbench', 'kenney-survival-kit.zip', 'Models/GLB format/workbench.glb', 'survival/workbench.glb', 'Models/GLB format/Textures/colormap.png', 'survival/Textures/colormap.png'],
  ['campfire', 'kenney-survival-kit.zip', 'Models/GLB format/campfire-pit.glb', 'survival/campfire.glb', 'Models/GLB format/Textures/colormap.png', 'survival/Textures/colormap.png'],
  ['table', 'kenney-furniture-kit.zip', 'Models/GLTF format/table.glb', 'table.glb', null, null],
  ['bed', 'kenney-furniture-kit.zip', 'Models/GLTF format/bedSingle.glb', 'bed.glb', null, null],
  ['boat', 'kenney-pirate-kit.zip', 'Models/GLB format/boat-row-small.glb', 'pirate/boat.glb', 'Models/GLB format/Textures/colormap.png', 'pirate/Textures/colormap.png'],
  ['dock', 'kenney-pirate-kit.zip', 'Models/GLB format/structure-platform-dock.glb', 'pirate/dock.glb', 'Models/GLB format/Textures/colormap.png', 'pirate/Textures/colormap.png'],
];

// [manifestId, zipFile, entryPathInZip, outFileName]
const SOUNDS = [
  ['ui-click', 'kenney-interface-sounds.zip', 'Audio/click_001.ogg', 'ui-click.ogg'],
  ['ui-confirm', 'kenney-interface-sounds.zip', 'Audio/confirmation_001.ogg', 'ui-confirm.ogg'],
  ['harvest-pop', 'kenney-impact-sounds.zip', 'Audio/impactGeneric_light_000.ogg', 'harvest-pop.ogg'],
  ['jingle', 'kenney-music-jingles.zip', 'Audio/8-Bit jingles/jingles_NES00.ogg', 'jingle.ogg'],
];

await mkdir(OUT_MODELS, { recursive: true });
await mkdir(OUT_SOUNDS, { recursive: true });

function extractEntry(zipPath, entry, destPath) {
  const tmp = join(tmpdir(), `aetheria-extract-${Date.now()}`);
  mkdirSync(tmp);
  if (process.platform === 'win32') {
    execFileSync(
      'powershell.exe',
      ['-NoProfile', '-Command', `Add-Type -AssemblyName System.IO.Compression.FileSystem; $z=[IO.Compression.ZipFile]::OpenRead('${zipPath}'); $e=$z.Entries | Where-Object { $_.FullName -eq '${entry}' }; if (!$e) { $z.Dispose(); exit 1 }; [IO.Compression.ZipFileExtensions]::ExtractToFile($e, '${join(tmp, 'f')}', $true); $z.Dispose()`],
      { stdio: 'pipe' },
    );
  } else {
    const out = execFileSync('unzip', ['-p', zipPath, entry], { stdio: ['ignore', 'pipe', 'pipe'] });
    writeFileSync(join(tmp, 'f'), out);
  }
  return join(tmp, 'f');
}

/** Count triangles by parsing the GLB JSON chunk (sum of index counts / 3). */
function countTriangles(glb) {
  const magic = glb.readUInt32LE(0);
  if (magic !== 0x46546c67) return null;
  const jsonLen = glb.readUInt32LE(12);
  const json = JSON.parse(glb.slice(20, 20 + jsonLen).toString('utf8'));
  let tris = 0;
  for (const mesh of json.meshes ?? []) {
    for (const prim of mesh.primitives ?? []) {
      if (prim.indices !== undefined) {
        const acc = json.accessors[prim.indices];
        tris += Math.floor(acc.count / 3);
      } else if (prim.attributes?.POSITION !== undefined) {
        tris += Math.floor(json.accessors[prim.attributes.POSITION].count / 3);
      }
    }
  }
  return tris;
}

function optimizeGlb(srcPath, destPath) {
  try {
    const cli = fileURLToPath(new URL('../node_modules/@gltf-transform/cli/bin/cli.js', import.meta.url));
    execFileSync(process.execPath, [cli, 'optimize', srcPath, destPath], { stdio: 'pipe', cwd: fileURLToPath(ROOT) });
    return 'gltf-transform';
  } catch {
    return null;
  }
}
const manifest = { version: 1, models: {}, sounds: {} };
const missing = [];

for (const [id, zip, entry, out, texEntry, texOut] of MODELS) {
  const zipPath = fileURLToPath(new URL(`../assets/raw/${zip}`, import.meta.url));
  if (!existsSync(zipPath)) {
    missing.push(id);
    continue;
  }
  try {
    const stageDir = join(tmpdir(), `aetheria-stage-${id}-${Date.now()}`);
    mkdirSync(stageDir, { recursive: true });
    const tmp = extractEntry(zipPath, entry);
    const staged = join(stageDir, 'model.glb');
    renameSync(tmp, staged);
    if (texEntry) {
      const texTmp = extractEntry(zipPath, texEntry);
      const texDir = join(stageDir, 'Textures');
      mkdirSync(texDir, { recursive: true });
      renameSync(texTmp, join(texDir, 'colormap.png'));
    }
    const outUrl = new URL(`../public/assets/models/${out}`, import.meta.url);
    await mkdir(new URL('./', outUrl), { recursive: true });
    const method = optimizeGlb(staged, fileURLToPath(outUrl));
    if (!method) await copyFile(staged, outUrl);
    if (texEntry) {
      // keep the relative Textures/ layout the GLB expects; share per-kit folder
      const texOutUrl = new URL(`../public/assets/models/${texOut}`, import.meta.url);
      await mkdir(new URL('./', texOutUrl), { recursive: true });
      if (!existsSync(fileURLToPath(texOutUrl))) {
        const stagedTex = join(stageDir, 'Textures', 'colormap.png');
        await copyFile(stagedTex, texOutUrl);
      }
    }
    const buf = readFileSync(fileURLToPath(outUrl));
    const st = await stat(outUrl);
    let textureKB = 0;
    if (texEntry) textureKB = Math.round((await stat(new URL(`../public/assets/models/${texOut}`, import.meta.url))).size / 1024);
    manifest.models[id] = {
      url: `/assets/models/${out}`,
      sizeKB: Math.round(st.size / 1024),
      triangles: countTriangles(buf),
      via: method ?? 'copy',
      ...(textureKB ? { textureKB, texture: `/assets/models/${texOut}` } : {}),
    };
    console.log(`model ${id}: ${(st.size / 1024).toFixed(1)} KB, ${manifest.models[id].triangles} tris (${method ?? 'copy'})`);
  } catch (err) {
    console.error(`model ${id}: FAILED ${err.message}`);
    missing.push(id);
  }
}

for (const [id, zip, entry, out] of SOUNDS) {
  const zipPath = fileURLToPath(new URL(`../assets/raw/${zip}`, import.meta.url));
  if (!existsSync(zipPath)) {
    missing.push(id);
    continue;
  }
  try {
    const tmp = extractEntry(zipPath, entry);
    renameSync(tmp, tmp + '.ogg');
    await copyFile(tmp + '.ogg', new URL(`../public/assets/sounds/${out}`, import.meta.url));
    const st = await stat(new URL(`../public/assets/sounds/${out}`, import.meta.url));
    manifest.sounds[id] = { url: `/assets/sounds/${out}`, sizeKB: Math.round(st.size / 1024) };
    console.log(`sound ${id}: ${(st.size / 1024).toFixed(1)} KB`);
  } catch (err) {
    console.error(`sound ${id}: FAILED ${err.message}`);
    missing.push(id);
  }
}

const manifestJson = JSON.stringify(manifest, null, 2);
await writeFile(new URL('../public/assets/models/manifest.json', import.meta.url), manifestJson);
// The ported game fetches 'assets/manifest.json' (relative); serve the same
// manifest there until R1 rewires to manifest ids (see DECISIONS.md).
await writeFile(new URL('../public/assets/manifest.json', import.meta.url), manifestJson);
if (missing.length > 0) console.log(`missing (fallback covers): ${missing.join(', ')}`);
else console.log('all curated assets staged');
console.log('Wrote public/assets/models/manifest.json + public/assets/manifest.json');
