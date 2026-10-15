# R1-021 — R1 performance audit + docs + PLAN update
Release: R1 | Depends on: R1-020

GOAL: Prove R1 budgets: draw calls 25-35, visible tris 40-60k, JS gzip <400 KB, Light >=30 FPS governor verified.

FILES:
- docs/PERFORMANCE.md
- docs/PLAN.md

READ FIRST:
- vite build output (gzip sizes)
- docs/DECISIONS.md change-me-if notes

STEPS:
1. Measure draw calls/tris via renderer.info on desktop + Light; record in PERFORMANCE.md.
2. Confirm initial JS gzip <400 KB and models <4 MB; run assets:check.
3. Flip PLAN.md R1 to Complete with acceptance results.

DONE WHEN: `docs/PLAN.md marks R1 Complete; npm test shows 53 passed`

DO NOT: no tuning beyond budgets (R5), no new features

SIZE: under 150 changed lines.
