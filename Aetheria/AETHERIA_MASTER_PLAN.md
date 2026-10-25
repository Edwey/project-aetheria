# Aetheria: Master Plan v4

Date: 24 October 2026. Platform: desktop browser only. This is one merged document. It replaces the two-part v3.1 file, the earlier v2 write-up and the older canonical drafts, so there is no Part A and Part B any more. Section 3 lists every decision made in this version. Section 17 lists what changed from v3.1.

**Rule for every choice:** pick the simplest approach that works, prove it in a small spike, and cut a feature before cutting quality.

## 1. The game in one paragraph

Aetheria is a cozy, isometric, low-poly sandbox on one connected island. You play one of nine permanent forms in three families (Slime, Wisp, Stone). Each form moves differently because of its physics: bounce, buoyancy, air, weight, momentum. You explore, gather, craft, build a home, redirect water, grow plants and befriend gentle wildlife. There is no combat, no hunger, no timers and no way to permanently break a save. Free to play, donations only, no ads, no account.

## 2. Pillars and non-goals

**Pillars**

1. Nine forms, nine identities. Each form is a real choice, not a skin.
2. One connected world. No form locks a region; a form can make a route faster, never the only way.
3. Physics with purpose. Weight, buoyancy, air and momentum create play that is readable and forgiving.
4. Everyone can do everything. All nine forms can walk, jump, climb, glide, collect, craft, build and swim. Forms differ by advantages, never handicaps.
5. Alive in the first ten seconds. Every action answers with motion, a visual and a sound.
6. Cozy and safe. No death, no decay, no soft-locks, no lost work.

**Non-goals for the first solo release:** combat, PvP, economy, phone or tablet support, co-op, a modding platform, a desktop wrapper, trading, cloud sync, a WebGPU requirement, hunger, tool breakage, structural collapse.

## 3. Decisions made in this version

| Topic | Decision |
| --- | --- |
| Slime physics | Target design is a rigid proxy collider with a visual-only jelly lattice. The prototype's soft-body solver stays as the feel reference until the Phase 0 spike (section 12) settles it. |
| Physics engine | Jolt is a candidate, not a commitment. The spike also tests a custom sphere-versus-heightfield collider, which may be enough and would remove the WASM dependency. |
| Biomes | Four regions, mapped onto the built biomes (section 8.1). The older built names are retired as display names. |
| Coyote time | 100 ms default (the plan said 80, the build has about 120). Re-tune in playtests. |
| Respawn | 0.5 s fade to the last safe ground, no inventory loss. |
| Dewdrop J | Release ballast: hold to dump soaked water and lose weight. This ties Dewdrop to the plate puzzles. |
| Legacy M and C toggles | Retired. Their effects live inside each form's J and K (section 5.1). No legacy toggles in v1.0. |
| Pressure plate | Reads weight and impact. A landing only counts above 4 m/s (about a 0.8 m drop). See section 7. |
| Default start | New players start on the island with a short no-text onboarding. The Proving Grounds stays as a developer level. |
| Import | Staged and validated; it never overwrites silently (section 13). |
| Long-term hook | Discovery log and form-specific collectibles move from should-have to demo scope (section 11). |
| Mobile | Desktop only. The dormant touch UI is deleted. |
| First task | Measure the real test computer before adding features (section 4). |

## 4. Platform and hardware floor

| Item | Decision |
| --- | --- |
| Browsers | Current Chrome, Edge, Firefox. Safari desktop best effort, tested before release. |
| Graphics | WebGL 2. |
| Test computer | A separate machine, not the developer's PC. Its specs are unknown, so the baseline laptop below stands in. Find them with `chrome://gpu` and Settings, System, About, and record them in Phase 0. Every performance claim is judged on this machine. |
| Frame rate | 60 FPS in the Balanced preset as the goal. The Low preset must hold 30 or better. |
| Offline | Works after first load where the browser allows it (service worker cache). |
| Hosting | Static files on a free CDN host. Check the free-tier terms for a donation-supported game before choosing. |

**Baseline laptop (assumed until measured):** 2 to 4 cores (Core i3 or i5 class, laptop power limits), 4 to 8 GB RAM, Intel integrated graphics (UHD 620 or Iris Xe class), 1366x768 or 1920x1080, Windows 10 or 11, Chrome or Edge, often on battery.

