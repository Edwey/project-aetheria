# R3 Water I — task outline (one line per task; expand to full task files when R2 is Complete)

- R3-001 Sea body + beach band terrain (WorldSet water level per body, depth to ~6 m near shore).
- R3-002 Cheap sea rendering: one transparent plane per body, vertex-shader waves, depth vertex colours, shoreline foam.
- R3-003 Buoyancy for soft bodies (per-particle upward accel by depth, clamped; rule 2 holds).
- R3-004 Slime swim: surface float, F dives, skip-dash (charged jump at speed bounces up to 3x).
- R3-005 Wisp swim: skimming counts as low (breath refills), mist dive at normal speed.
- R3-006 Stone swim: sinks, walks bed at full ground speed, gathers seabed in one hit, ignores currents.
- R3-007 Water inputs: Space = swim up/jump out, F = dive (replaces pound while submerged).
- R3-008 Underwater look: fog + CSS overlay when camera target submerged; Medium+ fake caustics.
- R3-009 Seabed resources: pearl + kelp fibre (counts as fibre) with per-form harvest perks.
- R3-010 Water tests: no form slower in water than land (10%); slime surfaces; stone beds; wisp refills; currents Ride-only; no NaN.
- R3-011 Boat + dock models from manifest (pirate kit) as decor/props, procedural fallback kept.
- R3-012 R3 acceptance: sea playable, WATER.md numbers filled, PLAN.md R3 Complete.
