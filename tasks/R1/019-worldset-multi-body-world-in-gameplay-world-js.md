# R1-019 — WorldSet multi-body world in gameplay/world.js
Release: R1 | Depends on: R1-002

GOAL: Introduce the R1 WorldSet API (list of terrain bodies, per-body grids, VOID outside) behind the current single landmass.

FILES:
- src/gameplay/world.js
- tests/unit/terrain-world.test.js

READ FIRST:
- docs/WORLD.md WorldSet spec (ground(x,z), bounds, void respawn)
- src/gameplay/terrain.js build() shape

STEPS:
1. Implement createWorldSet Bodies with ground() querying the containing body and VOID + last-safe-ground respawn otherwise.
2. Wrap (do not replace) Terrain.build output so all 50 tests still pass.
3. Add 3 unit tests: containing-body query, VOID outside, respawn position.

DONE WHEN: `npm test shows 53 passed (3 new)`

DO NOT: no sky islands yet (R2), no water (R3)

SIZE: under 150 changed lines.
