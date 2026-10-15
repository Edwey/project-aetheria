# ASSETS.md - Asset Sources, Licenses, Pipeline, Budgets

## Asset Pipeline Overview

Assets are fetched from CC0 sources, optimized, and referenced via a manifest. Procedural primitives serve as fallbacks.

### Pipeline Steps
1. **Fetch**: `scripts/fetch-assets.mjs` downloads packs from sources
2. **Optimize**: `scripts/optimize-assets.mjs` processes with glTF-Transform
3. **Check**: `scripts/check-assets.mjs` validates in CI
4. **Placeholders**: `scripts/make-placeholders.mjs` creates UI icon placeholders

### File Locations
- **Sources**: `assets/sources.json` (pack definitions)
- **Raw downloads**: `assets/raw/` (gitignored)
- **Optimized models**: `public/assets/models/` (GLB files)
- **Manifest**: `public/assets/models/manifest.json`
- **UI assets**: `public/assets/ui/` (SVG placeholders)
- **Licenses**: `assets/LICENSES.json` (auto-generated credits)

---

## Candidate CC0 Sources

### Kenney (kenney.nl)
**License**: CC0 (Creative Commons Zero)

**Packs**:
- Nature Kit: Trees, rocks, flowers, mushrooms
- Survival Kit: Workbench, campfire, tools
- Furniture Kit: Tables, beds, chairs
- Fantasy Town Kit: Fantasy structures
- Pirate Kit: Boats, docks
- Interface Sounds: UI sound effects
- Impact Sounds: Impact/hit sounds
- Music Jingles: Short music clips

**Download type**: Direct

---

### Quaternius (quaternius.com)
**License**: CC0

**Packs**:
- Stylized nature packs: Trees, bushes, rocks (variety)

**Download type**: Direct or page

---

### KayKit (kaylousberg.itch.io)
**License**: CC0

**Packs**:
- Forest and nature packs: Trees, bushes, rocks
- Hats and props: Cosmetic items

**Download type**: Manual (itch.io requires click)

---

### Poly Pizza
**License**: Varies (CAUTION)

**Note**: Only use CC0 or CC-BY with attribution in CREDITS.md
- Avoid Sketchfab (unclear licenses)
- Only use if license is explicitly CC0 or CC-BY

**Download type**: Manual

---

## Asset Rules

### sources.json Format
```json
{
  "packs": [
    {
      "id": "kenney-nature-kit",
      "name": "Nature Kit",
      "author": "Kenney",
      "pageUrl": "https://kenney.nl/assets/nature-kit",
      "license": "CC0",
      "downloadType": "direct",
      "downloadUrl": "https://example.com/nature-kit.zip",
      "files": ["*.glb", "*.gltf"],
      "destination": "models/nature"
    }
  ]
}
```

### Fetch Script
- Downloads "direct" and "page" sources automatically
- Parses page for .zip link for "page" type
- Prints manual steps for itch.io/Patreon/Drive downloads
- Verifies what was fetched
- Creates LICENSES.json entry

### Optimize Script
Uses `@gltf-transform/cli`:
- **Dedupe**: Remove duplicate vertices/attributes
- **Prune**: Remove unused nodes/meshes
- **Weld**: Merge nearby vertices
- **Quantize**: Reduce precision to save space
- **Meshopt**: Apply meshoptimizer compression
- **Merge by material**: Combine meshes with same material
- **Output**: GLB to `public/assets/models/`
- **Manifest**: Generates `manifest.json` with model IDs

### Check Script (CI)
Fails if:
- Model has no LICENSES.json entry
- License is not CC0 or attributed CC-BY
- Prop exceeds triangle budget (2,000 triangles)
- Prop exceeds size budget (20 KB gzipped)
- Total models exceed budget (4 MB gzipped)

### Placeholder Script
Creates SVG placeholders for:
- UI icons (32×32 or 64×64)
- Logo (256×256)
- With README instructions for file names to replace

---

## Asset Manifest

### Manifest Format
```json
{
  "models": {
    "oak_tree": {
      "file": "oak_tree.glb",
      "license": "CC0",
      "author": "Kenney",
      "triangles": 1200,
      "size": "15KB"
    },
    "pine_tree": {
      "file": "pine_tree.glb",
      "license": "CC0",
      "author": "Kenney",
      "triangles": 800,
      "size": "12KB"
    }
  }
}
```

### Usage
- Game references models by manifest ID (not file path)
- Fallback to procedural primitives if ID not found
- Runtime loads from `public/assets/models/`

---

## Procedural Fallbacks

