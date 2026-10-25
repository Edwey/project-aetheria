# CHARACTERS.md — The Nine Forms, Physics, Controls & Abilities

Aligned with `AETHERIA_MASTER_PLAN.md` v4.

## Overview

Three creature families (Slime, Wisp, Stone), each with three forms (nine total). All forms are always available. Switch family with `1, 2, 3`; cycle forms with `Z`. Tab cycles families.

Forms are data rows, not code. Adding or tuning a form changes a table, never a system.

---

## The Nine Forms

| Family | Form | Identity | J | K |
| --- | --- | --- | --- | --- |
| Slime | Oobleck | Bounce champion. Planes across water at speed. | Hold: squeeze through 0.5 m grates | — |
| Slime | Dewdrop | Bouncy when dry, splats flat when full of water. Soaks up water as ballast. | Hold: release ballast | Hold: water jet |
| Slime | Aether Bubble | Low gravity, slow falls, soft floaty bounces. Rides updrafts. | Tap: inflate for a lift pulse | — |
| Wisp | Mist | Light aerosol that hovers close to surfaces. | Hold: phase through barred gates | — |
| Wisp | Zephyr | Streamlined air. | — | Hold: gust dash that pushes movable props |
| Wisp | Lantern | Floats when loose, condenses into dense hard light to dive. | Hold: condense | Hold: spectral stairs |
| Stone | Aerolite | Pumice. Floats and skims water. Lift magic lets it ride updrafts and thermals while staying stone. | — | — |
| Stone | Geode | Rolling stone with near-zero friction. | Hold: roll brake | Hold: boost (refills at low speed) |
| Stone | Obsidian | Dense, wind-immune, sinks. | Hold: anchor in place | Tap: bounded ground shockwave (moves props, never players or buildings) |

Slots marked — are provisional and tunable. The old melt, spring, condense and diffuse toggles are absorbed into J/K and are not separate keys.

---

## Physics Data

| Form | Stop Time (s) | Mass (kg) |
| --- | --- | --- |
| Oobleck | 0.10 | 1.2 |
| Dewdrop | 0.25 | 1.2 to 2.0 (with ballast) |
| Aether Bubble | 0.20 | 0.4 |
| Mist, Zephyr | 0.20 | 0.3 |
| Lantern | 0.20 | 0.3 (up to 3.3 condensed) |
| Aerolite | 0.06 | 1.5 |
| Geode | 0.05 | 3.5 |
| Obsidian | 0.04 | 9.0 |

---

## Weight, Impact & Pressure Plates

**Impact load formula:**

`impact load = mass × (1 + min(3, v / (g × stop_time)))`

- `v` = downward landing speed (counted above 1.5 m/s for general effects)
- `g` = form's effective gravity (20 m/s² × gravity scale)
- `stop_time` = how long the form takes to stop
- Factor capped at 4× resting weight; load lasts ~0.35 s

**Pressure plate rule:** needs 1.7 kg load, stays pressed 3 s after load ends. Impact only counts toward plate when landing speed ≥ 4 m/s (~0.8 m drop). Stomp (F) gives flat 3× pulse; plate uses whichever is larger.

| Form | Standing | Landing at 4 m/s |
| --- | --- | --- |
| Oobleck | 1.2 — no | 3.6 — yes |
| Dewdrop (dry) | 1.2 — no | 2.2 — yes |
| Dewdrop (full) | 2.0 — yes | yes |
| Aether Bubble | 0.4 — no | 1.5 — no (capped at 1.6, can never press) |
| Mist, Zephyr, Lantern (loose) | 0.3 — no | no (capped at 1.2) |
| Lantern (>half condensed) | 1.7+ — yes | yes |
| Aerolite | 1.5 — no | 6.0 — yes |
| Geode, Obsidian | yes | yes |

Light forms can open a gate by pushing a prop of mass ≥2 onto the plate.

**Acceptance tests:** drop from 0.5 m must NOT press plate for Oobleck, dry Dewdrop, or Aerolite; drop from 1.0 m must; Bubble and uncondensed Mist/Zephyr/Lantern never press by any drop; no load exceeds 4× resting weight.

---

## Controls

