# PLAN.md - Development Roadmap (v4)

## Overview & Context

Aetheria is a cozy 3D browser sandbox built with TypeScript, Three.js, Jolt Physics (WASM), and ECS architecture.

**This plan is for the game itself.** `Aetheria.html` is a throwaway tester build, published only so people can try the feel and send feedback. It constrains nothing here: no engine, data model or file layout is chosen to match it, and its code is not copied. What it proved (jump feel, squash, soft-slime behaviour, performance tiers) is reproduced cleanly in the production codebase.

**Units:** every density in this plan is relative to water (water = 1). Real water density (1000 kg/m^3) appears only inside the drag formula.

### Core Pillars
1. **Physics-first and consistent**: All forms obey the exact same physical laws. Differences come from real physical data (mass, density, drag, tanks), never from special-case hacks.
2. **Fairness**: No ability is indefinite. Every ability has a resource tank, cooldown, or physical condition. An exhausted ability stays strictly locked until the activating key is released.
3. **Alive**: Creatures react dynamically to the world around them (idle breathing, wakes, splashes, emotes, glowing states, trails, wind responses), rather than acting as static colliders.
4. **Simple art, procedural-first assets**: Stylized soft low-poly aesthetic with flat-shaded terrain and smooth soft creatures, powered primarily by procedural geometry, procedural Web Audio, and GPU particles, with a lean manifest-driven CC0 asset fetcher for external additions.

### The Nine Forms (3 per creature, always available; switch with 1/2/3 and Z)
- **Slime (Fluid)**:
  - *Oobleck*: Mass 1.2 kg, density 1.12. Firm and bouncy; planes on water (lift begins at 3.5 m/s, fully on top above 5 m/s); squeezes through narrow grates.
  - *Dewdrop*: Mass `1.2 + 0.8 * ballast` kg, density `0.8 + 0.19 * ballast`. Soft and impact-absorbing; soaks water as ballast; hold `K` for rocket water jet.
  - *Aether Bubble*: Mass 0.4 kg, density 0.25. Reduced gravity feel via air drag; tap `J` to inflate for lift pulse; buoyant; rides thermals.
- **Wisp (Atmosphere)**:
  - *Mist*: Mass 0.15 kg, density 0.08. Gaseous dispersion; hovers naturally over water; hold `J` to phase through solid gates.
  - *Zephyr*: Mass 0.25 kg, density 0.12. Aerodynamic stream; hold `K` for sustained gust dash that shoves dynamic props.
  - *Lantern*: Mass 0.80 kg, density 0.05 to 2.40. Hold `K` to condense into hard-light (sinks deeper the longer held, rises upon release/breath exhaustion); light solidifies spectral stairs. All wisp abilities and Space-rise draw from one shared breath tank.
- **Stone (Gravity)**:
  - *Aerolite*: Mass 1.5 kg, density 0.55. Pumice-light rock (density < 1.0 floats); skims water efficiently at speed. **Lift magic:** couples to updrafts, thermals and wind like an air creature while remaining stone (rock body, air-creature currents).
  - *Geode*: Mass 3.5 kg, density 2.60. Near-zero rolling friction; hold `K` for acceleration boost (adds acceleration only, no speed cap).
  - *Obsidian*: Mass 9.0 kg, density 5.00. Hold `J` for immovable anchor; `K` to slam; shoves boulders and crates; sinks rapidly.

---

## Build Order (v4, game first)

The game is proven by its loop (explore, harvest, craft, build, biomes) before the other forms are built. All nine forms are specified as data now; they are built in parts.

1. **Phases 1-2** (done): architecture, physics wrapper.
2. **Phase 5b**: migrate legacy Phases 3-5 to the nine-form data model (see below).
3. **Phase 6**: unified physics core, including the engine spike and the CI performance gates (a Phase 6 exit criterion).
4. **Phase 6b: Loop Slice**: bounded island with biomes, harvesting, inventory and crafting, modular building, with **three forms, one per family** (proposed: Oobleck, Zephyr, Geode; confirm). Every form must do everything: collect, build, craft.
5. **Phases 7-8**: resource tanks and the dev-only Proving Grounds for the three slice forms.
6. **Remaining six forms**: added as data rows plus their tanks and abilities, with no new systems.
7. **Phases 9-13**: alive systems, cosmetics, HUD, art, audio (art and audio can start earlier, in parallel).
8. **Phase 14**: release verification (the performance numbers are already enforced in CI by then).

Each phase ends with a **playable result** line: something a person can open and play, not just tests passing.

---

## Form Identity: Bounce, Water and Air (v4.1)

**Bounce.** Restitution is a per-form data value with one exception: Dewdrop's depends on its ballast. Bounce is also gated on landing speed (slimes bounce from 1.5 m/s, other forms from 3 m/s) and never happens while submerged.

| Form | Restitution | Why |
| :--- | :--- | :--- |
| Oobleck | 0.85 | Firm, elastic, returns energy: the bounce champion |
| Dewdrop | 0.6 x (1 - splat), splat = smoothstep(0.45, 0.85, ballast) | Bouncy when dry; full of water it splats flat (impact velocity cut, splash particles) |
| Aether Bubble | 0.5 | Airiest, not springiest: very light, little momentum, so it bounces softly; low gravity (0.35) makes every hop slow and long |
| Aerolite / Geode | 0.30 / 0.25 | Hard stone, small bounce |

Design call: **keep the Bubble airy rather than springy.** A very light body loses its energy to air drag and has little momentum, so realistic "airy" means long hang time and slow falls, not high rebounds. The three slimes then read distinctly: Oobleck bounces highest, Dewdrop bounces as much as it is dry, the Bubble hangs.

**Water movement (universal, all forms).**
- No gliding, hovering-glide or sail while submerged. Glide is disabled whenever the submerged fraction exceeds about 8%.
- Swimming replaces it: WASD paddles (about 9 m/s^2; 7 for Lantern and Geode, 5 for Obsidian), Space strokes upward up to 3 m/s, and quadratic water drag sets the speed.
- Dense forms (Geode, Obsidian) sink and walk the lakebed and can still jump from it; Obsidian does not stroke upward.
- Planing (Oobleck, Aerolite) is a speed effect above 3.5 m/s, not glide; gas forms hover over the surface by their own ability.
- Bounce is off while submerged.

**Aerolite lift magic.** Aerolite keeps a stone body (mass 1.5, rock drag, rock collisions) but its current coupling is that of an air creature: updrafts, thermals, downdrafts and wind carry it, tuned by a dedicated coefficient instead of 1 / mass. It sparkles in thermals. It is the one form whose air response is deliberately detached from its mass.

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

### Phase 2: Physics Integration (built on Rapier; the engine is re-decided in the Phase 6 spike, and this wrapper becomes the `PhysicsWorld` interface)
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

### Phase 3: Creature 1 — Slime (Liquid Form) [LEGACY PROTOTYPE, superseded by the nine-form model in Phase 5b]
**Goal**: Implement the Slime creature with its 3 base form variants, physics behaviors, controls, and character controller.

**Deliverables:**
- [x] Slime component definitions (`SlimeComponent`, `SlimeFormVariant`, `SlimeState`)
- [x] 3 Slime base form presets:
  - **Goo**: ultra-soft, low stiffness (0.10), high grip (0.8), high stickiness (0.8), fast wall climbing
  - **Jelly Ball**: balanced, moderate stiffness (0.40), balanced grip (0.5), bouncy (restitution 0.6)
  - **Jelly Cube**: firm, high stiffness (0.45), stable footing, strong spring leap, high shape retention
