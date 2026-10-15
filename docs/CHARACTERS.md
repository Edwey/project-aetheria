# CHARACTERS.md - Forms, Core, Verbs, Controls, and Numbers

## The Three Forms

Every creature has a Core that keeps it together and is where items fly in. The Core and inventory survive form switches.

### Slime (Liquid Form)

**Core**: Shape-match centre (the centre of the shape-matching target)

**Body**: Soft body by position-based dynamics
- Full quality: 642 particles
- Light quality: 162 particles
- Shape presets: blob, goo, jelly ball, jelly cube
- Preset configurations (from prototype):
  - blob: stiff=0.22, pressure=1.0, skin=0.9, grip=0.55, sticky=0.5
  - goo: stiff=0.10, pressure=1.0, skin=0.45, grip=0.8, sticky=0.8
  - ball: stiff=0.40, pressure=1.0, skin=0.9, grip=0.5, sticky=0.3
  - cube: stiff=0.45, pressure=1.0, skin=0.9, grip=0.5, sticky=0.3

**Abilities**:
- **Jump**: Charge jump (hold Space 0 to 0.85s, release)
  - Tap Space: ~0.5m rise
  - 0.3s hold: ~1.6m rise
  - 0.85s hold: ~5.3m rise
  - Base jump power (JMIN): 4.5
  - Max jump power (jmax): 15 (default), scales with profile.body.jmax
- **Climb**: Sticky wall climb (3 m/s)
  - Can climb walls with normal < 0.6 and > -0.3 when pushing into them
  - Can cling to overhangs for 1.5s budget
- **Glide**: Hold Space in the air
  - Fall cap: -2.2 m/s
  - Glide control: 0.9 of full control in air
  - Speed multiplier: 1.3x while gliding
- **Melt** (M key): Flatten into puddle
  - Scale shrinks to 0.65
  - Height < 0.6m when fully melted
  - Form back above 0.85m
  - Sticky climbing disabled while melting
- **Spring** (C key): Coiled spring
  - Jump power multiplied by 1.35
- **Ground Pound** (F key): Smash downward
  - Produces shockwave on landing
- **Heart** (H key): Pop heart effect
- **Hover**: Brief float at jump peak
  - Duration: 0.8s
  - Activates when contacts >= 3 and avgN[1] > 0.5

**Physics Constants** (from Phys.js):
- Gravity (G): -20 m/s²
- Particle radius (RP): 0.07 m
- Collision margin (MARGIN): 0.03 m
- Substeps (SUB): 4
- Constraint iterations (ITERS): 3
- Shrink factor (SHRINK): 0.35
- Charge time (CHARGE_T): 0.85 s
- Min jump power (JMIN): 4.5
- Max speed (MAXSPEED): 6 m/s
- Drive force (DRIVE): 16
- Damping (DAMP): 3
- Squash force (SQUASH): 75
- Climb force (CLIMB): 36
- Max displacement per substep (MAXD): 0.09 m

**Perks**:
- Sticky climbing: Can climb walls other forms cannot
- Melt: Can squeeze through small gaps
- Higher hover duration (0.8s vs 0.5s for stone)
- Sticky harvest: Extra sap from trees

---

### Wisp (Gas Form)

**Core**: Tether centre (motes never farther than 2.2m from centre)

**Body**: Cloud of motes
- Full quality: 96 motes
- Light quality: 48 motes
- Radius: ~0.6m
- Self-organized with cohesion and repulsion

**Abilities**:
- **Jump**: Tap Space for free hop
  - Hop velocity: +6 m/s upward
  - Free (no breath cost)
- **Rise**: Hold Space to rise
  - Breath cost: 20 per second
  - Full breath = 5s of rising
  - Stops when breath runs out
  - Free when on ground or within 1.4m of it
- **Float** (V key): Hold altitude
  - Breath cost: 3 per second
  - Full breath = ~33s of floating
  - Switches off when breath runs out
  - Rain slows drain to 1/3
