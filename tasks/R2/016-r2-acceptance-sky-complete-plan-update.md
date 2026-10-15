# R2-016 — R2 acceptance: sky complete + PLAN update
Release: R2 | Depends on: R2-008, R2-015

GOAL: Prove R2 exit criteria: 3 islands, thermals, trampolines, bridges, void respawn, all-forms reachability, budgets intact.

FILES:
- docs/PLAN.md
- docs/WORLD.md

READ FIRST:
- docs/PLAN.md R2 acceptance list
- renderer.info draw calls + tris in dev

STEPS:
1. Verify every R2 acceptance bullet in a live session; record results in PLAN.md.
2. Confirm budgets (draw calls, tris, JS gzip, models) still green via assets:check.
3. Flip R2 to Complete.

DONE WHEN: `docs/PLAN.md marks R2 Complete; npm test shows 64 passed`

DO NOT: no scope creep into water (R3)

SIZE: under 150 changed lines.
