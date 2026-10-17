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

## Per-Form Water Perks

### Slime
- **Floats and swims at surface**: Default state is surface floating
- **Dive**: Hold F to dive below surface
- **Skip-dash**: Charged jump released at speed bounces off surface up to 3 times
  - Charge while in water
  - Release near surface
  - Bounces up to 3 times with preserved speed
- **Surface mechanics**: Normal movement on surface
- **No breath cost**: Being in water costs nothing

### Wisp
- **Skimming**: Skimming over water counts as "low"
  - Breath refills at 60/s (same as ground)
  - Free to move on surface
- **Dive as mist**: Can dive into water as mist at normal speed
  - No breath cost for diving
  - Normal movement underwater
- **Breath refill**: Refills breath when over water (low state)
- **No slowdown**: Normal speed in water

### Stone
- **Sinks to bed**: Sinks to seabed and walks it
  - Walks at full ground speed on seabed
  - No need to surface
- **Gathers fastest**: Seabed resources gathered in one hit
- **Ignores currents**: Unaffected by water currents
- **No breath cost**: Being in water costs nothing

---

## Water Inputs

### Shared Controls
- **Space**: Swim up or jump out of water
- **F**: Dive while submerged (replaces ground pound)
- **Ride (Shift)**: Ride currents (only affects while Riding)

### Per-Form Specific
- **Slime**:
  - Hold F underwater: Stay submerged
  - Release F near surface: Surface
  - Charge jump at surface: Skip-dash
- **Wisp**:
  - Hold Space: Rise (costs breath, but refills over water)
  - V: Float (hold altitude)
  - Default: Sink gently
- **Stone**:
  - Normal movement on seabed
  - No special controls needed

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
