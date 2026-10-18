# PLAN.md - Development Roadmap

## Overview

Aetheria is a cozy, peaceful 3D browser game built with TypeScript, Three.js, and Rapier WASM physics. The game features three playable creatures (slime, wisp, stone), each with multiple forms, exploring a procedurally generated world.

**Tech Stack:**
- Vite + TypeScript
- Three.js (renderer)
- Rapier WebAssembly (physics)
- ECS architecture
- GLB assets from 3dassets.dev

**Visual Style:**
- Cozy low-poly aesthetic
- Soft pastel palette
- NPR shaders (Kuwahara filter)
- Painted miniature feel

---

## Development Phases

### Phase 1: Core Architecture
**Goal**: Establish ECS foundation, basic rendering, and project structure.

**Deliverables:**
- [x] Monorepo setup with pnpm workspaces
- [x] TypeScript configuration (strict mode)
- [x] Vite build configuration
- [x] Core ECS package (entities, components, queries, systems)
- [x] Math utilities package (Vec3, Quat, Mat4)
- [x] Event bus package
- [x] Basic Three.js renderer package
- [x] Camera controller
- [x] Empty scene with ground plane
- [x] Unit tests for core packages

**Acceptance Tests:**
- [x] TypeScript compiles without errors
- [x] Core ECS tests pass (entity lifecycle, queries)
- [x] Math tests pass (vector operations)
- [x] Dev server starts and shows a blank scene
- [x] No circular dependencies in package graph

**Estimated Time**: 3-5 days

---

### Phase 2: Physics Integration
**Goal**: Integrate Rapier WASM physics and connect to ECS.

**Deliverables:**
- [x] Rapier WASM package wrapper
- [x] Physics components (RigidBody, Collider, Transform)
- [x] Physics system integration
- [x] Heightfield terrain in Rapier
- [x] Basic collision detection
- [x] Ground height query function
- [x] Physics debug visualization (optional)
- [x] Unit tests for physics

**Acceptance Tests:**
- [x] Rapier WASM loads successfully
- [x] Simple physics scene with falling spheres
- [x] Heightfield terrain collision works
- [x] Ground height queries return correct values
- [x] Physics tests pass (deterministic simulation)

**Estimated Time**: 3-4 days

---

### Phase 3: Creature 1 — Slime (Liquid Form)
**Goal**: Implement the Slime creature with its 3 base form variants, physics behaviors, controls, and character controller.

**Deliverables:**
- [ ] Slime component definitions (`SlimeComponent`, `SlimeFormVariant`, `SlimeState`)
- [ ] 3 Slime base form presets:
  - **Goo**: ultra-soft, low stiffness (0.10), high grip (0.8), high stickiness (0.8), fast wall climbing
  - **Jelly Ball**: balanced, moderate stiffness (0.40), balanced grip (0.5), bouncy (restitution 0.6)
  - **Jelly Cube**: firm, high stiffness (0.45), stable footing, strong spring leap, high shape retention
- [ ] Movement system (ground drive force 16, air control 0.9, max speed 6 m/s, idle brake 25/s)
- [ ] Charge jump system (tap ~0.5m, 0.3s hold ~1.6m, 0.85s hold ~5.3m, power 4.5 to 15)
- [ ] Melting / squeezing system (M key: compresses height < 0.6m, scale 0.65, recovers above 0.85m)
- [ ] Sticky climbing system (wall climb at 3 m/s on steep surfaces, 1.5s overhang cling budget)
- [ ] Gliding & peak hover (fall cap -2.2 m/s, 1.3x speed boost while gliding, 0.8s hover at apex)
- [ ] Ground pound (F key) and Spring leap (C key: 1.35x jump boost)
- [ ] Procedural deformable slime mesh in `@render` (squash & stretch, melt pancake, bounce)
- [ ] Input handling (WASD, Space, Shift, M, C, F) & Character Controller
- [ ] Comprehensive unit tests for all Slime mechanics

**Acceptance Tests:**
- [ ] Slime entity spawns at designated position
- [ ] All 3 form variants (Goo, Jelly Ball, Jelly Cube) apply distinct physics attributes
- [ ] Horizontal movement accelerates up to 6 m/s and brakes smoothly on idle
- [ ] Jump heights verified: tap ~0.5m, 0.3s hold ~1.6m, 0.85s hold ~5.3m
- [ ] Melting reduces vertical height below 0.6m and recovers when released
- [ ] Goo climbs steep walls at 3 m/s; plain/cube requires more footing
- [ ] Gliding caps downward velocity at -2.2 m/s
- [ ] All Slime unit tests pass

**Estimated Time**: 5-7 days

---

### Phase 4: Creature 2 — Wisp (Gas Form)
**Goal**: Implement the Wisp creature with its 3 base form variants, mote particle dynamics, and aerial traversal.

**Deliverables:**
- [ ] Wisp component definitions (`WispComponent`, `WispFormVariant`, `BreathComponent`)
- [ ] 3 Wisp base form presets:
  - **Cloud**: dense protective cloud, higher particle count, steady drift
  - **Motes**: sparse scattered motes, agile, wider reach, fast skimming
  - **Ring**: orbiting mote pattern, rhythmic resonance, focused harvesting
