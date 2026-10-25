# WORLD_PLAN.md — Island Layout, Regional POIs & World Design

Aligned with `AETHERIA_MASTER_PLAN.md` (v4).

---

## 1. Island Overview & Topology

Aetheria is **one compact, continuous island** surrounded by open sea. There are **no sky islands**; every area is physically grounded, reachable on foot, glide, or swim, and visible from elevated viewpoints.

### Core Dimensions & Scale
- **Footprint**: ~280 × 280 meters (bounded within coordinates $[-140, +140]$ on X and Z axes).
- **Travel Time**: ~90 seconds to sprint from one coast to the opposite shore.
- **Vertical Relief**: Sea level at $Y = 0$; Central Lookout Ridge rises to $Y \approx +24\text{ m}$; Whispering Pines granite peaks at $Y \approx +18\text{ m}$; Bioluminescent Basin drops into a sunken hollow at $Y \approx +1\text{ m}$.
- **Open World from Minute One**: Zero artificial gates, loading screens, or invisible walls. Ocean surf and natural rock outcroppings form organic boundaries.

---

## 2. World Layout & Regional Map

```
                     NORTH (-Z)
             [ Whispering Pines ]
          Granite Tor & Alpine Stream
             (Tarns, Pines, Moss)
                      │
  WEST (-X)           │           EAST (+X)
[ Sunbaked Crags ] ───┼─── [ The Shimmering Coast ]
 Terracotta Canyons   │     Sandy Beaches, Sea Caves,
 Arches, Clay Flats   │       Tide Pools, Driftwood
                      │
            [ Bioluminescent Basin ]
           Sunken Fungal Marsh, Glowing
               Spore Geysers, Mud
                     SOUTH (+Z)
```

### Central Overlook (The Hearth Ridge)
- **Coordinates**: $(0, 0)$ at $Y \approx +24\text{ m}$.
- **Role**: Panoramic 360-degree vantage point overlooking all four regional borders. Features an ancient stone altar, windsock/weather chime, and thermal column.

---

## 3. The Four Regions & Major POIs

### Region 1: The Shimmering Coast (South & East)
- **Aesthetic**: Warm turquoise sea, soft golden sands, weathered driftwood logs, tide pools.
- **Key POIs**:
  - `P101` **Pebble Cove (Player Spawn)** `(60, 40)`: Calm, sheltered cove with small tide pools, starter shells, and gentle slopes to teach basic movement.
  - `P102` **Driftwood Pier & Beach Hut** `(80, 20)`: Weathered wooden dock with starter workbench; calm water for testing early swimming and rafts.
  - `P103` **Sunken Cavern** `(110, -10)`: Half-submerged sea cave accessible by swimming or seabed walking; contains glowing pearl geodes and hidden alcoves.
  - `P104` **Tidal Flats** `(70, 80)`: Wide expanse of shallow water where Oobleck can test surface planing and Aerolite floats like driftwood.

### Region 2: Whispering Pines (North)
- **Aesthetic**: Deep evergreen canopy, misty mountain air, granite crags, cool alpine streams.
- **Key POIs**:
  - `P201` **Whispering Ridge Tor** `(-20, -90)`: Towering granite outcrop ($Y \approx +18\text{ m}$) ideal for launching long glides across the forest canopy.
  - `P202` **Mirror Tarn** `(10, -70)`: Deep mountain tarn ($3.5\text{ m}$ depth) fed by a bubbling cascade; clay deposits along bed.
  - `P203` **Logging Glade** `(-50, -60)`: Clearing with ancient fallen cedar logs, pinecone groves, and sap tapping sites.
  - `P204` **Granite Stair** `(30, -100)`: Stepped natural terraces requiring hops, climbs, or wisp ascents to scale.