Design rules that follow: fill rate is the first limit, not triangles; Balanced renders at 0.85 to 1.0 scale and Low at 0.75 with pixel ratio capped at 1.0; one cheap shadow map from Medium up and blob shadows on Low; no post-processing chain; the interface works at 1366x768 without scrolling; about 4 ms simulation and 4 ms render submission per 16.7 ms frame; under about 400 MB tab memory; an optional 30 FPS battery cap; rendering pauses when the tab is hidden.

## 5. The nine forms

Forms are data rows, not code. Adding or tuning a form changes a table, never a system.

### 5.1 Roster and abilities

| Family | Form | Identity | J | K |
| --- | --- | --- | --- | --- |
| Slime | Oobleck | Bounce champion. Planes across water at speed. | Hold: squeeze through 0.5 m grates | none yet |
| Slime | Dewdrop | Bouncy when dry, splats flat when full of water. Soaks up water as ballast. | Hold: release ballast | Hold: water jet |
| Slime | Aether Bubble | Low gravity, slow falls, soft floaty bounces. Rides updrafts. | Tap: inflate for a lift pulse | none yet |
| Wisp | Mist | Light aerosol that hovers close to surfaces. | Hold: phase through barred gates | none yet |
| Wisp | Zephyr | Streamlined air. | none yet | Hold: gust dash that pushes movable props |
| Wisp | Lantern | Floats when loose, condenses into dense hard light to dive. | Hold: condense | Hold: spectral stairs |
| Stone | Aerolite | Pumice. Floats and skims water. Lift magic lets it ride updrafts and thermals while staying stone. | none yet | none yet |
| Stone | Geode | Rolling stone with near-zero friction. | Hold: roll brake | Hold: boost, refilled at low speed |
| Stone | Obsidian | Dense, wind-immune, sinks. | Hold: anchor in place | Tap: bounded ground shockwave that moves props, never players or buildings |

Slots marked none yet are provisional and tunable. The old melt, spring, condense and diffuse toggles are absorbed into these slots and are not separate keys.

### 5.2 Controls

| Input | Action |
| --- | --- |
| W A S D | Camera-relative movement |
| Space | Contextual up: jump (hold to charge, release), wisp rise, swim stroke |
| Left Shift (hold) | Sprint, free of any cost, momentum kept on release |
| G (hold) | Ride the wind |
| J / K | The two ability slots of the active form |
| F | Stomp, pound or down-gust (every family) |
| E | Interact (opens crafting at a workbench) |
| B | Build mode; Enter places, Backspace removes, X rotates |
| Ctrl+Z / Ctrl+Y | Undo or redo a build step (20 steps) |
| 1 2 3 | Pick a family and return to the last form used in it |
| Z | Cycle the three forms of the family. Tab cycles families. |
| 4 to 8, H | Emotes and heart |
| Right mouse drag, Q | Orbit the camera, turn 90 degrees (Shift+Q reverses). Wheel zooms. |
| Esc, R | Menu, return to last safe ground |

All keys are remappable with conflict warnings and a restore-defaults button. Sprint can be hold or toggle. The HUD form list is a clickable shortcut.

## 6. Universal rules for all forms

- **Verbs:** walk, jump, climb, glide, collect, craft, build, swim.
- **Form switching** is instant and safe. If the new shape does not fit, the switch is refused with a small outline flash, with no teleporting. Speed is kept across the switch.
- **Moor rule:** with no input and standing on ground, nothing is pushed by wind. Light forms gain from thermals and gliding, never from helpless drift. Obsidian is wind-immune.
- **Water (submerged 8% or more):** gliding is off for every form and swimming takes over. WASD paddles, Space strokes upward (capped at 3 m/s). Dense forms sink and walk the lakebed and can jump from it; Obsidian does not stroke upward. Bounce is off while submerged. Planing (Oobleck, Aerolite) is a speed effect, not glide. Gas forms hover over the surface as their own ability.
- **Obstructed spaces and recovery** never create a soft-lock.

## 7. Weight, impact and pressure plates

**Real physics:** weight does not change with height. What height changes is the impact. A body falling from height h lands at v = sqrt(2 g h), and the average force on stopping is about m g + m v / dt, where dt is the stop time. A harder body or surface stops faster and spikes higher. Air drag caps the speed, so the force stops growing past a certain height.

