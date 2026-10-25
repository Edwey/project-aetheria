# PLAN.md — Development Roadmap (aligned with Master Plan v4)

## Overview & Context

Aetheria is a cozy, isometric, low-poly sandbox on one connected island. Desktop browser only (Chrome, Edge, Firefox; Safari best-effort). Built with TypeScript (strict), Vite, pnpm, Three.js (WebGL 2).

**This plan derives from `AETHERIA_MASTER_PLAN.md` (v4).** That document is the single source of truth for all design decisions. `Aetheria.html` is a throwaway tester build — its code is not copied, but what it proved (jump feel, squash, soft-slime behaviour, performance tiers) is reproduced cleanly.

**Rule for every choice:** pick the simplest approach that works, prove it in a small spike, and cut a feature before cutting quality.

---

## Pillars

1. **Nine forms, nine identities.** Each form is a real choice, not a skin.
2. **One connected world.** No form locks a region; a form can make a route faster, never the only way.
3. **Physics with purpose.** Weight, buoyancy, air and momentum create play that is readable and forgiving.
4. **Everyone can do everything.** All nine forms can walk, jump, climb, glide, collect, craft, build and swim. Forms differ by advantages, never handicaps.
5. **Alive in the first ten seconds.** Every action answers with motion, a visual and a sound.
6. **Cozy and safe.** No death, no decay, no soft-locks, no lost work.

**Non-goals for first solo release:** combat, PvP, economy, phone/tablet support, co-op, modding platform, desktop wrapper, trading, cloud sync, WebGPU, hunger, tool breakage, structural collapse.

---

## The Nine Forms

Forms are data rows, not code. Adding or tuning a form changes a table, never a system.

| Family | Form | Mass (kg) | J | K |
| --- | --- | --- | --- | --- |
| Slime | Oobleck | 1.2 | Hold: squeeze through 0.5 m grates | — |
| Slime | Dewdrop | 1.2–2.0 | Hold: release ballast | Hold: water jet |
| Slime | Aether Bubble | 0.4 | Tap: inflate for a lift pulse | — |
| Wisp | Mist | 0.3 | Hold: phase through barred gates | — |
| Wisp | Zephyr | 0.3 | — | Hold: gust dash that pushes movable props |
| Wisp | Lantern | 0.3–3.3 | Hold: condense | Hold: spectral stairs |
| Stone | Aerolite | 1.5 | — | — |
| Stone | Geode | 3.5 | Hold: roll brake | Hold: boost (refills at low speed) |
| Stone | Obsidian | 9.0 | Hold: anchor in place | Tap: bounded ground shockwave |

---

## Controls

| Input | Action |
| --- | --- |
| W A S D | Camera-relative movement |
| Space | Contextual up: jump (hold to charge), wisp rise, swim stroke |
| Left Shift (hold) | Sprint (no cost, momentum kept) |
| G (hold) | Ride the wind |
| J / K | Two ability slots of the active form |
| F | Stomp, pound or down-gust (every family) |
| E | Interact (opens crafting at workbench) |
| B | Build mode; Enter places, Backspace removes, X rotates |
| Ctrl+Z / Ctrl+Y | Undo/redo a build step (20 steps) |
| 1 2 3 | Pick a family, return to last form used in it |
| Z | Cycle forms within family. Tab cycles families. |
| 4–8, H | Emotes and heart |
| Right drag, Q | Orbit camera, turn 90° (Shift+Q reverses). Wheel zooms. |
| Esc, R | Menu, return to last safe ground |

All keys remappable with conflict warnings and restore-defaults.

---

## Platform & Hardware Floor

| Item | Decision |
| --- | --- |
| Browsers | Current Chrome, Edge, Firefox. Safari desktop best effort. |
| Graphics | WebGL 2 |
| Frame rate | 60 FPS Balanced preset goal; Low preset must hold 30+ |
| Offline | Works after first load (service worker cache) |
| Hosting | Static files on a free CDN host |

