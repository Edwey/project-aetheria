# REFERENCES.md - Reference Games and What We Borrow

## Animal Crossing

**What we copy**:
- Cozy color palette with soft, warm tones
- Soft rounded UI with gentle curves
- Gentle day/night tint transitions
- Bouncy, satisfying UI sounds
- Peaceful, non-punitive gameplay
- Collecting and decorating loop

**What we do NOT copy**:
- Real-time clock sync (we use game time)
- NPC villagers (single-player only for now)
- Debt/loan systems (no economy)
- Multiplayer (PartyKit later, not in v1)
- Daily reset mechanics

**Test**: Cozy aesthetic and peaceful gameplay

---

## A Short Hike

**What we copy**:
- Glide and climb exploration mechanics
- Readable small world (everything accessible in short play sessions)
- Short gameplay loops (climb → reach → return)
- Verticality in exploration
- Joyful movement feel

**What we do NOT copy**:
- 2D sprite art (we use 3D)
- Conversation dialogue (no NPCs)
- Badge/achievement system (simpler progression)
- Fixed camera angle (we have camera rotation)

**Test**: Glide and climb exploration works, world is readable

---

## Minecraft

**What we copy**:
- Gather, craft, place loop
- Clear recipe costs (X of Y resource)
- Block-based building with snapping
- Resource gathering from environment
- Creative building possibilities

**What we do NOT copy**:
- Voxel/block world (we use smooth terrain)
- Infinite procedural terrain (fixed world size)
- Survival mechanics (no hunger/damage)
- Mining depth (we have surface gathering)
- Redstone/circuitry (no complex automation)

**Test**: Crafting recipes work, building snaps correctly

---

## Valheim

**What we copy**:
- Modular snapping pieces for building
- Clear green/red ghost placement indicators
- Structural decay (not in v1, future)
- Viking-inspired aesthetic elements (not directly, just structure)
- Building on uneven terrain

**What we do NOT copy**:
- Combat/raids (peaceful game)
- Stamina system (no stamina)
- Biome bosses (no enemies)
- Complex building physics (simpler structural rules)
- Death/respawn penalties (no punishment)

**Test**: Ghost placement shows valid/invalid clearly, snapping works

---

## Slime Rancher

**What we copy**:
- Squishy creature feel through soft-body physics
- Readable wobble and squish animations
- Joyful pickup mechanics (items fly to player)
- Cute, expressive creature
- Collection loop with visual feedback

**What we do NOT copy**:
- Ranch management (no NPC slimes)
- Economy/currency (no money)
- Day/night event schedule (simpler weather)
- Large open world (smaller, focused world)
- Slime types with unique diets (all forms can do everything)

**Test**: Slime feels squishy and joyful, pickups fly to player

---

## Journey

**What we copy**:
- Wind and sand flow visual effects
- Calm, ambient music mood (audio in R5)
- Gliding downwind feeling
- Environmental storytelling (ruins, landmarks)
- Minimal UI during exploration

**What we do NOT copy**:
- Linear narrative (open exploration)
- Multiplayer companion (single-player)
- Scarf mechanic (no progression item)
- Ancient language (no decoding puzzles)
- Endgame transformation (forms are permanent)

**Test**: Wind feels real, gliding is satisfying

---

## Raft

**What we copy**:
- Building on and over water
- Floating foundations (raft pieces in R4)
- Ocean setting (sea in R3)
- Resource gathering from water
- Cozy building on the waves

**What we do NOT copy**:
- Shark threats (no enemies)
- Hunger/thirst (no survival)
- Island hopping progression (fixed world)
- Crafting research tree (simpler recipes)
- Current-based navigation (currents are Ride-only)

**Test**: Raft pieces float and snap, building on water works

---

## Unique to Aetheria

**Original elements**:
- Three-form system (Slime, Wisp, Stone) with form-switching
- Every form can do every verb (advantages only, no disadvantages)
- Per-form water perks (slime skip-dash, wisp skimming, stone seabed walking)
- Core system (inventory and form identity survive switches)
- Hybrid world (landmass + sea + sky islands)
- Biome-blended terrain with smooth transitions
- Weather per biome with independent state machines
- Wind that only affects you while Riding (Rule 4)
- No punishment mechanics (no damage, no drowning, no hunger)
- Local saves with profile and build persistence
- Customization with cosmetics and procedural fallbacks

**Test**: Three-form system works, all verbs available to all forms
