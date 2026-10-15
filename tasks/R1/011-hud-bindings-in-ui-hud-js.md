# R1-011 — HUD bindings in ui/hud.js
Release: R1 | Depends on: R1-017

GOAL: Move inventory/biome/wind/jump-meter HUD updates out of game.js into ui/hud.js.

FILES:
- src/ui/hud.js
- src/app/game.js

READ FIRST:
- src/app/game.js updateHud/renderInv() + #inv #biomeLbl #wxLbl #jump elements
- index.html HUD markup

STEPS:
1. Move updateHud + renderInv verbatim into ui/hud.js operating on a passed state object.
2. Replace game.js calls with the import; text content identical.
3. Keep aria-live and 44px touch target sizes.

DONE WHEN: `npm run build succeeds; HUD reads identically`

DO NOT: no HUD redesign (R5), no framework

SIZE: under 150 changed lines.
