# ENVIRONMENT.md - Biomes, Wind, Weather, Resources, Crafting, Building

## Biomes

The world has four blended biomes with smooth transitions. The Aetheria terrain blends them together.

### Lush Plains
- **Colors**: Green grass (0.40-0.72, 0.72-0.78, 0.35-0.40)
- **Flora**: Oak trees, flowers (petals), rocks
- **Weather**: Sun shower (rain)
- **Wind strength**: 1.5 (base)
- **Resources**: Timber, sap, fibre, petal
- **Features**: Gentle rolling hills
- **Trees**: Oak (42 trees, 4m spacing)

### Sunstone Dunes
- **Colors**: Sandy gold (0.80-0.93, 0.47-0.80, 0.34-0.54)
- **Flora**: Cactus, flowers (petals)
- **Weather**: Sand flurry
- **Wind strength**: 3.5 (base)
- **Resources**: Fiber, petal
- **Features**: Large sand dunes
- **Thermals**: Updrafts on dune crests (for reaching sky islands)
- **Trees**: Cactus (28 trees, 4.5m spacing)

### Frostpeak Taiga
- **Colors**: Cold blue-green (0.26-0.55, 0.46-0.56, 0.36-0.60)
- **Flora**: Pine trees, rocks, flowers (petals)
- **Weather**: Snowfall
- **Wind strength**: 4.0 (base)
- **Resources**: Timber, sap, fibre, petal
- **Features**: Mountains with snow caps
- **Cold air drainage**: Wind flows downhill on slopes steeper than ~15 degrees
- **Trees**: Pine (100 trees, 2.8m spacing)

### Mystic Grove
- **Colors**: Mystical purple-green (0.34-0.52, 0.38-0.56, 0.55-0.68)
- **Flora**: Mushrooms, flowers (spores)
- **Weather**: Spore aurora
- **Wind strength**: 1.0 (base)
- **Resources**: Fibre, spore
- **Features**: Swirling vortices
- **Swirling**: 2D scalar field with ~12m cells creates curl-like wind patterns
- **Gravity**: 0.9x (slightly floaty)
- **Trees**: Mushroom (38 trees, 4m spacing)

---

## Wind System

### Base Wind Strength
Per biome base strength (before modifiers):
- Plains: 1.5 m/s
- Dunes: 3.5 m/s
- Taiga: 4.0 m/s
- Grove: 1.0 m/s

### Wind Direction
- Base angle: Rotates slowly over time (period = 90s)
- Angle formula: 0.7 + 1.2 * sin(TAU * t / 90)

### Modifiers
- **Gusts**: Random gusts (2-4s duration, 6-8s interval)
  - Gust multiplier: 1 + 0.6 * gustValue
- **Weather modifiers**:
  - Sand flurry: +60% wind speed
  - Snowfall: -30% wind speed
  - Rain: +10% wind speed
  - Spore aurora: no wind speed change
- **Slope effects**: Windward slopes speed wind up
  - Slope factor: 1 + 0.3 * min(1, slope) * (dot product)
- **Taiga drainage**: Cold air flows downhill on steep slopes
  - Slope threshold: > 0.27 (~15 degrees)
  - Drainage factor: 2 * biome weight

### Special Wind Features
- **Thermals**: Updrafts over dune crests
  - Located at local height maxima in dunes biome
  - Height: base + 12m
  - Radius: 5m
  - Strength: 4 m/s (fades at top)
  - Max 40 thermals
- **Mushroom updrafts**: Updrafts over mushroom caps
  - Height: base + 8m
  - Strength: 3 m/s
- **Grove vortices**: Swirling patterns
  - Scalar field at 0.52/m and 0.47/m resolution
  - Creates curl-like wind patterns
  - Strength: 2.4 m/s

### Wind Interaction (Rule 4)
- **Steady by default**: Wind never moves, slows, or lifts a creature
- **Ride (Shift)**: Holding Ride lets wind carry and boost you
  - Tailwinds: Up to +40% speed boost
  - Headwinds: Projected component cancelled (never slow you)
  - Updrafts: Lift you (only while Riding)
