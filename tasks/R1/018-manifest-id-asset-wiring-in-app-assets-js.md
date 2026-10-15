# R1-018 — Manifest-id asset wiring in app/assets.js
Release: R1 | Depends on: R1-004

GOAL: Replace game.js tryGLB/ASSETS global fetch with app/assets.js manifest ids; keep procedural fallbacks.

FILES:
- src/app/assets.js
- src/app/game.js

READ FIRST:
- src/app/game.js tryGLB() + assets/manifest.json fetch
- public/assets/models/manifest.json ids

STEPS:
1. Load the canonical manifest via loadManifest(); resolve flora/hat urls with getModelUrl(id).
2. Delete the legacy assets/manifest.json fetch; keep the file served until R2.
3. Game runs identically with an empty public/assets folder (fallback test: temporarily rename folder, boot, restore).

DONE WHEN: `npm run build succeeds; models load from manifest ids or fall back cleanly`

DO NOT: no hard-coded model paths

SIZE: under 150 changed lines.