- [x] Movement system (ground drive force 16, air control 0.9, max speed 6 m/s, idle brake 25/s)
- [x] Charge jump system (tap ~0.5m, 0.3s hold ~1.6m, 0.85s hold ~5.3m, power 4.5 to 15)
- [x] Melting / squeezing system (M key: compresses height < 0.6m, scale 0.65, recovers above 0.85m)
- [x] Sticky climbing system (wall climb at 3 m/s on steep surfaces, 1.5s overhang cling budget)
- [x] Gliding & peak hover (fall cap -2.2 m/s, 1.3x speed boost while gliding, 0.8s hover at apex)
- [x] Ground pound (F key) and Spring leap (C key: 1.35x jump boost)
- [x] Procedural deformable slime mesh in `@render` (squash & stretch, melt pancake, bounce)
- [x] Input handling (WASD, Space, Shift, M, C, F) & Character Controller
- [x] Comprehensive unit tests for all Slime mechanics

**Acceptance Tests:**
- [x] Slime entity spawns at designated position
- [x] All 3 form variants (Goo, Jelly Ball, Jelly Cube) apply distinct physics attributes
- [x] Horizontal movement accelerates up to 6 m/s and brakes smoothly on idle
- [x] Jump heights verified: tap ~0.5m, 0.3s hold ~1.6m, 0.85s hold ~5.3m
- [x] Melting reduces vertical height below 0.6m and recovers when released
- [x] Goo climbs steep walls at 3 m/s; plain/cube requires more footing
- [x] Gliding caps downward velocity at -2.2 m/s
- [x] All Slime unit tests pass

**Estimated Time**: 5-7 days

---

### Phase 4: Creature 2 — Wisp (Gas Form) [LEGACY PROTOTYPE, superseded by Phase 5b]
**Goal**: Implement the Wisp creature with its 3 base form variants, mote particle dynamics, and aerial traversal.

**Deliverables:**
- [x] Wisp component definitions (`WispComponent`, `WispFormVariant`, `BreathComponent`)
- [x] 3 Wisp base form presets:
  - **Cloud**: dense protective cloud, higher particle count, steady drift
  - **Motes**: sparse scattered motes, agile, wider reach, fast skimming
  - **Ring**: orbiting mote pattern, rhythmic resonance, focused harvesting
- [x] Mote cluster simulation & 2.2m tether constraint
- [x] Free hop (tap Space: +6 m/s) and gentle sinking (2.5 m/s)
- [x] Rising (hold Space, 20 breath/s) and Floating (V key, 3 breath/s)
- [x] Breath management (100 max, 5s rise budget, auto-refill near ground/water)
- [x] Condense (C key, 1.4x speed), Diffuse (M key, 0.6x speed), Down-gust (F key)
- [x] Wall-hug drift climbing (3 m/s)
- [x] Procedural mote particle rendering in `@render`
- [x] Unit tests for all Wisp mechanics

**Acceptance Tests:**
- [x] Motes remain bounded within 2.2m tether from core
- [x] All 3 variants (Cloud, Motes, Ring) function with distinct dynamics
- [x] Breath depletes during rise (20/s) and float (3/s), refilling near ground
- [x] Down-gust dive produces downward velocity (-22 m/s) with safe timeout
- [x] All Wisp unit tests pass

**Estimated Time**: 5-7 days

---

### Phase 5: Creature 3 — Stone (Solid Form) [LEGACY PROTOTYPE, superseded by Phase 5b]
**Goal**: Implement the Stone creature with its 3 base form variants, rigid physics, and high-impact abilities.

**Deliverables:**
- [x] Stone component definitions (`StoneComponent`, `StoneFormVariant`)
- [x] 3 Stone base form presets:
  - **Round Boulder**: high momentum rolling, geode cracking (>5 m/s), high durability
  - **Tall Pillar**: sturdy, high reach, stable footing against wind
  - **Sharp Shard**: crystalline facets, sharp edges, efficient piton wedging
- [x] Heavy rigid physics (mass, low grip 0.35, high wind resistance 0.5)
- [x] Piton wall climbing (2 m/s, clings without slipping when idle)
- [x] Heavy charge jump (max power 12.75, 0.5s apex hover)
- [x] Crystal sail glide (-3.0 m/s fall cap, free shockwave on landing)
- [x] Pebble shrinking (M key: scale 0.65 to fit through narrow passages)
- [x] Ground pound shockwave (F key) and Rolling impacts
- [x] Procedural low-poly faceted stone mesh in `@render`
- [x] Unit tests for all Stone mechanics

**Acceptance Tests:**
- [x] All 3 variants (Boulder, Pillar, Shard) apply distinct rigid attributes
- [x] Piton climb allows clinging to walls without slipping
- [x] High-speed rolling (>5 m/s) detected for obstacle cracking
- [x] Crystal sail caps fall speed at -3.0 m/s and triggers landing shockwave
- [x] Pebble shrink reduces scale to 0.65 and recovers
- [x] All Stone unit tests pass

**Estimated Time**: 5-7 days

---

### Phase 5b: Nine-Form Data Model & Shared Movement Verbs
**Goal**: Replace the legacy per-creature presets (Goo / Jelly Ball / Cube, Cloud / Motes / Ring, Boulder / Pillar / Shard and their M/C/F/V keys) with the nine forms of Appendix A1 as pure data, and make the movement verbs universal.

**Deliverables:**
- [ ] Forms as data: one table row per form (mass, relative density, restitution, drag, abilities, tank). Adding a form never adds a system.
- [ ] Shared movement verbs for all nine forms: walk, jump, **climb**, **glide**, hop. Same inputs, numbers tuned by mass and density.
- [ ] Input remap: `1/2/3`, `Z`, `J`, `K`, `Space`; the legacy keys are removed.
- [ ] Legacy tests ported or retired; no test may reference a legacy form.

**Acceptance Tests:**
- [ ] All nine form rows load from data; switching forms changes numbers only.
- [ ] Every form can climb and glide with its own tuned values.
- [ ] No reference to Goo, Jelly, Cloud, Motes, Ring, Boulder, Pillar or Shard remains in code or tests.

**Playable result**: switch between the forms and move, climb and glide with each.

---

### Phase 6: Unified Physics Core & Force Systems
**Goal**: Implement the unified physics core on one engine (Jolt, pending the spike), with data-defined physical force systems and the CI performance gates.

**Deliverables:**
- [ ] Single-Engine Physics (Jolt Physics, WASM, single-thread build, behind a `PhysicsWorld` interface):
  - Jolt provides rigid bodies, heightfield terrain, soft bodies (with pressure and volume constraints), a character controller and buoyancy in one world, so there is no custom/rigid coupling layer
  - Loaded lazily after the title screen from a separate `.wasm`, cached by a service worker (measured: about 0.74 MB gzip wasm plus 0.14 MB glue)
  - **Engine spike (first 2 days of Phase 6):** build the slime as a Jolt soft body and as a custom 162-particle PBD solver behind the same interface; pick by measured ms/step and feel on a throttled mobile profile. Fallbacks: custom slime solver on the same `PhysicsWorld`, or cannon-es for props only
  - Mobile slime tier: about 162 simulation particles driving a smooth, higher-resolution render mesh by GPU skinning (Phong-tessellation skin); desktop may use more
