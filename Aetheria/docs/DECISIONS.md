# DECISIONS.md — Assumptions & Design Decisions

Aligned with `AETHERIA_MASTER_PLAN.md` v4. Each entry includes a "change me if" note.

---

## Architecture Decisions

### Physics Engine
**Decision**: Adopted custom TypeScript heightfield and primitive collider behind `PhysicsWorld` interface; heavy WASM physics (Rapier/Jolt) dropped for core traversal.
**Rationale**: Phase 0 spike verified that custom collider executes in <0.05ms per step, handles trenches and steps smoothly, and avoids 750KB+ WASM overhead that violates the 700KB initial JS budget.
**Change me if**: Complex multi-body dynamic rigid body puzzle mechanics require a full constraints solver later (candidate: lightweight cannon-es for props only).

### Slime Physics
**Decision**: Rigid proxy collider with procedural visual jelly deformation (squash & stretch, damped harmonic ground squish, 162-vertex lattice).
**Rationale**: Phase 0 spike proved the rigid proxy achieves >= 5 bounces at 0.85 restitution without artificial boosts, passes 100/100 tight-space grate tests without tunneling or pinching, and is 20x faster than full particle XPBD simulation.
**Change me if**: Playtesters report visual jelly deformation lacks specific soft-body tactile response.

### Desktop Only
**Decision**: Desktop browser only. No phone, tablet or touch support. The dormant touch UI from the tester build is deleted.
**Rationale**: Mobile adds enormous complexity for a solo developer. Desktop-first lets us focus on feel and quality.
**Change me if**: Demand justifies mobile support post-launch.

### ECS Architecture
**Decision**: Small ECS library (miniplex or bitECS) for world entities and props. Hot loops use plain typed arrays.
**Rationale**: Data-oriented, cache-friendly, scalable, separates simulation from rendering.
**Change me if**: Performance profiling shows significant overhead.

### Code Layout
**Decision**: Single project with folders: `core/`, `data/`, `sim/`, `physics/`, `render/`, `audio/`, `build/`, `save/`, `ui/`, `dev/`.
**Rationale**: Matches Master Plan §12. Input is commands, simulation is separate from rendering, every entity has a stable ID.
**Change me if**: Monorepo becomes too complex.

### TypeScript Strict Mode
**Decision**: TypeScript strict mode, no `any` types.
**Rationale**: Type safety catches bugs early.
**Change me if**: Development speed is too slow.

---

## Tech Stack Decisions

### Vite Build Tool
**Decision**: Vite for development and production builds.
**Change me if**: Different build tool needed.

### Three.js
**Decision**: Three.js with WebGL 2.
**Change me if**: WebGPU becomes a non-goal change.

### pnpm
**Decision**: pnpm for package management.
**Change me if**: Team prefers npm/yarn.

---

## Gameplay Decisions

### Nine Forms as Data
**Decision**: All nine forms are data rows. Adding a form changes a table, never a system.
**Change me if**: A form requires fundamentally new simulation.

### Four Regions (not biomes)
**Decision**: Four display-name regions mapped onto built biomes. Old built names retired as display names.
**Rationale**: Verdant Refuge, Wildwood, Waterworn Basin, Windcarved Heights give each area identity while the built biomes handle rendering.
**Change me if**: The naming doesn't resonate with testers.

### Controls
**Decision**: WASD move, Space jump, Shift sprint, G ride wind, J/K abilities, F stomp, E interact, B build. All remappable.
**Rationale**: Master Plan §5.2. Legacy M and C toggles retired; their effects live inside J and K.
**Change me if**: Playtesting reveals control conflicts.

### Pressure Plate Minimum Speed
**Decision**: Impact only counts toward plates when landing speed ≥ 4 m/s (~0.8 m drop).
**Rationale**: Without this, any hop above 1.5 m/s presses the plate for Oobleck/Aerolite/Geode/Obsidian and the height puzzle disappears.
**Change me if**: Playtesting shows the 4 m/s threshold is too restrictive.

### Coyote Time
**Decision**: 100 ms default (plan said 80, build has ~120). Re-tune in playtests.
**Change me if**: Playtesting reveals different sweet spot.

### Respawn
**Decision**: 0.5 s fade to last safe ground, no inventory loss.
**Change me if**: 0.5 s feels abrupt (this is an open item).

### No Default Start in Proving Grounds
**Decision**: New players start on the island with short no-text onboarding. Proving Grounds stays as developer level.
**Change me if**: Testing reveals onboarding needs the Proving Grounds.

### Dewdrop J (Release Ballast)
**Decision**: Hold J to dump soaked water and lose weight. Ties Dewdrop to plate puzzles.
**Change me if**: A better ability emerges in playtesting.

