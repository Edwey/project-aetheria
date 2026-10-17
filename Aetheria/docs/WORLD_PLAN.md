# WORLD PLAN (proposal for review — concrete layout for R1/R2)

This is the concrete world to build. Numbers follow the prototype and
WORLD.md/ENVIRONMENT.md; anything I invented is marked [NEW]. Correct me
wherever I'm wrong — especially island themes and POI placement.

## 1. Landmass map (240 × 240 m, 10 m cells, north = -z up)

```
        N (-z, taiga NW | grove NE)
      -120  -80  -40    0   +40  +80 +120  x
-120   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  -120
 -80   ~ TTTTTTTTTT GGGGGGGG ~~~~~~~~~~~~~~~~~~~   -80   T=taiga peaks
 -60   ~ TTT^^TTTTTT GGGGGGGG ~~ [SporeIsle34]~~   -60   ^=LookoutTor
 -40   ~ TTT(frost) LLL GGG(trampolines) SSSSS ~~   -40   L=lake, S=swamp
 -20   ~ TTTTTT MMMMMMMM GGGGG river ~~~~~~~~~~~   -20   M=meadow
   0   ~ TTTTTT MMMM(8,8 grotto)MMMM DDD ~~~~~~~     0
 +20   ~ PPPP hut(-20,16) spawn(-24,28) DDD ~~~~~  +20   P=plains home
 +40   ~ PPPPPPPPPP DDDD DDDD E(boat dock) ~~~~~~  +40   E=east docks
 +60   ~ PPPPPPP DDDD(thermals)DDDD [Ember38] ~~~  +60
 +80   ~ PPPP DDDDDDDDDDDD B(boat dock)~~~~~~~~~~  +80   B=south beach
+100   ~ bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb ~~~~ +100   b=beach ring
+120   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ +120
        S (+z, plains SW | dunes SE)
```

Quadrants (from `biomeW` in terrain.js): SW plains, SE dunes, NW taiga, NE grove.
Sea surrounds everything in R3; `~` marks approximate shoreline (where height
falls below ~0.5 m — exact line comes from the height grid, R3 task).

## 2. Land POIs ([NEW] names; coords are x,z in metres, A=120 bounds)

| # | Name | Coords | Biome | What / why | Resources |
|---|------|--------|-------|------------|-----------|
| P0 | Hearth Meadow (spawn) | (-24, 28) | plains | Safe starter bowl, gentle hills, first oaks/flowers | timber, sap, petal, fibre |
| P1 | Hut home | (-20, 16) | plains | Keep the prototype test hut as the starter home [NEW: Wsuggest keeping it]; workbench inside | bench crafting |
| P2 | Mingle Meadow | (0, 8) | border | Center of the map; Sun Grotto tunnel (8,8) kept as 0.95 m squeeze showcase | petal |
| P3 | Dune sea + crests | (60, 60) (80, 70) (45, 85) | dunes | Tall dunes; thermal columns on the 3 crests (R2-003) | fibre (cactus), petal |
| P4 | Frostpeak ridge | (-60, -60) | taiga | Highest ground (~10 m), pines, snow; launch point toward Lookout Isle | timber, sap, starstone (geodes) |
| P5 | Frozen tarn (R4) | (-75, -45) | taiga | Walkable ice sheet; pound cracks ring → ice crystals | ice crystals |
| P6 | Trampoline Grove | (55, -50) (70, -35) | grove | 4+ giant mushrooms as bounce chains toward Spore Isle | spore, fibre |
| P7 | Murk Swamp (R4) | (75, -40) | grove | Shallow murky water ≤1 m, reeds, glowing spores | fibre (reeds), spore |
| P8 | Mirror Lake (R4) | (0, -40) | north | Lake with clay bed; river spline east to the sea (currents, Ride-only) | clay |
| P9 | South Beach + docks (R3) | (0, 105) (-40, 100) | shore | Beach band, raft dock, pearl/kelp beds offshore | pearl, kelp (=fibre) |
| P10 | East landing (R3) | (105, 40) | shore | Dune-side dock for boat trips (boats are decor/props in R3) | pearl |
| P11 | Clay flats | (-60, 60) | plains | Extra clay deposits near home so bowl/workbench never gate on travel | clay |