- [ ] Universal Moor Rule: with no input and grounded, a moor force cancels wind up to a cap, so no form is ever pushed around while idle. Light forms gain from thermals and gliding, never from helpless drift.
- [ ] **CI performance gates (Phase 6 exit criterion):** a physics benchmark (per-tier ms/step), a bundle-size check (initial, wasm, total gzip) and a CPU-throttled (6x) browser frame test gating JS frame time, draw calls and triangles, all driven by one `perf-budget.json`. The phase is not done while any gate fails.
- [ ] Universal Node Buoyancy System:
  - Per-body node buoyancy calculation: `accel = (g / relative_density) * submerged_fraction` (capped at max buoyancy multiplier)
  - Surface water level queries supporting variable water heights, planar lakes, and river channels
- [ ] Quadratic Water Drag & Planing Lift System:
  - Quadratic hydrodynamic drag relative to local water flow velocity: `F_drag = 0.5 * rho * v_rel^2 * Cd * A`
  - Planing hydrodynamic lift active above ~3.5 m/s horizontal water velocity, allowing dense forms (Oobleck, Aerolite) to skim and plane over water while sinking at low speeds
- [ ] Aerodynamic Drag & Terminal Velocity Model:
  - Cross-sectional air drag model producing terminal velocity `v_term = sqrt(g * m / kd)`
  - Naturally differentiates light/wide forms (Aether Bubble, Mist) falling slowly without artificial gravity tweaks
- [ ] Atmospheric Currents & Vector Fields:
  - Volumetric force volumes for thermal updrafts, downdrafts, and gale corridors
  - Current acceleration model: `a = (u - v) * area_coeff * k / mass`
  - Acceleration inversely proportional to mass; wind force divided by mass
- [ ] Per-Form Bounce, Universal Water Movement and Aerolite Lift Magic (see "Form Identity" above), all data-driven
- [ ] Detached Jump Impulse System:
  - Jump impulse calculation scaling weakly with mass (`J_jump ~ m^0.35`)
  - Anti-grab guard ensuring rising bodies are never clamped or snapped to vertical walls or surface colliders while ascending or during the first ~0.5 s of airtime
- [ ] Rocket Equation Water Jet Propulsion:
  - Mass-depleting jet thrust: `a_thrust = v_e * mdot / (1.0 + 0.8 * ballast)`
  - Thrust acceleration increases dynamically as Dewdrop expels ballast mass
- [ ] Rigid Dynamic Props & Mass-Based Impulse Collisions:
  - Buoyant wooden crates (density 0.6, naturally floats) and sinking boulders (density 2.5, sinks to lake bed)
  - Mass-based impulse collision resolution between creatures and props
  - Anchored state override: Obsidian anchor renders creature immovable (infinite effective mass)
- [ ] Unit & Simulation Tests:
  - Physics unit test suite covering buoyancy, planing thresholds, terminal velocities, and current accelerations in `@sim`

**Acceptance Tests:**
- [ ] Buoyancy differentiates forms accurately: Bubble (density 0.25) and Aerolite (density 0.55) float naturally; Oobleck (density 1.12), Geode (density 2.6), and Obsidian (density 5.0) sink when stationary.
- [ ] Planing lift allows Oobleck and Aerolite to skim on water above 3.5 m/s, sinking within 0.8 s once velocity drops below threshold.
- [ ] Terminal velocities match `sqrt(g * m / kd)` within 5% tolerance across all forms without altering gravity constants.
- [ ] Updrafts and gales accelerate bodies inversely proportional to mass; Obsidian (mass 9.0) resists gale drift while Bubble (mass 0.4) is carried rapidly.
- [ ] Jumps cannot be snagged by vertical colliders for the first 0.5 s of airtime.
- [ ] Restitution ordering holds: Oobleck > dry Dewdrop > Bubble; a full-ballast Dewdrop does not bounce and splats.
- [ ] No form glides while submerged; every form can swim (dense forms walk the lakebed) and can leave the water.
- [ ] Aerolite is carried by updrafts and thermals at an air-creature rate while its mass and collisions stay those of stone.
- [ ] Water jet thrust increases measurably over time as Dewdrop ballast mass decreases following the rocket equation.
- [ ] Crates float in water and get pushed by creature impulses; anchored Obsidian cannot be displaced by colliding boulders or crates.

**Estimated Time**: 5-7 days

---

### Phase 6b: Loop Slice (the game, with three forms)
**Goal**: Prove the game loop with one form per family before building the rest: explore, harvest, craft, build, biomes. The three slice forms are proposed as Oobleck, Zephyr and Geode (confirm).

**Deliverables:**
- [ ] Bounded island with biomes and weather that affect movement, not just colour
- [ ] Harvesting, inventory and crafting
- [ ] Modular building with roof cutaway
- [ ] Every slice form can collect, craft and build; forms differ only by advantages, never disadvantages
- [ ] Local save and load
- [ ] Runs inside the CI performance budget on the mobile tier

**Acceptance Tests:**
- [ ] A new player can harvest, craft a part and place it with each of the three forms
- [ ] No form is blocked from any loop action
- [ ] CI performance gates stay green

**Playable result**: a short, complete session: arrive, gather, craft, build a small shelter, save.

**Estimated Time**: 7-10 days

---

### Phase 7: Resource Tanks & Fairness Systems
**Goal**: Establish the deterministic fairness and resource management framework where every form ability is governed by physical tanks, strict cooldowns, and the key-release lockout rule.

**Deliverables:**
- [ ] Universal Fairness Lockout State Machine:
  - Core resource controller: when any resource tank reaches 0, the associated ability enters `Exhausted` state
  - Strict fairness rule: an exhausted ability remains completely locked from refilling or re-triggering until the player physically releases the activating input key (`J`, `K`, or `Space`)
- [ ] Dewdrop Ballast Tank:
  - Dynamic ballast resource (0.0 to 1.0) governing total mass (`1.2 + 0.8 * ballast`) and density (`0.8 + 0.19 * ballast`)
  - Depletion rate: empties completely in ~2.5 s of continuous jet propulsion (`dm/dt = 0.4 / s`)
  - Refill condition: refills exclusively when submerged in water bodies (`+0.5 / s`); dry land refills are strictly barred
- [ ] Aether Bubble Air Tank:
  - Discrete air resource (0.0 to 1.0)
  - Inflate tap cost: 0.35 air per tap for momentary vertical lift; 0.6 s cooldown lockout between taps
  - Atmospheric recharge: passive ambient refill rate of 0.12 / s
- [ ] Wisp Shared Breath Tank:
  - Unified breath tank (100.0 max capacity) shared across all Wisp forms and abilities:
    - Mist phase (`J` hold): ~8 s budget (12.5 breath/s drain)
    - Zephyr gust dash (`K` hold): ~5 s budget (20.0 breath/s drain)
    - Lantern hard-light condense (`K` hold): ~8 s budget (12.5 breath/s drain)
    - Wisp Space-rise: 20.0 breath/s drain
  - Ground replenishment: refills at +25.0 breath/s when grounded or hovering near water
  - Fairness override: breath replenishment is strictly paused while ANY wisp ability key is held active
- [ ] Geode Boost Capacitor:
  - Kinetic acceleration boost energy (100.0 max capacity, ~5 s sustained boost)
  - Refill condition: boost charge will NOT begin refilling until creature linear velocity returns to base rolling speed (< 6.0 m/s)
  - Acceleration-only boost: continuous forward acceleration without artificial speed caps
- [ ] Obsidian Resolve Tank:
  - Gravitational anchor resolve (100.0 max capacity, ~5 s continuous anchor duration)
  - Forced un-anchor upon resolve depletion; recharge starts only after releasing `J` (+25.0 / s)
