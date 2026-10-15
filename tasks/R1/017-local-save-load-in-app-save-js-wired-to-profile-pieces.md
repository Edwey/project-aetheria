# R1-017 — Local save/load in app/save.js wired to profile + pieces
Release: R1 | Depends on: R1-013

GOAL: Persist profile, inventory and per-terrain pieces to localStorage on change and restore on boot.

FILES:
- src/app/save.js
- src/app/game.js

READ FIRST:
- src/app/game.js loadSave/saveSave/flushSave() + initBuildState()
- src/gameplay/build.js serialize/load

STEPS:
1. Route flushSave through save.js (debounced) storing {inv, pieces} per world name.
2. Restore on boot; corrupt data falls back to defaults (bad data ignored test).
3. Add 2 unit tests: roundtrip + corrupt-input ignored.

DONE WHEN: `npm test shows 52 passed (2 new) and build succeeds`

DO NOT: no IndexedDB yet (only if save exceeds quota), no cloud

SIZE: under 150 changed lines.