- [ ] Mote cluster simulation & 2.2m tether constraint
- [ ] Free hop (tap Space: +6 m/s) and gentle sinking (2.5 m/s)
- [ ] Rising (hold Space, 20 breath/s) and Floating (V key, 3 breath/s)
- [ ] Breath management (100 max, 5s rise budget, auto-refill near ground/water)
- [ ] Condense (C key, 1.4x speed), Diffuse (M key, 0.6x speed), Down-gust (F key)
- [ ] Wall-hug drift climbing (3 m/s)
- [ ] Procedural mote particle rendering in `@render`
- [ ] Unit tests for all Wisp mechanics

**Acceptance Tests:**
- [ ] Motes remain bounded within 2.2m tether from core
- [ ] All 3 variants (Cloud, Motes, Ring) function with distinct dynamics
- [ ] Breath depletes during rise (20/s) and float (3/s), refilling near ground
- [ ] Down-gust dive produces downward velocity (-22 m/s) with safe timeout
- [ ] All Wisp unit tests pass

**Estimated Time**: 5-7 days

---

### Phase 5: Creature 3 — Stone (Solid Form)
**Goal**: Implement the Stone creature with its 3 base form variants, rigid physics, and high-impact abilities.

**Deliverables:**
- [ ] Stone component definitions (`StoneComponent`, `StoneFormVariant`)
- [ ] 3 Stone base form presets:
  - **Round Boulder**: high momentum rolling, geode cracking (>5 m/s), high durability
  - **Tall Pillar**: sturdy, high reach, stable footing against wind
  - **Sharp Shard**: crystalline facets, sharp edges, efficient piton wedging
- [ ] Heavy rigid physics (mass, low grip 0.35, high wind resistance 0.5)
- [ ] Piton wall climbing (2 m/s, clings without slipping when idle)
- [ ] Heavy charge jump (max power 12.75, 0.5s apex hover)
- [ ] Crystal sail glide (-3.0 m/s fall cap, free shockwave on landing)
- [ ] Pebble shrinking (M key: scale 0.65 to fit through narrow passages)
- [ ] Ground pound shockwave (F key) and Rolling impacts
- [ ] Procedural low-poly faceted stone mesh in `@render`
- [ ] Unit tests for all Stone mechanics

**Acceptance Tests:**
- [ ] All 3 variants (Boulder, Pillar, Shard) apply distinct rigid attributes
- [ ] Piton climb allows clinging to walls without slipping
- [ ] High-speed rolling (>5 m/s) detected for obstacle cracking
- [ ] Crystal sail caps fall speed at -3.0 m/s and triggers landing shockwave
- [ ] Pebble shrink reduces scale to 0.65 and recovers
- [ ] All Stone unit tests pass

**Estimated Time**: 5-7 days

---

### Phase 6: Form Switching & Metamorphosis
**Goal**: Enable instantaneous seamless switching between Slime, Wisp, and Stone while preserving core state and momentum.

**Deliverables:**
- [ ] Form switching system in `@sim` (hotkeys 1, 2, 3)
- [ ] Core & inventory preservation across transitions
- [ ] Momentum conversion and safe volume transition
- [ ] Morph visual transition effects and animations
- [ ] Unit tests for form switching

**Acceptance Tests:**
- [ ] Switching between all 3 creatures preserves position, core items, and momentum
- [ ] Rapid form switching does not glitch physics or duplicate entities
- [ ] All form switching tests pass

**Estimated Time**: 3-4 days

---

### Phase 7: World Generation
**Goal**: Procedural terrain generation with flora and props.

**Deliverables:**
- [ ] Noise-based terrain generation
- [ ] Heightfield construction
- [ ] Biome system (meadow, forest, desert)
- [ ] Flora placement (trees, flowers, grass)
- [ ] Prop placement (rocks, crystals)
- [ ] World seed system
- [ ] Chunk system for large worlds
- [ ] Building piece system
- [ ] Unit tests for terrain

**Acceptance Tests:**
- [ ] Terrain generates deterministically from seed
- [ ] Biomes have distinct flora
- [ ] Flora doesn't overlap terrain
- [ ] Heightfield matches visual terrain
- [ ] Chunk loading/unloading works
- [ ] Terrain tests pass

**Estimated Time**: 5-7 days

---

### Phase 8: UI and HUD
**Goal**: DOM-based UI overlay with cozy aesthetic.

**Deliverables:**
- [ ] HUD overlay (biome label, wind, inventory)
- [ ] Control panel (creature selection, 3-variant preset selection per creature)
- [ ] Sliders for form parameters
- [ ] Quality selector (Full/Light)
- [ ] Weather selector
- [ ] Time of day control
- [ ] Cozy UI styling (rounded corners, pastel colors)
- [ ] Touch controls for mobile
- [ ] Responsive design

**Acceptance Tests:**
- [ ] HUD displays correctly on desktop and mobile
- [ ] Creature selection and variant selection update in real time
- [ ] Sliders update parameters dynamically
- [ ] Playwright UI tests pass

