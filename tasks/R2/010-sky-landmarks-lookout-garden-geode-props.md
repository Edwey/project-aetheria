# R2-010 — Sky landmarks: lookout + garden + geode props
Release: R2 | Depends on: R2-002

GOAL: Place one readable landmark per island using manifest ids with procedural fallback.

FILES:
- src/render/flora.js
- public/assets/models/manifest.json

READ FIRST:
- R2-002 landmark tags
- src/app/assets.js getModelUrl()

STEPS:
1. Lookout: table+torch; garden: flowers+mushroom ring; geode: rock cluster tinted.
2. All landmarks procedural-first; GLB only as override.
3. Landmarks visible from the mainland (silhouette check in dev).

DONE WHEN: `npm run build succeeds; 3 landmarks identifiable from afar`

DO NOT: no new asset downloads (use staged set)

SIZE: under 150 changed lines.
