# R1-020 — Thin boot in app/main.js; retire game.js monolith
Release: R1 | Depends on: R1-010, R1-016, R1-019

GOAL: Rewire main.js to compose render/ui/app modules directly; game.js becomes a re-export shim, then is deleted.

FILES:
- src/app/main.js
- src/app/game.js

READ FIRST:
- All R1-001..R1-019 modules
- index.html module script

STEPS:
1. Compose init() in main.js from scene/camera/ground/flora/hud/panel/loop/save/assets/world modules.
2. Keep every HUD id and control working; run the full manual smoke (every form, action, weather, terrain).
3. Delete game.js only when build + tests are green without it.

DONE WHEN: `npm test shows 53 passed, build succeeds, dev server plays like the prototype`

DO NOT: no behaviour change in this task

SIZE: under 150 changed lines.
