# R2-013 — Wisp island traversal feel (no physics change)
Release: R2 | Depends on: R2-007

GOAL: If reachability shows wisp struggling, fix with route/thermal placement, never by buffing wisp.

FILES:
- docs/WORLD.md
- src/gameplay/env.js

READ FIRST:
- R2-007 reachability results
- rule 2 (advantages only) + rule 4 (steady wind)

STEPS:
1. If a wisp route fails, move/strengthen a thermal or trampoline (world data).
2. Re-run reachability; document the route change.
3. If all pass, record the three routes and close with no code change.

DONE WHEN: `npm test shows 64 passed; WORLD.md documents 3 wisp routes`

DO NOT: no wisp buffs, no physics.js edits

SIZE: under 150 changed lines.
