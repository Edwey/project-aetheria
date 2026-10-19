# ARCHITECTURE.md - Aetheria Game Architecture

## Tech Stack

- **Build Tool**: Vite 5.x
- **Language**: TypeScript (strict mode)
- **Renderer**: Three.js (r128+)
- **Physics**: Single-engine architecture via `PhysicsWorld` interface (Jolt Physics WASM single-thread build with Phase 6 engine spike evaluating Jolt soft bodies vs custom 162-particle PBD slime solver)
- **Architecture**: ECS (Entity Component System) with data-driven nine forms (Phase 5b)
- **Assets**: CC0 GLB/GLTF 2.0 with manifest-driven fetcher (`pnpm assets:fetch`) and procedural Three.js fallbacks
- **Units**: Relative density (water = 1); real water density (1000 kg/m³) is used only inside the quadratic water drag formula.

## Core Principles

1. **Physics-First and Consistent**
   - All nine forms obey the exact same physical laws; form differences emerge strictly from data (mass, relative density, drag coefficients, tanks), never special-case hacks.
   - Simulation owns game state, physics, and saveable data via ECS.
   - Rendering owns scene composition, camera, and visuals.
   - UI owns DOM overlays, HUD, and menus.
   - Universal Moor Rule: when grounded and idle, a moor force cancels wind drift up to a cap.


2. **Data-Oriented Design**
   - ECS with Structure-of-Arrays (SoA) component storage
   - Systems are pure functions that iterate data
   - Cache-friendly memory layout

3. **Type Safety**
   - Full TypeScript strict mode
   - Branded types for entity IDs
   - Discriminated unions for variant data

4. **Web-First**
   - All code targets browser (WebGL, Canvas, requestAnimationFrame)
   - WASM for performance-critical paths (physics)
   - No Node-only dependencies in core packages

## Package Structure

```
Aetheria/
├── packages/
│   ├── core/          # Layer 0: Foundation
│   │   ├── ecs/       # Entity Component System
│   │   ├── math/      # Vector, matrix, quaternion utilities
│   │   ├── types/     # Core type definitions
│   │   └── events/    # Event bus
│   ├── sim/           # Layer 1: Simulation
│   │   ├── physics/   # Rapier integration
│   │   ├── forms/     # Creature forms (slime, wisp, stone)
│   │   ├── world/     # World generation, terrain
│   │   └── env/       # Environment (weather, wind)
│   ├── render/        # Layer 2: Rendering
│   │   ├── scene/     # Three.js scene setup
│   │   ├── camera/    # Camera controller
│   │   ├── materials/ # Cozy low-poly shaders
│   │   └── effects/   # Post-processing (Kuwahara)
│   ├── ui/            # Layer 3: UI
│   │   ├── hud/       # HUD overlay
│   │   ├── panels/    # Control panels
│   │   └── input/     # Input mapping
│   └── assets/        # Layer 4: Assets
│       ├── loader/    # GLB loading
│       └── manifest/  # Asset manifests
└── app/               # Game entry point
    ├── main.ts
    └── bootstrap.ts
```

## Layer Dependency Rules

- Layer 0 (core): No dependencies on other layers
- Layer 1 (sim): Depends only on core
- Layer 2 (render): Depends on core, sim (read-only)
- Layer 3 (ui): Depends on core, sim (read-only)
- Layer 4 (assets): Depends on core only
- No circular dependencies
- No upward imports

## ECS Architecture

### Entities
- Unique 64-bit IDs (branded type)
- Generated from a sequence
- IDs can be reused after deletion

### Components
- Data-only structures (no logic)
- Stored in Structure-of-Arrays for cache efficiency
- Example components:
  - `Position` (x, y, z)
  - `Velocity` (x, y, z)
  - `Form` (slime, wisp, stone, variant)
  - `Health` (current, max)
  - `State` (idle, moving, jumping, etc.)

### Systems
- Pure functions that iterate over component queries
- Deterministic order via topological sort
- Example systems:
  - `MovementSystem` - updates position from velocity
  - `PhysicsSystem` - runs Rapier simulation
  - `FormSystem` - handles form-specific logic
  - `RenderSystem` - syncs Three.js meshes from ECS data

### Queries
- Filter entities by component presence
- Cached for performance
- Example: `Query<Position, Velocity>` returns all moving entities

## Physics Integration

