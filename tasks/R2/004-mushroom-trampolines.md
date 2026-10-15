# R2-004 — Mushroom trampolines
Release: R2 | Depends on: R2-002

GOAL: Bouncy mushrooms on land + islands: landing on one launches the creature skyward, equal for all forms.

FILES:
- src/gameplay/terrain.js
- src/app/game.js

READ FIRST:
- src/gameplay/env.js mushrooms[] bounce field
- src/gameplay/physics.js doJump() power path

STEPS:
1. Tag trampoline mushrooms in terrain (positions + radius + power).
2. On grounded contact inside the radius with downward speed, set upward velocity (same for slime/wisp/stone).
3. Add springy scale pop + chime via existing event hooks only.

DONE WHEN: `npm test shows 57 passed; manual bounce works for all 3 forms`

DO NOT: no per-form tuning differences (advantage audit)

SIZE: under 150 changed lines.