**Game rule (data-driven, all forms):**

`impact load = mass x (1 + min(3, v / (g x stop_time)))`

`v` is the downward landing speed (only counted above 1.5 m/s for general effects), `g` is the form's effective gravity (20 m/s^2 times its gravity scale), and `stop_time` is how long that form takes to stop. The factor is capped at 4x resting weight and the load lasts about 0.35 s.

| Form | Stop time (s) | Mass (kg) |
| --- | --- | --- |
| Oobleck | 0.10 | 1.2 |
| Dewdrop | 0.25 | 1.2 to 2.0 with ballast |
| Aether Bubble | 0.20 | 0.4 |
| Mist, Zephyr | 0.20 | 0.3 |
| Lantern | 0.20 | 0.3, up to 3.3 condensed |
| Aerolite | 0.06 | 1.5 |
| Geode | 0.05 | 3.5 |
| Obsidian | 0.04 | 9.0 |

**Pressure plate rule (fix in this version):** the plate needs 1.7 kg of load and stays pressed for 3 s after the load ends. Impact only counts toward the plate when the landing speed is at least 4 m/s, which is about a 0.8 m drop. Without this minimum, any hop above 1.5 m/s presses the plate for Oobleck, Aerolite, Geode and Obsidian, and the height puzzle disappears. A stomp (F) still gives a flat 3x pulse; the plate uses whichever of the two is larger.

| Form | Standing | Landing at 4 m/s |
| --- | --- | --- |
| Oobleck | 1.2 no | 3.6 yes |
| Dewdrop, dry | 1.2 no | 2.2 yes |
| Dewdrop, full of water | 2.0 yes | yes |
| Aether Bubble | 0.4 no | 1.5 no, and capped at 1.6 so it can never press |
| Mist, Zephyr, Lantern loose | 0.3 no | no (capped at 1.2) |
| Lantern, over half condensed | 1.7 or more, yes | yes |
| Aerolite | 1.5 no | 6.0 yes |
| Geode, Obsidian | yes | yes |

Light forms can still open a gate by pushing a prop of mass 2 or more onto the plate. The same impact value also drives the strength of Obsidian's shockwave, camera shake, hit-stop, squash depth and the size of dust and splash effects.

**Acceptance tests:** a drop from 0.5 m must not press the plate for Oobleck, Dewdrop (dry) or Aerolite; a drop from 1.0 m must; Bubble and uncondensed Mist, Zephyr and Lantern never press it by any drop; no load exceeds 4x resting weight.

## 8. World

### 8.1 The island and its four regions

One compact, continuous island. A sprint across takes roughly 90 seconds (a tuning target). Everything is open from minute one. Every region and main route works for every family, through different physics paths where needed.

| Region (display name) | Built biome it uses | Role |
| --- | --- | --- |
| Verdant Refuge | Lush Plains | Friendly hub with a clear home landmark. Crafting, storage and comfort. Useful, never required. |
| Wildwood | Mystic Grove | Gathering, gentle wildlife, sheltered routes, soil. |
| Waterworn Basin | Frostpeak Taiga | Snowmelt streams feed ponds, ditches and diving. Home of the water and digging system. |
| Windcarved Heights | Sunstone Dunes | Hot sand makes natural thermals. Gliding, wind, sand traction and momentum routes. |

This gives the water biome the plan was missing without adding a fifth region. Each region needs one authored landmark, one shortcut and one safe resting point. Supporting content is procedural.

### 8.2 Terrain and the hybrid grid

A chunked heightfield rendered as flat-shaded low-poly geometry with baked vertex ambient occlusion. Under it sits a flat integer grid of 1 m cells storing soil moisture, crop stage, trench depth and water level.

**Ditches:** digging lowers a cell's trench depth (0.3 m). It does not rebuild the terrain collider. The avatar's ground probe subtracts trench depth, so feet sink in. Water, moisture and visuals read the grid. Rolling props use the flat collider and ignore ditches. This is an explicit Phase 0 experiment: if a rolling Geode visibly floats over a ditch in a way testers notice, give rolling props the same ground-probe offset or add a thin collider strip along trenches. Never rebuild the whole collider.

### 8.3 Water

