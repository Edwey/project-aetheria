# ARCHITECTURE.md — Aetheria Technical Architecture

Aligned with `AETHERIA_MASTER_PLAN.md` v4. Desktop browser only.

## Tech Stack

| Layer | Choice |
| --- | --- |
| Language & build | TypeScript (strict), Vite, pnpm, one project with folders |
| Rendering | Three.js, WebGL 2, instanced meshes, vertex colours, few textures |
| ECS | Small library (miniplex or bitECS) for world entities and props. Hot loops use plain typed arrays. |
| Physics | Behind a `PhysicsWorld` interface. Decided in the Phase 0 spike. |
| Audio | Raw Web Audio API, zero files |
| Saves | IndexedDB + browser storage, JSON export |

## Core Principles

1. **Physics with purpose**
   - All nine forms obey the same physical laws. Differences come from data (mass, density, drag, stop time), never special-case hacks.
   - Simulation owns game state, physics, and saveable data.
   - Rendering owns scene composition, camera, visuals.
   - UI owns DOM overlays, HUD, menus.
   - Moor Rule: with no input and on ground, nothing is pushed by wind.

2. **Data-oriented design**
   - Forms as data rows. Adding a form changes a table, never a system.
   - ECS with Structure-of-Arrays (SoA) component storage.
   - Systems are pure functions that iterate data.

3. **Type safety**
   - Full TypeScript strict mode.
   - Branded types for entity IDs.
   - Discriminated unions for variant data.

4. **Desktop web-first**
   - All code targets desktop browser (WebGL 2, requestAnimationFrame).
   - WASM for performance-critical paths (physics, if Jolt is chosen).
   - No Node-only dependencies in core packages.
   - No mobile/touch requirements.

## Code Layout

```
Aetheria/
├── packages/
│   ├── core/       # Loop, fixed step, input commands, camera
│   ├── data/       # Forms, recipes, regions, all tuning numbers
│   ├── sim/        # Movement, abilities, water grid, weather, wildlife, farming
│   ├── physics/    # PhysicsWorld interface and adapter
│   ├── render/     # Three.js scene, materials, effects
│   ├── audio/      # Procedural Web Audio synthesis
│   ├── build/      # Building system (place, undo, snap)
│   ├── save/       # Save, export, import, backups
│   ├── ui/         # DOM HUD, menus, input mapping
│   └── dev/        # Proving Grounds, perf hooks
└── app/            # Game entry point
    ├── main.ts
    └── bootstrap.ts
```

## Layer Dependency Rules

- `core/`: no dependencies on other packages
- `data/`: depends only on core
- `sim/`: depends on core, data
- `physics/`: depends on core, data
- `render/`: depends on core, data, sim (read-only)
- `audio/`: depends on core, data, sim (read-only)
- `build/`: depends on core, data, sim
- `save/`: depends on core, data, sim
- `ui/`: depends on core, data, sim (read-only)
- `dev/`: depends on all (internal only)
- No circular dependencies. No upward imports.

## Physics Architecture

### PhysicsWorld Interface

Physics is abstracted behind a `PhysicsWorld` interface so the implementation can be swapped.

**Phase 0 spike (1–2 weeks)** decides between:
1. **Jolt Physics WASM** — full rigid body engine with character controller, heightfield terrain
2. **Custom sphere-vs-heightfield collider** — may be enough, removes WASM dependency

Gate: if testers can't feel the difference, adopt the simpler approach.

### Slime Physics

Target design: rigid proxy collider with visual-only jelly lattice (~162 particles skinned in vertex shader). The prototype's soft-body solver stays as the feel reference until Phase 0 settles it.

### Fixed Timestep

- **Physics tick**: fixed 60 Hz with visual interpolation
- **Catch-up**: at most 4 steps per frame; excess discarded after tab suspension
- **Phase order**: input → ability → motor → physics → contacts → world update → render

### Simulation-Rendering Boundary

- `PhysicsWorld` owns collision detection and spatial dynamics
- ECS owns game-specific state, form data tables, abilities
- Three.js mirrors physics transforms each visual frame
- Zero Three.js objects inside simulation state
- Input is commands, simulation is separate from rendering
- Every entity has a stable ID (keeps later co-op possible)

## ECS Architecture

### Entities
- Unique IDs (branded type)
- Generated from a sequence
- Stable across saves

### Components
- Data-only structures (no logic)
- Stored in Structure-of-Arrays for cache efficiency

### Systems
- Pure functions iterating component queries
- Deterministic order

### Queries
- Filter entities by component presence
- Cached for performance

## Save System

- Local-first, multiple named worlds, no account.
- Browser storage (fast path) + IndexedDB mirror with 3 rolling backups (`backup_1` to `backup_3`).
- Backups only rotate when content changed.
- **Staged import:** parse → check version → validate keys → show summary → backup first → apply → reload. Never silently overwrites.
- Versioned schema with validated migrations.
- Export/import via JSON text (copy/paste or file download where host allows).
- Destructive actions (reset, delete world) require explicit confirmation.

## Input System

- Abstract actions: move, jump, sprint, ride, ability_j, ability_k, stomp, interact, build, undo, redo, cycle_form, select_family, emote, orbit, menu, respawn
- Map physical inputs to actions in one place
- All keys remappable with conflict warnings and restore-defaults
- Sprint can be hold or toggle

## Performance Strategy

### Steady State
- Zero allocations in hot loops
- Object pools for temporary objects
- Reuse TypedArrays

### Rendering
- InstancedMesh for repeated geometry
- Frustum culling
- Draw call budget: ~60
- ~150k visible triangles
- Baked vertex AO, toon ramp lighting

### Quality Presets
- **Low**: 0.75 scale, pixel ratio 1.0, blob shadows, no post-processing
- **Medium**: 0.85–1.0 scale, one cheap shadow map
- **High**: full resolution, full effects
- **Custom**: user-adjustable
- Two-way governor: drops after ~1 s slow, recovers after ~12 s good, stops after two relapses

### Memory
- Under ~400 MB tab memory
- Initial JS ~700 KB gzip
- Whole demo ~4 MB gzip

## Build Pipeline

### Development
- Vite dev server with HMR
- TypeScript for type checking

### Production
- Tree-shaking via Rollup
- Minification
- WASM bundling (if Jolt chosen)

## Migration from Aetheria.html

`Aetheria.html` is a throwaway tester build. It constrains nothing in the production codebase.

### Keep (feel reference)
- Gravity: -20 m/s²
- Particle radius: 0.07 m
- Jump feel, squash, soft-slime behaviour
- Performance tier concepts

### Change
- Monolithic single file → modular package structure
- Custom JS physics → `PhysicsWorld` interface (engine TBD via Phase 0 spike)
- Legacy per-creature presets → nine forms as pure data
- Mobile/touch UI → deleted (desktop only)
- Build order follows 10-phase roadmap (Phases 0–9)

## Reference

- Canonical design: `AETHERIA_MASTER_PLAN.md` (v4)
- Tester prototype: `Aetheria.html` (feel reference only)
- Visual reference: A Short Hike, Susurrus (cozy low-poly miniature)
