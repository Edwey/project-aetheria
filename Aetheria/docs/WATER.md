# WATER.md — Water Bodies, Hydrodynamics, Per-Form Interactions

Aligned with `AETHERIA_MASTER_PLAN.md` (v4). Desktop browser only.

---

## 1. Core Water Philosophy

Water in Aetheria is an inviting playground, not an obstacle or hazard:
- **No Drowning & No Damage**: Forms can remain submerged indefinitely without penalty.
- **No Forced Penalties**: Water never artificially slows or traps any form.
- **Physics-Driven Buoyancy**: Density, displacement, and form shapes govern whether a creature floats, skims, or walks along the floor.
- **Steady Currents (Rule 4)**: Rivers and ocean currents are neutral by default. They never sweep you away or disrupt movement unless you hold **Shift (Ride)** to harness their downstream speed boost. Headwinds/upcurrents never slow you down.

---

## 2. Water Bodies Across the Four Regions

The island features distinct aquatic environments integrated into the four regions:

| Region | Water Feature | Characteristics |
| :--- | :--- | :--- |
| **The Shimmering Coast** | Ocean Border & Tide Pools | Endless turquoise sea surrounding the island; shallow tide pools ($0.3\text{ m}$–$1.0\text{ m}$) with sea shells and kelp; gentle beach surf. |
| **Whispering Pines** | Mountain Streams & Alpine Tarn | Clear alpine lake ($2\text{ m}$–$4\text{ m}$ depth) fed by rushing granite streams; rapid downstream current vectors; cold mist. |
| **Sunbaked Crags** | Oasis & Wadis | Palm-fringed desert oasis spring; dry wadi gullies that channel flash water during regional rainstorms. |
| **The Bioluminescent Basin** | Shallow Marsh & Sunken Channels | Murky, bioluminescent swamp ($0.5\text{ m}$–$1.5\text{ m}$); glowing reed beds; floating lily-pad platforms; subterranean caverns. |

---

## 3. Universal Water Controls

| Input | In-Water Action | Notes |
| :--- | :--- | :--- |
| **`W`, `A`, `S`, `D`** | Swim / Paddle / Bed-Walk | Horizontal directional propulsion through water or along lakebed |
| **`Space`** | Upward Stroke / Bed-Jump | Strokes upwards toward surface (or jumps if grounded on floor) |
| **`Shift` (Hold)** | Ride Current | Aligns with flow vector for up to $+40\%$ speed boost; no slowdown upstream |
| **`J`** | Primary Ability | Form-specific ability (e.g. bounce, anchor, light pulse) |
| **`K`** | Secondary Ability | Form-specific utility (e.g. water jet, gust, hard-light condense) |

---

## 4. Per-Form Water Interactions (9 Forms)

### Slime Family
- **Oobleck** (Shear-Thickening):
  - *Density*: $1.12$ (sinks gently when idle).
  - *Behavior*: Planing hydrodynamic lift engages at speeds $> 3.5\text{ m/s}$. When sprinting or hopping fast across water, Oobleck solidifies on impact and runs cleanly across the surface without submerging.
- **Dewdrop** (Water Absorber):
  - *Density*: $0.80 \to 1.05$ (varies with soaked ballast).
  - *Behavior*: Naturally floats when light. Holding `K` absorbs surrounding water to gain weight; tapping or holding `K` again exhausts stored water in a high-velocity rocket jet for vertical or forward propulsion.
- **Aether Bubble** (Pure Buoyancy):
  - *Density*: $0.20$ (super buoyant).
  - *Behavior*: Bobs high on water surface like a soap bubble. Never sinks. Space or `J` triggers high buoyant bounces off waves.

### Wisp Family
- **Mist** (Vapor Dispersion):
  - *Density*: $0.08$.
  - *Behavior*: Glides effortlessly over water surfaces with zero drag. Skimming close to water replenishes float duration and stamina meter.
- **Zephyr** (Wind Current):
  - *Density*: $0.12$.
  - *Behavior*: Skims surface while generating miniature water ripples. Holding `K` fires a directional gust that pushes floating crates, logs, and lily pads across lakes.
- **Lantern** (Hard-Light Core):
  - *Density*: $0.05$ (standard) $\to 2.40$ (condensed).
  - *Behavior*: Normally hovers over water. Holding `K` condenses light into hard matter, causing Lantern to sink down to the seabed. Underwater, its intense glow reveals hidden seabed geode deposits and sunken paths.

### Stone Family
- **Aerolite** (Porous Pumice):
  - *Density*: $0.55$ ($< 1.0$, floats naturally).
  - *Behavior*: Pumice stone that floats and bobs like driftwood. Skims surface with water currents and thermals.
- **Geode** (Hollow Crystal Sphere):
  - *Density*: $2.60$.
  - *Behavior*: Plunges smoothly to the lakebed or seabed. Walks along the floor with full ground traction. Can jump off the seabed to ascend.
- **Obsidian** (Super-Dense Bed Anchor):
  - *Density*: $5.00$.
  - *Behavior*: Sinks immediately like an iron weight. Walks along deep seabed undisturbed. Holding `J` anchors immovably into underwater substrate, allowing it to withstand extreme river rapids.

---

## 5. Hydrodynamics & Current Math

### Quadratic Drag & Buoyancy
For immersed particles or rigid bodies:
$$\vec{F}_{\text{buoyancy}} = \rho_w \cdot V_{\text{submerged}} \cdot g \cdot \hat{y}$$
$$\vec{F}_{\text{drag}} = -\frac{1}{2} \cdot \rho_w \cdot |\vec{v}_{\text{rel}}| \vec{v}_{\text{rel}} \cdot C_d \cdot A$$

### River Flow & Steady Current (Rule 4)
Current vectors $\vec{C}(x, z)$ are defined by spline flow fields along river courses:
- **Default State**: Player velocity is unaffected by $\vec{C}$. You can swim upstream or downstream with identical base responsiveness.
- **Riding (`Shift`)**:
  $$\text{if } \vec{v} \cdot \vec{C} > 0 \implies \vec{v}_{\text{final}} = \vec{v} + \vec{C} \cdot \min\left(1.0, \frac{\vec{v} \cdot \vec{C}}{|\vec{C}|^2}\right) \times 0.4$$
  Headway is boosted downstream by up to $+40\%$.
  If $\vec{v} \cdot \vec{C} \le 0$ (swimming against current), the counter-force is zeroed.

---

## 6. Water Rendering Strategy

To satisfy the $\le 60$ draw call budget and run smoothly at 60 FPS:
- **Geometry**: Single planar meshes segmented per water body (ocean ring, mountain tarn, marsh).
- **Vertex Animation**: Lightweight sine-wave displacement inside vertex shader for gentle surface motion.
- **Depth Color Ramp**: Distance to underwater terrain mapped to a 2-stop color gradient (shallow turquoise to deep sapphire).
- **Shoreline Foam**: Edge intersection detection against scene depth buffer or vertex distance mask generates subtle white foam lines.
- **Camera Immersion**: Exponential depth fog with soft cyan/emerald tint when the camera dips below water level. No expensive full-screen screen-space reflections (SSR) required.
