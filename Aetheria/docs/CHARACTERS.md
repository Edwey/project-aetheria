# CHARACTERS.md - The Nine Forms, Verbs, Physics Data & Controls (v4)

## Overview

Aetheria features three creature families (Slime, Wisp, Stone), each with three distinct, always-available forms (nine forms total). Every creature possesses a persistent Core that preserves orientation, inventory, and building state across form transitions.

**Pillars & Rules:**
1. **Forms as Pure Data (Phase 5b)**: All nine forms obey universal physics laws. Differences stem from physical data tables (mass, relative density, drag, restitution, tanks), never special-case hacks.
2. **Fairness**: Every active ability is bounded by a physical resource tank or condition. An exhausted ability remains locked until the activating key is released.
3. **Universal Movement Verbs**: Every form can **walk**, **jump**, **climb**, **glide**, and **hop**. Numbers are tuned by mass, relative density, and aerodynamic drag.
4. **Units**: Every density is relative to water ($\text{water} = 1.0$). Real water density ($1000\text{ kg/m}^3$) is used only inside the quadratic water drag formula.

---

## The Nine Forms Matrix

Switch creature family with `1, 2, 3`; cycle the active family's forms with `Z`.

| Creature | Form | Mass (kg) | Relative Density ($\text{water} = 1$) | Restitution | Primary (`J`) | Secondary (`K`) | Physical Trait & Unique Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Slime** | **Oobleck** | 1.2 | 1.12 | 0.85 (Bounce champion) | Squeeze through grates (`J` hold) | Firm bounce (`K` hold) | Firm, elastic; planes on water (lift starts at 3.5 m/s, fully on top >5 m/s); squeezes narrow slots under pressure. |
| **Slime** | **Dewdrop** | $1.2 + 0.8 B$ | $0.8 + 0.19 B$ | $0.6 \times (1 - \text{splat})$ | Soften & absorb impacts (`J`) | Rocket water jet (`K` hold) | Soft, impact-absorbing; soaks water as ballast ($B \in [0, 1]$); jet follows rocket equation; splats when full of ballast. |
| **Slime** | **Aether Bubble** | 0.4 | 0.25 | 0.50 (Airy hang) | Inflate lift pulse (`J` tap) | Float drift (`K` hold) | Airy, not springy: very light, low momentum, low gravity ($0.35g$); long hang time, slow falls; rides thermals. |
| **Wisp** | **Mist** | 0.15 | 0.08 | 0.10 | Phase through gates (`J` hold) | Drift whisper (`K` hold) | Gaseous dispersion; hovers naturally over water; permeable through solid barred gates. |
| **Wisp** | **Zephyr** | 0.25 | 0.12 | 0.20 | Whirl lift pulse (`J`) | Sustained gust dash (`K` hold) | Aerodynamic stream; sustained gust pushes and shoves movable physics props (crates/boulders). |
| **Wisp** | **Lantern** | 0.80 | 0.05 → 2.40 | 0.30 | Luminescence flare (`J`) | Condense hard-light (`K` hold) | Condenses into hard-light (density rises to 2.4); sinks deeper longer held; light solidifies spectral stairs. |
| **Stone** | **Aerolite** | 1.5 | 0.55 | 0.30 | Pumice hop (`J`) | Skim glide (`K` hold) | Pumice-light rock (density < 1.0 floats); skims water efficiently at speed. **Lift magic:** couples to currents like an air creature. |
| **Stone** | **Geode** | 3.5 | 2.60 | 0.25 | Roll brake (`J` hold) | Acceleration boost (`K` hold) | Near-zero friction; boost adds pure forward acceleration without speed cap; core glows with boost charge. |
| **Stone** | **Obsidian** | 9.0 | 5.00 | 0.00 (Zero bounce) | Immovable anchor (`J` hold) | Ground slam & shove (`K`) | Dense gravity anchor; immovable when anchored; shoves boulders/crates; sinks rapidly. |

*$B$ is Dewdrop's current ballast resource level ($0.0$ to $1.0$). Splat formula: $\text{splat} = \text{smoothstep}(0.45, 0.85, B)$.*

---

## Form Identity & Physics Rules

