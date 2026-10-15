# R1-016 — Main loop in app/loop.js with fixed-step governor hook
Release: R1 | Depends on: R1-015

GOAL: Move frame()/fixedStep() scheduling into app/loop.js and call quality governor per frame (lower-only).

FILES:
- src/app/loop.js
- src/app/quality.js

READ FIRST:
- src/app/game.js frame()/fixedStep() + acc/slow logic
- src/app/quality.js createGovernor() (Stage B stub)

STEPS:
1. Move the frame accumulator (FIXED=1/60, max 4 steps, slow-mo x0.25) into loop.js.
2. Call governor.tick(dt) each frame; apply pixelRatio/shadow downgrade on full->light only.
3. Never raise quality mid-session.

DONE WHEN: `npm run build succeeds; slow frames drop to Light and stay there`

DO NOT: no auto-raise, no new qualities

SIZE: under 150 changed lines.
