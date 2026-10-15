# R1-006 — Creature-only outline in render/outline.js
Release: R1 | Depends on: R1-007

GOAL: Add the thin inverted-hull outline pass on creatures ONLY (never the world).

FILES:
- src/render/outline.js
- src/render/creature.js

READ FIRST:
- src/app/game.js writeBodyMesh()/writeWisp()
- docs/DECISIONS.md outline rule

STEPS:
1. Implement addOutline(mesh, color) cloning geometry with BackSide scaled material.
2. Apply to slime/stone body mesh and wisp core only; skip when quality is light with outlineBlur off.
3. Keep the outline width under 0.03 m so hitboxes read unchanged.

DONE WHEN: `npm run build succeeds; creatures show a thin outline, world does not`

DO NOT: no world outlines, no postprocessing deps

SIZE: under 150 changed lines.
