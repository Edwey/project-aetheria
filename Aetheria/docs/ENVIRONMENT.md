# ENVIRONMENT.md — Regions, Weather, Wind, Resources, Crafting, Building

Aligned with `AETHERIA_MASTER_PLAN.md` v4.

## The Island & Four Regions

One compact, continuous island. Sprint across ~90 seconds. Everything open from minute one. Every region and main route works for every family, through different physics paths where needed.

| Region (display name) | Built Biome | Role |
| --- | --- | --- |
| Verdant Refuge | Lush Plains | Friendly hub with a clear home landmark. Crafting, storage, comfort. Useful, never required. |
| Wildwood | Mystic Grove | Gathering, gentle wildlife, sheltered routes, soil. |
| Waterworn Basin | Frostpeak Taiga | Snowmelt streams feed ponds, ditches and diving. Home of water and digging. |
| Windcarved Heights | Sunstone Dunes | Hot sand makes natural thermals. Gliding, wind, sand traction, momentum routes. |

Each region needs one authored landmark, one shortcut and one safe resting point. Supporting content is procedural.

---

## Terrain & Hybrid Grid

Chunked heightfield rendered as flat-shaded low-poly geometry with baked vertex ambient occlusion. Under it sits a flat integer grid of 1 m cells storing soil moisture, crop stage, trench depth and water level.

**Ditches:** digging lowers a cell's trench depth (0.3 m). It does not rebuild the terrain collider. The avatar's ground probe subtracts trench depth so feet sink in. Water, moisture and visuals read the grid. Rolling props use the flat collider and ignore ditches. Phase 0 experiment: if a rolling Geode visibly floats over a ditch, give rolling props the same ground-probe offset or add a thin collider strip.

---

## Water System

Water level per grid cell moves downhill in a small flow step (~4 per second). Active radius ~24 m around player at full detail; distant basins keep one summary value and exchange water through fixed weirs. Rain fills reservoirs, trenches carry water, moisture spreads 2–3 cells. Buoyancy and swimming read the grid directly.

**Demo version:** one reservoir and one authored trench path.

### Universal Water Movement

All nine forms obey the same rules:
- **No underwater glide.** Gliding disabled when submerged fraction >8%.
- **Swimming replaces glide.** WASD paddles (~9 m/s²; 7 for Lantern/Geode, 5 for Obsidian). Space strokes upward up to 3 m/s.
- **Dense forms** (Geode, Obsidian) sink and walk lakebed, can jump from it. Obsidian doesn't stroke upward.
- **Planing** (Oobleck, Aerolite) is a speed effect above 3.5 m/s, not glide. Gas forms hover over the surface.
- **Bounce off** while submerged.

---

## Weather, Air & Wildlife

- **Clear, wind and rain** with smooth transitions. Weather never damages buildings and never forces shelter.
- **Thermals:** authored upward air fields, concentrated over the Heights, with a few elsewhere. Zephyr, Bubble and Aerolite ride them.
- **Five species:** frogs, moths, birds, dragonflies, owls. Simple routines and habitat attraction (ponds → dragonflies, porches → owls, Lantern → moths). Trust 0–100 per species. Companions are stretch goal. No death or neglect.

### Wind Rules

- **Moor rule:** no input + on ground = not pushed by wind. Light forms gain from thermals/gliding, never helpless drift. Obsidian is wind-immune.
- **Ride the wind (G hold):** tailwinds speed you up, headwinds never slow you, updrafts lift you.

---

## Resources

Resources are gathered by interaction with the world. No hunger or survival pressure.

### Harvesting Methods
- **Impact:** running into flora at speed
- **Pound (F):** ground pound near flora
- **Absorb:** passing through flowers
- **Rolling:** stone rolling into geodes/clay

---

## Crafting

- **Pocket items** (twine, torch, campfire, bowl, workbench) craft anywhere.
- **Building pieces** need a workbench within 5 m.
- **Nearby storage** supplies crafting; no global inventory.

---

## Building

### Pieces
Foundations, floors, walls, roofs, stairs, ramps, doors, windows, bridges. Furniture rotates freely and snaps to surfaces. Structural pieces snap to 0.5 m and 1.0 m grid. Adaptive stilts reach down to 3.0 m.

### Rules
- Pieces need support when placed; nothing ever collapses or decays.
- **Undo/redo:** 20 steps, restoring full cost.
- **Dismantling** returns 75%.
- **Ghost preview:** green = valid, red = invalid.
- **Build mode:** B toggles. Enter places, Backspace removes, X rotates.
- **Ctrl+Z / Ctrl+Y** undo/redo.

### Farming
- Crops grow from soil moisture and weather.
- Never die; dry plant just pauses.
- Offline growth computed on load, capped at 72 hours.

### Progression
- Comes from recipes, resources, discoveries, convenience and decoration.
- Never from gated regions, grind or forced quests.

### Stretch Goals
- Copy/paste, mirror, blueprints saved as JSON.

---

## Puzzles

- Handcrafted landmarks plus physics interactions (weight/impact plates, gates, water routing).
- Optional hints and a reset always.
- No puzzle can ruin a save.

---

## Numbers Summary

### Terrain
- Sprint crossing: ~90 s
- Height grid cell: 1 m (hybrid grid)
- Trench depth: 0.3 m

### Weather
- Transitions: smooth
- No damage, no forced shelter

### Wind
- Moor rule: cancels wind while idle + grounded
- Ride (G hold): tailwind boost, no headwind slowdown

### Water
- Flow steps: ~4 per second
- Active radius: ~24 m
- Submerge threshold: 8%
- Paddle drive: 9 m/s² (7 Lantern/Geode, 5 Obsidian)
- Upward stroke cap: 3 m/s
- Planing threshold: 3.5 m/s, full at 5 m/s

### Building
- Grid: 0.5 m and 1.0 m
- Stilts: to 3.0 m
- Undo: 20 steps
- Dismantle: 75% return
- Workbench range: 5 m

### Farming
- Offline growth cap: 72 h

### Day/Night
- Cycle: 24 minutes
