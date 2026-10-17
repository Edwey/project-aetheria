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
- [ ] Monorepo setup with pnpm workspaces
- [ ] TypeScript configuration (strict mode)
- [ ] Vite build configuration
- [ ] Core ECS package (entities, components, queries, systems)
- [ ] Math utilities package (Vec3, Quat, Mat4)
- [ ] Event bus package
- [ ] Basic Three.js renderer package
- [ ] Camera controller
- [ ] Empty scene with ground plane
- [ ] Unit tests for core packages

**Acceptance Tests:**
- [ ] TypeScript compiles without errors
- [ ] Core ECS tests pass (entity lifecycle, queries)
- [ ] Math tests pass (vector operations)
- [ ] Dev server starts and shows a blank scene
- [ ] No circular dependencies in package graph

**Estimated Time**: 3-5 days

---

### Phase 2: Physics Integration
**Goal**: Integrate Rapier WASM physics and connect to ECS.

**Deliverables:**
- [ ] Rapier WASM package wrapper
- [ ] Physics components (RigidBody, Collider, Transform)
- [ ] Physics system integration
- [ ] Heightfield terrain in Rapier
- [ ] Basic collision detection
- [ ] Ground height query function
- [ ] Physics debug visualization (optional)
- [ ] Unit tests for physics

**Acceptance Tests:**
- [ ] Rapier WASM loads successfully
- [ ] Simple physics scene with falling spheres
- [ ] Heightfield terrain collision works
- [ ] Ground height queries return correct values
- [ ] Physics tests pass (deterministic simulation)

**Estimated Time**: 3-4 days

---

### Phase 3: Creature Forms (One Creature)
**Goal**: Implement slime form with all its variants as a proof of concept.

**Deliverables:**
- [ ] Slime physics components (from Aetheria.html constants)
- [ ] Slime form variants (blob, goo, jelly ball, jelly cube)
- [ ] Slime movement system
- [ ] Slime jumping system (tap, hold heights)
- [ ] Slime melting/squeezing system
- [ ] Slime climbing system (sticky vs plain)
- [ ] Basic slime mesh (procedural for now)
- [ ] Input mapping (WASD, Space, Shift)
- [ ] Character controller
- [ ] Unit tests for slime mechanics

**Acceptance Tests:**
- [ ] Slime spawns at correct position
- [ ] Movement matches prototype (velocity, friction)
- [ ] Jump heights: tap ~0.5m, 0.3s hold ~1.6m, 0.85s hold ~5m
- [ ] Melt goes below 0.65m and recovers above 0.85m
- [ ] Sticky slime climbs 5m wall, plain does not
- [ ] All slime mechanics tests pass

**Estimated Time**: 5-7 days

---

### Phase 4: All Creature Forms
**Goal**: Implement wisp and stone with their variants.

**Deliverables:**
- [ ] Wisp physics components
- [ ] Wisp form variants (dense cloud, sparse motes, ring pattern, spiral swirl)
- [ ] Wisp movement (hover, wind riding)
- [ ] Wisp breath system (rise, float costs)
- [ ] Wisp tether constraint (2.2m)
- [ ] Stone physics components
- [ ] Stone form variants (crystal cluster, round boulder, tall pillar, sharp shard)
- [ ] Stone movement (walk, pitons)
- [ ] Stone hover (0.5s) vs slime hover (0.8s)
- [ ] Stone shrinking (pebble form)
- [ ] Form switching system
- [ ] Unit tests for all forms

**Acceptance Tests:**
- [ ] All three forms spawn correctly
- [ ] Form switching preserves position
- [ ] Wisp tether stays at 2.2m in violent gusts
- [ ] Wisp rise costs ~20/s, float ~3/s
- [ ] Stone hover 0.5s, slime 0.8s
- [ ] Stone shrinks to 0.65, grows back
- [ ] All form mechanics tests pass

**Estimated Time**: 7-10 days

---

### Phase 5: World Generation
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

### Phase 6: UI and HUD
**Goal**: DOM-based UI overlay with cozy aesthetic.

**Deliverables:**
- [ ] HUD overlay (biome label, wind, inventory)
- [ ] Control panel (form selection, preset selection)
- [ ] Sliders for form parameters
- [ ] Quality selector (Full/Light)
- [ ] Weather selector
- [ ] Time of day control
- [ ] Cozy UI styling (rounded corners, pastel colors)
- [ ] Touch controls for mobile
- [ ] Responsive design

**Acceptance Tests:**
- [ ] HUD displays correctly on desktop
- [ ] HUD displays correctly on mobile
- [ ] Form switching works from UI
- [ ] Preset selection works per form
- [ ] Sliders update form parameters
- [ ] Playwright UI tests pass

**Estimated Time**: 4-5 days

---

### Phase 7: Asset Pipeline
**Goal**: GLB asset loading from 3dassets.dev with manifest system.

**Deliverables:**
- [ ] Asset manifest format
- [ ] GLB loader package
- [ ] Asset preloading system
- [ ] Fallback to procedural generation
- [ ] Progress indicator
- [ ] Asset optimization (optional)
- [ ] Asset catalog (3dassets.dev models)
- [ ] Unit tests for asset loading

**Acceptance Tests:**
- [ ] GLB models load from CDN
- [ ] Fallback to procedural if load fails
- [ ] Progress indicator shows during load
- [ ] Asset tests pass

**Estimated Time**: 3-4 days

---

### Phase 8: Environment Effects
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
- [ ] Wind affects creatures correctly (Rule 4)
- [ ] Weather particles render
- [ ] Time cycle works
- [ ] Environment tests pass

**Estimated Time**: 4-5 days

---

### Phase 9: Save/Load System
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

### Phase 10: Visual Polish
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

### Phase 11: Testing and QA
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

### Phase 12: Release Preparation
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

**Estimated Time**: 2-3 days

---

## Total Estimated Time

**Minimum**: 45-60 days
**Realistic**: 60-80 days
**With buffer**: 80-100 days

---

## Current Status

**Phase**: Not started
**Progress**: Planning complete, ready to begin Phase 1

---

## Dependencies Between Phases

- Phase 2 depends on Phase 1 (ECS foundation)
- Phase 3 depends on Phase 2 (physics)
- Phase 4 depends on Phase 3 (one creature complete)
- Phase 5 can parallel with Phase 4 (world gen independent)
- Phase 6 depends on Phase 4 (needs creatures)
- Phase 7 can parallel with Phase 5 (assets independent)
- Phase 8 depends on Phase 5 (needs world)
- Phase 9 depends on Phase 4 (needs ECS state)
- Phase 10 depends on Phase 7 (needs assets)
- Phase 11 depends on all previous phases
- Phase 12 depends on Phase 11