**Baseline laptop (assumed until measured):** 2–4 cores (i3/i5 class), 4–8 GB RAM, Intel integrated (UHD 620/Iris Xe), 1366×768 or 1920×1080, Windows 10/11, Chrome/Edge, often on battery.

Design rules: fill rate is the first limit; Balanced renders at 0.85–1.0 scale, Low at 0.75 with pixel ratio capped at 1.0; one cheap shadow map from Medium up, blob shadows on Low; no post-processing chain; interface works at 1366×768; ~4 ms sim + ~4 ms render per 16.7 ms frame; under ~400 MB tab memory; optional 30 FPS battery cap; rendering pauses when tab is hidden.

---

## Universal Rules

- **Verbs:** walk, jump, climb, glide, collect, craft, build, swim.
- **Form switching** is instant and safe. If the new shape doesn't fit, switch is refused with outline flash.
- **Moor rule:** no input + on ground = not pushed by wind. Light forms gain from thermals and gliding, never helpless drift.
- **Water (submerged 8%+):** gliding off, swimming takes over. WASD paddles, Space strokes upward (3 m/s cap). Dense forms sink and walk lakebed; Obsidian doesn't stroke upward. Bounce off while submerged. Planing (Oobleck, Aerolite) is a speed effect, not glide. Gas forms hover over surface.
- **Respawn:** 0.5 s fade to last safe ground, no inventory loss.

---

## Weight, Impact & Pressure Plates

`impact load = mass × (1 + min(3, v / (g × stop_time)))`

Plates need 1.7 kg load, stay pressed 3 s. Impact only counts above 4 m/s landing speed (~0.8 m drop). Stomp (F) gives flat 3× pulse. See Master Plan §7 for full table.

---

## World

### The Island & Four Regions

One compact continuous island. Sprint across ~90 seconds. Everything open from minute one.

| Region | Built Biome | Role |
| --- | --- | --- |
| Verdant Refuge | Lush Plains | Friendly hub, crafting, storage, comfort |
| Wildwood | Mystic Grove | Gathering, gentle wildlife, sheltered routes, soil |
| Waterworn Basin | Frostpeak Taiga | Snowmelt streams, ponds, ditches, diving, water/digging |
| Windcarved Heights | Sunstone Dunes | Hot sand thermals, gliding, wind, sand traction, momentum |

Each region: one authored landmark, one shortcut, one safe resting point. Supporting content is procedural.

### Terrain

Chunked heightfield, flat-shaded low-poly, baked vertex AO. Flat integer grid (1 m cells): soil moisture, crop stage, trench depth, water level.

Ditches: digging lowers trench depth 0.3 m. Does not rebuild terrain collider.

### Water

Per-cell water level, ~4 flow steps/s. Active radius ~24 m at full detail; distant basins keep summary value. Rain fills, trenches carry, moisture spreads 2–3 cells. Demo: one reservoir, one authored trench path.

### Weather & Air

Clear, wind, rain — smooth transitions. Weather never damages buildings. Thermals: authored upward air fields (concentrated on Heights). Five wildlife species: frogs, moths, birds, dragonflies, owls. Trust 0–100 per species.

### Puzzles

Handcrafted landmarks + physics interactions (weight/impact plates, gates, water routing). Optional hints, always reset. No puzzle can ruin a save.

---

## Building, Crafting & Farming

- **Pieces:** foundations, floors, walls, roofs, stairs, ramps, doors, windows, bridges. Furniture rotates freely, snaps to surfaces. Structural snaps 0.5 m and 1.0 m. Adaptive stilts to 3.0 m. Pieces need support; nothing collapses or decays.
- **Undo/redo:** 20 steps, restoring full cost. **Dismantling** returns 75%.
- **Crafting:** pocket items craft anywhere. Building pieces need workbench within 5 m. Nearby storage supplies crafting (no global inventory).
- **Farming:** crops grow from soil moisture + weather. Never die; dry = paused. Offline growth computed on load, capped 72 h.
- **Progression:** recipes, resources, discoveries, convenience, decoration. Never gated regions, grind or forced quests.

