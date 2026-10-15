# R2-001 — Sky island terrain bodies
Release: R2 | Depends on: R1 (Complete)

GOAL: Add 3 sky-island terrain bodies (~60 m wide, 30-50 m above sea level) to the WorldSet with height grids and bounds.

FILES:
- src/gameplay/terrain.js
- src/gameplay/world.js

READ FIRST:
- src/gameplay/world.js WorldSet API (R1-019)
- docs/WORLD.md sky island spec

STEPS:
1. Add buildSkyIsland(cx, cz, topY, seed) generating a 60 m disc body with its own 0.5 m grid, rim cliffs and flat top.
2. Register 3 islands in the default set with distinct positions; each gets one resource/landmark tag.
3. Colliders join the global 4 m broadphase via the existing grid path.
4. Add 2 unit tests: island ground() inside bounds, VOID between island and land.

DONE WHEN: `npm test shows 55 passed (2 new)`

DO NOT: no island visuals yet (R2-002), no thermals

SIZE: under 150 changed lines.
