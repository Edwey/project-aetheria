# ASSETS.md — Asset Sources, Licenses, Pipeline, Budgets

Aligned with `AETHERIA_MASTER_PLAN.md` (v4). Desktop browser only.

---

## 1. Asset Pipeline Overview

Assets in Aetheria are fetched from curated CC0 / public domain sources, optimized using glTF-Transform, tracked in a manifest, and given procedural fallback geometry. The game must run cleanly even with an empty `public/assets/` folder.

```
External CC0 Sources
        │
        ▼ (scripts/fetch-assets.mjs)
assets/raw/  (gitignored raw source packs)
        │
        ▼ (scripts/optimize-assets.mjs via glTF-Transform)
public/assets/models/*.glb  +  public/assets/models/manifest.json
        │
        ▼ (scripts/check-assets.mjs CI budget check)
Verified & bundled for runtime
```

### Pipeline Scripts
1. **Fetch**: `pnpm run assets:fetch` downloads or guides downloads of packs from licensed sources into `assets/raw/`.
2. **Optimize**: `pnpm run assets:optimize` deduplicates, welds, quantizes, and applies meshopt compression via glTF-Transform.
3. **Check**: `pnpm run assets:check` validates licenses, triangle budgets, and file sizes in CI.
4. **Placeholders**: `pnpm run make-placeholders` generates procedural fallback SVG icons and materials.

---

## 2. Directory Structure

```
Aetheria/
├── assets/
│   ├── sources.json          # Pack definitions, URLs, and licenses
│   ├── LICENSES.json         # Auto-generated attribution database
│   └── raw/                  # Gitignored raw downloads (.zip, .gltf, .obj)
├── public/
│   └── assets/
│       ├── models/           # Optimized runtime GLB files
│       │   └── manifest.json # Asset registry (IDs, sizes, triangles)
│       ├── audio/            # Ambient loops, chimes, UI audio
│       └── ui/               # SVG icons, HUD elements
└── src/render/
    └── fallbacks.ts          # Procedural Three.js geometry fallbacks
```

---

## 3. Approved CC0 Sources

Only CC0 or properly attributed CC-BY 4.0 assets are permitted:

1. **Kenney (kenney.nl)** — CC0:
   - Nature Kit (trees, rocks, flowers, mushrooms)
   - Survival Kit (workbench, campfire, wooden planks)
   - Furniture Kit (tables, stools, lanterns)
   - Interface & Impact Sounds (clicks, chimes, landing thuds)
2. **Quaternius (quaternius.com)** — CC0:
   - Stylized low-poly plants, conifers, desert flora, crystals.
3. **KayKit (kaylousberg.itch.io)** — CC0:
   - Low-poly props, decorative pieces, hats/accessories.
4. **Self-Authored Procedural Primitives**:
   - Custom low-poly geometries generated via Three.js (slimes, wisps, geodes).

---

## 4. Asset Budgets (Desktop Only)

| Metric | Budget | Description |
| :--- | :--- | :--- |
| **Initial JS Bundle** | $< 700\text{ KB}$ | Gzipped JavaScript payload |
| **Total Models** | $< 5\text{ MB}$ | All runtime GLBs combined (gzipped) |
| **Per-Prop Model** | $< 25\text{ KB}$ | Single compressed prop GLB |
| **Prop Triangle Count** | $\le 2,000$ | Triangles per individual prop model |
| **Total Visible Triangles** | $\le 150,000$ | On-screen triangle budget at 60 FPS |
| **Draw Calls** | $\le 60$ | Enforced via InstancedMesh & batched meshes |
| **Heap Memory** | $< 250\text{ MB}$ | Peak browser tab memory footprint |
| **Texture Resolution** | $256 \times 256$ to $512 \times 512$ | Prefer vertex colors or lightweight palettes |

---

## 5. Procedural Primitives & Fallbacks

**Mandatory Rule**: The entire island must generate and render using procedural Three.js primitives if asset GLBs are missing or disabled.

| Asset Type | Procedural Fallback |
| :--- | :--- |
| **Deciduous Trees** | Cylinder trunk + Icosahedron/Cone foliage with vertex noise |
| **Conifers / Pines** | Stacked stepped cones on a tapered cylinder trunk |
| **Rocks & Boulders** | Low-poly Dodecahedron / Icosahedron with random vertex jitter |
| **Crystals / Geodes** | Sharpened Octahedron with emissive material accent |
| **Flora / Flowers** | Small extruded cylinders / disc clusters with vibrant vertex tint |
| **Workbench / Campfire** | Composed boxes, stone ring cylinder, point-light flicker |
| **Structures / Walls** | Extruded rectangular geometry with snapped grid coordinates |

---

## 6. Four Regional Prop Manifest

Props are mapped across the four island regions:

1. **The Shimmering Coast**:
   - Driftwood logs, smooth beach stones, seashells, kelp clumps, dock pilings, tidepool stones.
2. **Whispering Pines**:
   - Tall pine trees, granite slabs, alpine moss patches, fallen logs, pinecone pickups.
3. **Sunbaked Crags**:
   - Sandstone arches, hoodoos, terracotta boulders, dry brush, clay mounds, oasis palms.
4. **The Bioluminescent Basin**:
   - Giant glowing mushrooms, bioluminescent spores, cypress knees, damp marsh reeds, glowing crystals.

---

## 7. Quality & Governor Settings

The runtime performance governor maintains 60 FPS on desktop:

- **Standard Quality**:
  - Full InstancedMesh density for foliage and grass.
  - Shadow map resolution $2048 \times 2048$.
  - Full particle budgets (500 ambient/weather particles).
  - Screen-space outlines & water caustic highlights.
- **Throttled / Eco Quality** (if sustained frame drops occur):
  - Drops foliage instance count by 35%.
  - Shadow map reduced to $1024 \times 1024$ or soft directional shadow.
  - Particle count capped at 200.
  - Preserves 60 FPS target without altering physics or gameplay.
