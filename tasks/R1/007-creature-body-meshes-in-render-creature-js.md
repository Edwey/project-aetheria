# R1-007 — Creature body meshes in render/creature.js
Release: R1 | Depends on: R1-005

GOAL: Move slime/stone body mesh writing (particles to mesh) out of game.js into render/creature.js.

FILES:
- src/render/creature.js
- src/app/game.js

READ FIRST:
- src/app/game.js writeBodyMesh(), disposeCreature(), surfacePoint()
- src/gameplay/physics.js body fields (x, n, com)

STEPS:
1. Move writeBodyMesh/disposeCreature verbatim into render/creature.js operating on (scene, body, look).
2. Replace game.js calls with the import; no triangulation changes.
3. Run npm test (pure modules untouched) and npm run build.

DONE WHEN: `npm test shows 50 passed and npm run build succeeds`

DO NOT: no mesh algorithm changes

SIZE: under 150 changed lines.
