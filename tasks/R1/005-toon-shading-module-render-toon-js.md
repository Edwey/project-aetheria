# R1-005 — Toon shading module render/toon.js
Release: R1 | Depends on: R1-001

GOAL: Centralise MeshToonMaterial creation with a 3-4 step gradient ramp used by all world materials.

FILES:
- src/render/toon.js
- src/render/ground.js

READ FIRST:
- docs/ASSETS.md shading rule (MeshToonMaterial, 3-4 step ramp)
- src/app/game.js stdM/material creation

STEPS:
1. Create makeToon(color, steps) + shared gradient map in render/toon.js.
2. Switch ground chunks (and only ground) to toon materials; keep colours identical.
3. Verify day/night tint still applies through applyTime.

DONE WHEN: `npm run build succeeds; scene renders with toon bands`

DO NOT: no outline work (R1-006), no new dependencies

SIZE: under 150 changed lines.