- [ ] Unit & System Tests:
  - Automated tests validating drain rates, refill rates, lockout transitions, and key-release re-arming

**Acceptance Tests:**
- [ ] Holding an ability key after resource exhaustion keeps the ability locked; no recharge occurs until key is released.
- [ ] Dewdrop jet exhausts in 2.5 s +/- 0.1 s; ballast does not refill on dry land, only refilling when submerged in water.
- [ ] Bubble inflate consumes exactly 0.35 air, enforces 0.6 s lockout, and passively regenerates at 0.12/s.
- [ ] Wisp abilities (Mist, Zephyr, Lantern, Space-rise) all drain from the same shared breath pool; ground replenishment is suspended while keys are held.
- [ ] Geode boost lockout prevents recharge as long as creature moves above base speed.
- [ ] Obsidian anchor lasts ~5 s max, then forces un-anchor if key is held; releasing key restores resolve.

**Estimated Time**: 4-5 days

---

### Phase 8: Proving Grounds (dev-only test level inside the game)
**Goal**: Build the permanent, dev-only "Proving Grounds" verification level inside the game (separate from the public tester build) featuring environmental obstacle zones that rigorously exercise and validate all 9 forms and their 2 to 4 abilities, complete with real-time telemetry and an interactive ability checklist.

**Deliverables:**
- [ ] Carved Lake with Solid Floor:
  - Deep water basin (30m x 20m, 8m depth) with solid floor
  - Exercises deep sinking (Lantern, Obsidian, Boulders) vs surface floating (Bubble, Aerolite, Crates)
- [ ] Flowing River Canal:
  - 40m x 6m canal with calibrated horizontal flow velocity (4 m/s)
  - Tests water drag, planing skim against flow, upstream swimming, and Dewdrop ballast re-soaking
- [ ] Narrow Squeeze Grates:
  - Solid rock barriers perforated by narrow grates (0.5m clearance)
  - Validates Oobleck soft-body squeezing under pressure while blocking rigid forms
- [ ] Spectral Pressure Plate & Heavy Gate:
  - Heavy mechanical gate with locked collision
  - Pressure plate requiring high mass (>8 kg, satisfied by Obsidian or rolled boulders) to open
  - Gate allows Mist form to phase directly through via `J` hold without triggering plate
- [ ] Gale Corridor & Atmospheric Ravine:
  - Gale wind tunnel with 15 m/s continuous headwind to test mass-based wind resistance and Zephyr prop shoving
  - Deep vertical ravine (15m depth) featuring a central thermal updraft (+8 m/s), localized updraft vent (+12 m/s), and downdraft vent (-10 m/s)
- [ ] Light-Solidified Spectral Stairs:
  - Semi-transparent ethereal staircase leading out of the ravine
  - Colliders remain disabled by default; when Lantern condenses hard-light (`K` hold) in proximity, stair steps solidify into physical platforms
- [ ] Interactive Ability Checklist HUD:
  - Dynamic on-screen checklist displaying the 2 to 4 testable abilities of the current active form
  - Automatically detects ability execution events and marks items with green checkmarks
- [ ] Real-Time Physics Telemetry Readout:
  - Live HUD telemetry displaying: Creature, Form, Mass (kg), Relative density (water = 1), Linear Speed (m/s), Submerged Fraction (%), and Active Resource Tank (%)

**Acceptance Tests:**
- [ ] All 9 forms have their specific 2-4 abilities listed and successfully check off on execution in the checklist.
- [ ] Oobleck runs across the carved lake surface when entering at >5 m/s and squeezes through narrow grates.
- [ ] Mist phases through the closed gate; other forms are blocked by solid collision.
- [ ] Lantern illumination hardens spectral stairs, allowing player to ascend ravine; deactivation restores pass-through transparency.
- [ ] Deep lake floor can be reached by Lantern (density up to 2.4) and Obsidian (density 5.0).
- [ ] Telemetry displays exact live values for mass, density, velocity, and submersion matching the data tables.

**Estimated Time**: 5-7 days

---

### Phase 9: Alive Systems, Reactions & Environmental Feedback
**Goal**: Implement dynamic biological and environmental reaction systems that make creatures feel organic and responsive to the physical world rather than static geometric tokens.

**Deliverables:**
- [ ] Procedural Idle Breathing System:
  - Rhythmic ~5% volume/pressure pulsation (~0.8 Hz frequency) driven by sinusoids
  - Applied to soft-body rest shape for Slime, faceted mesh vertex displacement for Stone, and mote cluster breathing for Wisp
- [ ] Hydrodynamic Splash & Dynamic Wake Ripples:
  - Particle splash bursts on water entry scaled non-linearly with impact kinetic energy
  - Continuous expanding circular wake ripples generated behind creatures moving through water surfaces
- [ ] Big Event Emotional Emotes:
  - Procedural micro-reactions for high-intensity physical events:
    - High-velocity bounce: playful squash & stretch with eye blink
    - Water dive: buoyant bubble pop particles
    - Geode boost: kinetic burst streak & excited shake
    - Obsidian anchor/slam: shockwave ring & grim stance
- [ ] Form-Specific Visual Glows:
  - Dynamic emissive intensity scaling with physical state:
    - Geode core glow pulses brighter with stored boost charge
    - Obsidian crystalline fissures flare with molten glow during anchor
    - Lantern light expands in radius and intensity when condensed
- [ ] Procedural Movement Particle Trails:
  - Zephyr: swirling aerodynamic vortex ribbons
  - Lantern: drifting incandescent hard-light embers
  - Dewdrop: misty water spray droplets when jetting
  - Stone / Obsidian: ground dust puffs on hard landings and rolling friction
- [ ] Environmental Reaction System:
  - Creature mesh leaning and directional squash in response to ambient wind vectors and current forces

**Acceptance Tests:**
- [ ] Creature mesh displays continuous 5% breathing pulse while motionless.
- [ ] Entering water at >3 m/s spawns momentum-scaled splash particles and triggers water-surface wake ripples.
- [ ] Geode mesh emission intensifies linearly with boost charge; Obsidian cracks glow brightly during anchor hold.
- [ ] Trails (Zephyr ribbon, Lantern sparks, Dewdrop spray) spawn at creature anchor points during movement and disperse cleanly.
- [ ] Unit tests verify event bus triggers for `onBounce`, `onWaterEntry`, `onBoost`, and `onAnchor`.

**Estimated Time**: 4-5 days

---

### Phase 10: Cosmetics, Body Shapes & Secondary Motion
**Goal**: Implement the cosmetic personalization system featuring exactly three body shapes per creature and spring-physics attachment accessories that maintain strict physical parity.

**Deliverables:**
- [ ] Three Distinct Body Shapes per Creature (Purely Cosmetic):
  - **Slime Shapes**:
    - *Blob*: Classic organic amoeba with dynamic squash and fluid contour
    - *Ball*: Smooth spherical droplet with surface tension wobble
    - *Cube*: Rounded voxel gelatin cube with edge beveling
  - **Stone Shapes**:
    - *Round*: Weathered river boulder with smooth worn facets
    - *Crystal*: Sharp geode cluster with angular geometric crystalline planes
    - *Block*: Chiseled architectural monolith with clean chamfers
  - **Wisp Shapes**:
    - *Cloud*: Soft billowy aerosol puff of dense swirling motes
    - *Fireflies*: Decentralized orbiting constellation of luminous ember nodes
    - *Plume*: Elongated trailing spirit flame with directional head and tail
