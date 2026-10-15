# R2-011 — Updraft/thermal visuals in render/weather.js
Release: R2 | Depends on: R2-003

GOAL: Render thermal columns as rising dust motes (Light: 20 sprites) only while in/near them.

FILES:
- src/render/weather.js
- src/gameplay/env.js

READ FIRST:
- R2-003 thermals[] + sample() strength
- render/weather.js particle pool

STEPS:
1. Add a small pooled sprite column per thermal; opacity follows strength.
2. Zero allocations per frame (reuse pool).
3. Off in Light quality beyond 60 m distance.

DONE WHEN: `npm run build succeeds; thermals visibly shimmer`

DO NOT: no new textures (vertex-coloured quads)

SIZE: under 150 changed lines.
