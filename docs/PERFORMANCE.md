# PERFORMANCE.md - Performance Budgets and Targets

## Target Device

**Primary target**: $150 Android phone
- RAM: 2-3 GB
- Browser: Chrome
- Goal: 60 FPS
- Floor: 30 FPS in "Light" quality

**Secondary target**: Desktop browsers
- Higher specs
- Should run at 60 FPS in Full quality

---

## Bundle Budgets

### JavaScript
- **Initial JS (gzipped)**: < 400 KB ✓ **Actual: 172 KB** (120 KB app + 511 KB Three.js = 128 KB gzipped Three.js + 47 KB gzipped app)
- **First load**: < 2.5 MB ✓ **Actual: ~173 KB** (well under budget)
- **Includes**: Three.js r128, game code, asset manifests

### Models
- **Total models (gzipped)**: < 4 MB
- **Per prop**: < 20 KB gzipped
- **Triangles per prop**: < 2,000

### Textures
- **Resolution**: 256-512 px or none
- **Prefer**: Vertex colors over textures
- **Format**: Prefer none, use procedural colors

### Total Memory
- **Runtime memory**: < 120 MB
- **Includes**: Textures, geometries, buffers

---

## Rendering Budgets

### Draw Calls
- **Target**: 25-35 draw calls
- **Technique**: InstancedMesh for repeated flora/pieces
- **Chunk culling**: Only render visible chunks

### Triangles
- **Visible triangles**: 40,000-60,000
- **Per chunk**: ~7,000-10,000 triangles
- **Optimization**: LOD for distant chunks (future)

### Pixel Ratio
- **Full quality**: Up to 2 (desktop)
- **Light quality**: At most 1.25 (mobile)
- **Auto-detect**: Based on devicePixelRatio and performance

### Shadow Maps
- **Full quality**: 2048×2048
- **Light quality**: 1024×1024
- **Update**: Every frame (directional light)

---

## Quality Settings

### Full Quality (Desktop)
- **Slime particles**: 642
- **Wisp motes**: 96
- **Weather particles**: 650
- **Pixel ratio**: Up to 2
- **Shadow map**: 2048
- **Outline blur**: Enabled
- **Caustics**: Enabled (Medium+)
- **Anti-aliasing**: Enabled

### Light Quality (Mobile Default)
- **Slime particles**: 162
- **Wisp motes**: 48
- **Weather particles**: 350
- **Pixel ratio**: At most 1.25
- **Shadow map**: 1024
- **Outline blur**: Disabled
- **Caustics**: Disabled
- **Anti-aliasing**: Disabled or reduced

### Auto Selection
- **Detect**: Touch device → Light quality
- **Fallback**: If FPS < 30 for 5 seconds → Drop to Light
- **Governor**: Never raises quality mid-session

---

## FPS Governor

### Logic
```javascript
if (fps < 30 for 5 seconds) {
  if (quality === 'full') {
    quality = 'medium';
  } else if (quality === 'medium') {
    quality = 'light';
  }
}
// Never raise quality mid-session
```

### Thresholds
- **Full → Medium**: FPS < 30 for 5s
- **Medium → Light**: FPS < 30 for 5s
- **Light**: Minimum quality, no further reduction

### Triggers
- **Check interval**: Every 1 second
- **Window**: Average over last 5 seconds
- **Action**: Apply immediately, persist in save

---

## Hot Loop Optimization

### Per-Frame Allocation
- **Rule**: Allocate nothing in hot loops
- **Technique**: Reuse arrays, object pools
- **Example**: Pre-allocate particle arrays

### InstancedMesh
- **Flora**: All trees/rocks/flowers use InstancedMesh
- **Pieces**: Repeated build pieces use InstancedMesh
- **Update**: Only update instance matrices when needed

### Geometry
- **Chunk meshes**: Reuse geometry buffers
- **Dynamic updates**: Only update vertex attributes when changed
- **Frustum culling**: Skip invisible chunks

### Physics
- **Fixed timestep**: 1/60 s with 4 substeps
- **Broadphase**: 4 m grid for collision
- **Height grid**: Pre-sampled, not per-particle noise

---

## Memory Management

### Geometry Reuse
- **InstancedMesh**: Shared geometry for instances
- **Pool**: Object pool for temporary objects
- **Dispose**: Explicitly dispose unused geometries

### Texture Management
- **No large textures**: Prefer vertex colors
- **Small textures**: 256-512 px if needed
- **Unload**: Dispose unused textures

### Buffer Reuse
- **Float64Arrays**: Reuse for physics arrays
- **Typed arrays**: Avoid garbage collection

---

## Specific Optimizations

### Slime Physics
- **Particle count**: Reduced in Light quality (162 vs 642)
- **Constraint iterations**: 3 (already minimal)
- **Grid broadphase**: 4 m cells (already efficient)

### Wisp Physics
- **Mote count**: Reduced in Light quality (48 vs 96)
- **Hash grid**: 1024 buckets for spatial hashing
- **Spatial hashing**: Only check nearby cells

### Rendering
- **Frustum culling**: Skip off-screen chunks
- **LOD**: Future - reduce detail for distant chunks
- **Batching**: Group similar draw calls

### Weather
- **Particle count**: 350 (Light) vs 650 (Full)
- **Vertex shader waves**: No CPU cost
- **Depth colors**: Precomputed, no per-frame cost

---

## Profiling

### Built-in Profiling
- **FPS counter**: HUD shows current FPS
- **Quality indicator**: HUD shows current quality
- **Memory**: Optional memory display (debug)

### Chrome DevTools
- **Performance tab**: Profile frame time
- **Memory tab**: Check for leaks
- **Rendering**: Check draw calls

### Target Metrics
- **Frame time**: < 16.67 ms (60 FPS)
- **GPU time**: < 10 ms
- **Script time**: < 6 ms

---

## Mobile-Specific Considerations

### Touch Detection
- **Pointer API**: Use pointer events
- **Touch targets**: Minimum 44 px
- **Prevent default**: Stop scroll/zoom on canvas

### Reduced Motion
- **CSS**: Respect `prefers-reduced-motion`
- **Game**: Disable particle effects when set

### Battery
- **Throttling**: Detect when device throttles
- **Reduce quality**: Auto-drop to Light when throttled

---

## Numbers Summary

### Bundle Sizes
- Initial JS: < 400 KB gzipped
- First load: < 2.5 MB
- Total models: < 4 MB gzipped
- Per prop: < 20 KB gzipped

### Rendering
- Draw calls: 25-35
- Triangles: 40,000-60,000
- Pixel ratio: ≤2 (Full), ≤1.25 (Light)
- Shadow map: 2048 (Full), 1024 (Light)

### Quality Particle Counts
- Slime: 642 (Full), 162 (Light)
- Wisp: 96 (Full), 48 (Light)
- Weather: 650 (Full), 350 (Light)

### Memory
- Total: < 120 MB
- Per prop: < 20 KB
- Textures: 256-512 px or none

### FPS
- Target: 60 FPS
- Floor: 30 FPS (Light)
- Governor: Drop after 5s below 30 FPS
