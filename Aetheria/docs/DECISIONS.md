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

### Rapier WASM Physics
**Decision**: Use @dimforge/rapier3d instead of custom JS physics.
**Rationale**: 2-3x faster, cross-platform deterministic, actively maintained, less custom code.
**Change me if**: WASM loading fails on target browsers, or bundle size is too large.

### GLB Asset Format
**Decision**: Standardize on GLB (binary glTF with embedded textures) for all 3D assets.
**Rationale**: Three.js native support, single file per model, CDN-ready from 3dassets.dev.
**Change me if**: Need advanced features only available in other formats, or compression is insufficient.

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
**Decision**: Use cozy low-poly style with soft pastel palette, NPR shaders.
**Rationale**: Matches "peaceful/cozy" game goal, different from slime lab, inspired by A Short Hike/Susurrus.
**Change me if**: Playtesting shows aesthetic doesn't resonate, or performance issues with shaders.

### Kuwahara Post-Processing
**Decision**: Use Kuwahara filter for painterly/watercolor effect.
**Rationale**: Unique visual identity, cozy feel, technical showcase.
**Change me if**: Performance impact is too high on mobile, or effect looks unnatural.

### Asset Sources
**Decision**: Use 3dassets.dev and Grab3D.com for CC0 GLB models.
**Rationale**: High quality, web-optimized, CC0 license, CDN-ready.
**Change me if**: Need specific assets not available, or licensing requirements change.

---

## Gameplay Decisions

### Three Creatures Only
**Decision**: Keep only slime, wisp, stone as playable forms. No additional creatures.
**Rationale**: Focus on quality over quantity, each form has depth with variants.
**Change me if**: User feedback requests more variety, or gameplay needs expand.

### Form Variants per Creature
**Decision**: Each creature has 3 distinct base form variants (slime: goo/jelly ball/jelly cube; wisp: cloud/motes/ring; stone: boulder/pillar/shard) developed phase-by-phase.
**Rationale**: 3 base forms per creature provides distinct, memorable physics properties and gameplay feel without redundant overlap.
**Change me if**: Playtesting requests further sub-variants.

### Physics Constants from Prototype
**Decision**: Keep all physics constants from Aetheria.html (gravity -20, particle radius 0.07, etc.).
**Rationale**: Preserves proven gameplay feel, no need to rebalance from scratch.
**Change me if**: Playtesting shows issues, or new architecture requires different approach.

### Peaceful Game Only
**Decision**: No combat, damage, enemies, hunger, drowning, or punitive mechanics.
**Rationale**: Matches "cozy/peaceful" goal, different from typical games.
**Change me if**: Game becomes boring without challenge, or user feedback requests conflict.

---

## Performance Decisions

### Fixed Timestep (1/60s)
**Decision**: Use fixed timestep of 1/60s for physics simulation.
**Rationale**: Deterministic, consistent across devices, prevents tunneling.
**Change me if**: Target devices can't sustain 60 FPS, or need different timestep.

### Quality Levels (Full/Light)
**Decision**: Two quality levels: Full (desktop) and Light (mobile).
**Rationale**: Simple choice, covers most devices, easy to implement.
**Change me if**: Need more granular control, or devices have wider performance range.

### Draw Call Budget (25-35)
**Decision**: Target 25-35 draw calls per frame.
**Rationale**: Good balance of visual quality and performance, achievable with instancing.
**Change me if**: Visuals need more complexity, or hardware improves significantly.

### Bundle Size Budget (400KB gzipped)
**Decision**: Target <400KB gzipped for initial JS load.
**Rationale**: Fast load on mobile, reasonable for 3D game with Three.js.
**Change me if**: Game complexity requires more code, or compression improves.

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
