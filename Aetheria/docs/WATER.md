# WATER.md - Water Types, Per-Form Perks, Currents, Buoyancy

## Core Water Rules (Rule 2 Applies)

**Peaceful water mechanics - no form is disadvantaged:**
- No drowning
- No damage
- No speed loss in water
- No breath cost for being in water
- Water never slows, slips, or weighs down any form

## Water Types

### Sea (R3)
- **Location**: Surrounds the landmass
- **Beach band**: Shallow transition zone near shore
- **Depth**: Up to ~6 m near shore
- **Surface level**: Constant (typically Y = 0)
- **Resources**: Pearl, kelp fibre (counts as fibre)
- **Rendering**: Transparent plane with vertex-shader waves, depth colors, shoreline foam

### Lakes and Rivers (R4)
- **Location**: Inside land biomes (plains, grove, taiga)
- **Lakebed clay**: Clay resource
- **Rivers**: Follow splines
- **Flow field**: Rivers have current vectors
- **Depth**: Variable, typically 1-3 m

### Swamp (R4)
- **Location**: Shallow water bodies
- **Depth**: 1 m or less
- **Appearance**: Murky tint
- **Resources**: Reeds (fibre), glowing spores
- **Wading**: Full speed (no slowdown)

### Frozen Water (R4)
- **Location**: Ice sheets in cold areas
- **Physics**: Neutral (no slipping)
- **Walking**: Can walk on ice with normal physics
- **Ground pound**: Cracks a ring open, drops ice crystals
- **Rendering**: White/ice colored surface

---

## Universal Water Movement (v4.1)

All nine forms obey the same hydrodynamic physical rules:

1. **No Underwater Glide**: Gliding, hovering-glide, and crystal sails are strictly disabled whenever the submerged fraction exceeds $8\%$.
2. **Universal Swimming**:
   - `WASD`: Paddles through water with $\sim 9\text{ m/s}^2$ drive force ($7\text{ m/s}^2$ for Lantern and Geode, $5\text{ m/s}^2$ for Obsidian).
   - `Space`: Strokes upward up to $3.0\text{ m/s}$.
   - Terminal swimming speed is governed naturally by quadratic water drag ($\vec{F}_{\text{drag}} = \frac{1}{2} \rho_w v_{\text{rel}}^2 C_d A$, where $\rho_w = 1000\text{ kg/m}^3$).
3. **Lakebed & Seabed Walking**: Dense forms (Geode, Obsidian) sink to the floor, walk along the bed at full speed, and can jump upward from it. Obsidian does not stroke upward.
4. **Planing Hydrodynamic Lift**: When moving horizontally above $3.5\text{ m/s}$ in the surface layer ($f_{\text{submerged}} \in [0.1, 0.7]$), planing lift allows dense skimming forms (Oobleck, Aerolite) to run across water without sinking.
5. **No Bounce While Submerged**: Surface impact bounce is disabled while immersed in water.

---

## Per-Form Water Interactions (Nine Forms)

### Slimes
- **Oobleck**: Relative density 1.12. Sinks slowly when stationary, but above $3.5\text{ m/s}$ planing lift engages; runs fully on top of water above $5\text{ m/s}$.
- **Dewdrop**: Relative density $0.8 + 0.19 B$ ($B \in [0, 1]$). Soaks water as ballast exclusively while submerged ($+0.50\text{ /s}$). Hold `K` for rocket water jet propulsion that exhausts ballast in ~2.5 s. Splats flat without bounce when ballast is full.
- **Aether Bubble**: Relative density 0.25. Highly buoyant; floats naturally on surface with slow vertical bobbing; tap `J` for buoyant lift hop.

### Wisps
- **Mist**: Relative density 0.08. Gaseous dispersion hovers effortlessly over water surfaces; skimming over water counts as ground proximity, regenerating breath tank at $+25\text{ /s}$.
- **Zephyr**: Relative density 0.12. Agile surface skimmer; hold `K` for gust dash to push floating crates across lakes.
- **Lantern**: Density condenses from 0.05 up to 2.40 by holding `K`. Condensing into hard-light causes the Lantern to sink deep into lakebeds; releasing `K` or running out of breath causes it to float back to the surface.

### Stone
- **Aerolite**: Relative density 0.55 (density < 1.0 floats naturally). Pumice-light stone; skims water efficiently at speed. Couples to thermals and currents like an air creature.
- **Geode**: Relative density 2.60. Sinks to lakebed; rolls with near-zero friction; paddles at $7\text{ m/s}^2$ and jumps from lakebed.
- **Obsidian**: Relative density 5.00. Plunges rapidly to lakebed; anchor (`J`) locks immovably to bed floor against strong river currents.

---

## Water Inputs & Controls

| Action | Control | Behavior |
| :--- | :--- | :--- |
| **Swim / Paddle** | `WASD` / Arrows | Directional paddle drive ($9\text{ m/s}^2$; $7\text{ m/s}^2$ Geode/Lantern; $5\text{ m/s}^2$ Obsidian) |
| **Upward Stroke** | `Space` | Upward swim stroke up to $3\text{ m/s}$ (disabled for Obsidian) |
| **Jump from Bed** | `Space` | Jump impulse when grounded on lakebed/seabed |
| **Water Jet** | `K` (hold) | Dewdrop rocket propulsion (expels ballast, rises in acceleration) |
| **Condense Sink** | `K` (hold) | Lantern hard-light condensation (increases density to 2.4, sinking to floor) |
| **Anchor** | `J` (hold) | Obsidian immovable bed anchor |
| **Ride Current** | `Shift` | Harness river currents for directional boost |