---

## Presentation

**Camera:** isometric follow, default 45° yaw/pitch. Right drag orbits (pitch ~35–55°), wheel zooms. Circular dither cutaway for blocking geometry.

**Look:** flat-shaded faceted environment, smooth soft creatures. Baked vertex AO, toon ramp lighting, thin outline on creatures, rim light, fake thickness, tinted depth fog, warm key/cool shadows. Gradient sky, CSS vignette, additive-sprite bloom. Water: depth tint, scrolling stripes, baked shoreline foam, no reflections. 24-min day/night cycle. Quality presets: Low, Medium, High, Custom + two-way governor.

**Audio:** all procedural Web Audio. Footsteps by ground type, impacts, abilities, weather, water. Bounce-chain music (rising scale notes). Music is the risky part.

**Interface:** minimal HUD. Top left: menu + creature name. Left: ability card + clickable nine-form list. Top right: biome, weather, wind, clock, objective. Bottom centre: hotbar, charge bar, key bar. Question-mark reveals full controls. Menu tabs: Creature, Craft/Build, World, Settings, How to Play. Accessibility: reduced motion, flash limits, colour-blind palettes, text/HUD scaling, subtitles, remappable keys.

---

## Feel, Life & Hook

**Rule:** every action answers in motion, visual and sound, and every form has one signature moment worth a six-second clip.

**Must-have (demo):**
- Squash/stretch from velocity/impact, anticipation before jumps
- 100 ms coyote time, 100 ms input buffer, 0.1 m corner nudge (no lift)
- Bounce chain (re-jump within 0.3 s, +10% per link, up to 5) with rising notes
- Hit-stop 2–4 frames on heavy impacts
- Grass bending, water ripples/splashes, splat flower (full Dewdrop)
- Idle personality, tapping creature reacts
- Discovery log with form-specific collectibles
- Photo mode with one-click screenshot

---

## Technical Architecture

| Layer | Choice |
| --- | --- |
| Language/build | TypeScript (strict), Vite, pnpm |
| Rendering | Three.js, WebGL 2, instanced meshes, vertex colours |
| ECS | Small library (miniplex or bitECS) for world entities/props. Hot loops: plain typed arrays |
| Physics | Behind `PhysicsWorld` interface. Decided in Phase 0 spike. |
| Audio | Raw Web Audio API, zero files |
| Saves | IndexedDB + browser storage, JSON export |

**Code layout:** `core/`, `data/`, `sim/`, `physics/`, `render/`, `audio/`, `build/`, `save/`, `ui/`, `dev/`

**Physics spike (Phase 0, 1–2 weeks):** Rebuild Oobleck and Dewdrop on a rigid proxy with visual-only jelly lattice. Compare vs prototype's soft body on bounce, tight spaces, ditch tests. Also test Jolt vs custom sphere-vs-heightfield collider.

**Fixed 60 Hz step** with visual interpolation, max 4 catch-up steps, excess discarded. Phase order: input → ability → motor → physics → contacts → world update → render.

---

## Saves, Privacy & Resilience

- Local-first, multiple named worlds, no account.
- Browser storage (fast path) + IndexedDB mirror with 3 rolling backups.
- **Staged import:** parse, check version, validate keys, show summary, backup first, then apply. Never silently overwrites.
- Versioned schema with validated migrations.
- No optional browser permissions. Diagnostics opt-in only.

---

## Provisional Tuning Defaults

See Master Plan §14 for complete table (Oobleck restitution 0.85, Dewdrop ballast formula, Bubble gravity 0.35g, coyote 100 ms, building grid 0.5/1.0 m, etc.).

---

## Performance & Testing

**Performance is a ratchet.** Starting targets on test computer, Balanced: 60 FPS, ~60 draw calls, ~150k visible triangles, <400 MB, initial JS ~700 KB gzip, whole demo ~4 MB gzip. After vertical slice, re-baseline; nothing gets worse by >10%.

