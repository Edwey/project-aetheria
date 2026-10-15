# R1-004 — Instanced flora via manifest in render/flora.js
Release: R1 | Depends on: R1-003

GOAL: Replace procedural-only flora meshes with InstancedMesh per species, using manifest GLBs with procedural fallback.

FILES:
- src/render/flora.js
- src/app/assets.js

READ FIRST:
- src/app/game.js buildFlora() + mkInst/setI helpers
- public/assets/models/manifest.json ids (tree-oak, tree-pine, rock, mushroom, flower, cactus)

STEPS:
1. Implement buildFlora(scene, world) with one InstancedMesh per flora kind; load GLB via getModelUrl(id), fall back to the current primitive when null.
2. Keep the seeded positions/counts from world.flora exactly; instancing only.
3. Cap instance counts per chunk for the 40-60k triangle budget.

DONE WHEN: `npm test shows 50 passed and npm run build succeeds`

DO NOT: no new species, no gameplay changes

SIZE: under 150 changed lines.
