# PERFORMANCE.md - Performance Budgets and Targets

## Target Device

**Primary target**: $150 Android phone
- RAM: 2-3 GB
- Browser: Chrome 90+
- Goal: 60 FPS
- Floor: 30 FPS in "Light" quality

**Secondary target**: Desktop browsers
- Higher specs
- Should run at 60 FPS in Full quality

---

## Bundle Budgets

### JavaScript
- **Initial JS (gzipped)**: < 400 KB
- **First load**: < 2.5 MB
- **Includes**: Three.js, Rapier WASM, game code, asset manifests
- **Note**: Rapier WASM is loaded separately, not counted in JS budget

### Models
- **Total models (gzipped)**: < 4 MB
- **Per prop**: < 20 KB gzipped
- **Triangles per prop**: < 2,000
- **Format**: GLB with embedded WebP textures

### Textures
- **Resolution**: 256-512 px or none
- **Prefer**: Vertex colors over textures
- **Format**: WebP embedded in GLB
- **Strategy**: Procedural generation where possible

### Total Memory
- **Runtime memory**: < 120 MB
- **Includes**: Textures, geometries, buffers, WASM heap

---

## Rendering Budgets

### Draw Calls
- **Target**: 25-35 draw calls
- **Technique**: InstancedMesh for repeated flora/pieces
- **Chunk culling**: Only render visible chunks
- **Strategy**: Batch similar geometries, merge materials where possible

### Triangles
- **Visible triangles**: 40,000-60,000
- **Per chunk**: ~7,000-10,000 triangles
- **Optimization**: LOD for distant chunks (future)

### Pixel Ratio
- **Full quality**: Up to 2 (desktop)
- **Light quality**: At most 1.25 (mobile)
- **Auto-detect**: Based on devicePixelRatio and performance

### Post-Processing
- **Kuwahara shader**: Only in Full quality
- **Disabled in Light**: Mobile performance priority
- **Impact**: Adds ~5-10ms frame time on desktop

### Shadow Maps
- **Full quality**: 2048×2048
- **Light quality**: 1024×1024
- **Update**: Every frame (directional light)
- **Technique**: Cascaded shadow maps for large worlds (future)

---

## Quality Settings

### Full Quality (Desktop)
- **Slime particles**: 642
- **Wisp motes**: 96
- **Stone particles**: 642
- **Weather particles**: 650
- **Pixel ratio**: Up to 2
- **Shadow map**: 2048
- **Kuwahara shader**: Enabled
- **Anti-aliasing**: Enabled (FXAA or MSAA)
- **Physics**: Rapier WASM with full precision

### Light Quality (Mobile Default)
- **Slime particles**: 162
- **Wisp motes**: 48
- **Stone particles**: 162
- **Weather particles**: 350
- **Pixel ratio**: At most 1.25
- **Shadow map**: 1024
- **Kuwahara shader**: Disabled
- **Anti-aliasing**: Disabled or reduced
- **Physics**: Rapier WASM with reduced substeps if needed

### Auto Selection
- **Detect**: Touch device → Light quality
- **Fallback**: If FPS < 30 for 5 seconds → Drop to Light
- **Governor**: Never raises quality mid-session

---

## Physics Performance

### Rapier WASM Configuration
- **Fixed timestep**: 1/60 s
- **Substeps**: 4 (Full), 2 (Light)
- **Solver iterations**: 8 (Full), 4 (Light)
- **Broadphase**: Dynamic AABB tree
- **Narrowphase**: Default Rapier solver

### Performance Targets
- **Physics time**: < 3 ms per frame (60 FPS target)
- **WASM overhead**: < 0.5 ms per frame
- **Memory**: < 32 MB for physics world

### Optimization Strategies
- **Sleep bodies**: Disable simulation for static objects
- **Compound shapes**: Merge colliders where possible
- **Heightfield terrain**: Efficient collision for large worlds
- **Spatial hashing**: For large numbers of dynamic objects

---

## FPS Governor

### Logic
```typescript
if (fps < 30 for 5 seconds) {
  if (quality === 'full') {
    quality = 'light';
  }
}
// Never raise quality mid-session
```

### Thresholds
- **Full → Light**: FPS < 30 for 5s
- **Light**: Minimum quality, no further reduction