- **Sink**: Default behavior when not rising or floating
  - Sinks gently at 2.5 m/s
  - Costs nothing
  - Always comes down eventually
- **Down-gust** (F key): Puff then dive
  - Puff on ground: +9 m/s upward, queues dive
  - Dive in air: velocity set to -22 m/s downward
  - Produces one shockwave on landing
  - Safety: never stuck in dive (2s timeout)
- **Condense** (C key): Tighten cloud
  - Cohesion multiplied by 4
  - Repulsion reduced
  - Speed multiplier: 1.4x
- **Diffuse** (M key): Spread cloud
  - Cohesion multiplied by 0.3
  - Repulsion increased
  - Speed multiplier: 0.6x
- **Wall-hug climb**: Drift up walls at 3 m/s when pushing into them
- **Heart** (H key): Pop heart effect

**Physics Constants** (from Wisp.js):
- Substeps (SUB): 2
- Hash grid size (HS): 1024
- Max speed (MAXSPEED): 5 m/s
- Acceleration (ACCEL): 14
- Particle radius (PR): 0.12 m
- Wind cap (WIND_CAP): 10 m/s
- Tether distance (TETHER): 2.2 m
- Float cost (FLOAT_COST): 20 per second
- Hover cost (HOVER_COST): 3 per second
- Float refill rate (FLOAT_REFILL): 60 per second
- Low height threshold (LOW_H): 1.4 m
- Sink speed (SINK): 2.5 m/s

**Perks**:
- Wall-hug climbing: Can climb walls by pushing into them
- Float: Can hold altitude indefinitely (with breath)
- Diffuse: Spread out to fit through gaps
- Skimming: Skimming over water counts as "low" (breath refills)
- Diving: Can dive into water as mist at normal speed
- Gust-slam: Multiple motes striking a trunk fast enough shakes it
- Wider reach: 7m reach for harvesting (vs 4.5m for slime/stone)
- Pull-in: Absorbs flowers from 2.75m away (vs 1.1m for slime/stone)

---

### Stone (Solid Form)

**Core**: Rigid centre

**Body**: Slime body at full stiffness
- Full quality: 642 particles
- Light quality: 162 particles
- Shape: Always sphere (cube shape inherits stiffness from stone preset)
- Stiffness: 1.0 (fully rigid)
- Skin: 1.0
- Sticky: 0 (no sticky climbing)
- Grip: 0.35 (reduced)
- Wind multiplier: 0.5 (less affected by wind)
- Speed multiplier: 1.1x

**Abilities**:
- **Jump**: Charge jump (hold Space 0 to 0.85s, release)
  - Base jump power: 4.5
  - Max jump power (jmax): 15 * 0.85 = 12.75 (reduced)
  - Same mechanics as slime but reduced power
- **Climb**: Piton climbing
  - Climb speed: 2 m/s
  - Can hang without slipping when not pushing
  - Push into wall to climb, stop pushing to hang
- **Glide**: Crystal sail (hold Space in the air)
  - Fall cap: -3 m/s (slower fall than slime)
  - Free landing shockwave (one shockwave on landing)
- **Pebble** (M key): Shrink to fit gaps
  - Scale shrinks to 0.65
  - Height < 0.6m when pebble
  - Form back when released
- **Ground Pound** (F key): Smash downward
  - Same as slime
- **Heart** (H key): Pop heart effect
- **Hover**: Brief float at jump peak
  - Duration: 0.5s (shorter than slime)
  - Activates when contacts >= 3 and avgN[1] > 0.5
- **Rolling**: Rolling cracks geodes and clay
  - Must roll faster than 5 m/s
  - Contact with geode/clay within 1.0m horizontally, 1.2m vertically