- **Per-form wind sensitivity**:
  - Slime: 1.0x (base)
  - Stone: 0.5x (less affected)
  - Wisp: 2.0x (more affected, but 5x in general physics)

---

## Weather System

Each biome has its own weather state machine with 4 phases:
1. **Clear**: Duration 25-70s (random)
2. **Building**: Duration 10s (weather ramps up)
3. **Active**: Duration 60-180s (full weather)
4. **Clearing**: Duration 15s (weather ramps down)

### Weather Types per Biome
- Plains: Rain (sun shower)
- Dunes: Sand flurry
- Taiga: Snowfall
- Grove: Spore aurora

### Weather Effects
- **Rain**:
  - Visual: Rain lines falling
  - Gameplay: Jump +20%, Wisp breath refill +2 per second when wet
  - Wind: +10% speed
  - Wisp float drain: Reduced to 1/3
- **Sand**:
  - Visual: Sand particles blowing
  - Gameplay: None (visual only)
  - Wind: +60% speed
- **Snow**:
  - Visual: Snowflakes falling gently
  - Gameplay: None (visual only)
  - Wind: -30% speed
- **Spore**:
  - Visual: Glowing spores floating upward
  - Gameplay: Gravity -15% (floatier), vertical wind +0.8 m/s
  - Wind: No speed change

### Weather Override
- Manual override in UI: Clear, Sun shower, Sand flurry, Snowfall, Spore aurora
- Default: Auto (follows biome machines)

---

## Resources

### Raw Resources
| Resource | Source | Stack Cap | Notes |
|----------|--------|-----------|-------|
| Timber | Oak trees, pine trees | 40 (80 stone) | From tree impact/pound |
| Sap | Oak trees, pine trees | 40 (80 stone) | Slime gets +1 per tree (sticky perk) |
| Fiber | Cactus, reeds (swamp) | 40 (80 stone) | From cactus impact/pound |
| Starstone | Geodes | 40 (80 stone) | From geode impact/pound/roll |
| Clay | Clay deposits, lakebed | 40 (80 stone) | From clay impact/pound/roll |
| Petal | Flowers (plains, dunes, taiga) | 40 (80 stone) | From flower absorb |
| Spore | Flowers (grove) | 40 (80 stone) | From flower absorb |

### Harvesting Methods
- **Impact**: Slime/stone hitting flora at speed
  - Slime: 3.2 m/s threshold
  - Stone: 2.6 m/s threshold
- **Pound**: Ground pound near flora
  - Range: 3.8m
- **Absorb**: Wisp passing through flowers
  - Range: Slime/stone 1.1m, Wisp 2.75m
- **Rolling**: Stone rolling into geodes/clay
  - Speed threshold: 5 m/s
  - Range: 1.0m horizontal, 1.2m vertical

### Flora Resource Drops
- **Oak**: 2 timber, 1 sap (+1 for slime sticky)
- **Pine**: 1 timber, 1 sap (+1 for slime sticky)
- **Cactus**: 2 fiber
- **Mushroom**: 3 spore
- **Geode**: 2 starstone (2-4 from pound)
- **Clay**: 2 clay (2 from pound, +1 for slime)
- **Flower (petal)**: 1 petal
- **Flower (spore)**: 1 spore

---

## Crafting

### Recipes

| ID | Output | Cost | Station | Notes |
|----|--------|------|---------|-------|
| twine | Twine | 2 fiber | Pocket | - |
| torch | Torch | 1 timber, 1 sap | Pocket | - |
| campfire | Campfire | 3 timber, 1 sap | Pocket | - |
| bowl | Clay bowl | 2 clay | Pocket | - |
| workbench | Workbench | 5 timber, 2 twine | Pocket | - |
| foundation | Foundation | 4 timber, 1 twine | Bench | Snaps to grid |
| wall | Log wall | 2 timber, 1 twine | Bench | Snaps to foundation |
| doorwall | Door wall | 2 timber, 1 twine | Bench | Snaps to foundation |
| roof | Thatched roof | 3 fiber, 1 timber | Bench | Snaps to foundation |
| table | Table | 3 timber | Bench | Prop |
| bed | Bed | 2 timber, 3 fiber, 3 petal | Bench | Prop |