**Degradation order:** distant wildlife, particles, cosmetic effects first. Physics, form identity, safe traversal, save integrity never degrade. Two-way governor: drops quality after ~1 s slow frames, recovers after ~12 s good frames, stops recovering after two relapses.

**CI gates from Phase 0:** physics benchmark (ms/step), bundle-size check, browser frame test with 6× CPU throttling.

**Quality gates:** form matrix, route matrix, safety, plates/impact, feel, water/building, puzzle resets, stress testing, accessibility, cross-browser, first-minute test. Critical defect blocks release.

---

## Roadmap

| # | Phase | Main Work | Exit Gate |
| --- | --- | --- | --- |
| 0 | Spikes & measurement | Physics spike, trench experiment, cutaway shader, test computer baseline, CI skeleton | Physics approach decided; baseline measured |
| 1 | Foundation | Split single file → modules, forms as data, input commands, save schema + staged import, island start with no-text onboarding | Island loads, saves, restores; modules build in CI |
| 2 | Signature abilities | J/K for all nine forms (Oobleck, Zephyr, Geode first), water rules, forgiveness toolkit, Proving Grounds, impact/plate tests | Every form passes form matrix; CI green |
| 3 | Loop slice | One bounded area: harvest, craft bench, building with undo, trench/water, HUD, core audio, art pass | Loop is fun, readable, save-safe. **Go/no-go review.** |
| 4 | Public demo | All nine forms, one area, core loop, discovery log, photo mode, feedback, hosting | Outside testers finish first experience; first-minute test passed |
| 5 | Full island | Four regions, routes, landmarks, puzzles | Every region reachable by every family |
| 6 | Living world | Wildlife/trust, farming, weather, full watershed | No hitches in common play |
| 7 | Building & sharing | Breadth, cosmetics, import/export, blueprints | Reliable persistence |
| 8 | Polish | Art, audio, accessibility, hook features | Looks and feels premium on test computer |
| 9 | Release hardening | Cross-browser, documentation, final optimisation | No critical defects; performance characterised |

**Demo scope:** all nine forms, one area, core loop (gather, dig, divert water, craft, build, save).

**Cut list (in order):** wild companions; copy/paste/mirror; blueprint sharing; full watershed; time trials/ghosts/daily seeds; clip recording (keep screenshots); adaptive music beyond bounce-chain.

**Never cut:** nine-form identity, safe traversal, save integrity, no-failure-state rule, first-minute experience.

**After launch:** co-op (host-authoritative, 2–4 players), desktop wrapper, mod loader, trading, cloud sync.

---

## Risks

| Risk | Answer |
| --- | --- |
| Soft body pinches/tunnels/costs too much | Phase 0 spike; rigid proxy is default target |
| Performance unknown on weak laptop | Measure in Phase 0; ratchet and governor |
| Single file unmaintainable | Split into modules in Phase 1 |
| Too many controls overwhelm new players | Minimal HUD, onboarding, first-minute test |
| Tab suspension / physics spirals | Fixed step, bounded catch-up, discard excess |
| Save corruption or eviction | Versioned schema, staged import, 3 backups, export reminders |
| Water too expensive | Active radius + summaries; demo: one reservoir, one trench |
| Procedural music sounds thin | Budget time; allow sampled loops later |
| Scope growth | Cut list, go/no-go after Phase 3 |

---

## Current Status

