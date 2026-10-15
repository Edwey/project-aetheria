# R1-012 — Control panel in ui/panel.js
Release: R1 | Depends on: R1-011

GOAL: Move form buttons, body presets, sliders, time and weather selects out of game.js into ui/panel.js.

FILES:
- src/ui/panel.js
- src/app/game.js

READ FIRST:
- src/app/game.js panel/form/slider/quality/weather/time block
- src/gameplay/profile.js validate/save

STEPS:
1. Move panel construction + sync functions verbatim; keep slider ranges and aria-pressed states.
2. Replace game.js calls with imports; profile.save still debounced via saveSoon.
3. All 48 control ids must keep working.

DONE WHEN: `npm run build succeeds; every control works as before`

DO NOT: no new controls

SIZE: under 150 changed lines.