**Perks**:
- Piton climbing: Can hang on walls without slipping
- Crystal sail: Slower fall cap (-3 vs -2.2)
- Free landing shockwave: Glide landing produces shockwave
- Pebble: Can shrink to fit through gaps
- Rolling: Cracks geodes and clay by rolling into them
- Stack cap: 80 items (vs 40 for slime/wisp)
- Lowest hit speed: More resilient to impacts
- Seabed walking: Sinks to seabed and walks at full ground speed (R3+)
- Ignores currents: Unaffected by water currents (R3+)

---

## Shared Mechanics

### Core and Inventory
- Every creature has a Core that keeps it together
- Items fly into the Core when gathered
- The Core and inventory survive form switches
- Core types (cosmetic): crystal, star, heart, gold flakes

### Wind and Currents (Rule 4)
- **Steady by default**: Wind and currents never move, slow, or lift you
- **Ride (Shift)**: Hold Ride to let wind/currents carry and boost you
  - Tailwinds: Up to +40% speed boost
  - Headwinds: Never slow you (projected component cancelled)
  - Updrafts: Lift you (only while Riding)
- Ride strength multiplier:
  - Slime: 1.0
  - Stone: 0.5
  - Wisp: 1.0 (but 5x more affected by wind in general)

### Idle Brake
- Idle brake: 25/s when on ground and not moving
- Prevents drifting when AFK
- Does not apply when Riding

### Harvesting
- Harvest by hit type:
  - Impact: Slime/stone hitting flora at speed
  - Pound: Ground pound near flora
  - Absorb: Wisp passing through flowers
- Hit speed thresholds:
  - Slime: 3.2 m/s
  - Wisp: 3.0 m/s
  - Stone: 2.6 m/s
- Cooldown: Slime/stone 7s, stone 3s

### Crafting
- Pocket recipes: Craftable anywhere
- Bench recipes: Require workbench within 5m
- Stack caps: Stone 80, Slime/Wisp 40

### Building
- Ghost preview (green = valid, red = invalid)
- Snapping: Foundations snap to grid, walls snap to foundation edges
- Sockets: Pieces snap to valid positions
- Stilts: Shallow water foundations have stilts to bed (R4+)
- Roof and wall fade: Fade when creature is inside
- Reach: Slime/stone 4.5m, Wisp 7m

### Cosmetics
- 5 slots: head, face, back, aura, trail
- Procedural primitives as default
- Optional CC0 hat models (R5+)

### Emotions
- 10 states: neutral, sleepy, cozy, happy, sad, curious, excited, proud, love, surprised
- Manual: 8 emotions bound to keys 1-8
- Automatic: Triggered by gameplay events
- Eye styles: oval, round, sparkle, sleepy
- Mouth styles: smile, dot, cat

### Customization Profile
- Name: Up to 16 characters
- Form: slime, wisp, stone
- Look:
  - Top/bottom colors (hex)
  - Translucency: 0.3-0.95
  - Gloss: 0-1
  - Size: 0.7-1.4x
  - Eye style and color
  - Mouth style
  - Core type
- Body parameters:
  - Preset: blob, goo, ball, cube
  - Stiffness: 0-1
  - Pressure: 0.6-1.5
  - Skin tension: 0.05-1
  - Grip: 0-1
  - Sticky: 0-1
  - Max jump: 8-20

### Local Save
- Profile: localStorage (key: aetheria.profile.v1)
- Game save: localStorage + IndexedDB for large data (key: aetheria.save.v1)
- Saves: Inventory, build pieces per terrain, profile
- Auto-save: 500ms debounce
- Flush on pagehide/beforeunload

---

## Controls Summary

