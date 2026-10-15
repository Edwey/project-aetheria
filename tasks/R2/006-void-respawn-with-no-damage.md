# R2-006 — Void respawn with no damage
Release: R2 | Depends on: R1-019

GOAL: Falling below hmin-25 anywhere respawns at last safe ground with inventory intact and zero penalty.

FILES:
- src/app/loop.js
- src/gameplay/world.js

READ FIRST:
- fixedStep() void check (cc[1] < world.hmin - 25)
- WorldSet last-safe-ground tracking

STEPS:
1. Track lastSafe when grounded on any body; on VOID fall, respawn there via existing spawnForm().
2. Keep Core + inventory across the respawn (form switches already preserve them).
3. Add 1 unit test: VOID query + respawn point equals last safe.

DONE WHEN: `npm test shows 60 passed (1 new); falling off plays respawn, no damage`

DO NOT: no damage/hunger mechanics ever (rule 5)

SIZE: under 150 changed lines.