- [ ] Spring-Physics Attachment System:
  - Attachment sockets for hats, backpacks, and charms
  - 3-DOF damped spring-mass secondary motion simulation for attached accessories
  - Inertial reaction: attachments lag during acceleration, bounce on landing, and sway with body rotation
- [ ] Strict Physical Invariance Assurance:
  - Separation of cosmetic visual geometry from physical collision proxies
  - All 3 body shapes and all cosmetic accessories share identical engine/soft-body collision volumes, mass distributions, and buoyancy metrics
- [ ] Hydrodynamic Secondary Drag:
  - Attachments experience increased damping and trailing hydrodynamic drag when submerged in water

**Acceptance Tests:**
- [ ] Switching between the 3 body shapes for any creature changes visual rendering without altering collision bounds, mass, density, or buoyancy.
- [ ] Attachments (e.g. hat, backpack) lag smoothly behind sudden accelerations using damped spring physics and settle without jitter.
- [ ] Submerging an attachment in water increases damping and causes trailing hydrodynamic lag.
- [ ] Cosmetic state serializes cleanly with form definitions.

**Estimated Time**: 3-4 days

---

### Phase 11: Unified HUD & Universal Control Scheme
**Goal**: Create a unified single-panel HUD overlay and consistent universal control scheme across all 9 forms, eliminating modal confusion.

**Deliverables:**
- [ ] Unified Single-Panel HUD Overlay:
  - Compact, elegant glassmorphic status card positioned in the corner:
    - Active creature identity (1: Slime, 2: Wisp, 3: Stone) and active form name
    - Dynamic resource gauge bar (ballast, air, breath, boost, resolve)
    - Distinct visual lockout indicator (red pulse / lock icon) when resource is exhausted
    - Contextual one-line action hint (e.g., "Hold K to Jet", "Hold J to Anchor", "Hold K to Condense Light")
    - Minimalist key legend displaying primary inputs
- [ ] Universal Control Mapping:
  - `1`, `2`, `3`: Instant switch between Slime, Wisp, and Stone
  - `Z`: Sequential cycling through the 3 forms of the active creature
  - `WASD` / Arrow Keys: Standard omnidirectional horizontal locomotion
  - `Space`: Jump / Rise (costs breath for Wisp, weakly scaled with mass for others)
  - `J`: Primary form action (hold or tap: e.g., Bubble inflate tap, Mist phase hold, Obsidian anchor hold)
  - `K`: Secondary form action (hold: e.g., Dewdrop jet hold, Zephyr dash hold, Lantern condense hold, Geode boost hold, Obsidian slam)
- [ ] Consistent Semantic Guarantees:
  - Keys `J` and `K` are always the primary and secondary ability triggers; `Z` always cycles forms; base locomotion is never rebound
  - Exhausted ability lockout visually signaled on the HUD until key is released
- [ ] Mobile Touch Overlay:
  - Virtual floating joystick for movement
  - Dedicated virtual buttons for Jump, Action J, Action K, Form Cycle (Z), and Creature Selector (1-3)
  - Identical dispatch to ECS input event stream

**Acceptance Tests:**
- [ ] HUD displays active creature, form, resource bar, hint, and key legend in a single unified card.
- [ ] Pressing `Z` cycles through the 3 forms sequentially; pressing `1, 2, 3` swaps creature family instantly.
- [ ] Resource gauge visibly turns red / displays lock icon when exhausted and remains locked until key is released.
- [ ] Action hints update immediately upon form switch to reflect the active form's J and K abilities.
- [ ] Touch buttons fire identical ECS input events as keyboard inputs.

**Estimated Time**: 3-4 days

---

### Phase 12: Stylized Art, Shading & Asset Pipeline
**Goal**: Implement the stylized soft low-poly visual aesthetics and establish a procedural-first asset pipeline supplemented by a strict, manifest-driven CC0 asset fetcher.

**Deliverables:**
- [ ] Stylized Low-Poly Material & Shading:
  - Custom Three.js materials: flat-shaded faceted lighting for terrain, rocks, and wooden props
  - Smooth Gouraud / subsurface scattering approximation for soft creature forms
  - Curated painted pastel color palette
- [ ] Lighting & Post-Processing Stack:
  - Balanced hemisphere ambient light with soft directional sun and shadow mapping
  - Lightweight post-processing pass: gentle edge vignette and soft atmospheric bloom
- [ ] Procedural-First Asset Generators:
  - Code-driven procedural geometry generators for terrain heightfield, rocks, crates, grates, and water planes
  - GPU particle systems for splashes, ripples, dust, embers, and wind ribbons
- [ ] Manifest-Driven CC0 Asset Fetcher (`pnpm assets:fetch`):
  - CLI script driven by `packages/assets/manifest.json`
  - Manifest structure: `{ "id": string, "name": string, "url": string, "license": "CC0", "hash": "sha256:...", "target": string }`
  - Keyless API integration with Poly Haven and verified CC0 repositories
  - Automatic validation: Verifies public domain / CC0 license, checks SHA-256 hash integrity, strips extraneous metadata
  - Strict git exclusion: Downloaded models saved to ignored cache directories; never committed to git

**Acceptance Tests:**
- [ ] Visual scene renders flat-shaded low-poly terrain, smooth creature meshes, pastel sky gradient, soft shadows, and bloom without shader artifacts.
- [ ] Running `pnpm assets:fetch` downloads assets specified in `manifest.json`, validates their SHA-256 hashes, and fails if hash or license mismatch.
- [ ] Downloaded asset binaries are verified to be in `.gitignore` and not tracked by git.
- [ ] All forms render with consistent pastel material color palettes.

**Estimated Time**: 4-5 days

---

### Phase 13: Procedural Audio System
**Goal**: Develop a zero-dependency, procedural Web Audio synthesizer package providing rich, dynamic sound effects and ambient soundscapes without external audio files.

**Deliverables:**
- [ ] Web Audio Procedural Synthesis Engine:
  - Modular audio node graph using native oscillators, biquad filters, gain nodes, and noise buffers
  - Zero external MP3/WAV file dependencies; instant loading and zero footprint impact
- [ ] Form & Ability Audio Synthesizers:
  - Dewdrop Jet: High-pass filtered pink noise with upward resonant pitch glide as ballast drains
  - Bubble Inflate & Pop: Resonant sine sweep chirps with harmonic overtones
  - Mist Phase & Zephyr Dash: Swirling stereo-panned wind whoosh with modulated bandpass filters
  - Lantern Hard-Light: Harmonic crystalline bell hum with shimmering decay
  - Geode Rolling & Boost: Modulated low-frequency rumble scaling with rolling speed; explosive snap on boost
  - Obsidian Anchor & Slam: Deep 45 Hz sub-bass seismic thud and heavy stone impact crunch
- [ ] Environmental & Hydrodynamic Audio:
  - Dynamic low-pass master muffling filter when camera or creature is submerged underwater
  - Impact splash generator scaling pitch and gain with water entry velocity
  - Ambient wind murmur modulating with gale speed and ravine proximity
- [ ] Safe Audio Context Lifecycle:
  - AudioContext auto-suspended until first user gesture (pointerdown/keydown)
  - Fixed audio voice pooling to prevent CPU spikes or node leaks

