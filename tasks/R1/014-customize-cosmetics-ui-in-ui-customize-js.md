# R1-014 — Customize + cosmetics UI in ui/customize.js
Release: R1 | Depends on: R1-012

GOAL: Move buildCustomizeUI and cosmetic mesh builders out of game.js into ui/customize.js.

FILES:
- src/ui/customize.js
- src/app/game.js

READ FIRST:
- src/app/game.js buildCustomizeUI/makeHead/makeBack/makeFace/buildCosmetics/updateCosmetics()
- src/gameplay/profile.js CATALOG

STEPS:
1. Move customization UI + primitive cosmetic builders verbatim.
2. Replace game.js calls with imports; GLB hat overrides stay optional via manifest.
3. Default look must be pixel-identical.

DONE WHEN: `npm run build succeeds; cosmetics unchanged`

DO NOT: no new cosmetic slots

SIZE: under 150 changed lines.