### Bench Range
- Workbench must be within 5m to craft bench recipes
- Pocket recipes can be crafted anywhere

### Stack Caps
- Stone: 80 items per resource
- Slime/Wisp: 40 items per resource

---

## Building

### Placeable Pieces

| Type | Kind | Snapping | Notes |
|------|------|----------|-------|
| foundation | floor | Grid (2m) | Has stilts in shallow water |
| wall | wall | Foundation edge | Fades when inside |
| doorwall | wall | Foundation edge | Has 1.4m door gap |
| roof | roof | Foundation center | Fades when inside |
| table | prop | Foundation floor | - |
| bed | prop | Foundation floor | - |
| campfire | ground | Grid (0.5m) | Has fire light |
| torch | ground | Grid (0.5m) | Has fire light |
| bowl | ground | Grid (0.5m) | - |
| workbench | ground | Grid (0.5m) | Enables bench crafting |

### Building Mechanics
- **Ghost preview**: Green = valid, red = invalid
- **Reach**: Slime/stone 4.5m, Wisp 7m
- **Slope max**: Slime 4.0, Stone/Wisp 2.5
- **Snapping**:
  - Foundations: Snap to 2m grid, connect to nearby foundations
  - Walls: Snap to foundation edges (4 positions per foundation)
  - Roofs: Snap to foundation center
  - Props: Snap to foundation floor with 0.5m grid
  - Ground items: Snap to 0.5m grid
- **Overlap refusal**: Pieces cannot overlap
- **Player collision**: Cannot place where you are standing
- **Removal**: Delete removes nearest piece (5m range)
- **Cascading removal**: Removing a foundation removes all pieces attached to it

### Structure Features
- **Roof and wall fade**: Fade when creature is inside a foundation footprint
  - Roof opacity: 0.08 when inside
  - Wall opacity: 0.1 when facing inside
  - Camera-facing walls fade
- **Stilts**: Shallow water foundations have posts to bed
  - Post positions: ±1.8m on both axes
  - Post length: foundation top - bed height + 0.3m
- **Fire lights**: Campfires and torches emit light
  - 3 nearest fires get real lights
  - Light intensity: 1.2 + 0.25 * sin(time * 11 + offset)
  - Range: 12m

### Build Perks by Form
- **Reach**: Wisp 7m, Slime/Stone 4.5m
- **Slope max**: Slime 4.0, Stone/Wisp 2.5

---

## Numbers Summary

### Terrain
- Landmass size: 240 × 240 m
- Height grid cell size: 0.5 m
- Chunk size: 40 m
- Chunks: 6 × 6
- Broadphase grid cell size: 4 m

### Flora Counts (Aetheria)
- Oak trees: 42
- Pine trees: 100
- Cactus: 28
- Mushrooms: 38
- Rocks: 20
- Geodes: 9 (3 per biome: plains, taiga, grove)
- Clay deposits: 8 (4 per biome: plains, grove)
- Flowers (petal): 140 (90 plains, 24 dunes, 32 taiga)
- Flowers (spore): 70 (grove)

### Weather
- Weather particle count: Full 650, Light 350
- Weather radius: 18 m around player
- Weather height range: -6 to +11 m around player

### Wind
- Base wind period: 90 s
- Gust duration: 2-4 s
- Gust interval: 6-8 s
- Thermal radius: 5 m
- Thermal height: +12 m
- Mushroom updraft height: +8 m

### Resources
- Max stack: Stone 80, Slime/Wisp 40
- Harvest cooldown: Slime/stone 7 s, Stone 3 s
- Tree cooldown after hit: Slime/stone 7 s, Stone 3 s

### Building
- Foundation size: 4 × 4 m
- Wall height: 3 m
- Wall thickness: 0.3 m
- Door gap: 1.4 m
- Roof size: 4.6 × 4.6 m
- Roof thickness: 0.3 m
- Bench range: 5 m
- Build reach: Slime/stone 4.5 m, Wisp 7 m
