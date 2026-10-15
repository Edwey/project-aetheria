# R2-014 — Stone island traversal feel (route, not stats)
Release: R2 | Depends on: R2-007

GOAL: Same as R2-013 for stone: routes and trampolines, never stat changes.

FILES:
- docs/WORLD.md
- src/gameplay/terrain.js

READ FIRST:
- R2-007 reachability results
- stone piton/sail thresholds (frozen)

STEPS:
1. Adjust trampoline placement or bridge anchors if stone routes fail.
2. Re-run reachability; document.
3. Close with no code change if all pass.

DONE WHEN: `npm test shows 64 passed; WORLD.md documents 3 stone routes`

DO NOT: no stone buffs

SIZE: under 150 changed lines.
