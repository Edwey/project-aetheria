# PERFORMANCE.md — Performance Budgets & Targets

Aligned with `AETHERIA_MASTER_PLAN.md` v4. Desktop browser only.

## Target Platform

**Desktop only.** Current Chrome, Edge, Firefox. Safari desktop best effort, tested before release.

**Measured Test Computer Specifications (Phase 0):**
- **CPU**: Intel(R) Core(TM) i7-9850H CPU @ 2.60GHz (6 cores, 12 logical processors)
- **RAM**: 32.0 GB Physical Memory
- **GPU**: NVIDIA Quadro T1000 + Intel(R) UHD Graphics 630
- **OS**: Windows 11 Desktop (PowerShell / Chromium environment)
- **Display Target**: 1920×1080 @ 60 Hz baseline

Every performance claim and ratchet benchmark is judged on this machine.

---

## Frame Rate Targets

| Preset | Target |
| --- | --- |
| Balanced | 60 FPS (goal) |
| Low | 30 FPS (floor) |

**Performance is a ratchet, not a promise.** After the vertical slice, re-baseline and enforce that nothing gets worse than the baseline by more than 10%.

---

## Bundle Budgets

| Metric | Budget |
| --- | --- |
| Initial JS (gzip) | ~700 KB |
| Whole demo download (gzip) | ~4 MB |
| Tab memory | Under ~400 MB |

---

## Rendering Budgets

| Metric | Target |
| --- | --- |
| Draw calls | ~60 |
| Visible triangles | ~150k |
| Render submission | ~4 ms per 16.7 ms frame |
| Simulation | ~4 ms per 16.7 ms frame |

### Techniques
- InstancedMesh for repeated geometry
- Frustum culling
- Vertex colours, few textures
- Baked vertex ambient occlusion

---

## Quality Presets

| Setting | Low | Medium | High | Custom |
| --- | --- | --- | --- | --- |
| Resolution scale | 0.75 | 0.85–1.0 | 1.0+ | User choice |
| Pixel ratio cap | 1.0 | device | device | User choice |
| Shadows | Blob shadows | One cheap shadow map | One cheap shadow map | User choice |
| Post-processing | None | None | None | — |
| Particles | 150/emitter | — | 400/emitter | User choice |

The interface works at 1366×768 without scrolling.

---

## Two-Way Governor

- Drops quality after ~1 second of slow frames
- Recovers after ~12 seconds of good frames
- Stops recovering after two relapses
- Measures CPU and GPU time separately

---

## Degradation Order

Drop in this order to maintain frame rate:
1. Distant wildlife
2. Particles and cosmetic effects
3. Quality preset reduction

**Never degrade:** physics, form identity, safe traversal, save integrity.

---

## Physics Performance

### Fixed Timestep
- 60 Hz fixed step with visual interpolation
- At most 4 catch-up steps per frame
- Excess discarded after tab suspension
- Phase order: input → ability → motor → physics → contacts → world update → render

### Obsidian Anchor
- Uses kinematic or static body, never infinite mass

---

## CI Gates (from Phase 0)

| Gate | Metric |
| --- | --- |
| Physics benchmark | ms per step |
| Bundle size | gzip check |
| Browser frame test | 6× CPU throttling: JS frame time, draw calls, triangles (not FPS) |

Software rendering is never used for frame-rate claims.

---

## Design Rules

- Fill rate is the first limit, not triangles
- One cheap shadow map from Medium up; blob shadows on Low
- No post-processing chain
- Optional 30 FPS battery cap
- Rendering pauses when tab is hidden

---

## Memory Management

### Hot Loop Rules
- Zero per-frame allocations during active gameplay
- Object pools for particles, VFX, sound emitters
- Pre-allocated typed-array buffers
- Reuse TypedArrays for physics

### What Is NOT Tested Yet

- Real GPU frame rate and draw calls
- Physics acceptance numbers on final build
- Firefox and Safari
- Long sessions and memory
- Save corruption and recovery
- Keyboard-only and screen-reader use
