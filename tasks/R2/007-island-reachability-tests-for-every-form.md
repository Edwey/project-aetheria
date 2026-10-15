# R2-007 — Island reachability tests for every form
Release: R2 | Depends on: R2-003, R2-004, R2-005

GOAL: Prove all 3 islands reachable by slime, wisp and stone via thermals/trampolines/glide/bridges.

FILES:
- tests/unit/terrain-world.test.js
- src/gameplay/env.js

READ FIRST:
- R2-003 thermal columns + R2-004 trampoline power
- tests/unit/_harness.js settledSlime + wispInp

STEPS:
1. Script per-form ascents: slime (thermal ride + glide), wisp (rise + float), stone (trampoline + sail).
2. Assert each form lands (grounded) on each island top within the sim budget.
3. Record routes in docs/WORLD.md reachability table.

DONE WHEN: `npm test shows 63 passed (3 new reachability tests)`

DO NOT: no weakening thermals/trampolines to force one route

SIZE: under 150 changed lines.
