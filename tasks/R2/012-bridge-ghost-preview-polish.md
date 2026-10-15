# R2-012 — Bridge ghost preview polish
Release: R2 | Depends on: R2-005

GOAL: Green/red ghost + stilt preview for bridges, consistent with Valheim-style placement readability.

FILES:
- src/render/pieces.js
- src/ui/build-panel.js

READ FIRST:
- R2-005 bridge validity rules
- render/pieces.js ghost colours

STEPS:
1. Render stilt posts from bridge ends to anchor/bed in preview.
2. Red ghost states: unanchored, overlap, out of bounds (text reasons kept).
3. Keep 44px touch targets on build buttons.

DONE WHEN: `npm run build succeeds; bridge ghost reads clearly`

DO NOT: no rule changes

SIZE: under 150 changed lines.