### Single-Engine Architecture (`PhysicsWorld` Interface)
- Single-engine physics interface abstracts the underlying engine (Jolt Physics WASM single-thread build)
- Phase 6 engine spike: compares Jolt soft body vs custom 162-particle PBD solver behind the exact same `PhysicsWorld` interface
- Fixed timestep simulation (1/60 s) with accumulator clamping (`maxSubSteps = 3`)
- Single world handles rigid bodies, heightfield terrain, soft bodies (with pressure/volume constraints), character controller, and buoyancy
- Lazy WASM loading after title screen (~0.74 MB gzip WASM + 0.14 MB glue cached by service worker)
- Mobile slime tier: ~162 simulation particles driving render mesh via GPU Phong-tessellation skinning

### Simulation-Rendering Boundary
- `PhysicsWorld` owns collision detection and spatial dynamics
- ECS owns game-specific state, nine-form data tables, abilities, and resource tanks
- Three.js mirrors physics transforms each visual frame
- Zero direct Three.js objects inside simulation state

## Asset Pipeline

### Asset Format
- Standard: GLB (binary glTF with embedded textures)
- Fallback: Procedural generation
- CDN-ready URLs from 3dassets.dev

### Manifest System
- JSON manifest defines all assets
- Stable keys for references
- Grouped by domain: characters, environment, props, audio

### Loading Strategy
- Preload critical assets on startup
- Lazy load non-critical assets
- Progress indicator for user feedback

## Input System

### Action Mapping
- Define abstract actions: `move`, `jump`, `interact`, `menu`, etc.
- Map physical inputs to actions in one place
- Support keyboard, mouse, touch, gamepad

### Input Processing
- Input manager collects raw events
- Action mapper converts to game actions
- Systems consume actions, not raw input

## Save System

### Saveable State
- Only ECS component data (no Three.js objects)
- Serialized as JSON
- Encrypted/obfuscated if needed

### Save Format
```json
{
  "version": 1,
  "timestamp": 1234567890,
  "entities": [
    {
      "id": "entity-123",
      "components": {
        "Position": {"x": 10, "y": 0, "z": 5},
        "Form": {"kind": "slime", "variant": "blob"}
      }
    }
  ],
  "world": {
    "seed": 42,
    "visitedAreas": ["area-1", "area-2"]
  }
}
```

## Performance Strategy

### Steady State
- Zero allocations in hot loops
- Object pools for temporary objects
- Reuse TypedArrays

### Rendering
- InstancedMesh for repeated geometry
- Frustum culling
- LOD for distant objects
- Draw call budget: 25-35

### Physics
- Fixed timestep with substeps
- Broadphase spatial hashing
- Narrowphase: Rapier WASM

## Debug System

### Debug Overlays
- FPS counter
- Entity count
- Draw calls
- Physics debug draw (optional)
- Entity inspector (click to inspect)

### Logging
- Structured logging with levels
- Performance markers
- Error tracking

## Testing Strategy

### Unit Tests
- Pure functions tested in isolation
- No Three.js in core/sim tests
- Mock dependencies where needed

### Integration Tests
- Test package interactions
- Test asset loading
- Test save/load roundtrips

### Playwright Tests
- End-to-end gameplay scenarios
- UI interaction testing
- Performance regression tests

## Build Pipeline

### Development
- Vite dev server with HMR
- TypeScript for type checking
- ESLint for code quality

### Production
- Tree-shaking via Rollup
- Minification
- WASM bundling
- Asset optimization

## Migration Path from Aetheria.html
`Aetheria.html` is a throwaway tester build published only to test feel. It constrains nothing in the production codebase.

### Keep (Feel & Physics Truth)
- Gravity: -20 m/s²
- Particle radius: 0.07 m
- Jump feel, squash, soft-slime behaviour, performance tiers
- Proven feel numbers reproduced cleanly in production

### Change (Architecture & v4 Roadmap)
- Monolithic prototype → Modular ECS packages
- Custom JS prototype physics → Jolt Physics WASM behind `PhysicsWorld` interface
- Legacy per-creature presets → Nine forms as pure data (Phase 5b)
- Universal movement verbs: walk, jump, climb, glide, hop for all forms
- Build order: Loop Slice (Phase 6b: 3 slice forms explore, harvest, craft, build) before expanding remaining forms
- CI performance gates as Phase 6 exit criterion

### Change (Visuals & Assets)
- Procedural-first Three.js geometry + CC0 GLB pipeline (`pnpm assets:fetch` with SHA-256 manifest)
- Procedural Three.js fallback guarantee (game runs with empty asset cache)
- Procedural Web Audio synthesizer (zero audio file dependencies)
- Painted pastel palette, soft shadows, edge vignette, and bloom

## Reference

- Tester prototype: `Aetheria.html` (reference for feel only)
- Asset sources: Kenney CC0, Poly Haven API
- Visual reference: A Short Hike, Susurrus (cozy low-poly miniature)
