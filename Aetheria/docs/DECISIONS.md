# DECISIONS.md - Assumptions and Design Decisions

This document records assumptions made during development. Each entry includes a "change me if" note for when circumstances change.

---

## Architecture Decisions

### ECS Architecture
**Decision**: Use Entity Component System for game state management.
**Rationale**: Data-oriented design, cache-friendly, scalable, separates simulation from rendering.
**Change me if**: Performance profiling shows significant overhead, or team prefers simpler component-based approach.

### Layered Package Structure
**Decision**: Organize code into 5 layers (core, sim, render, ui, assets) with strict dependency rules.
**Rationale**: Prevents circular dependencies, enforces separation of concerns, makes testing easier.
**Change me if**: Monorepo becomes too complex, or single-package structure proves simpler.

### TypeScript Strict Mode
**Decision**: Use TypeScript with strict mode enabled, no `any` types.
**Rationale**: Type safety catches bugs early, better IDE support, self-documenting code.
**Change me if**: Development speed is too slow, or TypeScript compilation becomes a bottleneck.

### Physics Engine & Single-Engine Architecture
**Decision**: Standardize on a single-engine physics abstraction via `PhysicsWorld` interface, using Jolt Physics (WASM, single-thread build). Run an engine spike in the first 2 days of Phase 6 comparing Jolt soft bodies vs a custom 162-particle PBD slime solver behind the same interface.
**Rationale**: Combining rigid bodies, soft bodies (with volume/pressure constraints), character controller, heightfields, and buoyancy in one engine eliminates cross-engine coupling and synchronization issues. Jolt WASM is ~0.74 MB gzip wasm + 0.14 MB glue, lazy-loaded after title screen.
**Change me if**: The Phase 6 engine spike proves custom PBD solver has significantly better mobile performance or feel.

### GLB Asset Format & CC0 Pipeline
**Decision**: Manifest-driven CC0 asset fetcher (`pnpm assets:fetch`) saving to ignored cache directories, with procedural Three.js fallbacks for every asset.
**Rationale**: Guarantees zero licensing risk, keeps git repository lean (no binary bloat), and ensures the game runs cleanly even with an empty assets folder.
**Change me if**: Asset requirements exceed procedural/CC0 availability.

---

## Tech Stack Decisions

### Vite Build Tool
**Decision**: Use Vite for development and production builds.
**Rationale**: Fast HMR, modern ES modules, built-in optimization, widely adopted.
**Change me if**: Webpack/Vite feature gap becomes critical, or team prefers different tool.

### Three.js r128+
**Decision**: Pin Three.js to r128+ (current stable), upgrade later if needed.
**Rationale**: Stable API, good performance, large ecosystem, no breaking changes expected soon.
**Change me if**: Need features only in newer versions, or performance regression occurs.

### pnpm Workspaces
**Decision**: Use pnpm for monorepo workspaces management.
**Rationale**: Fast, disk-efficient, strict dependency management, good for monorepos.
**Change me if**: Team prefers npm/yarn workspaces, or pnpm has compatibility issues.

---

## Visual Style Decisions

### Cozy Low-Poly Aesthetic
**Decision**: Use cozy low-poly style with soft pastel palette, NPR shaders, flat-shaded terrain and props, smooth soft creatures.
**Rationale**: Matches "peaceful/cozy" game goal, miniature sandbox aesthetic.
**Change me if**: Playtesting shows aesthetic doesn't resonate, or performance issues with shaders.

### Kuwahara Post-Processing
**Decision**: Use Kuwahara filter for painterly/watercolor effect in Full quality; disable on mobile/Light quality.
**Rationale**: Unique visual identity, cozy feel, adaptive performance scaling.
**Change me if**: Performance impact is too high, or effect looks unnatural.

---

## Gameplay & Physics Decisions (v4)

### Nine Forms as Pure Data (Phase 5b)
**Decision**: Replace legacy prototype forms (Goo, Jelly Ball, Cube, Cloud, Motes, Ring, Boulder, Pillar, Shard) with nine data-driven forms in a single unified table (Slime: Oobleck, Dewdrop, Aether Bubble; Wisp: Mist, Zephyr, Lantern; Stone: Aerolite, Geode, Obsidian).
**Rationale**: Adding a form never adds a system; differences come strictly from mass, relative density, drag, and tanks. Eliminates modal confusion.
**Change me if**: Specific forms require fundamentally new physical simulation solvers.