**Estimated Time**: 4-5 days

---

### Phase 9: Asset Pipeline
**Goal**: GLB asset loading from 3dassets.dev with manifest system.

**Deliverables:**
- [ ] Asset manifest format
- [ ] GLB loader package
- [ ] Asset preloading system
- [ ] Fallback to procedural generation
- [ ] Progress indicator
- [ ] Asset optimization
- [ ] Asset catalog (3dassets.dev models)
- [ ] Unit tests for asset loading

**Acceptance Tests:**
- [ ] GLB models load from CDN
- [ ] Fallback to procedural if load fails
- [ ] Progress indicator shows during load
- [ ] Asset tests pass

**Estimated Time**: 3-4 days

---

### Phase 10: Environment Effects
**Goal**: Weather, wind, and atmospheric effects.

**Deliverables:**
- [ ] Weather system (clear, rain, storm)
- [ ] Wind system (steady, gusts, updrafts)
- [ ] Weather particles (rain, snow)
- [ ] Wind visualization (optional)
- [ ] Time of day cycle
- [ ] Sky color changes
- [ ] Lighting changes (sun/moon)
- [ ] Unit tests for env

**Acceptance Tests:**
- [ ] Weather transitions smoothly
- [ ] Wind affects creatures correctly (Rule 4: steady wind, hold Shift to Ride)
- [ ] Weather particles render
- [ ] Time cycle works
- [ ] Environment tests pass

**Estimated Time**: 4-5 days

---

### Phase 11: Save/Load System
**Goal**: Persist game state to localStorage.

**Deliverables:**
- [ ] Save format (JSON)
- [ ] Serialize ECS components
- [ ] Deserialize ECS components
- [ ] Auto-save on terrain switch
- [ ] Manual save/load
- [ ] Error handling (corrupt saves)
- [ ] Unit tests for save/load

**Acceptance Tests:**
- [ ] Save roundtrips correctly
- [ ] Corrupt saves are handled gracefully
- [ ] Auto-save triggers on terrain switch
- [ ] Save/load tests pass

**Estimated Time**: 2-3 days

---

### Phase 12: Visual Polish
**Goal**: Cozy low-poly aesthetic with NPR shaders.

**Deliverables:**
- [ ] Kuwahara post-processing shader
- [ ] Soft pastel palette materials
- [ ] Rounded geometry (chamfer)
- [ ] Ambient occlusion (baked)
- [ ] Particle effects (hearts, sparkles)
- [ ] Screen effects (screen shake, transitions)
- [ ] Performance optimization (instancing, culling)

**Acceptance Tests:**
- [ ] Visual style matches cozy aesthetic
- [ ] Performance budgets met (25-35 draw calls)
- [ ] FPS 60 on desktop, 30+ on mobile
- [ ] No visual glitches

**Estimated Time**: 5-7 days

---

### Phase 13: Testing and QA
**Goal**: Comprehensive test coverage and bug fixes.

**Deliverables:**
- [ ] Complete unit test suite
- [ ] Integration tests
- [ ] Playwright end-to-end tests
- [ ] Performance regression tests
- [ ] Accessibility audit
- [ ] Mobile testing
- [ ] Bug fixes
- [ ] Documentation updates

**Acceptance Tests:**
- [ ] All tests pass (>90% coverage)
- [ ] Playwright scenarios complete
- [ ] Performance budgets maintained
- [ ] No critical bugs

**Estimated Time**: 5-7 days

---

### Phase 14: Release Preparation
**Goal**: Production build, deployment, and documentation.

**Deliverables:**
- [ ] Production build optimization
- [ ] Bundle size analysis
- [ ] Deployment configuration
- [ ] README update
- [ ] CONTRIBUTING guide
- [ ] Release notes
- [ ] Version tagging

**Acceptance Tests:**
- [ ] Build succeeds without warnings
- [ ] Bundle under 400KB gzipped
- [ ] Deploys successfully
- [ ] Documentation complete

---

## Total Estimated Time

**Minimum**: 50-65 days
**Realistic**: 65-85 days
**With buffer**: 85-110 days

---

## Current Status

**Phase**: Ready to begin Phase 3 (Creature 1 — Slime)
**Progress**: Phase 1 (Core Architecture) & Phase 2 (Physics Integration) complete.

---

## Dependencies Between Phases

- Phase 2 depends on Phase 1 (ECS foundation)
- Phase 3 depends on Phase 2 (Rapier physics)
- Phase 4 depends on Phase 2 & 3 (creature patterns)
- Phase 5 depends on Phase 2 & 3 (creature patterns)
- Phase 6 depends on Phase 3, 4, 5 (needs all three creatures)
- Phase 7 can parallel with Phases 4-6 (world gen independent)
- Phase 8 depends on Phase 6 (needs creatures and variants)
- Phase 9 can parallel with Phase 7 (assets independent)
- Phase 10 depends on Phase 7 (needs world)
- Phase 11 depends on Phase 6 & 7 (needs creature state and world)
- Phase 12 depends on Phase 9 & 10 (needs assets and world)
- Phase 13 depends on all previous phases
- Phase 14 depends on Phase 13

