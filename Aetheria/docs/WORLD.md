# WORLD.md - Hybrid Layout, Sky Islands, World API, Save Format

## World Layout

The world is a hybrid system: one bounded landmass with a surrounding sea, plus sky islands above.

### Landmass
- **Size**: 240 × 240 m
- **Biomes**: Four blended regions (plains, dunes, taiga, grove)
- **Height grid**: 0.5 m cells
- **Coordinate system**: Y up, origin at center
- **Bounds**: Arena at ±60 m (slightly larger than landmass for safety margin)

### Sea
- **Surrounds**: The entire landmass
- **Beach band**: Shallow transition zone near shore
- **Depth**: Up to ~6 m near shore in R3
- **Surface level**: Constant per water body
- **Rendering**: Single transparent plane per body with vertex-shader waves

### Sky Islands
- **Count**: 3 islands
- **Size**: ~60 m wide each
- **Height**: Centres 30-50 m above sea level
- **Content**: One resource or landmark per island
- **Access**: Thermals, mushroom trampolines, gliding, floating, bridges
- **Reachability**: Every island must be reachable by every form

### Void
- **Below sea level**: Creatures fall into the cloud sea
- **Respawn**: At last safe ground position
- **No damage**: Peaceful game, no punishment

---

## World API

### WorldSet
The world is a set of terrain bodies. Each body has:
- Height grid (0.5 m cells)
- Bounds (A = half-width)
- Colliders (boxes, spheres, cylinders)
- Flora (trees, rocks, geodes, flowers)
- Visual-only objects

### Height Query
```javascript
// Returns height at (x, z) with gradient
function groundHeight(world, x, z) {
  // Bilinear interpolation from height grid
  // Returns height in metres
}
```

### Collision Query
```javascript
// Call a function for each contact with a sphere
function forEachContact(world, x, y, z, radius, callback) {
  // Broadphase grid (4 m cells)
  // For each contact: callback(nx, ny, nz, penetration)
}
```

### World Building
```javascript
// Builder API for creating terrain
const T = builder(A);  // A = half-width
T.box(cx, cy, cz, hx, hy, hz, yaw, rx, rz, color, extra);
T.sphere(cx, cy, cz, r, color, extra);
T.cyl(x, y0, z, r, h, extra);
T.ramp(x0, z0, len, wid, angle, yaw, color, platformLen);
T.tunnel(cx, cz, len, gapH, gapW, color);
T.border();  // Arena walls
```

### Biome Query
```javascript
// Returns biome weights at position
function biomeAt(world, x, z) {
  // Returns [plains, dunes, taiga, grove] weights summing to 1
}
```

### Flora Query
```javascript
// World.flora object contains:
flora.trees   // Array of tree objects
flora.rocks   // Array of rock objects
flora.geodes  // Array of geode objects
flora.clays   // Array of clay objects
flora.flowers // Array of flower objects
```

---

## Chunked Rendering (R1)

### Chunk System
- **Chunk size**: 40 m
- **Grid**: 6 × 6 chunks for 240 m landmass
- **Camera**: Isometric orthographic, only needs chunks in view
- **Frustum culling**: Only render visible chunks

### Chunk Mesh
```javascript
// Each chunk has:
- Height grid slice (40 m × 40 m)
- Vertex colors (from biome blending)
- Instanced flora (per-chunk instances)
- Triangle mesh for ground
```

### Instanced Flora
- **Per-chunk instancing**: Trees, rocks, geodes, flowers
- **Manifest-driven**: Load from assets/manifest.json
- **Fallback**: Procedural primitives if manifest missing
- **Dynamic updates**: Instance matrices updated when flora state changes

---

## Sky Island Access

### Thermals
- **Location**: Dune crests (local height maxima in dunes biome)
- **Radius**: 5 m
- **Height**: Base + 12 m
- **Strength**: 4 m/s (fades at top)
- **Effect**: Updraft only while Riding
- **Max count**: 40 thermals

### Mushroom Trampolines
- **Location**: Mushroom caps in grove
- **Radius**: 1.2 × scale
- **Bounce**: Velocity boosted on landing
  - Boost: min(12, -incoming_velocity * 1.1 + 2)
- **Forms**: Slime and stone (wisp flies over)
- **Cooldown**: 0.3 s

### Gliding & Aerial Movement
- **Slime (Oobleck / Dewdrop / Bubble)**: Hold `Space` in air for aerated pancake parachute; fall velocity capped at -2.2 m/s (-1.2 m/s for Bubble).
- **Stone (Aerolite / Geode / Obsidian)**: Hold `Space` in air; Aerolite leverages high lift coefficient ($A_{\text{coeff}} \cdot k / m$) to ride thermals; Geode/Obsidian deploy crystal sail, fall velocity capped at -3.0 m/s.
- **Wisp (Mist / Zephyr / Lantern)**: Hold `Space` to ascend/rise (costs breath tank at 20/s); low aerodynamic density yields natural buoyant drift without descent penalty.