### Loop Slice (Phase 6b)
**Decision**: Prove the complete game loop (explore, harvest, craft, build, biomes) on a bounded island with three forms (one per family: Oobleck, Zephyr, Geode) before expanding to the remaining six forms.
**Rationale**: Ensures core gameplay loop is fun, stable, and performant before scaling content.
**Change me if**: Playtesting requires all nine forms simultaneously to evaluate loop balance.

### Units: Relative Density
**Decision**: All densities are specified relative to water ($\text{water} = 1.0$).
**Rationale**: Intuitive physical reasoning (forms with density < 1 float, > 1 sink). Real water density ($1000\text{ kg/m}^3$) appears only inside the quadratic water drag formula.
**Change me if**: Simulation calculations require SI units across all internal equations.

### Form Identity: Bounce, Water and Air (v4.1)
**Decision**:
1. **Airy Bubble**: Keep Aether Bubble airy rather than springy (restitution 0.5, low momentum, $0.35g$ gravity, long hang times, slow falls).
2. **Dewdrop Ballast Splat**: Bouncy when dry (0.6), dropping to 0 (flat splat with splash particles) as ballast fills with water.
3. **Universal Water Movement**: No glide while submerged (>8% submerged). Universal swimming replaces glide (`WASD` paddles at 9 m/s², `Space` upward stroke at 3 m/s). Dense forms walk the lakebed and jump from it.
4. **Aerolite Lift Magic**: Stone body (mass 1.5, stone drag, rigid collisions), but air-creature current coupling (updrafts/thermals carry it detached from mass).
5. **Universal Moor Rule**: Grounded idle forms cancel wind drift up to a safety threshold.
**Rationale**: Provides sharp, distinct identity for all forms while eliminating frustrating physics traps (such as getting blown away while idle or gliding underwater).
**Change me if**: Specific traversal puzzles require underwater gliding or idle wind drift.

---

## Performance & CI Decisions

### CI Performance Gates (Phase 6 Exit Criterion)
**Decision**: Implement strict CI performance gates driven by `perf-budget.json`: physics ms/step benchmark, bundle-size check (initial, wasm, total gzip), and 6x CPU-throttled browser frame test gating frame time, draw calls (<35), and triangles (<60k).
**Rationale**: Enforces performance budgets continuously rather than deferring optimization to the end of development.
**Change me if**: CI infrastructure cannot reliably execute headless GPU/WASM frame tests.

### Simulation Consistency over Cross-Device Determinism
**Decision**: Run fixed timestep (1/60s) with decoupled accumulator clamping, but do not mandate bit-identical floating point across devices (single player sandbox).
**Rationale**: Cross-device WASM bit-determinism adds massive complexity for zero gameplay gain in a single-player cozy game with local saves.
**Change me if**: Multiplayer synchronization is introduced.

---

## UI/UX Decisions

### DOM Overlays for UI
**Decision**: Use DOM/CSS for all UI (HUD, panels, menus), not in-canvas text.
**Rationale**: Better accessibility, easier styling, responsive design, text crispness.
**Change me if**: Performance issues with DOM, or need in-world UI.

### Cozy UI Aesthetic
**Decision**: Use rounded corners, pastel colors, soft shadows for UI.
**Rationale**: Matches visual style, feels friendly and welcoming.
**Change me if**: Playtesting shows readability issues, or aesthetic changes.

### Touch Controls for Mobile
**Decision**: Implement virtual joystick and buttons for touch devices.
**Rationale**: Mobile support required, touch is primary input on phones.
**Change me if**: Playtesting shows mobile isn't target audience, or better alternative exists.

---

## Testing Decisions

### Unit Tests for Core/Sim
**Decision**: Core and sim packages must have comprehensive unit tests.
**Rationale**: Pure functions easy to test, catches bugs early, ensures reliability.
**Change me if**: Development speed too slow, or tests provide little value.

### Playwright for E2E
**Decision**: Use Playwright for end-to-end gameplay and UI testing.
**Rationale**: Cross-browser, reliable, good for regression testing.
**Change me if**: CI takes too long, or flaky tests become problematic.

