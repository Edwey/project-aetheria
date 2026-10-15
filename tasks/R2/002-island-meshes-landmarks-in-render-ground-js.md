# R2-002 — Island meshes + landmarks in render/ground.js
Release: R2 | Depends on: R2-001

GOAL: Render sky islands with the chunk/toon pipeline and place each island landmark (garden, geode spire, lookout).

FILES:
- src/render/ground.js
- src/render/flora.js

READ FIRST:
- R2-001 island bodies
- public/assets/models/manifest.json (flower, rock, tree-pine)

STEPS:
1. Extend chunk builder to island bodies (same 40 m chunks, toon + vertex colours).
2. Place landmarks from manifest ids with procedural fallback: flower garden, rock geode spire, wood lookout.
3. Keep island flora instanced and inside the triangle budget.

DONE WHEN: `npm run build succeeds; all 3 islands render with landmarks`

DO NOT: no new mechanics

SIZE: under 150 changed lines.
