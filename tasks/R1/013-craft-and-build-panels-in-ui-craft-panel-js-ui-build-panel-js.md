# R1-013 — Craft and build panels in ui/craft-panel.js + ui/build-panel.js
Release: R1 | Depends on: R1-012

GOAL: Move renderCraft/refreshCraft and build-mode UI out of game.js into the two panel modules.

FILES:
- src/ui/craft-panel.js
- src/ui/build-panel.js

READ FIRST:
- src/app/game.js renderCraft/refreshCraft/toggleBuild/cyclePiece/rotateGhost/updateGhost/placeGhost/removeNear()
- src/gameplay/craft.js canCraft + src/gameplay/build.js ghost/place

STEPS:
1. Move craft list rendering into craft-panel.js and ghost/placement UI into build-panel.js, verbatim.
2. Replace game.js calls with imports; bench-range checks unchanged.
3. Keep giveRes test button behaviour.

DONE WHEN: `npm test shows 50 passed and npm run build succeeds`

DO NOT: no recipe or snapping changes; at most 2 files, split carefully

SIZE: under 150 changed lines.
