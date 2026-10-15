# R2-015 — Slime island traversal feel (route, not stats)
Release: R2 | Depends on: R2-007

GOAL: Same as R2-013 for slime: thermals and glide lines, never stat changes.

FILES:
- docs/WORLD.md
- src/gameplay/env.js

READ FIRST:
- R2-007 reachability results
- slime glide cap -2.2 (frozen)

STEPS:
1. Tune thermal positions only; re-run reachability.
2. Document the three slime routes.

DONE WHEN: `npm test shows 64 passed; WORLD.md documents 3 slime routes`

DO NOT: no slime buffs

SIZE: under 150 changed lines.
