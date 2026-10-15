# R1-003 — Chunked ground meshes (6x6x40 m) in render/ground.js
Release: R1 | Depends on: R1-002

GOAL: Render the 240 m landmass as 40 m chunk meshes with per-chunk vertex colours, culling chunks outside the ortho view.

FILES:
- src/render/ground.js
- src/app/game.js

READ FIRST:
- src/app/game.js buildGround()
- src/gameplay/terrain.js ground() height-grid API

STEPS:
1. Implement buildGroundChunks(scene, world) creating 6x6 PlaneGeometry chunks (80x80 segments) displaced by ground(), vertex-coloured by colorAt.
2. Swap the game.js ground build to the chunk version behind the same loadTerrain() call.
3. Hide chunks whose bounds fall outside the camera frustum each frame.
4. Run npm run build; dev server shows identical terrain.

DONE WHEN: `npm run build succeeds and npm test shows 50 passed`

DO NOT: no terrain math changes, no new dependencies

SIZE: under 150 changed lines.
