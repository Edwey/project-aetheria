# R2-003 — Thermals as world features in gameplay/env.js
Release: R2 | Depends on: R2-001

GOAL: Add steady thermal columns above dune crests to Env: lift while Riding, nothing while steady.

FILES:
- src/gameplay/env.js
- tests/unit/wind.test.js

READ FIRST:
- src/gameplay/env.js sample()/thermals fields
- tests/unit/wind.test.js updraft task pattern

STEPS:
1. Add thermals[] (x, z, radius, strength) to env; sample() adds +wy inside a column.
2. Keep the push law (never slows): thermal wind only enters inp.wind, Ride-gated by physics.
3. Add 2 unit tests: Riding rises in a thermal, steady gets nothing.

DONE WHEN: `npm test shows 57 passed (2 new)`

DO NOT: no physics.js changes (rule 2: revert anything that slows a form)

SIZE: under 150 changed lines.