**Acceptance Tests:**
- [ ] AudioContext initializes cleanly on first user gesture without console warnings.
- [ ] Triggering abilities (jet, phase, dash, condense, boost, anchor) produces distinct synthesized sounds.
- [ ] Water submersion dynamically applies a low-pass filter to master audio.
- [ ] Zero external MP3/WAV files required for core audio; bundle size remains unaffected.

**Estimated Time**: 3-4 days

---

### Phase 14: System Integration, Performance & Release Readiness
**Goal**: Perform full end-to-end integration, performance profiling against 60 FPS budgets on desktop and 30+ FPS on mobile, comprehensive QA testing, and release documentation.

**Deliverables:**
- [ ] End-to-End Traversal & Verification Suites:
  - Automated integration tests exercising complete traversal chains across all 9 forms in the Proving Grounds
  - Verification of ability checkmarks, telemetry output, and resource tank transitions
- [ ] Performance Profiling & Optimization:
  - CPU profiling ensuring soft-body particle solver remains under 2.0 ms per frame
  - Draw call batching and instanced rendering maintaining < 35 draw calls in Proving Grounds
  - Fixed physics tick accumulator preventing spiral of death during frame drops
- [ ] Cross-Platform & Mobile Validation:
  - Full touch control audit on mobile viewports
  - Dynamic resolution scaling and quality presets (Full / Low-Power)
- [ ] Final Documentation & Release Tagging:
  - Production build optimization via Vite and bundle analyzer
  - Complete architectural documentation, control reference, and release notes

**Acceptance Tests:**
- [ ] All unit, integration, and physics tests pass across all packages (>90% code coverage).
- [ ] Stable 60 FPS maintained in Proving Grounds on standard desktop; stable 30+ FPS on mobile viewport.
- [ ] Zero memory leaks detected during continuous 10-minute form switching and ability usage stress test.
- [ ] Production build succeeds with `pnpm build` without errors or warnings.

**Estimated Time**: 4-6 days

---

## Project Risks & Technical Mitigations

### 1. Soft-Body + Rigid Engine Integration
- **Risk**: Coupling soft and rigid bodies (a custom solver, or Jolt soft bodies on mobile) risks penetrations, jitter at pinch points, and impulse instability when heavy rigid props strike soft bodies.
- **Mitigation**: Prefer one engine (Jolt) so soft and rigid share a world; the Phase 6 spike decides. If a custom slime solver wins, use a kinematic proxy: the engine maintains a bounding capsule proxy for broadphase spatial queries and gross collision response, while internal soft-body particles use Position-Based Dynamics (PBD) with sub-stepping (3 sub-steps per tick) and clamped penetration correction. Collisions with dynamic props exchange momentum via centralized mass-weighted impulse distribution.

### 2. Simulation Consistency (cross-device determinism is NOT a goal)
- **Risk**: Floating-point variances across browsers, variable rendering frame rates, and WASM runtime differences can cause physics calculations (buoyancy, planing lift, rocket thrust) to diverge or feel inconsistent across client hardware.
- **Mitigation**: Run all physics and resource systems on a strictly fixed simulation timestep (`dt = 1/60 s`) decoupled from rendering via a fixed accumulator with max sub-step clamping (`maxSubSteps = 3`). Single-player with local saves means bit-identical results across devices are not required; tests use tolerances.

### 3. Mobile Performance & Resource Constraints
- **Risk**: Concurrent execution of soft-body spring relaxation, GPU particle systems (splashes, wakes, dust), post-processing shaders (bloom, vignette), and physics stepping can induce thermal throttling and severe frame drops on mobile devices.
- **Mitigation**: Implement an adaptive quality manager. On mobile/low-power profiles: reduce soft-body lattice resolution, halve particle emission quotas, replace procedural wake mesh deformation with lightweight billboard ripple quads, and bypass bloom post-processing passes.

---

## Current Status

**Phase**: In Progress: Phase 6 (Unified Physics Core & Force Systems)
**Progress**: Phases 1–5 complete. All three base creatures (Slime, Wisp, Stone) integrated into ECS with core physics and visual controllers. v3 roadmap establishes the unified physical rules, nine forms data model, resource fairness tanks, and Proving Grounds test-bed.

| Phase | Status | Tests / Features |
|-------|--------|------------------|
| 1 – Core Architecture | ✅ Complete | 26 passing |
| 2 – Physics Integration | ✅ Complete | 8 passing |
| 3 – Slime (Liquid Form) | ✅ Complete | 14 passing, living jelly physical material & wobble |
| 4 – Wisp (Gas Form) | ✅ Complete | 24 passing, gaseous motes & light emission |
| 5 – Stone (Solid Form) | ✅ Complete | 22 passing, faceted rock, rolling & crystal sail |
| 5b – Nine-Form Data Model | ⏳ Next | Forms as data, shared climb/glide verbs, legacy removal |
| 6 – Unified Physics Core | 🔄 In Progress | Engine spike (Jolt vs custom slime), buoyancy, drag, moor rule, CI perf gates |
| 6b – Loop Slice | ⏳ Planned | Island + biomes, harvest, craft, build, with 3 forms |
| 7 – Resource Tanks & Fairness | ⏳ Planned | Dewdrop ballast, Bubble air, Wisp breath, Geode boost, Obsidian resolve |
| 8 – Proving Grounds Test-Bed | ⏳ Planned | Lake, river, gate, gale, stairs, thermal ravine & telemetry HUD |
| 9 – Alive Systems & Reactions | ⏳ Planned | Breathing pulses, wake ripples, splash effects, emotes & trails |
| 10 – Cosmetics & Body Shapes | ⏳ Planned | 3 shapes per creature, spring-physics attachments |
| 11 – Unified HUD & Controls | ⏳ Planned | Single status panel, consistent J/K/Z/1-3 controls |
| 12 – Stylized Art & Assets | ⏳ Planned | Low-poly NPR shaders, pastel palette, manifest-driven CC0 fetcher |
| 13 – Procedural Audio | ⏳ Planned | Web Audio procedural synthesis engine |
| 14 – Integration & Release | ⏳ Planned | E2E QA tests, performance profiling, production build |
| **Total Tests** | | **94 passing (Phases 1-5)** |

---

## Dependencies Between Phases

- **Phase 5b** depends on Phase 2 and the legacy Phases 3-5
- **Phase 6** depends on Phase 5b
- **Phase 6b** depends on Phase 6 (physics and CI gates)
- **Phase 7** depends on Phase 6 (tanks regulate forces, masses, and ability durations)
- **Phase 8** depends on Phase 6 & 7 (test-bed exercises all 9 forms and resource tanks)
- **Phase 9** depends on Phase 6 & 8 (alive systems react to water, physics events, and environment)
- **Phase 10** depends on Phase 6 & 9 (cosmetics require physics invariance and alive system hooks)
- **Phase 11** depends on Phase 7 & 8 (HUD reflects tanks, forms, checklist, and universal controls)
- **Phase 12** can run in parallel with 8-11 (shaders, lighting, and asset fetcher)
- **Phase 13** depends on Phase 6, 7 & 9 (audio reacts to physics collisions, jet thrust, alive breathing, and water)
- **Phase 14** depends on all previous phases (full verification, benchmarking, release build)

---

## Appendix: Comprehensive Data Tables

### Table A1: The Nine Forms Specification Matrix
All 9 forms are always available. Switch creature family with `1, 2, 3`; cycle forms with `Z`.