### No Legacy Toggles
**Decision**: Old M and C toggles retired. Their effects live inside each form's J and K.
**Change me if**: Never — this is a v4 decision.

---

## Save System Decisions

### Staged Import
**Decision**: Parse → check version → validate keys → show summary → backup into `backup_1` first → apply → reload. If any step fails, change nothing and say why.
**Rationale**: Import must never silently overwrite.
**Change me if**: Never — this is a safety rule.

### Multiple Named Worlds
**Decision**: Local-first, multiple named worlds, no account.
**Change me if**: Cloud sync is added post-launch.

### Browser Storage + IndexedDB
**Decision**: Browser storage (fast path) + IndexedDB mirror with 3 rolling backups.
**Rationale**: Browser storage can be evicted; backups mitigate this.
**Change me if**: IndexedDB alone proves sufficient.

### Export/Import
**Decision**: Copy/paste JSON text in Settings (file download only where host allows).
**Change me if**: A simpler export method becomes available.

---

## Performance Decisions

### Performance Is a Ratchet
**Decision**: After vertical slice, re-baseline. Nothing gets worse by >10%.
**Change me if**: The game needs a fundamental architecture change.

### Two-Way Governor
**Decision**: Drops after ~1 s slow, recovers after ~12 s good, stops after two relapses. Measures CPU and GPU separately.
**Change me if**: Playtesting reveals governor is too aggressive or too passive.

### Fixed 60 Hz Step
**Decision**: Visual interpolation, max 4 catch-up steps, excess discarded.
**Change me if**: Physics needs a different rate.

---

## Visual Style Decisions

### Flat-Shaded Low-Poly
**Decision**: Flat-shaded faceted environment, smooth soft creatures. Toon ramp lighting, thin outline on creatures, rim light, fake thickness, tinted depth fog.
**Change me if**: Playtesting shows aesthetic doesn't resonate.

### No Post-Processing Chain
**Decision**: No post-processing chain. Gradient sky, CSS vignette, additive-sprite bloom.
**Change me if**: A lightweight effect proves essential.

### 24-Minute Day/Night Cycle
**Decision**: Regional palettes for day/night.
**Change me if**: Cycle length feels wrong in play.

---

## Open Items (from Master Plan §17)

1. **The real specs of the test computer**: Resolved in Phase 0 (Intel Core i7-9850H 2.60GHz, 6C/12T, 32 GB RAM, NVIDIA Quadro T1000 + Intel UHD Graphics 630, Windows 11).
2. **The result of the physics spike**: Resolved in Phase 0 (Adopted Rigid Proxy with visual jelly deformation + custom TypeScript heightfield collider; passed bounce >= 5, 100/100 tight spaces, trench bridging, <0.05ms/step).
3. **Provisional J/K slots**: Resolved in Phase 2 & Table A1 (Full signature abilities implemented for all 9 forms with physics behaviors and visual representations).
4. **The purpose of sand traction on the Heights**: Open (to be calibrated during region testing).
5. **Whether the 0.5 s respawn fade feels abrupt**: Open (to be tested during public preview).

---

## Loop Slice & Audio Decisions (Phase 3)

### 20-Step Full Cost Undo
**Decision**: Undo stack retains up to 20 building actions, restoring 100% of material costs to player inventory.
**Rationale**: Eliminates building anxiety and promotes creative peaceful experimentation.
**Change me if**: Memory constraints demand smaller stack (unlikely given tiny memory footprint).

### Predictable 75% Dismantle Refund
**Decision**: Manual targeted dismantling returns `Math.floor(cost * 0.75)` (minimum 1).
**Rationale**: Aligned with Master Plan §9.

### Zero-File Procedural Web Audio Engine
**Decision**: 100% of sound effects, impacts, and musical bounce chains are synthesized via raw Web Audio API. Zero external audio asset files.
**Rationale**: Keeps total bundle tiny (<150KB gzipped) and loads instantly on any connection.
**Change me if**: Playtesting requires sampled loops for ambient music.

---

## Assumptions

### Target Device Performance
**Assumption**: Baseline laptop can sustain 60 FPS Balanced, 30 FPS Low.
**Change me if**: Phase 0 measurement reveals different reality.

### Browser Support
**Assumption**: Current Chrome, Edge, Firefox with WebGL 2.
**Change me if**: Need to support older browsers.

### Session Length
**Assumption**: Typical play session 10–30 minutes.
**Change me if**: Game design changes to longer sessions.

### Hosting
**Assumption**: Static files on a free CDN host. Check free-tier terms for donation-supported game.
**Change me if**: Terms don't allow donation model.
