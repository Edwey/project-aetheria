// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const BASE_KENNEY_URL = 'https://raw.githubusercontent.com/shorepine/kenney/main/3d';

/**
 * @typedef {Object} ModelSource
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {string} sourcePath
 * @property {string} targetPath
 * @property {string} license
 * @property {string} author
 * @property {string} authorUrl
 * @property {string} description
 */

/** @type {ModelSource[]} */
export const MODEL_SOURCES = [
  // --- Nature & Flora ---
  {
    id: 'tree_oak',
    name: 'Oak Tree',
    category: 'nature',
    sourcePath: 'nature/tree_oak.glb',
    targetPath: 'nature/tree_oak.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Stylized low-poly broadleaf oak tree'
  },
  {
    id: 'tree_pine',
    name: 'Pine Tree',
    category: 'nature',
    sourcePath: 'nature/tree_pineDefaultA.glb',
    targetPath: 'nature/tree_pine.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Stylized evergreen pine tree'
  },
  {
    id: 'tree_small',
    name: 'Small Tree',
    category: 'nature',
    sourcePath: 'nature/tree_small.glb',
    targetPath: 'nature/tree_small.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Compact sapling tree'
  },
  {
    id: 'tree_tall',
    name: 'Tall Tree',
    category: 'nature',
    sourcePath: 'nature/tree_tall.glb',
    targetPath: 'nature/tree_tall.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Slender vertical forest tree'
  },
  {
    id: 'cactus',
    name: 'Cactus',
    category: 'nature',
    sourcePath: 'nature/cactus_tall.glb',
    targetPath: 'nature/cactus.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Desert saguaro cactus'
  },
  {
    id: 'mushroom_red',
    name: 'Red Mushroom',
    category: 'nature',
    sourcePath: 'nature/mushroom_red.glb',
    targetPath: 'nature/mushroom_red.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Woodland toadstool with spotted cap'
  },
  {
    id: 'mushroom_tan',
    name: 'Tan Mushroom',
    category: 'nature',
    sourcePath: 'nature/mushroom_tan.glb',
    targetPath: 'nature/mushroom_tan.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Earth-tone forest button mushroom'
  },
  {
    id: 'flower_red',
    name: 'Red Flower',
    category: 'nature',
    sourcePath: 'nature/flower_redA.glb',
    targetPath: 'nature/flower_red.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Vibrant red meadow blossom'
  },
  {
    id: 'flower_yellow',
    name: 'Yellow Flower',
    category: 'nature',
    sourcePath: 'nature/flower_yellowA.glb',
    targetPath: 'nature/flower_yellow.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Bright sunny daisy flower'
  },
  {
    id: 'flower_purple',
    name: 'Purple Flower',
    category: 'nature',
    sourcePath: 'nature/flower_purpleA.glb',
    targetPath: 'nature/flower_purple.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Wild lilac lavender flower'
  },
  {
    id: 'campfire',
    name: 'Campfire',
    category: 'nature',
    sourcePath: 'nature/campfire_stones.glb',
    targetPath: 'nature/campfire.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Stone ring hearth with burning wood logs'
  },

  // --- Rocks & Boulders ---
  {
    id: 'boulder_large',
    name: 'Heavy Sinking Boulder',
    category: 'rocks',
    sourcePath: 'nature/rock_largeB.glb',
    targetPath: 'rocks/boulder_large.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Heavy high-density boulder (2.5 kg/m³) that sinks in deep water'
  },
  {
    id: 'rock_large',
    name: 'Large Rock',
    category: 'rocks',
    sourcePath: 'nature/rock_largeA.glb',
    targetPath: 'rocks/rock_large.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Faceted low-poly granite boulder'
  },
  {
    id: 'rock_small',
    name: 'Small Rock',
    category: 'rocks',
    sourcePath: 'nature/rock_smallA.glb',
    targetPath: 'rocks/rock_small.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Scatter ground pebble / cobble'
  },
  {
    id: 'rock_tall',
    name: 'Tall Rock Pillar',
    category: 'rocks',
    sourcePath: 'nature/rock_tallA.glb',
    targetPath: 'rocks/rock_tall.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Vertical geological rock spire'
  },
  {
    id: 'crystal_geode',
    name: 'Geode Crystal',
    category: 'rocks',
    sourcePath: 'platformer/jewel.glb',
    targetPath: 'rocks/crystal_geode.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Faceted resonant mineral crystal for Stone Geode form'
  },

  // --- Props & Physics Interactables ---
  {
    id: 'crate_wood',
    name: 'Buoyant Wooden Crate',
    category: 'props',
    sourcePath: 'prototype/crate.glb',
    targetPath: 'props/crate_wood.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Buoyant cargo crate (density 0.6 kg/m³) that floats and bobs on water'
  },
  {
    id: 'crate_large',
    name: 'Large Wooden Crate',
    category: 'props',
    sourcePath: 'survival/box-large.glb',
    targetPath: 'props/crate_large.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Sturdy reinforced heavy storage box'
  },
  {
    id: 'barrel_wood',
    name: 'Wooden Barrel',
    category: 'props',
    sourcePath: 'survival/barrel.glb',
    targetPath: 'props/barrel_wood.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Cylindrical rolling timber barrel'
  },
  {
    id: 'chest',
    name: 'Treasure Chest',
    category: 'props',
    sourcePath: 'mini-dungeon/chest.glb',
    targetPath: 'props/chest.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Lidded trunk with iron fittings'
  },
  {
    id: 'lantern',
    name: 'Lantern',
    category: 'props',
    sourcePath: 'fantasy-town/lantern.glb',
    targetPath: 'props/lantern.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Hanging glass beacon for Wisp Lantern form'
  },
  {
    id: 'canoe',
    name: 'Wooden Canoe',
    category: 'props',
    sourcePath: 'nature/canoe.glb',
    targetPath: 'props/canoe.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Floating watercraft for lake exploration'
  },
  {
    id: 'boat_row',
    name: 'Row Boat',
    category: 'props',
    sourcePath: 'pirate/boat-row-small.glb',
    targetPath: 'props/boat_row.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Small wooden skiff'
  },
  {
    id: 'bed',
    name: 'Cozy Cot Bed',
    category: 'props',
    sourcePath: 'nature/bed.glb',
    targetPath: 'props/bed.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Wooden camping bedstead'
  },

  // --- Structures & Proving Grounds Mechanics ---
  {
    id: 'pressure_plate_square',
    name: 'Square Pressure Plate',
    category: 'structures',
    sourcePath: 'prototype/button-floor-square.glb',
    targetPath: 'structures/pressure_plate_square.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Floor trigger requiring heavy mass (>8 kg Obsidian / boulder) to depress'
  },
  {
    id: 'pressure_plate_round',
    name: 'Round Pressure Plate',
    category: 'structures',
    sourcePath: 'prototype/button-floor-round.glb',
    targetPath: 'structures/pressure_plate_round.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Circular contact pad sensor'
  },
  {
    id: 'gate_sliding',
    name: 'Heavy Slotted Gate',
    category: 'structures',
    sourcePath: 'prototype/door-sliding.glb',
    targetPath: 'structures/gate_sliding.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Solid obstacle passable only via Mist phase or pressure plate trigger'
  },
  {
    id: 'grate_metal',
    name: 'Metal Grate Slot',
    category: 'structures',
    sourcePath: 'modular-dungeon/gate-metal-bars.glb',
    targetPath: 'structures/grate_metal.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Narrow 0.5m barred opening for Oobleck fluid squeezing'
  },
  {
    id: 'stairs_stone',
    name: 'Spectral Stairs',
    category: 'structures',
    sourcePath: 'fantasy-town/stairs-stone.glb',
    targetPath: 'structures/stairs_stone.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Ethereal steps solidified by Lantern hard-light condensation'
  },
  {
    id: 'ladder',
    name: 'Wooden Ladder',
    category: 'structures',
    sourcePath: 'prototype/ladder.glb',
    targetPath: 'structures/ladder.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Vertical climbing rung frame'
  },

  // --- Cosmetics & Collectibles ---
  {
    id: 'hat_cap',
    name: 'Cloth Cap',
    category: 'cosmetics',
    sourcePath: 'prototype/hat-cap.glb',
    targetPath: 'cosmetics/hat_cap.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Wearable soft peaked cap with spring physics'
  },
  {
    id: 'hat_hard',
    name: 'Hard Hat',
    category: 'cosmetics',
    sourcePath: 'prototype/hat-hard.glb',
    targetPath: 'cosmetics/hat_hard.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Sturdy protective dome helmet'
  },
  {
    id: 'charm_star',
    name: 'Celestial Star',
    category: 'cosmetics',
    sourcePath: 'platformer/star.glb',
    targetPath: 'cosmetics/charm_star.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Floating luminous star charm'
  },
  {
    id: 'coin_gold',
    name: 'Sun Coin',
    category: 'cosmetics',
    sourcePath: 'platformer/coin-gold.glb',
    targetPath: 'cosmetics/coin_gold.glb',
    license: 'CC0',
    author: 'Kenney',
    authorUrl: 'https://kenney.nl',
    description: 'Collectible gleaming token'
  }
];