| Creature | Form | Mass (kg) | Relative density (water = 1) | Restitution | Primary Ability (`J`) | Secondary Ability (`K`) | Physical Trait / Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Slime** | **Oobleck** | 1.2 | 1.12 | Highest (0.85), the bounce champion | Squeeze through grates (`J` hold) | Firm bounce (`K` hold) | Firm & bouncy; planes on water: lift begins at 3.5 m/s, fully on top above 5 m/s; squeezes narrow slots under pressure. |
| **Slime** | **Dewdrop** | 1.2 + 0.8*B | 0.8 + 0.19*B | 0.6 when dry, falling to 0 (splat) as ballast fills | Soften & absorb impacts (`J`) | Water jet propulsion (`K` hold) | Soft, impact-absorbing; soaks water as ballast (B: 0 to 1); jet follows rocket equation. |
| **Slime** | **Aether Bubble**| 0.4 | 0.25 | Moderate (0.5), floaty: slow, long hops from low gravity | Inflate lift pulse (`J` tap) | Float drift (`K` hold) | Reduced gravity, high air drag, low terminal velocity; buoyant in water; rides thermals. |
| **Wisp** | **Mist** | 0.15 | 0.08 | Low (0.10) | Phase through gates (`J` hold) | Drift whisper (`K` hold) | Gaseous dispersion; hovers naturally over water surfaces; permeable through barred gates. |
| **Wisp** | **Zephyr** | 0.25 | 0.12 | Low (0.20) | Whirl lift pulse (`J`) | Sustained gust dash (`K` hold) | Aerodynamic stream; sustained gust pushes and shoves movable physics props (crates/boulders). |
| **Wisp** | **Lantern** | 0.80 | 0.05 → 2.40 | Moderate (0.30) | Luminescence flare (`J`) | Condense hard-light (`K` hold) | Condenses into hard-light (density rises to 2.4); sinks deeper longer held; solidifies spectral stairs. |
| **Stone** | **Aerolite** | 1.5 | 0.55 | Moderate (0.30) | Pumice hop (`J`) | Skim glide (`K` hold) | Pumice-light rock; density < 1.0 allows floating; skims water surface efficiently at speed. Lift magic: rides updrafts and currents like an air creature, yet is stone. |
| **Stone** | **Geode** | 3.5 | 2.60 | Moderate (0.50) | Roll brake (`J` hold) | Acceleration boost (`K` hold) | Near-zero friction; boost adds pure acceleration without speed cap; glows with boost charge. |
| **Stone** | **Obsidian** | 9.0 | 5.00 | None (0.00) | Immovable anchor (`J` hold) | Ground slam & shove (`K`) | Dense gravity anchor; immovable when anchored; shoves boulders/crates; sinks rapidly. |

*Note: B represents Dewdrop's current ballast resource level (0.0 to 1.0).*

---

### Table A2: Physics Model & Mathematical Formulas

| Physical Phenomenon | Governing Formula | System Description & Parameters |
| :--- | :--- | :--- |
| **Universal Buoyancy** | $a_{\text{buoy}} = \frac{g}{\text{density}} \cdot f_{\text{submerged}}$ | Computed per body node; $g = 9.81\text{ m/s}^2$; capped at $3.0g$ max upward acceleration. |
| **Quadratic Water Drag** | $\vec{F}_{\text{drag}} = \frac{1}{2} \rho_w \|\vec{v}_{\text{rel}}\|^2 C_d A \cdot (-\hat{v}_{\text{rel}})$ | Evaluated relative to local water flow velocity $\vec{v}_{\text{rel}} = \vec{v} - \vec{u}_{\text{water}}$; $\rho_w = 1000\text{ kg/m}^3$. |
| **Planing Lift** | $a_{\text{lift}} = C_L \cdot (\|\vec{v}_h\| - v_{\text{threshold}})^{1.5}$ | Active in water boundary layer ($f_{\text{submerged}} \in [0.1, 0.7]$) when horizontal speed exceeds $v_{\text{threshold}} \approx 3.5\text{ m/s}$. |
| **Aerodynamic Drag** | $\vec{F}_{\text{air}} = \frac{1}{2} \rho_a \|\vec{v}\|^2 k_d A \cdot (-\hat{v})$ | Terminal velocity naturally emerges as $v_{\text{term}} = \sqrt{\frac{g \cdot m}{k_d A}}$; light/wide forms drift slowly. |
| **Atmospheric Currents** | $\vec{a}_{\text{current}} = (\vec{u}_{\text{air}} - \vec{v}) \cdot \frac{A_{\text{coeff}} \cdot k}{m}$ | Drives bodies toward air velocity $\vec{u}_{\text{air}}$ (thermals $+8\text{ m/s}$, downdrafts $-10\text{ m/s}$, gales $15\text{ m/s}$); force scaled by $1/m$. |
| **Rocket Water Jet** | $a_{\text{thrust}} = \frac{v_e \cdot \dot{m}}{1.0 + 0.8 \cdot \text{ballast}}$ | Follows rocket equation; effective exhaust velocity $v_e = 24\text{ m/s}$, mass flow rate $\dot{m} = 0.4\text{ /s}$. Thrust increases as ballast empties. |
| **Detached Jump Guard** | Snap Disabled if $v_y > 0 \lor t_{\text{air}} < 0.5\text{ s}$ | Prevents vertical wall-grabbing or terrain snapping during jump ascent or within the initial 0.5 s airtime. |
| **Rigid Prop Collision** | $\Delta \vec{v}_1 = \frac{-(1 + e)(\vec{v}_{\text{rel}} \cdot \hat{n})}{\frac{1}{m_1} + \frac{1}{m_2}} \frac{\hat{n}}{m_1}$ | Mass-ratio impulse exchange with crates ($m=18\text{ kg}, \rho=0.6$) and boulders ($m=150\text{ kg}, \rho=2.5$). Anchored creature has $m_1 \to \infty$. |

---

### Table A3: Resource Tanks & Fairness Specifications

| Resource Tank | Form / Creature | Capacity | Drain Rate / Cost | Refill Condition & Rate | Fairness Lockout Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ballast Tank** | Slime: Dewdrop | 1.0 (adds 0.8 kg) | Empties in ~2.5 s of jet ($\dot{m} = 0.40\text{ /s}$) | Refills **only** when submerged in water ($+0.50\text{ /s}$). Zero dry refill. | When empty, jet ceases immediately. Lockout remains active until `K` is released. |
| **Air Tank** | Slime: Aether Bubble | 1.0 | Tap `J` costs 0.35 air per lift pulse | Passive ambient recharge ($+0.12\text{ /s}$). 0.6 s cooldown between taps. | If air < 0.35, inflate is locked. Re-arms when air $\ge 0.35$ and cooldown expires. |
| **Breath Tank** (Shared) | Wisp: Mist | 100.0 | Phase hold (`J`): ~8 s budget ($12.5\text{ /s}$) | Ground/water proximity ($+25.0\text{ /s}$). Refill paused while any key held. | When breath hits 0, phase breaks instantly. Lockout until `J` released. |
| **Breath Tank** (Shared) | Wisp: Zephyr | 100.0 | Gust dash (`K`): ~5 s budget ($20.0\text{ /s}$) | Ground/water proximity ($+25.0\text{ /s}$). Refill paused while any key held. | When breath hits 0, dash halts. Lockout until `K` released. |
| **Breath Tank** (Shared) | Wisp: Lantern | 100.0 | Hard-light (`K`): ~8 s budget ($12.5\text{ /s}$) | Ground/water proximity ($+25.0\text{ /s}$). Refill paused while any key held. | When breath hits 0, light de-condenses; creature rises. Lockout until `K` released. |
| **Breath Tank** (Shared) | Wisp: Any Form | 100.0 | Space-rise: $20.0\text{ /s}$ | Ground/water proximity ($+25.0\text{ /s}$). Refill paused while any key held. | Space-rise disabled when breath hits 0. Gentle sink begins. Lockout until `Space` released. |
| **Boost Energy** | Stone: Geode | 100.0 | Boost hold (`K`): 5 s budget ($20.0\text{ /s}$) | Refills ($+20.0\text{ /s}$) **only** after speed decays to base speed ($< 6\text{ m/s}$). | When empty, boost thrust cuts out. Recharge blocked while moving above base speed. |
| **Resolve Tank** | Stone: Obsidian | 100.0 | Anchor hold (`J`): ~5 s budget ($20.0\text{ /s}$) | Continuous recharge ($+25.0\text{ /s}$) once `J` key is released. | Anchor forced release at 0 resolve. Cannot re-anchor until `J` is released and resolve $> 20$. |

