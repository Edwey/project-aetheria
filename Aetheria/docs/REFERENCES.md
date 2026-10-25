# REFERENCES.md — Reference Games and What We Borrow

Aligned with `AETHERIA_MASTER_PLAN.md` (v4).

---

## 1. Animal Crossing

**What we borrow**:
- Cozy, welcoming aesthetic with soft, warm color tones.
- Rounded, tactile UI design with responsive micro-animations.
- Gentle day/night transitions and atmospheric ambient shifts.
- Satisfying auditory feedback on UI clicks and interactions.
- Peaceful, non-punitive gameplay loop centered on exploration and collecting.

**What we do NOT copy**:
- Real-time 24-hour clock synchronization (we use an in-game day/night cycle).
- NPC villagers or dialogue trees (single-player solitary sandbox).
- Debt, loans, or currency systems (no in-game economy).
- Daily reset chore mechanics.

---

## 2. A Short Hike

**What we borrow**:
- Joyful movement feel: climbing, gliding, and ascending peaks.
- Readable, dense small-scale world where landmarks are always visible.
- Tight vertical exploration loops (spot a peak $\to$ navigate path $\to$ glide down).
- Responsive isometric/third-person camera feel with gentle framing.

**What we do NOT copy**:
- 2D pixelated sprite billboarding (we use clean low-poly 3D meshes).
- Narrative quests and conversation dialogue.
- Golden feather stamina locks (we have no stamina limit for basic exploration).

---

## 3. Minecraft

**What we borrow**:
- Gather, craft, build loop with simple, clear recipes.
- Modular building system with clean grid and surface snapping.
- Harvesting raw resources directly from environmental props (timber, stone, clay).
- Creative freedom to place structures and decorate the landscape.

**What we do NOT copy**:
- Voxel block terrain (we use continuous smooth heightmap terrain).
- Infinite procedural world (fixed, hand-crafted ~280m island).
- Survival hunger, health, mob attacks, and death mechanics.
- Complex redstone electrical logic.

---

## 4. Valheim

**What we borrow**:
- Snapping structural pieces for building (foundations, walls, posts, roofs).
- Clear placement feedback (green/red holographic placement indicator).
- Building on organic, uneven terrain without clipping issues.

**What we do NOT copy**:
- Brutal combat, raids, and boss gating.
- Punishing stamina constraints during running or jumping.
- Death penalties or corpse runs.
- Structural stability stress physics.

---

## 5. Slime Rancher

**What we borrow**:
- Squishy, tactile creature feel driven by physics and procedural squish.
- Delightful pickup mechanics (nearby items gently magnetize and pop into inventory).
- Expressive, playful character animations and bouncy responses.

**What we do NOT copy**:
- Ranch management and corral containment.
- Economy, plort markets, and currency.
- Strict feeding schedules and angry tarr monsters.

---

## 6. Journey

**What we borrow**:
- Flowing wind visual ribbons and desert sand atmospherics.
- Uplifting glide physics down canyons and over dunes.
- Calm, evocative environmental storytelling through ancient ruins and arches.
- Minimalist HUD that preserves immersion.

**What we do NOT copy**:
- Linear progression through strictly separated levels.
- Scarf length progression locks.
- Multiplayer matchmaking.

---

## 7. What is Unique to Aetheria

- **Nine Permanent Forms in Three Families**: Slime (Oobleck, Dewdrop, Aether Bubble), Wisp (Mist, Zephyr, Lantern), and Stone (Aerolite, Geode, Obsidian) — all accessible from minute one.
- **Universal Verbs with Distinct Physics**: Every form can move, jump, glide, squeeze, cling, and swim. Forms differ by weight, friction, bounce, and signature abilities (J/K).
- **Rule 4 (Steady Wind & Water)**: Wind, currents, and thermals are neutral and harmless by default. They only carry or boost the player when holding **Shift (Ride)**. Headwinds never slow you down.
- **One Continuous Compact Island**: Sprint across in ~90 seconds; no sky islands, no artificial loading zones. Every region visible from the central ridge.
- **Four Distinct Ecological Regions**: The Shimmering Coast, Whispering Pines, Sunbaked Crags, and The Bioluminescent Basin.
- **Complete Peace of Mind**: Single-player, zero combat, zero death, zero health bars, zero inventory loss.
- **Robust Local Persistence**: IndexedDB multi-save system with three rolling slot backups and staged JSON import validation.