### 1. Bounce Dynamics
- **Restitution Ordering**: Oobleck (0.85) > dry Dewdrop (0.60) > Aether Bubble (0.50) > Aerolite (0.30) > Geode (0.25) > Obsidian (0.00).
- **Dewdrop Ballast Splat**: When dry ($B = 0$), Dewdrop is bouncy (restitution 0.6). As ballast soaks up water, restitution drops to 0; at high ballast it splats flat on impact, cutting impact velocity and emitting splash droplets.
- **Airy Bubble**: Aether Bubble is airy rather than springy. Low momentum and high air drag create slow falls and long hang times, not explosive rebounds.
- **Velocity Gating**: Bounce triggers only above threshold impact speeds (slimes bounce from $1.5\text{ m/s}$, other forms from $3.0\text{ m/s}$).
- **Submersion Rule**: Bounce is completely disabled while submerged.

### 2. Universal Water Movement
- **No Underwater Glide**: Gliding, hovering-glide, and crystal sails are disabled whenever the submerged fraction exceeds $8\%$.
- **Universal Swimming**:
  - `WASD`: Paddles through water with $\sim 9\text{ m/s}^2$ drive force ($7\text{ m/s}^2$ for Lantern and Geode, $5\text{ m/s}^2$ for Obsidian).
  - `Space`: Strokes upward up to $3.0\text{ m/s}$.
  - Speed is naturally set by quadratic water drag ($\vec{F}_{\text{drag}} = \frac{1}{2} \rho_w v_{\text{rel}}^2 C_d A$).
- **Lakebed Walking**: Dense forms (Geode, Obsidian) sink to the floor, walk along the bed, and can jump upward from it. Obsidian does not stroke upward.
- **Planing Lift**: Above $3.5\text{ m/s}$ horizontal speed in the surface boundary layer, planing hydrodynamic lift allows dense skimming forms (Oobleck, Aerolite) to run across water without sinking.
- **Gas Hover**: Wisp forms naturally hover over the water surface by their own physical density and breath mechanics.

### 3. Aerolite Lift Magic
Aerolite maintains a solid stone body (mass $1.5\text{ kg}$, stone drag, rigid collisions), but its aerodynamic coupling is uniquely tuned to behave like an air creature:
- Updrafts, thermals, downdrafts, and gales carry it using a dedicated air coupling coefficient instead of $1 / \text{mass}$.
- Sparkles visually with radiant motes inside thermals.

### 4. Universal Moor Rule
When a creature is grounded and receives no player input, an automatic moor force cancels ambient wind force up to a safety threshold. No creature is ever pushed around or drifted helplessly while idle.

---

## Universal Movement Verbs

All nine forms support the same core movement verbs:
1. **Walk / Roll / Drift**: Omnidirectional horizontal drive with form-specific acceleration, braking, and surface friction.
2. **Jump / Hop**: Charge jump or impulse hop. Jump ascent is protected by an anti-grab guard: rising bodies are never clamped or snapped to vertical walls or ledges for the first $0.5\text{ s}$ of airtime.
3. **Climb**: Universal vertical surface navigation:
   - Slimes use viscoelastic deformation and surface adhesion.
   - Wisps use ascending updraft drift along wall boundaries.
   - Stone forms use rigid piton wedging ($2\text{ m/s}$, hangs without slipping when idle).
4. **Glide**: Air resistance creates steady descent capped at terminal velocity ($v_{\text{term}} = \sqrt{\frac{g \cdot m}{k_d A}}$).
5. **Swim**: Surface swimming, planing skims, and deep bed exploration.

---

## Resource Tanks & Fairness Specifications

Every ability is bounded by physical resource tanks with a strict lockout state machine: when an ability tank empties, it enters `Exhausted` state and will NOT refill until the player releases the activating key.

