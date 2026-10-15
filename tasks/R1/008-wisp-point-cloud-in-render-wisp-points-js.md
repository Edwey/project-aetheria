# R1-008 — Wisp point cloud in render/wisp-points.js
Release: R1 | Depends on: R1-007

GOAL: Move wisp mote rendering (points + core) out of game.js into render/wisp-points.js.

FILES:
- src/render/wisp-points.js
- src/app/game.js

READ FIRST:
- src/app/game.js writeWisp(), makePoints()
- src/gameplay/wisp.js mote fields

STEPS:
1. Move writeWisp/makePoints verbatim; keep 96/48 mote counts and size attenuation.
2. Replace game.js calls with the import.
3. Check breath-driven colour still reads from the same state.

DONE WHEN: `npm run build succeeds; wisp looks identical`

DO NOT: no behaviour changes

SIZE: under 150 changed lines.
