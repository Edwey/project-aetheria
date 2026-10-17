# ARCHITECTURE.md - Aetheria Game Architecture

## Tech Stack

- **Build Tool**: Vite 5.x
- **Language**: TypeScript (strict mode)
- **Renderer**: Three.js (r128+)
- **Physics**: Rapier WebAssembly (@dimforge/rapier3d)
- **Architecture**: ECS (Entity Component System)
- **Assets**: GLB/GLTF 2.0 from 3dassets.dev, Grab3D

## Core Principles

1. **Separation of Concerns**
   - Simulation owns game state, physics, and saveable data
   - Rendering owns scene composition, camera, and visuals
   - UI owns DOM overlays, HUD, and menus
   - No mixing between layers

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

### Rapier Setup
- WASM module loaded via @dimforge/rapier3d
- Fixed timestep (1/60 s)
- Deterministic simulation
- Heightfield terrain

### Simulation-Rendering Boundary
- Rapier owns collision and dynamics
- ECS owns game-specific state (forms, abilities)
- Three.js mirrors Rapier transforms each frame
- No direct Three.js objects in simulation

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

### Keep (Physics & Rules)
- Gravity: -20
- Particle radius: 0.07
- Form physics constants
- Movement/jumping/gliding mechanics
- All gameplay rules from CHARACTERS.md

### Change (Architecture)
- Monolithic → Modular ECS
- Custom JS physics → Rapier WASM
- Inline code → TypeScript packages
- Mixed concerns → Layered architecture

### Change (Visuals)
- Basic toon shading → Cozy low-poly + NPR shaders
- Simple geometry → GLB models from 3dassets.dev
- Basic UI → DOM overlays with cozy aesthetic
- Single color → Soft pastel palette

## Reference

- Original prototype: `Aetheria.html` (physics rules only)
- Asset sources: 3dassets.dev, Grab3D.com
- Visual reference: A Short Hike, Susurrus (cozy low-poly)