Water level per grid cell moves downhill in a small flow step (about 4 per second). The active radius around the player (about 24 m) runs at full detail; distant basins keep one summary value and exchange water through fixed weirs. Rain fills reservoirs, trenches carry water, moisture spreads 2 to 3 cells. Buoyancy and swimming read the grid directly. Demo version: one reservoir and one authored trench path.

### 8.4 Weather, air and wildlife

- Clear, wind and rain with smooth transitions. Weather never damages buildings and never forces shelter.
- Thermals are authored upward air fields, concentrated over the Heights, with a few elsewhere. Zephyr, Bubble and Aerolite ride them.
- Five species: frogs, moths, birds, dragonflies, owls. Each has a simple routine and habitat attraction (ponds draw dragonflies, porches draw owls, Lantern draws moths). Trust runs 0 to 100 per species. Companions are a stretch goal. No death or neglect.

### 8.5 Puzzles

Handcrafted landmarks plus physics interactions (weight and impact plates, gates, water routing). Optional hints and a reset always. No puzzle can ruin a save.

## 9. Building, crafting and farming

- **Pieces:** foundations, floors, walls, roofs, stairs, ramps, doors, windows, bridges. Furniture rotates freely and snaps to surfaces. Structural pieces snap to 0.5 m and 1.0 m. Adaptive stilts reach down to 3.0 m. Pieces need support when placed; nothing ever collapses or decays.
- **Undo and redo:** 20 steps, restoring the full cost. **Dismantling** returns a predictable 75%.
- **Crafting:** pocket items (twine, torch, campfire, bowl, workbench) craft anywhere. Building pieces need a workbench within 5 m. Nearby storage supplies crafting; there is no global inventory.
- **Farming:** crops grow from soil moisture and weather. They never die; a dry plant just pauses. Offline growth is computed on load, capped at 72 hours.
- **Progression** comes from recipes, resources, discoveries, convenience and decoration. Never from gated regions, grind or forced quests.
- **Stretch:** copy and paste, mirror, blueprints saved as JSON.

## 10. Presentation

**Camera:** isometric follow camera, default 45 degree yaw and pitch. Right mouse drag orbits (yaw free, pitch limited to about 35 to 55 degrees), wheel zooms. A circular screen-space dither cutaway dissolves trees, roofs and cliffs that block the avatar. Test it in the first playable scene; if it feels cramped, adjust zoom, pitch range and outlines before the world grows.

**Look:** flat-shaded faceted environment, smooth soft creatures. Cheap polish only: baked vertex AO, toon ramp lighting, a thin outline on creatures, rim light and a fake thickness term instead of real subsurface scattering, tinted depth fog, a warm key light with cool shadows. Gradient sky, CSS vignette, additive-sprite bloom. Water uses depth tint, scrolling stripes and baked shoreline foam, with no reflections. A 24-minute day and night cycle with regional palettes. Quality presets Low, Medium, High and Custom with a two-way governor.

**Audio:** all effects and ambience are procedural Web Audio: footsteps by ground type, impacts, abilities, weather, water. Bounce-chain music plays rising scale notes while bounces continue and resets when the chain breaks. Music is the risky part; budget real time and keep the option of a few small sampled loops.

**Interface:** minimal HUD that shows only what the player needs now. Top left menu button and creature name. Left: ability card for the current form and the clickable nine-form list. Top right: biome, weather, wind, clock and one objective. Bottom centre: hotbar, charge-jump bar, and one compact key bar. A question-mark button reveals the full controls and developer numbers. Menu tabs: Creature (selected family only), Craft and build, World, Settings, How to play. Accessibility: reduced motion, flash limits, colour-blind-safe palettes, text and HUD scaling, subtitles, remappable keys.

## 11. Feel, life and the long-term hook

**Rule:** every action answers in motion, visual and sound, and every form has one signature moment worth a six-second clip.

**Must have (demo)**