| Action | Keyboard | Touch | Notes |
|--------|----------|-------|-------|
| Move | WASD/Arrows | Left joystick | - |
| Jump | Space (tap/hold) | Jump button | Charge for height (slime/stone), free hop (wisp) |
| Glide/Rise | Hold Space in air | - | Glides (slime/stone) or rises (wisp) |
| Float | V | Float button | Wisp only: hold altitude |
| Ride wind | Shift | Ride button | Carried by wind/currents |
| Switch form | Tab | - | Cycles: slime → wisp → stone |
| Melt/Diffuse | M | Melt button | Slime melt, stone pebble, wisp diffuse |
| Spring/Condense | C | - | Slime spring, wisp condense |
| Ground pound/Down-gust | F | Pound button | Slime/stone pound, wisp down-gust |
| Heart | H | - | Pop heart effect |
| Build mode | P | - | Toggle build mode |
| Select piece | [ ] | - | Cycle build pieces |
| Rotate piece | X | - | Rotate ghost 90° |
| Place piece | Enter | Tap canvas | Place at ghost location |
| Remove piece | Delete/Backspace | - | Remove nearest piece |
| Emotes | 1-8 | - | Manual emotions |
| Rotate camera | Q/E | - | Rotate 90° |
| Zoom | Mouse wheel | - | In/out |
| Respawn | R | - | Return to spawn |
| Slow-mo | T | - | Toggle slow motion |
| Wind debug | B | - | Toggle wind arrows |

---

## Physics Constants Summary

| Constant | Value | Unit | Notes |
|----------|-------|------|-------|
| G (gravity) | -20 | m/s² | Physics gravity |
| RP (particle radius) | 0.07 | m | Slime particle radius |
| MARGIN | 0.03 | m | Collision margin |
| SUB | 4 | - | Physics substeps per frame |
| ITERS | 3 | - | Constraint iterations |
| CHARGE_T | 0.85 | s | Max jump charge time |
| JMIN | 4.5 | m/s | Min jump power |
| MAXSPEED | 6 | m/s | Max speed (slime/stone) |
| DRIVE | 16 | m/s² | Drive force |
| DAMP | 3 | 1/s | Damping factor |
| SQUASH | 75 | m/s² | Squash force |
| CLIMB | 36 | m/s² | Climb force |
| MAXD | 0.09 | m | Max displacement per substep |
| FIXED | 1/60 | s | Fixed timestep |
| WISP_MAXSPEED | 5 | m/s | Wisp max speed |
| WISP_ACCEL | 14 | m/s² | Wisp acceleration |
| WISP_TETHER | 2.2 | m | Wisp tether distance |
| WISP_FLOAT_COST | 20 | 1/s | Wisp rise breath cost |
| WISP_HOVER_COST | 3 | 1/s | Wisp float breath cost |
| WISP_REFILL | 60 | 1/s | Wisp breath refill on ground |
| WISP_LOW_H | 1.4 | m | Wisp "on ground" height threshold |
| WISP_SINK | 2.5 | m/s | Wisp sink speed |

---

## Form Comparison Table

| Verb | Slime | Wisp | Stone |
|------|-------|------|-------|
| Move | 6 m/s | 5 m/s | 6.6 m/s (1.1x) |
| Jump (tap) | 0.5m | Free hop (+6 m/s) | ~0.4m (reduced) |
| Jump (full) | 5.3m | N/A | ~4.5m (reduced) |
| Climb | Sticky (3 m/s) | Wall-hug (3 m/s) | Pitons (2 m/s, hang) |
| Glide | Fall cap -2.2 m/s | N/A | Fall cap -3 m/s |
| Squeeze | Melt (0.65x) | Diffuse (spread) | Pebble (0.65x) |
| Hover | 0.8s | N/A | 0.5s |
| Gather reach | 4.5m | 7m | 4.5m |
| Craft | Bench or pocket | Bench or pocket | Bench or pocket |
| Build reach | 4.5m | 7m | 4.5m |
| Swim (R3+) | Surface, skip-dash | Skim, dive mist | Walk seabed |
| Emote | All 10 | All 10 | All 10 |
| Stack cap | 40 | 40 | 80 |
| Wind ride | 1.0x | 1.0x (5x affected) | 0.5x |
