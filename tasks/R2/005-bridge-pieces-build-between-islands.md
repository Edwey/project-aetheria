# R2-005 — Bridge pieces (build) between islands
Release: R2 | Depends on: R2-002

GOAL: Add raft-bridge/foundation chain pieces so players can build spans; snap end-to-end like foundations.

FILES:
- src/gameplay/build.js
- tests/unit/craft-build.test.js

READ FIRST:
- src/gameplay/build.js KIND/ghost()/place() snapping
- docs/ENVIRONMENT.md building section

STEPS:
1. Add bridge piece kind reusing floor snap (4 m grid) with stilt posts to VOID-safe anchors.
2. Ghost validity: needs one anchored end; red otherwise.
3. Add 2 unit tests: end-to-end snap, unanchored refused.

DONE WHEN: `npm test shows 59 passed (2 new)`

DO NOT: no physics changes

SIZE: under 150 changed lines.
