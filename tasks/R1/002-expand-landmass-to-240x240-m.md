# R1-002 — Expand landmass to 240x240 m
Release: R1 | Depends on: R1-001

GOAL: Grow the aetheria terrain from A=60 to A=120 (240x240 m) with the same biome functions and stable seeds.

FILES:
- src/gameplay/terrain.js
- tests/unit/terrain-world.test.js

READ FIRST:
- src/gameplay/terrain.js buildAetheria + builder(A)
- docs/WORLD.md hybrid layout

STEPS:
1. Change the aetheria definition to A=120; keep cs=0.5 and seeded rng untouched.
2. Adjust spawn, hut (HUT), tunnels and flora placement that assume A=60 so all stay in-bounds.
3. Update the world tests that hardcode coordinates; keep thresholds identical.
4. Run npm test; flora counts must be stable across builds (same seed => same counts).

DONE WHEN: `npm test shows 50 passed (counts updated, all green)`

DO NOT: no biome redesign, no new dependencies

SIZE: under 150 changed lines.