---

### Table A4: Proving Grounds Environmental Obstacles & Zones

| Zone / Feature | Dimensions & Properties | Physics Rules Exercised | Required Form / Ability | Success Verification Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **Carved Lake Basin** | 30m x 20m, 8m depth; solid floor; still water ($\rho = 1000$). | Node buoyancy, submersion depth, hydrostatic sinking. | Lantern (condense sink), Obsidian (rapid sink), Bubble/Aerolite (float). | Lantern/Obsidian reach lake floor; Bubble floats on surface; crates bob stably. |
| **Flowing River Canal** | 40m x 6m canal, 3m depth; flow vector $\vec{u} = (4, 0, 0)\text{ m/s}$. | Quadratic water drag, current deflection, planing lift. | Oobleck / Aerolite (>3.5 m/s skim), Dewdrop (ballast soak). | Oobleck skims surface across river without sinking; Dewdrop refills ballast to 100%. |
| **Narrow Grate Slot** | 0.5m horizontal opening in solid stone barrier. | Soft-body deformation, volume preservation under compression. | Slime: Oobleck (`J` squeeze). | Oobleck compresses and passes through slot; rigid stone forms blocked. |
| **Pressure Plate & Gate** | Heavy plate ($>8\text{ kg}$ threshold); 10m mechanical gate. | Mass-weighted activation, ghost collision phase. | Obsidian (stand/slam) OR boulder push OR Mist (`J` phase). | Obsidian weight triggers plate and opens gate; Mist phases directly through closed gate. |
| **Gale Wind Corridor** | 25m enclosed trench; continuous headwind $\vec{u}_{\text{air}} = (-15, 0, 0)\text{ m/s}$. | Atmospheric drag, $F/m$ scaling, aerodynamic prop shove. | Stone forms (high inertia), Zephyr (`K` gust dash to shove props). | Any idle form holds position (moor rule); heavy Stone walks forward through the gale; Zephyr shoves crates forward against wind. |
| **Spectral Staircase** | Semi-transparent ethereal steps rising 12m up ravine. | Proximity-based dynamic collider activation. | Wisp: Lantern (`K` hard-light condense). | Lantern condensation solidifies steps, enabling climbing; release de-solidifies stairs. |
| **Ravine Thermal & Vents** | 15m ravine; central thermal ($+8\text{ m/s}$), updraft ($+12\text{ m/s}$), downdraft ($-10\text{ m/s}$). | Atmospheric vertical velocity transfer, terminal velocity balance. | Slime: Bubble (ride thermal), Wisp: Any (gliding). | Bubble enters thermal at bottom and is carried to ravine crest without input. |
| **Physics Props Arena** | Assortment of floating crates ($\rho=0.6$) and sinking boulders ($\rho=2.5$). | Mass-based impulse collision, rocket jet impulse, anchor immobility. | Dewdrop (jet push), Zephyr (gust shove), Obsidian (anchor immovable). | Crates shoved across floor by water jet; colliding boulder stopped cold by anchored Obsidian. |

---

### Table A5: Cosmetics & Body Shapes Specification

| Creature | Cosmetic Body Shapes (3 per creature) | Attachment Sockets | Spring Physics Configuration | Parity & Collision Rule |
| :--- | :--- | :--- | :--- | :--- |
| **Slime** | 1. **Blob** (fluid organic)<br>2. **Ball** (smooth sphere)<br>3. **Cube** (rounded voxel jelly) | Top (Hat), Back (Backpack) | Stiffness: 120, Damping: 8, Mass: 0.15; high wobble on landing. | Identical soft-body rest volume ($V = 0.00107\text{ m}^3$) and particle lattice proxy. |
| **Stone** | 1. **Round** (weathered cobble)<br>2. **Crystal** (sharp faceted quartz)<br>3. **Block** (quarried monolith) | Crown (Hat), Center (Pouch/Gem) | Stiffness: 300, Damping: 22, Mass: 0.30; firm, low-amplitude vibration. | Identical engine convex hull / cylinder collider proxy ($r = 0.5\text{ m}, h = 1.0\text{ m}$). |
| **Wisp** | 1. **Cloud** (swirling puff)<br>2. **Fireflies** (orbiting swarm)<br>3. **Plume** (trailing comet flame) | Orbit (Floating Crown), Trail (Tassels) | Stiffness: 45, Damping: 4, Mass: 0.05; gentle trailing harmonic drift. | Identical core collision sphere proxy ($r = 0.4\text{ m}$) and light emission origin. |

---

### Table A6: Unified Input & Control Mapping

| Input Key | Slime: Oobleck | Slime: Dewdrop | Slime: Aether Bubble | Wisp: Mist | Wisp: Zephyr | Wisp: Lantern | Stone: Aerolite | Stone: Geode | Stone: Obsidian |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `1` | Switch to Slime | Switch to Slime | Switch to Slime | Switch to Slime | Switch to Slime | Switch to Slime | Switch to Slime | Switch to Slime | Switch to Slime |
| `2` | Switch to Wisp | Switch to Wisp | Switch to Wisp | Switch to Wisp | Switch to Wisp | Switch to Wisp | Switch to Wisp | Switch to Wisp | Switch to Wisp |
| `3` | Switch to Stone | Switch to Stone | Switch to Stone | Switch to Stone | Switch to Stone | Switch to Stone | Switch to Stone | Switch to Stone | Switch to Stone |
| `Z` | Next: Dewdrop | Next: Bubble | Next: Oobleck | Next: Zephyr | Next: Lantern | Next: Mist | Next: Geode | Next: Obsidian | Next: Aerolite |
| `WASD` | Horizontal move | Horizontal move | Horizontal move | Horizontal drift | Horizontal drift | Horizontal drift | Horizontal roll | Low-friction roll | Heavy roll |
| `Space` | Jump (elastic) | Jump (absorb) | Gentle buoyant hop | Space-rise (20 breath/s) | Space-rise (20 breath/s) | Space-rise (20 breath/s) | Pumice leap | Heavy roll hop | Low stone hop |
| `J` (Primary) | Squeeze grate (hold) | Soften impact (hold) | Inflate lift (tap, 0.35 air) | Phase through gate (hold) | Whirlwind lift pulse | Luminescence flare | Pumice hop pulse | Roll brake (hold) | Immovable anchor (hold) |
| `K` (Secondary) | Firm bounce (hold) | Rocket water jet (hold) | Float drift (hold) | Drift whisper (hold) | Sustained gust dash (hold) | Condense hard-light (hold) | Skim glide (hold) | Acceleration boost (hold) | Ground slam & shove |


