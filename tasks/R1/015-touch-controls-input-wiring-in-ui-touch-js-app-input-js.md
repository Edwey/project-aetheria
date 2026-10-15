# R1-015 — Touch controls + input wiring in ui/touch.js + app/input.js
Release: R1 | Depends on: R1-012

GOAL: Move joystick/buttons out of game.js and route them through the app/input state module.

FILES:
- src/ui/touch.js
- src/app/input.js

READ FIRST:
- src/app/game.js touch/joy/knob block + readInput()
- src/app/input.js createInput() (Stage B stub)

STEPS:
1. Move touch DOM handling into ui/touch.js writing into the shared input state.
2. Make game.js readInput() consume createInput().state instead of its own keys set.
3. Keyboard mapping must stay byte-identical (WASD, Space, Shift, Tab, M/C/F/H/V, Q/E, R/T/B/P/X/Enter/Del, 1-8, [ ]).

DONE WHEN: `npm run build succeeds; keyboard + touch both drive all forms`

DO NOT: no remapping, no new gestures

SIZE: under 150 changed lines.