---

## Currents

### River Currents
- **Location**: Rivers in land biomes
- **Flow field**: Per-cell velocity vectors
- **Effect**: Only affects while Riding (Rule 4)
- **Steady by default**: Never moves you unless Riding
- **Tailwind boost**: +40% max if aligned
- **Headwind cancel**: Never slows you

### Current Mechanics
```javascript
// Current vector at position
current = sampleFlowField(x, z);

// Apply only while Riding
if (riding) {
  const aligned = dot(velocity, current);
  if (aligned < 0) {
    // Headwind: cancel component
    current -= projected_component;
  } else {
    // Tailwind: boost
    speed *= 1 + 0.4 * min(1, aligned / 4);
  }
}
```

---

## Buoyancy

### Soft Body Buoyancy
For slime and stone (soft body physics):
- **Per-particle upward acceleration**: Proportional to depth below surface
- **Clamped**: No infinite acceleration
- **Water drag**: Reduced velocity in water
- **Tuned**: Rule 2 must hold (no form slower in water)

### Buoyancy Formula
```javascript
// For each particle:
depth = surfaceY - particleY;
if (depth > 0) {
  buoyancy = depth * buoyancyConstant;
  buoyancy = min(buoyancy, maxBuoyancy);
  velocityY += buoyancy * dt;
  velocity *= (1 - waterDrag * dt);
}
```

### Tuning Goals
- **Slime**: Floats at surface, dives when holding F
- **Stone**: Sinks to bed, walks it
- **Wisp**: Skims or dives as mist (no buoyancy needed)

---

## Water Rendering

### Cheap Rendering Approach
- **Per-body plane**: One transparent plane per water body
- **Vertex-shader waves**: Animated displacement in vertex shader
- **Depth colors**: Precomputed depth stored in vertex colors
  - No depth texture needed
  - No refraction
  - No reflection
- **Shoreline foam**: From depth band near edges
- **Underwater tint**: Fog + CSS overlay when camera submerged
- **Fake caustics**: Only in Medium+ quality (optional)

### Depth Band
- **Near shore**: Shallow, light color
- **Deep**: Darker color
- **Foam**: White band at depth threshold

### Underwater Effect
- **Fog**: Exponential fog in shader
- **Tint**: CSS overlay with opacity based on depth
- **Trigger**: Camera target below surface

---

## Water Physics Numbers

### Surface
- **Surface level**: Y = 0 (sea), variable per body
- **Depth**: Sea up to 6 m near shore, lakes 1-3 m, swamp ≤1 m

### Buoyancy
- **Buoyancy constant**: To be tuned (target: slime floats at surface)
- **Max buoyancy**: Clamped to prevent infinite acceleration
- **Water drag**: To be tuned (target: no slowdown per Rule 2)

### Currents
- **River speed**: ~1-2 m/s
- **Current effect**: Only while Riding
- **Tailwind boost**: Up to +40%
- **Headwind cancel**: Never slows

### Slime Skip-Dash
- **Max bounces**: 3
- **Speed preservation**: Maintained through bounces
- **Charge time**: Same as ground jump (0.85 s)

### Stone Seabed
- **Seabed walking**: Full ground speed
- **Gather speed**: One hit for seabed resources
- **Current immunity**: Unaffected by currents

### Wisp Skimming
- **Low threshold**: Within 1.4 m of surface
- **Breath refill**: 60/s when low
- **Dive speed**: Normal speed (no penalty)

---

## Water Tests

### Rule 2 Tests
- **No form slower**: Each form tested in water vs land
  - Move 10 m forward in water and on land
  - Time difference < 10%
- **No breath cost**: Breath not spent for being in water
- **No slowdown**: No terrain penalty for water

### Per-Form Tests
- **Slime**:
  - Surfaces automatically
  - Dives when holding F
  - Skip-dash bounces up to 3 times
- **Wisp**:
  - Skims over water (low state, breath refills)
  - Dives as mist at normal speed
- **Stone**:
  - Sinks to seabed
  - Walks seabed at full speed
  - Ignores currents

### Current Tests
- **Steady by default**: Currents don't move you unless Riding
- **Headwind cancel**: Headwinds never slow you
- **Tailwind boost**: Tailwinds speed you up (up to +40%)
- **Ride only**: Effect only applies while Riding

### Buoyancy Tests
- **Slime floats**: Stays at surface without input
- **Stone sinks**: Sinks to bed and stays
- **Wisp**: No buoyancy (skims or dives)
- **No NaN**: No NaN values in water physics

---

## Water Interaction Summary

| Form | Surface | Dive | Currents | Seabed | Breath |
|------|---------|------|----------|--------|--------|
| Slime | Floats (F to dive) | Skip-dash | Affects (Ride) | N/A | No cost |
| Wisp | Skims (refills) | Mist (normal) | Affects (Ride) | N/A | No cost |
| Stone | Sinks | N/A | Ignores | Walks (full speed) | No cost |
