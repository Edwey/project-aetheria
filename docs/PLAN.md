# PLAN.md - Release Roadmap and Status

## Releases Overview

Each release is playable and has acceptance tests. We deliver as numbered releases R0 to R5.

### R0: Foundation (Current Status: In Progress)
**Goal**: Port the prototype with parity tests, set up repo, docs, scaffold, and asset pipeline.

**Deliverables**:
- [x] Repository structure created
- [ ] Documentation (README, AGENT, PLAN, CHARACTERS, ENVIRONMENT, WORLD, WATER, ASSETS, PERFORMANCE, REFERENCES, DECISIONS)
- [ ] Repo configs (package.json, vite.config.js, .editorconfig, .gitignore, CI)
- [ ] Scaffold code (empty-but-running app)
- [ ] Port prototype with parity tests
- [ ] Asset pipeline scripts
- [ ] New dev server shows the same game as the prototype

**Acceptance Tests**:
- All 48 headless tests from the prototype pass
- The dev server loads and runs without errors
- The new code produces identical results to the prototype (within 1e-6 for pure modules)

**Status**: Stage A (Documentation) in progress

---

### R1: Land
**Goal**: The 240m landmass with chunked rendering, CC0 instanced flora, toon shading, creature outline, plain-CSS HUD, local save/load, and quality auto-pick.

**Deliverables**:
- World API with 40m chunk meshes (6×6 chunks)
- Per-chunk instanced flora via manifest
- Toon shading (MeshToonMaterial with 3-4 step ramp)
- Creature outline (inverted-hull pass)
- Plain-CSS HUD (no framework)
- Local save/load (localStorage + IndexedDB for large data)
- Light and Full quality with FPS governor
- Auto quality selection based on device capabilities

**Acceptance Tests**:
- All flora renders correctly with instancing
- Chunks outside view are culled
- HUD displays correctly on mobile and desktop
- Save/load persists inventory and build state
- Quality governor responds to FPS drops
- Light quality runs at 30+ FPS on target phone

**Status**: Not started

---

### R2: Sky
**Goal**: Sky islands, thermals as world features, bridges, trampolines, void respawn.

**Deliverables**:
- 3 sky islands (~60m wide each, 30-50m above sea level)
- One resource or landmark per island
- Thermals above dune crests (updrafts)
- Mushroom trampolines (bounce mechanics)
- Bridges connecting sky islands
- Void respawn (fall into cloud sea, respawn at last safe ground)
- Reachability test: every island reachable by every form

**Acceptance Tests**:
- All three islands render and are accessible
- Thermals lift creatures when Riding
- Mushroom trampolines bounce correctly
- Bridges connect islands properly
- Void respawn places player at last safe ground without damage
- Reachability test passes for all forms

**Status**: Not started

---

### R3: Water I
**Goal**: Sea, shores, swim and dive, per-form perks, underwater look, seabed resources.

**Deliverables**:
- Sea surrounding the landmass with beach band
- Depth up to ~6m near shore
- Swim mechanics (Space = swim up/jump out, F = dive)
- Per-form water perks (slime skip-dash, wisp skimming, stone walking seabed)
- Underwater visual (tint, fog, CSS overlay when submerged)
- Seabed resources (pearl, kelp fibre)
- Cheap rendering (transparent plane, vertex-shader waves, depth colors, shoreline foam)

**Acceptance Tests**:
- No form is slower in water than on land (within 10%)
- Slime surfaces and can skip-dash
- Wisp refills breath over water and can dive as mist
- Stone walks seabed at full speed and ignores currents
- Currents only affect while Riding
- No NaN anywhere in water physics
- Underwater tint and fog apply correctly

**Status**: Not started

---

### R4: Water II
**Goal**: Lakes, rivers with currents, swamp, frozen water, raft pieces.

**Deliverables**:
- Lakes and rivers inside land biomes (plains, grove, taiga)
- Lakebed clay resource
- Rivers follow splines with flow fields
- Swamp (shallow, murky, reeds for fibre, glowing spores)
- Frozen water (ice sheets, walk with neutral physics)
- Ground pound cracks ice and drops ice crystals
- Shallow water: normal foundations with stilts to bed
- Deep water: raft floor pieces that float and snap together

**Acceptance Tests**:
- Rivers have correct flow fields
- Swamp is wadeable at full speed
- Ice is walkable without slipping
- Ground pound cracks ice ring
- Foundations use stilts in shallow water
- Raft pieces float and snap correctly
- All water types respect per-form perks

**Status**: Not started

---

### R5: Polish
**Goal**: WebAudio chimes, CC0 ambient and UI sounds, cosmetics with optional CC0 hat models, accessibility, performance tuning, release candidate.

**Deliverables**:
- WebAudio chimes system
- CC0 ambient sounds per biome
- CC0 UI sounds (craft, build, harvest, etc.)
- Cosmetics system with 5 slots
- Optional CC0 hat models (procedural primitives as default)
- Accessibility: focus management, 44px touch targets, reduced motion support
- Performance tuning based on real-device testing
- Release candidate (all tests pass, bundle within budget)

**Acceptance Tests**:
- Audio plays correctly on all platforms
- Cosmetics save and load correctly
- Hat models load from manifest or use procedural fallback
- Focus management works for keyboard navigation
- Touch targets are at least 44px
- Reduced motion preference respected
- Bundle size within budget (400KB initial, 2.5MB first load, 4MB models)
- 60 FPS on target device in Full quality

**Status**: Not started

---

## Later (Not Built Now)

- **Multiplayer**: PartyKit integration (event-bus interface defined in src/gameplay/events.js, no server built in v1)
- **Cloud Notes**: Supabase integration for shared notes

## Status Legend

- **Not started**: No work done yet
- **In Progress**: Work in progress
- **Blocked**: Waiting on dependency or decision
- **Complete**: All deliverables done, acceptance tests pass
