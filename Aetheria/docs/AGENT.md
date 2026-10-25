# AGENT.md — Rules for AI Working on Project Aetheria

Aligned with `AETHERIA_MASTER_PLAN.md` (v4).

This document contains rules for any AI agent working on this codebase.

---

## 1. Ground Rules & Scope

1. **Follow the Master Plan**: `AETHERIA_MASTER_PLAN.md` is the primary source of truth. All docs and code must align with it. `Aetheria.html` is an experimental prototype / feel reference only; do not copy its monolithic structure.
2. **Desktop Only**: Project Aetheria is desktop-browser only (Chrome, Edge, Firefox; Safari desktop best-effort). No mobile, no touch controls, no responsive downscaling for phones.
3. **Peaceful Sandbox**: No combat, no health, no damage, no drowning, no hunger, no death, no punishment. Never add mechanics that punish or frustrate the player.
4. **Permanent Forms**: Nine forms across three families (Slime, Wisp, Stone). All forms are always available from minute one. Switching is free and unrestricted (`C` switches family, `1`/`2`/`3` selects form).
5. **Universal Verbs**: Every form can perform core verbs: Move, Jump, Glide, Squeeze, Cling, Anchor/Float. Forms differ by weight, bounce, friction, and signature abilities (J / K), but no form is locked out of moving through the world.
6. **Steady Wind & Water (Rule 4)**: Wind, thermals, and currents are steady and neutral by default. They never push, pull, slow, or blow the player off course unless the player explicitly holds **Shift** (Ride). Headwinds never slow you down; tailwinds provide boost.

---

## 2. Architecture & Code Quality

- **Language & Stack**: TypeScript (strict mode), Three.js (pinned r128+), Vite, pnpm.
- **Physics Abstraction**: All physics must sit behind a clean `PhysicsWorld` interface (spiked in Phase 0: Jolt Physics WASM single-thread vs custom minimal physics). Game logic and character controllers interact only with `PhysicsWorld`.
- **Pure Game Simulation**: Simulation and gameplay logic must not tightly couple to Three.js render objects or DOM elements. ECS or decoupled system architecture: state in data, rendering observes state.
- **Zero Allocations in Hot Loops**: Reuse vectors (`THREE.Vector3`), quaternions, and temporary objects. Avoid instantiating objects inside `update(dt)` or render loops.
- **Instanced Rendering**: Use `THREE.InstancedMesh` for repeated props, foliage, and particles. Keep draw calls $\le 60$.
- **Procedural Fallbacks**: Every visual asset must have a procedural geometry fallback. The game must boot and be fully playable even if `public/assets/` is empty.

---

## 3. Controls Reference

Never invent custom control schemes; adhere strictly to the master plan:

| Action | Key / Input | Notes |
| :--- | :--- | :--- |
| **Move** | `W`, `A`, `S`, `D` / Arrows | Directional movement relative to camera |
| **Jump / Climb / Swim-Up** | `Space` | Jump on ground, climb on walls, upward swim stroke |
| **Sprint / Ride Wind / Currents**| `Shift` (hold) | Boost speed on ground; harness wind/current vectors |
| **Primary Ability** | `J` | Form signature ability (e.g. bounce, gust, anchor) |
| **Secondary Ability** | `K` | Form signature utility (e.g. squish, hard-light, geyser) |
| **Switch Family** | `C` | Cycles Slime $\to$ Wisp $\to$ Stone $\to$ Slime |
| **Select Form** | `1`, `2`, `3` | Direct selection within active family |
| **Inventory / Crafting** | `Tab` | Toggle inventory & crafting panel |
| **Pause / Settings** | `Esc` | Opens settings, controls, audio, graphics |

---

## 4. Performance Budgets (Desktop Only)

| Metric | Budget | CI Gate |
| :--- | :--- | :--- |
| **Initial JS bundle** | $< 700\text{ KB}$ gzipped | Fails build if exceeded |
| **Total 3D models** | $< 5\text{ MB}$ gzipped | Checked via asset script |
| **Target Frame Rate** | $60\text{ FPS}$ baseline | Monitored in performance governor |
| **Triangles visible** | $\le 150,000$ | Checked per scene |
| **Draw calls** | $\le 60$ | Instancing enforced |
| **Memory footprint** | $< 250\text{ MB}$ heap | No memory leaks in entity lifecycles |

---

## 5. Development Workflow & Tasks

- **Phases 0–9**: Follow the sequential roadmap laid out in `docs/PLAN.md`.
- **Small, verified steps**: Verify compilation (`pnpm build` or `npm run build`) and tests (`pnpm test` or `npm test`) frequently.
- **Never leave tests or builds broken**: Fix compile errors or test regressions immediately.
- **Document decisions**: If an edge case requires an assumption, log it in `docs/DECISIONS.md` with a "change me if" rationale.