- Squash and stretch from velocity and impact, and anticipation before jumps.
- 100 ms coyote time, 100 ms input buffer, 0.1 m tangential corner nudge that never adds lift, key-release lockout for exhausted abilities.
- Bounce chain (re-jump within 0.3 s for 10% more power per link, up to 5) with rising notes. A perfect-charge release gives a bonus burst.
- Hit-stop of 2 to 4 frames on heavy impacts, camera look-ahead, shake only on heavy landings.
- Grass bending, water ripples and splashes, a splat flower when a full Dewdrop lands.
- Idle personality (blinks, looks around, yawns after about 10 seconds); tapping the creature always reacts.
- A visible goal on the horizon, and no text walls: a glowing path, a bounce pad that invites a first jump, prompts only after the player has been stuck for several seconds.
- **Discovery log with form-specific collectibles** (moved up from release scope). Each form has a few optional places only it reaches easily, such as a ledge for Bubble, a grate for Oobleck, a gate for Mist. Nothing is required, so no form is a key, but this is the reason to switch forms after 30 minutes.
- Photo mode with one-click screenshot.

**Release:** fading trails and footprints, wildlife reactions, day and night grading, clip recording through the share sheet, form mastery challenges.

**Later:** time trials with ghosts in the Proving Grounds, a daily seed island, shareable seed codes.

**First-minute test:** five non-gamers play with no coaching. At least four reach their first bounce within 20 seconds and say they would keep playing. A separate gamer test checks that bounce pumping and thermal routing show real skill depth.

## 12. Technical architecture

| Layer | Choice |
| --- | --- |
| Language and build | TypeScript (strict), Vite, pnpm, one project with folders |
| Rendering | Three.js, WebGL 2, instanced meshes, vertex colours, few textures |
| ECS | A small library (miniplex or bitECS) for world entities and props only. Hot loops use plain typed arrays. |
| Physics | Behind a `PhysicsWorld` interface. Decided in the Phase 0 spike below. |
| Audio | Raw Web Audio API, zero files |
| Saves | IndexedDB plus browser storage, JSON export |

**Physics spike (Phase 0, 1 to 2 weeks).** Rebuild Oobleck and Dewdrop on a rigid proxy (sphere or capsule collider) with the jelly as a visual-only lattice of about 162 particles skinned in the vertex shader, and compare against the prototype's soft body on three tests:

1. **Bounce:** at least 5 clearly visible bounces from a normal jump at restitution 0.85. The prototype needed a turn-around boost to reach about 15 because the soft body absorbs the rebound.
2. **Tight spaces:** a 0.5 m grate and a narrow gap, repeated 100 times, with no pinching or tunnelling.
3. **Ditch:** a Geode rolls across a trench while the avatar walks through it.

Also test Jolt (character movement, terrain collision, WASM load and speed) against a plain custom sphere-versus-heightfield collider. **Gate:** if testers cannot feel the difference, adopt the proxy. If the soft body is clearly better and stays under 1 ms per step with no pinching, keep it and plan the extra regression tests. Fallback engines: Rapier, or cannon-es for props only.

**Fixed 60 Hz step** with visual interpolation, at most 4 catch-up steps per frame, and the excess discarded after a tab suspension. Phase order each tick: input, ability, motor, physics, contacts, world update, render. Obsidian's anchor uses a kinematic or static body, never infinite mass.

**Code layout:** `core/` (loop, fixed step, input commands, camera), `data/` (forms, recipes, regions, all tuning numbers), `sim/` (movement, abilities, water grid, weather, wildlife, farming), `physics/` (interface and adapter), `render/`, `audio/`, `build/`, `save/`, `ui/`, `dev/` (Proving Grounds, perf hooks). Input is commands, simulation is separate from rendering, and every entity has a stable ID, which keeps a later co-op possible without building networking now.

## 13. Saves, privacy and resilience

- Local-first, multiple named worlds, no account.
- Browser storage is the fast path and IndexedDB mirrors it with three rolling backups (`backup_1` to `backup_3`), written periodically and on page hide. Backups only rotate when the content changed.
- Browser storage can be evicted. Say so plainly and remind players to export.
- **Export and import:** copy and paste a JSON text in Settings (file download only where the host allows it).
- **Staged import (fix in this version):** parse the text, check the version number, check that each stored key is itself valid JSON with the fields the game expects, show a short summary (version, date, world count), write the current save into `backup_1` first, then apply and reload. If any step fails, change nothing and say why. Importing never silently overwrites.
- Versioned schema with validated migrations. Destructive actions (reset, delete world) require explicit confirmation.
- No optional browser permissions. Diagnostics are opt-in only, and the feedback report is a copy-and-send text the player controls.

