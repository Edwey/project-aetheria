# R1-010 — Build piece meshes in render/pieces.js
Release: R1 | Depends on: R1-004

GOAL: Move build piece objects (ghost + placed) out of game.js into render/pieces.js.

FILES:
- src/render/pieces.js
- src/app/game.js

READ FIRST:
- src/app/game.js buildPieceObj/addPieceObj/clearPieceObjs/updatePieces()
- src/gameplay/build.js rec shape

STEPS:
1. Move the five piece functions verbatim; keep ghost green/red validity colours.
2. Replace game.js calls with imports.
3. Wall/roof fade behaviour must be byte-identical.

DONE WHEN: `npm run build succeeds; ghost + pieces render as before`

DO NOT: no snapping rule changes

SIZE: under 150 changed lines.