### Region 3: Sunbaked Crags (West)
- **Aesthetic**: Terracotta red rocks, wind-carved sandstone arches, dry riverbeds, clay flats.
- **Key POIs**:
  - `P301` **The Great Arch** `(-80, -20)`: Massive natural sandstone bridge spanning a deep canyon ($Y \approx +16\text{ m}$).
  - `P302` **Thermal Gulch** `(-90, 20)`: Canyon featuring 3 persistent thermal updrafts for wisp soaring and glider launch.
  - `P303` **Clay Flats & Dried Wadi** `(-60, 50)`: Smooth terracotta basin with abundant clay nodes; fills with temporary water channels during rain.
  - `P304` **Cactus Oasis** `(-110, 0)`: Small desert oasis surrounded by fan palms and succulent plants; shade rest stop.

### Region 4: The Bioluminescent Basin (Southwest & Central Hollow)
- **Aesthetic**: Sunken twilight depression, massive bioluminescent mushrooms, misty ground fog, glowing spores.
- **Key POIs**:
  - `P401` **Spore Canopy Ring** `(-20, 60)`: Cluster of giant bouncy mushroom caps acting as natural trampoline chains.
  - `P402` **Glowmoss Grotto** `(0, 80)`: Deep subterranean grotto accessed via a narrow squeeze fissure ($0.95\text{ m}$); glowing crystals.
  - `P403` **Murk Marsh Channels** `(-40, 90)`: Shallow marsh with reeds, floating lily-pads, and water currents.
  - `P404` **The Geyser Mound** `(-10, 110)`: Vents that emit periodic pressurized steam/spore bursts, propelling light forms into the air.

---

## 4. Pressure Plates & Puzzle Mechanics

Scattered throughout the island are ancient stone switches and environmental puzzles:

1. **Light Pressure Plates (Wisp / Small Slime)**:
   - Activated by weights $\le 15\text{ kg}$ (Mist, Zephyr, Aether Bubble). Heavy forms trigger an overload spring lock.
2. **Medium Pressure Plates (Standard Form / Crates)**:
   - Activated by weights between $30\text{ kg}$ and $80\text{ kg}$ (Oobleck, Dewdrop, Aerolite, wooden crates).
3. **Heavy Pressure Plates (Dense Stone)**:
   - Activated only by weights $\ge 120\text{ kg}$ (Geode, Obsidian). Requires heavy stone grounding or stacked boulders.
4. **Impact Plates**:
   - Requires dynamic downward momentum (e.g. Geode ground slam or Dewdrop drop from height).
5. **Narrow Squeeze Fissures**:
   - $0.95\text{ m}$ openings accessible only by compressed Oobleck, Dewdrop, or Mist.

---

## 5. Wind Currents & Thermals

Thermals are column triggers with soft radial falloff that elevate wisps and gliders:
- `TH-01` **Hearth Crest** `(0, 10)`: Lift from $Y = 12 \to 26\text{ m}$ ($3.5\text{ m/s}$).
- `TH-02` **Crags Gulch A** `(-85, 15)`: Lift from $Y = 6 \to 22\text{ m}$ ($4.0\text{ m/s}$).
- `TH-03` **Crags Gulch B** `(-95, 30)`: Lift from $Y = 5 \to 20\text{ m}$ ($4.0\text{ m/s}$).
- `TH-04` **Pines North Ridge** `(-25, -85)`: Lift from $Y = 14 \to 28\text{ m}$ ($3.0\text{ m/s}$).
- `TH-05` **Basin Spore Chimney** `(-15, 65)`: Warm fungal updraft from $Y = 2 \to 18\text{ m}$ ($4.5\text{ m/s}$).

---

## 6. Procedural Generation & Hand-Authored Blending

- **Base Mesh**: Continuous heightmap generated via 2D Simplex noise with domain warping, shaped by a circular radial falloff towards sea level at the coastline.
- **Hand-Crafted Anchors**: Landmark POIs, cave entrances, arches, and key paths are stamped into the heightmap and feature placed prefab colliders.
- **Surface Biome Splatting**: Four splat weights blend smoothly across height, slope, and regional distance, driving ground shader color and prop distribution.