| Resource Tank | Associated Form | Capacity | Consumption Rate / Cost | Refill Condition & Rate | Fairness Locking Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ballast Tank** | Slime: Dewdrop | 1.0 ($+0.8\text{ kg}$) | Empties in ~2.5 s of jet ($\dot{m} = 0.40\text{ /s}$) | Refills **only** when submerged in water ($+0.50\text{ /s}$). Zero dry refill. | When empty, thrust cuts off. Locked until `K` is released. |
| **Air Tank** | Slime: Aether Bubble | 1.0 | Tap `J` costs 0.35 air per lift pulse | Passive ambient recharge ($+0.12\text{ /s}$). 0.6 s cooldown between taps. | If air < 0.35, inflate is locked. Re-arms when air $\ge 0.35$ and cooldown expires. |
| **Breath Tank** (Shared) | Wisp: Mist | 100.0 | Phase hold (`J`): ~8 s budget ($12.5\text{ /s}$) | Ground/water proximity ($+25.0\text{ /s}$). Refill paused while any key held. | When breath hits 0, phase breaks. Locked until `J` released. |
| **Breath Tank** (Shared) | Wisp: Zephyr | 100.0 | Gust dash (`K`): ~5 s budget ($20.0\text{ /s}$) | Ground/water proximity ($+25.0\text{ /s}$). Refill paused while any key held. | When breath hits 0, dash halts. Locked until `K` released. |
| **Breath Tank** (Shared) | Wisp: Lantern | 100.0 | Hard-light (`K`): ~8 s budget ($12.5\text{ /s}$) | Ground/water proximity ($+25.0\text{ /s}$). Refill paused while any key held. | When breath hits 0, hard-light de-condenses. Locked until `K` released. |
| **Breath Tank** (Shared) | Wisp: Any Form | 100.0 | Space-rise: $20.0\text{ /s}$ | Ground/water proximity ($+25.0\text{ /s}$). Refill paused while any key held. | Space-rise disabled when breath hits 0. Locked until `Space` released. |
| **Boost Energy** | Stone: Geode | 100.0 | Boost hold (`K`): 5 s budget ($20.0\text{ /s}$) | Refills ($+20.0\text{ /s}$) **only** after speed decays to base speed ($< 6.0\text{ m/s}$). | When empty, boost cuts out. Recharging blocked while moving above base speed. |
| **Resolve Tank** | Stone: Obsidian | 100.0 | Anchor hold (`J`): ~5 s budget ($20.0\text{ /s}$) | Continuous recharge ($+25.0\text{ /s}$) once `J` key is released. | Anchor forced release at 0 resolve. Cannot re-anchor until `J` is released and resolve $> 20$. |

---

## Universal Controls & Key Mapping

| Action | Keyboard / Mouse | Touch Overlay | Description |
| :--- | :--- | :--- | :--- |
| **Move** | `WASD` / Arrow keys | Virtual joystick | Omnidirectional horizontal locomotion |
| **Jump / Rise** | `Space` | Jump button | Tap to hop; hold Space to rise (costs breath for Wisp, weakly scaled with mass for others) |
| **Primary Action (`J`)** | `J` (hold / tap) | Action J button | Form-specific primary action (e.g., Oobleck squeeze, Bubble inflate, Mist phase, Obsidian anchor) |
| **Secondary Action (`K`)** | `K` (hold) | Action K button | Form-specific secondary action (e.g., Dewdrop jet, Zephyr dash, Lantern condense, Geode boost, Obsidian slam) |
| **Cycle Form** | `Z` | Cycle button | Advances to the next form within the current creature family |
| **Select Family** | `1`, `2`, `3` | Form pills (1-3) | `1`: Slime, `2`: Wisp, `3`: Stone |
| **Camera Orbit** | Right drag / `Q`, `E` | Touch drag | Orbit camera 360° |
| **Zoom** | Mouse wheel | Pinch | Adjust camera focal distance |

---

## Purely Cosmetic Body Shapes & Attachments

Each creature family offers exactly three interchangeable body shapes that are **purely cosmetic**, sharing identical physical collision volumes, masses, and buoyancy:

1. **Slime Shapes**:
   - **Blob**: Classic amoebic droplet with surface tension ripples.
   - **Ball**: Smooth spherical jelly with balanced wobble.
   - **Cube**: Rounded voxel gelatin block with edge beveling.
2. **Stone Shapes**:
   - **Round**: Smooth weathered cobble boulder.
   - **Crystal**: Sharp faceted geometric geode cluster.
   - **Block**: Chiseled architectural monolith with clean chamfers.
3. **Wisp Shapes**:
   - **Cloud**: Soft billowing aerosol puff of swirling motes.
   - **Fireflies**: Orbiting luminous constellation of ember nodes.
   - **Plume**: Elongated trailing spirit flame with head and tail.

**Spring-Physics Accessories**:
- Attachments (hats, backpacks, charms) utilize 3-DOF damped spring-mass dynamics.
- Accessories respond to body acceleration, wobble on hard landings, and experience increased hydrodynamic drag when submerged in water.
- Attachments possess zero collision volume and zero additional mass, maintaining absolute physical gameplay parity.