**Phase**: 3 — Loop Slice (Completed) | Phase 4 — Public Demo (Ready to Begin)
**Progress**: 
- **Phase 0 (Spikes & Measurement)**: Hardware baseline recorded (Intel i7-9850H, 32GB RAM, Quadro T1000/UHD 630). Physics spike verified (rigid proxy selected, >=5 bounces, 100/100 grate passes, <0.05ms/step). Trench experiment & cutaway dither shader built & verified.
- **Phase 1 (Foundation)**:
  - Table A1 Forms as Pure Data: All 9 forms defined (Slime: Oobleck, Dewdrop, Aether Bubble; Wisp: Mist, Zephyr, Lantern; Stone: Aerolite, Geode, Obsidian) with physical constants and J/K abilities.
  - Input Command Abstraction: Decoupled commands with 100ms coyote time, 100ms jump buffering, and conflict-checked keybindings.
  - Save System & Staged Import: Local-first multi-world schema with 3 rolling backups and staged import validation.
  - Island Starter: Pebble Cove starter environment, non-intrusive onboarding, and Springcap Mushroom bounce pad.
- **Phase 2 (Signature Abilities & Proving Grounds)**:
  - J and K signature abilities for all 9 forms (Oobleck squeeze/planing, Dewdrop ballast/jet, Bubble lift pulse, Mist phase, Zephyr dash, Lantern stairs, Aerolite float, Geode roll/brake/boost, Obsidian anchor/shockwave).
  - Water physics & hydrodynamics: 8% submerged gate, paddle drive, upward stroke (3 m/s cap), bed walking, Rule 4 steady currents with exponential drag.
  - Forgiveness toolkit: 100ms coyote time, 100ms jump buffer, 0.1m corner nudge (no lift), bounce chain (+10% per link up to 5), 0.5s fade safe ground respawn.
  - Weight & impact pressure plates: Master Plan §7 table (1.7kg threshold, 4.0 m/s gate, 4x mass cap, 3x stomp pulse, 3s latch, Bubble/Wisp caps).
  - Proving Grounds form matrix test: All 9 forms verified passing mobility, ability, plate, and water tests.
- **Phase 3 (Loop Slice & Go/No-Go Gate)**:
  - Harvest System & Resources: Peaceful harvesting of driftwood, river pebbles, reeds, and blossoms with 2.5m magnet drop attraction and collection.
  - Crafting System: Pocket items (twine, torch, campfire, bowl, workbench) crafted anywhere; building pieces crafted within 5.0m of workbench with nearby storage support.
  - Modular Building System: 0.5m/1.0m grid snapping, adaptive stilts down to 3.0m on foundations, strict support rules, 20-step 100% full-cost undo/redo, 75% predictable dismantle refund.
  - Dynamic Trench & Water Diversion: 1m grid with 0.3m depth dig step, collision height offset without rebuilding static colliders, ~4 flow steps/s water propagation from spring reservoir, 2-3 cell soil moisture diffusion.
  - Procedural Web Audio Engine (Zero Files): Real-time Web Audio synthesizer for rising pentatonic bounce-chain musical scale, surface footfalls, harvest pops, craft knocks, building place thuds, dismantle snaps, and water splashes.
  - Master Plan §10 Minimal HUD & Full 5-Tab Sanctuary Menu: Top-left menu & form switch, top-right environment & objective tracker, 6-slot quick hotbar, action bar, live inventory chips, staged save import/export with schema validation.
  - Loop Slice Integration Test: Verified full core loop end-to-end (Gather -> Craft -> Build -> Dig/Divert Water -> Undo/Dismantle -> Save & Restore) with 100% save data fidelity.
  - **Go/No-Go Review Gate (Master Plan §16)**: **GO.** Loop is readable, peaceful, highly performant (<150KB initial JS gzipped vs 700KB budget), and completely save-safe.
  - 189 unit & integration tests passing across 24 test suites; production build succeeds cleanly.

| Phase | Status |
| --- | --- |
| 0 – Spikes & measurement | ✅ Completed |
| 1 – Foundation | ✅ Completed |
| 2 – Signature abilities | ✅ Completed |
| 3 – Loop slice | ✅ Completed (Go Gate Passed) |
| 4 – Public demo | ⏳ Ready to begin |
| 5 – Full island | ⏳ Planned |
| 6 – Living world | ⏳ Planned |
| 7 – Building & sharing | ⏳ Planned |
| 8 – Polish | ⏳ Planned |
| 9 – Release hardening | ⏳ Planned |


