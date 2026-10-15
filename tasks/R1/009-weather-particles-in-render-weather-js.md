# R1-009 — Weather particles in render/weather.js
Release: R1 | Depends on: R1-001

GOAL: Move rain/sand/snow/spore particle seeding and update out of game.js into render/weather.js.

FILES:
- src/render/weather.js
- src/app/game.js

READ FIRST:
- src/app/game.js seedWeather/setWeather/updateWeather()
- src/gameplay/env.js weatherFor/weatherAt

STEPS:
1. Move the three weather functions verbatim into render/weather.js.
2. Replace game.js calls with imports; keep the 350 (light) / 800 (full) counts.
3. Verify weather follows biome after the move.

DONE WHEN: `npm run build succeeds; weather matches biome`

DO NOT: no new weather types

SIZE: under 150 changed lines.