/**
 * Downloads a single model, computes its SHA-256 hash, and saves it.
 * @param {ModelSource} model
 * @param {string} destDir
 */
async function fetchModel(model, destDir) {
  const url = `${BASE_KENNEY_URL}/${model.sourcePath}`;
  const outPath = path.join(destDir, model.targetPath);
  const outDir = path.dirname(outPath);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${model.id} from ${url}: HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');

  fs.writeFileSync(outPath, buffer);

  return {
    ...model,
    bytes: buffer.byteLength,
    sha256: `sha256:${hash}`,
    localPath: `assets/models/${model.targetPath}`
  };
}

export async function run() {
  console.log('🚀 Aetheria Asset Pipeline: Fetching and arranging 3D models...');

  const publicModelsDir = path.join(ROOT_DIR, 'public', 'assets', 'models');
  const manifestPath = path.join(publicModelsDir, 'manifest.json');
  const packagesManifestPath = path.join(ROOT_DIR, 'packages', 'assets', 'manifest.json');
  const licensesPath = path.join(ROOT_DIR, 'assets', 'LICENSES.json');

  if (!fs.existsSync(publicModelsDir)) {
    fs.mkdirSync(publicModelsDir, { recursive: true });
  }
  const assetsDir = path.join(ROOT_DIR, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const results = [];
  const categories = new Set();

  for (let i = 0; i < MODEL_SOURCES.length; i++) {
    const src = MODEL_SOURCES[i];
    process.stdout.write(`[${i + 1}/${MODEL_SOURCES.length}] Downloading ${src.name} (${src.category})... `);
    try {
      const res = await fetchModel(src, publicModelsDir);
      results.push(res);
      categories.add(src.category);
      console.log(`✓ (${(res.bytes / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.log(`✗ Error: ${err.message}`);
      throw err;
    }
  }

  // Generate Manifest
  const manifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalModels: results.length,
    categories: Array.from(categories),
    totalBytes: results.reduce((acc, r) => acc + r.bytes, 0),
    models: {}
  };

  for (const r of results) {
    manifest.models[r.id] = {
      id: r.id,
      name: r.name,
      category: r.category,
      path: r.localPath,
      file: path.basename(r.targetPath),
      license: r.license,
      author: r.author,
      authorUrl: r.authorUrl,
      description: r.description,
      bytes: r.bytes,
      sha256: r.sha256
    };
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\n📋 Saved manifest to: ${manifestPath}`);

  // Also write to packages/assets/manifest.json for compile-time TypeScript integration
  const pkgDir = path.dirname(packagesManifestPath);
  if (!fs.existsSync(pkgDir)) fs.mkdirSync(pkgDir, { recursive: true });
  fs.writeFileSync(packagesManifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`📋 Mirrored manifest to: ${packagesManifestPath}`);

  // Generate LICENSES.json
  const licenses = {
    generatedAt: new Date().toISOString(),
    pipeline: 'Aetheria CC0 Asset Ingestion',
    packs: [
      {
        name: 'Kenney Game Assets (Nature, Survival, Prototype, Platformer, Fantasy Town, Modular Dungeon, Pirate)',
        author: 'Kenney (Asset Jesus)',
        website: 'https://kenney.nl',
        license: 'CC0 1.0 Universal (Public Domain Dedication)',
        licenseUrl: 'http://creativecommons.org/publicdomain/zero/1.0/',
        attributionRequired: false,
        modelsIncluded: results.map(r => r.id)
      }
    ]
  };

  fs.writeFileSync(licensesPath, JSON.stringify(licenses, null, 2), 'utf-8');
  console.log(`📜 Saved licenses to: ${licensesPath}`);

  console.log('\n✨ Asset download and arrangement completed successfully!');
  console.log(`   Total models: ${results.length}`);
  console.log(`   Total size: ${(manifest.totalBytes / 1024).toFixed(1)} KB`);
  console.log(`   Categories: ${Array.from(categories).join(', ')}`);
}

// Run directly if invoked from CLI
if (process.argv[1] && process.argv[1].endsWith('fetch-assets.mjs')) {
  run().catch(err => {
    console.error('Fatal error in asset pipeline:', err);
    process.exit(1);
  });
}