Every asset has a procedural fallback using Three.js primitives:
- **Trees**: Cylinder (trunk) + Cone/Sphere (foliage)
- **Rocks**: Icosahedron with flat shading
- **Geodes**: Icosahedron with emissive color
- **Flowers**: Small spheres
- **Workbench**: Box geometry
- **Campfire**: Cylinders + cones for fire
- **Furniture**: Box combinations

**Rule**: Game must run with empty `public/assets/` folder

---

## In-Game Models

### Required Models
- **Trees**: Oak, pine, cactus, mushroom
- **Rocks**: Various sizes
- **Geodes**: Glowing crystals
- **Flowers**: Petal and spore types
- **Crafting**: Workbench, campfire, torch, bowl
- **Furniture**: Table, bed
- **Boats/Docks**: For R3+ (sea access)
- **Hats**: Optional cosmetic overrides (R5+)

### Cosmetics
- **Default**: Procedural primitives
- **Optional**: CC0 hat models from manifest
- **Slots**: Head, face, back, aura, trail

---

## Asset Budgets

### Size Budgets
- **Initial JS (gzipped)**: < 400 KB
- **First load**: < 2.5 MB
- **Total models (gzipped)**: < 4 MB
- **Per prop**: < 20 KB gzipped
- **Textures**: 256-512 px or none

### Triangle Budgets
- **Per prop**: < 2,000 triangles
- **Total visible**: 40,000-60,000 triangles

### Memory Budget
- **Total memory**: < 120 MB
- **Draw calls**: 25-35

---

## Asset Categories

### Nature
- Trees (oak, pine, cactus, mushroom)
- Rocks (various sizes)
- Flowers (petal, spore)
- Geodes (glowing crystals)
- Clay deposits

### Structures
- Workbench
- Campfire
- Torch
- Table
- Bed
- Foundation pieces
- Wall pieces
- Roof pieces
- Door pieces

### Cosmetics
- Hats (wizard, crown, ears, etc.)
- Face items (glasses, blush)
- Back items (backpack, wings)
- Aura effects (sparkles, fireflies)
- Trail effects (stars, petals)

### Audio (R5+)
- Ambient sounds per biome
- UI sounds (craft, build, harvest)
- Chimes and feedback sounds

---

## License Tracking

### LICENSES.json Format
```json
{
  "packs": [
    {
      "id": "kenney-nature-kit",
      "name": "Nature Kit",
      "author": "Kenney",
      "license": "CC0",
      "url": "https://kenney.nl/assets/nature-kit",
      "attribution": null
    },
    {
      "id": "custom-model",
      "name": "Custom Model",
      "author": "Artist Name",
      "license": "CC-BY 4.0",
      "url": "https://example.com",
      "attribution": "© 2024 Artist Name, CC-BY 4.0"
    }
  ]
}
```

### CREDITS.md Generation
- Script reads LICENSES.json
- Generates human-readable credits
- Never hand-edited (always regenerate)

---

## Manual Download Steps

For sources requiring manual clicks (itch.io, Patreon, Drive):

1. Run `npm run assets:fetch`
2. Script prints exact URL and folder
3. Download pack manually
4. Drop zip into `assets/raw/`
5. Run `npm run assets:optimize`

---

## Scripts Reference

### fetch-assets.mjs
```bash
npm run assets:fetch
```
- Downloads automatic sources
- Prints manual download instructions
- Verifies downloads
- Updates LICENSES.json

### optimize-assets.mjs
```bash
npm run assets:optimize
```
- Processes raw assets with glTF-Transform
- Outputs GLB to public/assets/models/
- Generates manifest.json
- Reports size and triangle counts

### check-assets.mjs
```bash
npm run assets:check
```
- Validates all assets
- Checks licenses
- Enforces budgets
- Fails CI if violations found

### make-placeholders.mjs
```bash
npm run make-placeholders
```
- Creates SVG placeholders for UI
- Creates README with replacement instructions
- Outputs to public/assets/ui/

---

## Quality Settings

### Full Quality
- All assets loaded
- Full resolution textures
- All flora instances

### Light Quality (Default on Touch)
- Reduced flora count
- Pixel ratio at most 1.25
- Shadow map 1024
- 350 weather particles
- No outline blur
- No caustics

---

## Numbers Summary

### Size Budgets
- Initial JS: < 400 KB gzipped
- First load: < 2.5 MB
- Total models: < 4 MB gzipped
- Per prop: < 20 KB gzipped

### Triangle Budgets
- Per prop: < 2,000 triangles
- Total visible: 40,000-60,000 triangles

### Texture Budgets
- Resolution: 256-512 px or none
- Prefer vertex colors over textures

### Performance
- Draw calls: 25-35
- Memory: < 120 MB
- Light quality particle counts: 162 (slime), 48 (wisp), 350 (weather)