### Triggers
- **Check interval**: Every 1 second
- **Window**: Average over last 5 seconds
- **Action**: Apply immediately, persist in save

---

## Hot Loop Optimization

### Per-Frame Allocation
- **Rule**: Allocate nothing in hot loops
- **Technique**: Reuse arrays, object pools, TypedArrays
- **Example**: Pre-allocate particle arrays, reuse Vector3 objects

### InstancedMesh
- **Flora**: All trees/rocks/flowers use InstancedMesh
- **Pieces**: Repeated build pieces use InstancedMesh
- **Update**: Only update instance matrices when needed

### Geometry
- **Chunk meshes**: Reuse geometry buffers
- **Dynamic updates**: Only update vertex attributes when changed
- **Frustum culling**: Skip invisible chunks

### ECS Performance
- **Structure-of-Arrays**: Component data in contiguous TypedArrays
- **Query caching**: Cache query results for systems
- **System ordering**: Topological sort for deterministic execution
- **Zero-allocation systems**: Avoid GC in hot systems

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
- **WebP format**: Smaller than PNG/JPEG

### Buffer Reuse
- **TypedArrays**: Reuse for physics arrays
- **Avoid GC**: Minimize temporary allocations
- **Pool strategy**: Object pools for frequently created objects

### WASM Memory
- **Heap size**: 32 MB default
- **Growth**: Allow growth if needed
- **Reuse**: Keep WASM instance alive

---

## Specific Optimizations

### Slime Physics
- **Particle count**: Reduced in Light quality (162 vs 642)
- **Constraint iterations**: 3 (already minimal)
- **Grid broadphase**: 4 m cells (already efficient)
- **Rapier integration**: Use RigidBody for slime body, soft body simulation separate

### Wisp Physics
- **Mote count**: Reduced in Light quality (48 vs 96)
- **Hash grid**: 1024 buckets for spatial hashing
- **Spatial hashing**: Only check nearby cells
- **Tether constraint**: Rapier distance constraint

### Stone Physics
- **Particle count**: Same as slime (642 vs 162)
- **Rigid body**: Stiff, no soft body simulation
- **Stack cap**: 80 items (vs 40 for slime/wisp)

### Rendering
- **Frustum culling**: Skip off-screen chunks
- **LOD**: Future - reduce detail for distant chunks
- **Batching**: Group similar draw calls
- **Material sharing**: Merge materials with same properties

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
- **Draw calls**: Optional draw call counter (debug)

### Chrome DevTools
- **Performance tab**: Profile frame time
- **Memory tab**: Check for leaks
- **Rendering**: Check draw calls
- **WebGL Inspector**: Shader debugging

### Target Metrics
- **Frame time**: < 16.67 ms (60 FPS)
- **GPU time**: < 10 ms
- **Script time**: < 6 ms
- **Physics time**: < 3 ms
- **Render time**: < 10 ms

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
- **Reduce quality**: Auto-drop to Light when throttling

### Memory Limits
- **Low memory mode**: Reduce texture resolution
- **Aggressive GC**: Trigger GC more frequently
- **Unload assets**: Unload distant assets

---

## Numbers Summary

### Bundle Sizes
- Initial JS: < 400 KB gzipped
- First load: < 2.5 MB
- Total models: < 4 MB gzipped
- Per prop: < 20 KB
- Rapier WASM: ~100 KB (separate)

### Rendering
- Draw calls: 25-35
- Triangles: 40,000-60,000
- Pixel ratio: ≤2 (Full), ≤1.25 (Light)
- Shadow map: 2048 (Full), 1024 (Light)

### Quality Particle Counts
- Slime: 642 (Full), 162 (Light)
- Wisp: 96 (Full), 48 (Light)
- Stone: 642 (Full), 162 (Light)
- Weather: 650 (Full), 350 (Light)

### Memory
- Total: < 120 MB
- Per prop: < 20 KB
- Textures: 256-512 px or none
- WASM heap: 32 MB

### FPS
- Target: 60 FPS
- Floor: 30 FPS (Light)
- Governor: Drop after 5s below 30 FPS

### Physics
- Timestep: 1/60 s
- Substeps: 4 (Full), 2 (Light)
- Solver iterations: 8 (Full), 4 (Light)
- Physics time: < 3 ms