### No Real-Device Testing Initially
**Decision**: Test on desktop browsers and device emulation only initially.
**Rationale**: Faster iteration, emulator good enough for initial phases.
**Change me if**: Real-device behavior differs significantly, or mobile is primary target.

---

## Save System Decisions

### localStorage + IndexedDB
**Decision**: Use localStorage for profile, IndexedDB for large save data.
**Rationale**: localStorage for small fast data, IndexedDB for large structured data.
**Change me if**: IndexedDB proves complex, or localStorage sufficient for all data.

### JSON Save Format
**Decision**: Serialize game state as JSON.
**Rationale**: Human-readable, easy to debug, widely supported.
**Change me if**: Size too large, or need binary format for performance.

### Auto-Save on Terrain Switch
**Decision**: Auto-save before switching terrain/world.
**Rationale**: Prevents progress loss, good UX.
**Change me if**: Performance impact, or user prefers manual saves only.

---

## Asset Pipeline Decisions

### Manifest-Based Loading
**Decision**: Use JSON manifest to define all assets with stable keys.
**Rationale**: Centralized asset management, easy to update, reference by key not URL.
**Change me if**: Too much overhead, or direct URL loading proves simpler.

### Preload Critical Assets
**Decision**: Preload critical assets on startup, lazy load others.
**Rationale**: Fast initial load, progressive loading for non-critical content.
**Change me if**: Initial load too slow, or all assets needed immediately.

### Procedural Fallback
**Decision**: Provide procedural generation fallback if asset load fails.
**Rationale**: Game always playable, graceful degradation.
**Change me if**: Procedural quality too low, or all assets must be present.

---

## Phase Planning Decisions

### 12-Phase Development
**Decision**: Break development into 12 phases from architecture to release.
**Rationale**: Manageable chunks, clear milestones, early testing and feedback.
**Change me if**: Phases prove too rigid, or different rhythm works better.

### Test After Each Phase
**Decision**: Run full test suite after completing each phase.
**Rationale**: Catch issues early, prevent debt accumulation, quality gates.
**Change me if**: Too time-consuming, or phase-specific testing sufficient.

### Phase 1 First
**Decision**: Start with Phase 1 (Core Architecture) before any gameplay.
**Rationale**: Foundation critical, hard to change later, sets patterns for rest.
**Change me if**: Team prefers prototype-first approach, or wants to see visuals immediately.

---

## Unknown/To Be Decided

### Monorepo vs Separate Repos
**Decision**: OpenWorld contains Aetheria (3D) and Explore-2D (2D) in one repo.
**Rationale**: Shared tooling, easier management, related projects.
**Change me if**: Projects diverge significantly, or team prefers separate repos.

### CI/CD Platform
**Decision**: Not yet decided (GitHub Actions likely).
**Rationale**: Good integration with GitHub, free for public repos.
**Change me if**: Need different platform, or GitHub Actions limitations.

### Deployment Target
**Decision**: Not yet decided (likely GitHub Pages or Vercel).
**Rationale**: Simple static hosting, good for browser games.
**Change me if**: Need server-side features, or different hosting requirements.

### Multiplayer Future
**Decision**: Single-player only for now, multiplayer not ruled out.
**Rationale**: Simplifies development, core gameplay is priority.
**Change me if**: Multiplayer becomes key requirement, or tech needs to support it.

---

## Assumptions

### Target Device Performance
**Assumption**: Target devices can sustain 30 FPS with Light quality.
**Change me if**: Real-device testing shows performance issues.

### Browser Support
**Assumption**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) with WebGL 2 and WASM support.
**Change me if**: Need to support older browsers, or WASM support issues.

### Network Conditions
**Assumption**: Players have reasonable internet for asset loading (not offline-first).
**Change me if**: Offline support becomes requirement, or poor network conditions common.

### Player Skill Level
**Assumption**: Players can learn controls and mechanics without extensive tutorial.
**Change me if**: Playtesting shows confusion, need better onboarding.

### Session Length
**Assumption**: Typical play session is 10-30 minutes.
**Change me if**: Game design changes to longer sessions, or different engagement pattern.