| Input | Action |
| --- | --- |
| W A S D | Camera-relative movement |
| Space | Contextual up: jump (hold to charge, release), wisp rise, swim stroke |
| Left Shift (hold) | Sprint, free of any cost, momentum kept on release |
| G (hold) | Ride the wind |
| J / K | Two ability slots of the active form |
| F | Stomp, pound or down-gust (every family) |
| E | Interact (opens crafting at workbench) |
| B | Build mode; Enter places, Backspace removes, X rotates |
| Ctrl+Z / Ctrl+Y | Undo/redo build step (20 steps) |
| 1 2 3 | Pick a family, return to last form used in it |
| Z | Cycle forms of the family. Tab cycles families. |
| 4–8, H | Emotes and heart |
| Right mouse drag, Q | Orbit camera, turn 90° (Shift+Q reverses). Wheel zooms. |
| Esc, R | Menu, return to last safe ground |

All keys remappable with conflict warnings and restore-defaults. Sprint: hold or toggle. HUD form list is a clickable shortcut.

---

## Universal Movement Rules

All nine forms support the same core movement verbs:

1. **Walk** — camera-relative omnidirectional movement
2. **Jump** — hold Space to charge, release to jump. Variable height.
3. **Climb** — universal wall navigation
4. **Glide** — air resistance creates steady descent
5. **Collect** — items fly to you when near
6. **Craft** — pocket items anywhere, workbench items at bench
7. **Build** — B toggles build mode
8. **Swim** — WASD paddles, Space strokes upward

### Form Switching
- Instant and safe. If new shape doesn't fit, switch refused with outline flash. No teleporting.
- Speed kept across the switch.

### Moor Rule
- No input + on ground = not pushed by wind. Light forms gain from thermals/gliding, never from helpless drift. Obsidian is wind-immune.

### Water Rules (submerged 8%+)
- Gliding off for every form; swimming takes over.
- WASD paddles, Space strokes upward (capped 3 m/s).
- Dense forms sink and walk lakebed; can jump from it. Obsidian doesn't stroke upward.
- Bounce off while submerged.
- Planing (Oobleck, Aerolite) is a speed effect above 3.5 m/s, not glide.
- Gas forms hover over the surface by their own ability.

### Aerolite Lift Magic
- Stone body (mass 1.5 kg, stone drag, rigid collisions) but air-creature current coupling.
- Updrafts, thermals, downdrafts, and wind carry it via dedicated coefficient instead of 1/mass.
- Sparkles in thermals.

### Obstructed Spaces & Recovery
- Never create a soft-lock.
- Respawn: 0.5 s fade to last safe ground, no inventory loss.

---

## Tuning Defaults

| Parameter | Start Value |
| --- | --- |
| Oobleck bounce | restitution 0.85, bounce from 1.5 m/s impact |
| Dewdrop | bounce 0.7 × (1 − splat); splat = smoothstep(0.45, 0.85, ballast); mass 1.2–2.0 kg |
| Aether Bubble | gravity 0.35g, terminal fall −4.0 m/s, bounce 0.55 |
| Aerolite | relative density 0.55, updraft coupling at air-creature rate, bounce 0.3 |
| Geode | rolling friction ≤0.02; boost refills +20/s below 6 m/s; no speed clamp |
| Obsidian | shockwave radius 3 m, min distance 0.5 m, bounded impulse |
| Sprint | ~1.45× top speed, no stamina |
| Water | gate 8% submerged; paddle 9 m/s² (7 Lantern/Geode, 5 Obsidian); stroke cap 3 m/s |
| Planing | lift from 3.5 m/s, full by 5 m/s |
| Wisp breath | pool 100; refill +25/s on/near ground/water; Mist 12.5/s, Zephyr dash 20/s, Lantern stairs 12.5/s |
| Pressure plate | 1.7 kg, impact from 4 m/s, pressed 3 s |
| Feel | coyote 100 ms, buffer 100 ms, corner nudge 0.1 m |
| Respawn | 0.5 s fade, last safe ground |
| Building | grid 0.5/1.0 m, stilts to 3.0 m, undo 20 steps, dismantle 75% |
| Ditches | depth 0.3 m, 1 m cells |
| World | day 24 min, crossing ~90 s, offline growth cap 72 h |
| Particles | cap per emitter by preset (start 150 Low, 400 High) |