### Bridges
- **Connect**: Sky islands to each other and to landmass
- **Snapping**: Foundation-based pieces
- **Walking**: Normal physics on bridges

### Reachability Test
- **Requirement**: Every island reachable by all nine forms across all 3 creature families.
- **Test path**:
  1. Start at island spawn
  2. Use thermals, trampolines, gliding, bridges
  3. Reach every other island
  4. Return to landmass
- **Per-form verification**:
  - Slime: Elastic bounce / trampoline chain + sticky wall climb + parachute glide
  - Wisp: Space-rise ascent + wind draft glide + phase through barriers
  - Stone: Updraft thermal ride (Aerolite) / piton climb + crystal sail glide (Geode)

---

## Save Format

### Profile Save (localStorage)
**Key**: `aetheria.profile.v1`

```javascript
{
  v: 1,
  name: "Slimey",  // Up to 16 chars
  form: "slime",  // "slime" | "wisp" | "stone"
  look: {
    top: "#7cf0a0",
    bottom: "#2fbf62",
    translucency: 0.86,
    gloss: 1,
    size: 1,
    eyeStyle: "oval",
    eyeColor: "#16301f",
    mouth: "smile",
    core: "crystal"
  },
  body: {
    preset: "blob",
    stiff: 0.22,
    pressure: 1,
    skin: 0.9,
    grip: 0.55,
    sticky: 0.5,
    jmax: 15
  },
  cosmetics: {
    head: "none",
    face: "none",
    back: "none",
    aura: "none",
    trail: "none"
  }
}
```

### Game Save (localStorage + IndexedDB)
**Key**: `aetheria.save.v1`

```javascript
{
  v: 1,
  inv: {
    timber: 12,
    sap: 5,
    fiber: 8,
    starstone: 3,
    clay: 2,
    petal: 15,
    spore: 7,
    // ... crafted items
    twine: 2,
    torch: 1,
    campfire: 0,
    bowl: 1,
    workbench: 1,
    foundation: 8,
    wall: 12,
    doorwall: 2,
    roof: 4,
    table: 1,
    bed: 1
  },
  pieces: {
    "aetheria": [
      {
        type: "foundation",
        x: 0,
        y: 1.2,
        z: 0,
        yaw: 0,
        fId: 0,
        edge: -1,
        top: 1.2,
        id: 1
      },
      // ... more pieces
    ],
    "playground": [
      // ... pieces for other terrains
    ]
  }
}
```

### IndexedDB for Large Data
- **Purpose**: Large assets, build data, world state
- **Database**: `aetheria_db`
- **Stores**:
  - `world_state`: Serialized world modifications
  - `assets`: Cached asset data
  - `build_data`: Large build structures

### Save Timing
- **Auto-save**: 500ms debounce after changes
- **Flush**: On pagehide/beforeunload
- **Load**: On game start

### Validation
- **Version check**: Reject saves with different v
- **Schema validation**: Reject malformed data
- **Fallback**: Default save if load fails

---

## Coordinate System

### Units
- **Distance**: Metres (m)
- **Time**: Seconds (s)
- **Angle**: Radians (math), Degrees (UI)

### Axes
- **X**: East-West (positive = east)
- **Y**: Up-Down (positive = up)
- **Z**: North-South (positive = south)

### Origin
- **Center of landmass**: (0, 0, 0)
- **Sea level**: Y = 0
- **Spawn**: Per terrain, usually above ground

### Bounds
- **Arena**: ±60 m (slightly larger than landmass)
- **Chunk**: 40 m
- **Height grid**: 0.5 m cells
- **Broadphase**: 4 m cells

---

## World Transitions

### Terrain Switching
- **Save before**: Always save before switching terrain
- **Load after**: Load pieces for new terrain
- **Preserve**: Inventory and profile across terrains
- **Reset**: Creature position to new terrain spawn

### Form Switching
- **Preserve**: Position, velocity, inventory
- **Transition**: Ring effect, sound
- **Cooldown**: 1.5 s
- **Core**: Inventory and Core survive switch

---

## Numbers Summary

### World Dimensions
- Landmass: 240 × 240 m
- Arena bounds: ±60 m
- Chunk size: 40 m
- Chunks: 6 × 6
- Height grid: 0.5 m cells
- Broadphase grid: 4 m cells

### Sky Islands
- Count: 3
- Width: ~60 m
- Height: 30-50 m above sea level
- Thermal radius: 5 m
- Thermal height: +12 m
- Mushroom bounce: min(12, -v * 1.1 + 2)

### Save Limits
- Profile name: 16 chars
- Stack cap: Stone 80, Slime/Wisp 40
- Auto-save debounce: 500 ms