## 14. Provisional tuning defaults

| Parameter | Start value |
| --- | --- |
| Oobleck bounce | restitution 0.85, bounce from 1.5 m/s impact |
| Dewdrop | bounce 0.7 x (1 - splat); splat = smoothstep(0.45, 0.85, ballast); ballast 1.2 to 2.0 kg |
| Aether Bubble | gravity 0.35 g, terminal fall -4.0 m/s, bounce 0.55 |
| Aerolite | relative density 0.55, updraft coupling at air-creature rate, bounce 0.3 |
| Geode | rolling friction 0.02 or less; boost refills +20/s only below 6 m/s; no speed clamp |
| Obsidian | shockwave radius 3 m, minimum distance 0.5 m, bounded impulse |
| Sprint | about 1.45x top speed, no stamina |
| Water | gate 8% submerged; paddle 9 m/s^2 (7 Lantern and Geode, 5 Obsidian); stroke cap 3 m/s |
| Planing | lift from 3.5 m/s, full by 5 m/s |
| Wisp breath | pool 100; refill +25/s on or within 1.5 m of ground or water; Mist 12.5/s, Zephyr dash 20/s, Lantern stairs 12.5/s |
| Pressure plate | 1.7 kg, impact counts from 4 m/s, stays pressed 3 s |
| Feel | coyote 100 ms, buffer 100 ms, corner nudge 0.1 m |
| Respawn | 0.5 s fade, last safe ground |
| Building | grid 0.5 and 1.0 m, stilts to 3.0 m, undo 20 steps, dismantle 75% |
| Ditches | depth 0.3 m, 1 m cells |
| World | day 24 min, crossing about 90 s, offline growth cap 72 h |
| Particles | cap per emitter by preset (start 150 Low, 400 High) |

## 15. Performance and testing

**Performance is a ratchet, not a promise.** Starting targets on the test computer, Balanced preset: 60 FPS, about 60 draw calls, about 150k visible triangles, under 400 MB tab memory, initial JS about 700 KB gzip, whole demo download about 4 MB gzip. After the vertical slice, re-baseline and enforce that nothing gets worse than the baseline by more than 10%. Software rendering is never used for frame-rate claims; the first headless test ran at about 2 FPS and proves nothing about speed.

**Degradation order:** distant wildlife, particles and cosmetic effects go first. Physics, form identity, safe traversal and save integrity never degrade. A two-way governor drops quality after about 1 second of slow frames, recovers after about 12 seconds of good frames, and stops recovering after two relapses. It measures CPU and GPU time separately.

**CI gates from the first physics phase:** a physics benchmark (ms per step), a bundle-size check, and a browser frame test with 6x CPU throttling that gates JS frame time, draw calls and triangles (not frames per second).

**Quality gates**

1. Form matrix: each of the nine forms passes a movement and ability test and never blocks a main route.
2. Route matrix: every region and main path has a viable route for each family.
3. Safety: obstructed form switches, respawn, save corruption, interrupted saves, import validation, migrations.
4. Plates and impact: the acceptance tests in section 7.
5. Feel: Oobleck bounces above dry Dewdrop above Bubble; a full Dewdrop splats; no gliding in water; Aerolite rides updrafts and keeps stone collisions.
6. Water and building: no hitches; placement, support, undo and refunds stay consistent.
7. Puzzles have resets and cannot soft-lock.
8. Stress: tab suspension, big builds, many wildlife, large imports, the test computer.
9. Accessibility options and visual sound equivalents; cross-browser smoke tests; the first-minute test.
10. A critical defect blocks release. Never ship a save-corrupting or route-blocking build.

**Not yet tested on the prototype:** real GPU frame rate and draw calls, the physics acceptance numbers on the final build, Firefox and Safari, long sessions and memory, save corruption and recovery, keyboard-only and screen-reader use.

## 16. Roadmap

The prototype already covers much of the old Phases 0 to 2, so those shrink. Effort is in focused working weeks for one developer. The old range was 36 to 57 weeks before the prototype existed; re-estimate after Phase 0 instead of quoting a new number.

