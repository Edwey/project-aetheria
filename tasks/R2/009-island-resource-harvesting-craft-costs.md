# R2-009 — Island resource harvesting + craft costs
Release: R2 | Depends on: R2-002

GOAL: Wire island resources (spore, starstone, petal) into harvesting impacts and existing recipes.

FILES:
- src/app/game.js
- src/gameplay/craft.js

READ FIRST:
- checkImpacts()/bumpTree()/breakBreakable() harvest path
- Craft.RES + RECIPES (no new resources without recipes)

STEPS:
1. Map island flora hits to spore/starstone/petal drops via the existing impact types.
2. Keep per-form harvest perks (impact/pound/absorb) unchanged.
3. Add 1 unit test: island resource id maps to a valid RES entry.

DONE WHEN: `npm test shows 64 passed (1 new)`

DO NOT: no new resource kinds, no economy rebalance

SIZE: under 150 changed lines.