Old test tunnels: keep (8,8) as Sun Grotto; move (-10,15) and (4,-16) or drop
them in R1-002 (your call — Q2 below). The playground/hills/stairs/ramps/rocky/
walls terrains stay as-is (lab courses, untouched).

## 3. Sky islands (3, each ~60 m wide; heights above sea Y=0)

| Isle | Sky coords | Top Y | Theme / landmark [NEW] | Resource | Route summary (details §5) |
|------|-----------|-------|------------------------|----------|---------------------------|
| Ember Isle | (75, 55) SE | 38 | Sunstone camp: campfire circle + **geode spire** (starstone) | starstone, petal | Dune thermals → glide (slime/stone); rise+float (wisp) |
| Spore Isle | (60, -60) NE | 34 | Mushroom garden: **giant mushroom ring** | spore, petal | Trampoline chain (slime/stone); rise+float (wisp) |
| Lookout Isle | (-60, -55) NW | 44 | Pine lookout: **wood tower** (table+torch) | timber, sap | Taiga ridge glide + thermal assist (all); bridges later |

Heights are first guesses: R2-007 reachability tests verify every island × every
form; if a route fails we move a thermal/trampoline (world data), never buff a
form (rules 2/4).

## 4. Thermals (R2-003) — dune crests + ridge assist

| # | Base (x,z) | Base Y≈ | Radius | Strength | Serves |
|---|-----------|---------|--------|----------|--------|
| T1 | (60, 60) | ~6 (crest) | 5 m | 4 m/s, +12 m | Ember Isle leg 1 |
| T2 | (80, 70) | ~7 (crest) | 5 m | 4 m/s, +12 m | Ember Isle leg 2 |
| T3 | (45, 85) | ~5 (crest) | 5 m | 4 m/s, +12 m | Ember Isle alternate |
| T4 | (-45, -70) | ~10 (ridge) | 5 m | 4 m/s, +12 m | Lookout Isle assist |
| T5 | (30, -70) | ~4 (grove edge) | 5 m | 3 m/s, +10 m | Spore Isle assist (weak, trampolines primary) |

Max 40 thermals per WORLD.md; we start with 5.

## 5. Reachability matrix (must all pass in R2-007)

| Isle | Slime | Wisp | Stone |
|------|-------|------|-------|
| Ember 38 m | T1/T2 ride → glide from ~18–22 m to island rim | Rise (~13 m) + float-glide from crest | T1/T2 ride → crystal-sail glide |
| Spore 34 m | Trampoline chain (2 bounces ≈ 10–14 m) + glide | Rise + float direct | Trampoline chain + sail |
| Lookout 44 m | T4 ride from 10 m ridge (~22 m) + long glide | Rise + float from ridge | Trampoline at ridge base + sail, or bridge (R2-005) |

Fallback ladder (in order): move/strengthen thermal → add trampoline →
extend bridge anchor. Never: change physics numbers.

## 6. Water placement (R3/R4)

- R3 sea: ring body around landmass, beach band where grid height in [-0.5, 0.8];
  docks at P9/P10; pearl + kelp beds at 2–6 m depth off south/east shores.
- R4 Mirror Lake at P8 (clay bed), river spline P8 → (120,-20) sea, Ride-only flow.
- R4 Murk Swamp at P7 (depth ≤1 m, reeds, spore glints).
- R4 Frozen tarn at P5 (ice sheet, neutral physics, pound-crack ring).

## 7. What I need from you (max 5, defaults marked *)

APPROVED 2026-10-16 (all defaults):
1. Island themes/landmarks: KEEP as drafted.
2. Old test tunnels: KEEP (8,8) as Sun Grotto (now a real in-world 0.95 m
   tunnel, flattened site, melted-only passage — implemented in terrain.js);
   the (-10,15)/(4,-16) tunnels live in the `walls` lab course, untouched.
3. Starter hut: KEEP at (-20,16).
4. Sky access: THERMALS FIRST, bridges optional.
5. Open vibe question: no correction received — map stands as drafted.
