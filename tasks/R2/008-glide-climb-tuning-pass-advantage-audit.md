# R2-008 — Glide + climb tuning pass (advantage audit)
Release: R2 | Depends on: R2-007

GOAL: Verify no R2 change made any form worse at any verb; fill the AGENT.md audit table.

FILES:
- docs/AGENT.md
- tests/unit/physics.test.js

READ FIRST:
- docs/AGENT.md advantage audit table
- all jump/climb/glide/squeeze/hover thresholds

STEPS:
1. Run full suite; any threshold regression is reverted, not retuned.
2. Fill one audit row per changed file (verb x form, none worse).
3. Record decisions in DECISIONS.md.

DONE WHEN: `npm test shows 63 passed; audit table complete with zero worse cells`

DO NOT: no threshold edits to make red tests green

SIZE: under 150 changed lines.
