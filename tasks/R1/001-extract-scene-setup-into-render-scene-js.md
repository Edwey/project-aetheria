# R1-001 — Extract scene setup into render/scene.js
Release: R1 | Depends on: R0 (Stage C green)

GOAL: Move renderer, scene, lights, fog and resize handling out of game.js into render/scene.js with no behaviour change.

FILES:
- src/render/scene.js
- src/app/game.js

READ FIRST:
- src/app/game.js “three.js” section (renderer, scene, applyTime)
- src/app/main.js

STEPS:
1. Create createScene(coarse) in src/render/scene.js returning { renderer, scene, setTime } copied verbatim from game.js.
2. Replace the three.js setup block in game.js with an import + call; keep applyTime behaviour identical.
3. Keep canvas#c, shadow map, sRGBEncoding, pixel-ratio cap exactly as-is.
4. Run npm test and npm run build; both must pass with no visual change.

DONE WHEN: `npm test shows 50 passed and npm run build succeeds`

DO NOT: no refactors, no new features, no new dependencies

SIZE: under 150 changed lines.