| # | Phase | Main work | Exit gate |
| --- | --- | --- | --- |
| 0 | Spikes and measurement | Physics spike (section 12), trench experiment, cutaway shader test, record the real test computer specs and a baseline frame time, CI skeleton | Physics approach decided; baseline measured on the test computer |
| 1 | Foundation | Split the single file into modules, forms as data, input commands, save schema and staged import, island start with no-text onboarding | The island loads, saves and restores; modules build in CI |
| 2 | Signature abilities | J and K for all nine forms (Oobleck, Zephyr, Geode first), merge of the old toggles, water rules, forgiveness toolkit, Proving Grounds, impact and plate tests | Every form passes the form matrix; CI gates green |
| 3 | Loop slice | One bounded area; harvest, craft bench, building with undo, trench and water diversion, HUD, core audio, art pass | The loop is fun, readable and save-safe. **Go or no-go review.** |
| 4 | Public demo (limited preview) | All nine forms, one area, the core loop, discovery log, photo mode, feedback button, hosting | Outside testers finish the first experience; first-minute test passed |
| 5 | Full island | Four regions, routes, landmarks, puzzles | Every region reachable by every family |
| 6 | Living world | Wildlife and trust, farming, weather, full watershed | No hitches in common play |
| 7 | Building and sharing | Breadth, cosmetics, import and export, blueprints | Reliable persistence |
| 8 | Polish | Art, audio, accessibility, hook features | Looks and feels premium on the test computer |
| 9 | Release hardening | Cross-browser, documentation, final optimisation | No critical defects; performance characterised |

**Demo scope:** all nine forms, one area and the core loop (gather, dig and divert water, craft, build, save). If time runs short, ship the six later forms with their data-level physics first and add abilities as each passes the form matrix.

**Cut list (drop in this order if behind):** wild companions; copy, paste and mirror; blueprint sharing; the full watershed (keep the simple distant model); time trials, ghosts, daily seeds and seed codes; clip recording (keep screenshots); adaptive music beyond bounce-chain notes.

**Never cut:** the nine-form identity, safe traversal, save integrity, the no-failure-state rule and the first-minute experience.

**After launch:** co-op (host-authoritative, 2 to 4 players, peaceful), a desktop wrapper if demand justifies it, a mod loader, trading windows and cloud sync.

## 17. Risks, changes and open items

| Risk | Answer |
| --- | --- |
| Soft body pinches, tunnels or costs too much | Phase 0 spike; rigid proxy is the default target |
| Performance unknown on a weak laptop | Measure in Phase 0; ratchet and governor |
| Single file becomes unmaintainable | Split into modules in Phase 1, before new systems |
| Too many controls overwhelm new players | Minimal HUD, onboarding, first-minute test |
| Tab suspension and physics spirals | Fixed step, bounded catch-up, discard the excess |
| Save corruption or eviction | Versioned schema, staged import, 3 backups, export reminders |
| Water too expensive | Active radius and summaries; demo uses one reservoir and one trench |
| Procedural music sounds thin | Budget time; allow a few sampled loops later |
| Scope growth | Cut list, go or no-go after Phase 3, co-op and modding stay out |

**Changes from v3.1:** one merged document with no Part A and Part B; physics target made explicit with a spike gate; biomes mapped so the water region exists; coyote time set to 100 ms; Dewdrop J defined; legacy M and C retired; plate impact minimum added (4 m/s) with acceptance tests; import made staged and validated; discovery log moved into the demo; roadmap rebuilt around the existing prototype; mobile budget and touch UI removed; old Jolt-locked text removed.

**Still open**

1. The real specs of the test computer.
2. The result of the physics spike.
3. Provisional J and K slots marked none yet, to be filled while building Phase 2.
4. The purpose of sand traction on the Heights (needs a play test).
5. Whether the respawn fade of 0.5 s feels abrupt.

**Definition of done.** Demo: a stranger opens the page, plays within seconds, can pick any of the nine forms, bounces within 20 seconds, finishes the loop with no coaching, and sends feedback in one click. Complete solo game: all nine forms, four connected regions with routes for every family, safe movement and water, building and farming, wildlife and puzzles, clear onboarding and accessibility, reliable saves with export and import, measured performance on the test computer, and no critical defects.

> Build the smallest polished proof of Aetheria's promise, validate it, then expand without giving up the nine-form identity, free exploration, creative building, safe traversal or save integrity.
