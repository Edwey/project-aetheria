# DECISIONS.md - Assumptions and Change Notes

This document records every assumption made during development. Each entry has a "change me if" note for when circumstances change.

## Repository Setup

### Project Name
**Decision**: Repository is in "OpenWorld" root directory
**Reason**: User requested everything in the OpenWorld folder, not a subdirectory
**Change me if**: You want to use a different repository name or structure

### License
**Decision**: MIT License
**Reason**: Prompt specifies MIT
**Change me if**: You need a different license (e.g., for commercial use)

### Language
**Decision**: English only
**Reason**: Prompt specifies English only
**Change me if**: You need internationalization

---

## Tech Stack

### Build Tool
**Decision**: Vite
**Reason**: Prompt specifies Vite
**Change me if**: You need a different build system

### Three.js Version
**Decision**: Pin r128 first
**Reason**: Prompt specifies pin r128, upgrading is its own later task
**Change me if**: r128 has critical bugs preventing development

### Module System
**Decision**: JavaScript ES modules with JSDoc types
**Reason**: Prompt specifies this, lighter than TypeScript
**Change me if**: You need stronger typing (switch to TypeScript)

### Frameworks
**Decision**: No React, no R3F, no Tailwind, no GSAP
**Reason**: Prompt specifies none, lightest runtime for low-end phones
**Change me if**: You need complex UI (might add React in later version)

### CSS
**Decision**: Plain HTML/CSS for HUD
**Reason**: Prompt specifies this, no framework overhead
**Change me if**: You need complex component-based UI

### Hosting
**Decision**: Vercel (free tier)
**Reason**: Prompt specifies free hosting on Vercel
**Change me if**: You need a different host (e.g., Netlify, GitHub Pages)

---

## Game Design

### World Size
**Decision**: 240 × 240 m landmass
**Reason**: Prompt specifies this size
**Change me if**: You need a larger or smaller world

### Biomes
**Decision**: Four blended biomes (plains, dunes, taiga, grove)
**Reason**: Prompt specifies these four
**Change me if**: You want different or additional biomes

### Sky Islands
**Decision**: 3 sky islands, ~60 m wide, 30-50 m above sea level
**Reason**: Prompt specifies this count and size
**Change me if**: You want more or fewer islands

### Water
**Decision**: Four types (sea, lakes/rivers, swamp, frozen)
**Reason**: Prompt specifies these types
**Change me if**: You want different water types

### Single-Player
**Decision**: Single-player with local saves only (v1)
**Reason**: Prompt specifies single-player, multiplayer later
**Change me if**: Multiplayer becomes priority before v1

### Event Bus
**Decision**: Define event-bus interface in src/gameplay/events.js
**Reason**: Prompt specifies this for future multiplayer
**Change me if**: You don't need the event bus architecture

---

## Art Style

### Shading
**Decision**: Toon shading (MeshToonMaterial with 3-4 step ramp)
**Reason**: Prompt specifies toon shading
**Change me if**: You want realistic PBR shading

### Colors
**Decision**: Flat vertex colors, no large textures
**Reason**: Prompt specifies vertex colors, lighter than textures
**Change me if**: You need more detailed visuals

### Outline
**Decision**: Thin outline on creatures only (inverted-hull pass)
**Reason**: Prompt specifies creatures only
**Change me if**: You want outlines on other objects

### Day/Night
**Decision**: Day/night cycle with dynamic lighting
**Reason**: Prompt specifies day/night
**Change me if**: You want constant lighting

---

## Assets

### CC0 Sources
**Decision**: Kenney, Quaternius, KayKit (CC0 only)
**Reason**: Prompt specifies these sources
**Change me if**: You find better CC0 sources

### Poly Pizza
**Decision**: Use only CC0 or CC-BY with attribution
**Reason**: Prompt warns about varying licenses
**Change me if**: You verify specific models have suitable licenses

### Cosmetics
**Decision**: Procedural primitives as default, CC0 hats optional
**Reason**: Prompt specifies procedural fallbacks
**Change me if**: You want no procedural fallbacks

### UI Icons
**Decision**: I (the human) will make UI icons and logo
**Reason**: Prompt specifies this
**Change me if**: You want to use CC0 icons instead

---

## Physics Constants

### Gravity
**Decision**: -20 m/s²
**Reason**: From prototype (Phys.js)
**Change me if**: Gameplay feels too heavy/light

### Particle Radius
**Decision**: 0.07 m for slime particles
**Reason**: From prototype (Phys.js)
**Change me if**: Creatures feel too big/small

### Time Step
**Decision**: Fixed 1/60 s with 4 substeps
**Reason**: From prototype, good stability
**Change me if**: You need different precision

### Units
**Decision**: Metres and seconds, Y up
**Reason**: From prototype
**Change me if**: You need different units

---

## Performance

### Target Device
**Decision**: $150 Android phone, 2-3 GB RAM, Chrome
**Reason**: Prompt specifies this as minimum
**Change me if**: Targeting higher-end devices only

### FPS Goal
**Decision**: 60 FPS target, 30 FPS floor in Light quality
**Reason**: Prompt specifies these targets
**Change me if**: You accept lower FPS for more features

### Bundle Budgets
**Decision**: 400 KB initial JS, 2.5 MB first load, 4 MB models
**Reason**: Prompt specifies these budgets
**Change me if**: You can accept larger bundles

### Light Quality Default
**Decision**: Light quality on touch devices
**Reason**: Prompt specifies this
**Change me if**: You want Full quality on all devices

---

## Testing

### Test Framework
**Decision**: Node tests with assertions
**Reason**: Prompt specifies Node tests
**Change me if**: You need browser-based tests

### Test Count
**Decision**: Recreate 48 headless tests from prototype
**Reason**: Prompt specifies 48 tests
**Change me if**: Prototype had different test count

### Mutation Check
**Decision**: Script that breaks rules and confirms test fails
**Reason**: Prompt specifies this for key rules
**Change me if**: You don't need mutation testing

---

## Documentation

### Numbers in Docs
**Decision**: Every player-facing number in CHARACTERS.md or ENVIRONMENT.md
**Reason**: Prompt specifies this
**Change me if**: You prefer different documentation structure

### Advantage Audit
**Decision**: Table in AGENT.md for every change
**Reason**: Prompt specifies this for Rule 2 compliance
**Change me if**: You don't need the audit table

---

## File Structure

### Folder Layout
**Decision**: Specified layout in section 6 of prompt
**Reason**: Prompt specifies exact structure
**Change me if**: You need different organization

### Module Files
**Decision**: 8 modules extracted from prototype
**Reason**: Prompt specifies this extraction
**Change me if**: You prefer different module boundaries

---

## CI/CD

### GitHub Actions
**Decision**: Install, lint, tests, assets:check, build
**Reason**: Prompt specifies this pipeline
**Change me if**: You need different CI steps

### Bundle Check
**Decision**: Fail if bundle exceeds budget
**Reason**: Prompt specifies this
**Change me if**: You accept larger bundles

---

## Assumptions Made During Stage A

### Prototype Reading
**Assumption**: Prototype file is "Aetheria Slime Lab.html" in the same directory
**Status**: Confirmed - file exists and was read
**Change me if**: Prototype file has different name or location

### Documentation Generation
**Assumption**: Old docs (README, AGENT, PLAN, etc.) may not exist
**Status**: Assumed they don't exist, regenerated from code and prompt
**Change me if**: Old docs exist and should be preserved

### Asset Sources
**Assumption**: Kenney, Quaternius, KayKit have CC0 licenses
**Status**: Not yet verified - will verify during asset fetch stage
**Change me if**: License terms change or packs are removed

### Three.js CDN
**Assumption**: Three.js r128 is available from cdnjs
**Status**: Used in prototype, should work for initial dev
**Change me if**: cdnjs removes r128 or has issues

---

## Future Decisions (Not Made Yet)

### Multiplayer Backend
**Decision**: Not made - PartyKit mentioned as later work
**Reason**: Prompt specifies multiplayer comes later
**Change me if**: Multiplayer becomes priority

### Cloud Notes
**Decision**: Not made - Supabase mentioned as later work
**Reason**: Prompt specifies cloud notes later
**Change me if**: You need cloud persistence earlier

### Three.js Upgrade
**Decision**: Not made - pinning r128 for now
**Reason**: Prompt says upgrading is its own later task
**Change me if**: r128 has critical bugs

### Accessibility Features
**Decision**: Not made - R5 will implement accessibility
**Reason**: Prompt specifies accessibility in R5
**Change me if**: Accessibility becomes priority earlier

---

## Stage C Port Notes (lighter-option log)

### Cross-module imports (wisp, build -> physics)
**Decision**: `wisp.js` and `build.js` import `{ groundHeight, forEachContact }`
from `./physics.js`. In the prototype these were browser globals (`Phys.*`),
which throws under ES modules (caught by tests before it could reach players).
**Change me if**: you want zero cross-imports (duplicate the grid lookup instead).

### Main app kept whole in src/app/game.js
**Decision**: the 90 KB main block is ported verbatim as `initGame()` in
`src/app/game.js` (imports instead of globals, HUD body/CSS ported too) rather
than split across render/ui/app now. A blind split of shared closure state
would risk behaviour change; decomposition happens incrementally as R1 tasks
(each leaving tests green).
**Change me if**: you want the big-bang split before R1.

### Tunnel test uses melt-squeeze + aetheria tunnel
**Decision**: the original "cube does not pass" setup wasn't recoverable from
the prototype (both shapes cross the in-world 0.95 m tunnel, slope-assisted).
Tests lock what the physics supports: blob crosses the real 0.95 m tunnel, and
melted slime passes a 0.7 m gap that blocks full size (melt 1.09 m -> 0.56 m).
**Change me if**: playtests show a shape-based jam worth encoding.

### Sun Grotto is now a REAL in-world tunnel (2026-10-16 correction)
**Decision**: the old test drove across open ground — aetheria had no tunnel at
(8,8). Added `T.tunnel(8,8,5,0.95,1.8)` lifted by a hut-style flattened site
(`GROT_H`), with flora excluded in a 7 m radius. Verified behavior: full-size
bodies stall at the mouth (x≈5.4), melted slime passes (x≈34). The prompt's
"cube does not pass" clause stays unrecoverable (cube is a slime preset, melts
too) — the test locks melt-squeeze instead. `T.tunnel` gained an optional `y0`
base height (defaults 0, no behavior change for existing callers).
**Change me if**: you want a different grotto site or gap height.

### Build.load ignores null rows
**Decision**: one-line `!d` guard so corrupt saves (null entries) load what is
valid instead of throwing. Valid-data behaviour unchanged.
**Change me if**: you prefer strict failure on corrupt saves.

### Manifest path kept as prototype's assets/manifest.json
**Decision**: `game.js` still fetches `assets/manifest.json` (missing -> silent
procedural fallback, per spec). R1 rewires to `/assets/models/manifest.json`
manifest ids.
**Change me if**: wiring manifest ids earlier.

## Stage D Asset Notes

### Kenney direct downloads work; itch.io automated for Quaternius
**Decision**: `fetch-assets.mjs` downloads Kenney `page` sources by parsing the
`.zip` link (8 packs, ~27.6 MB, all verified zips). Quaternius is now fully
automated via Playwright: pack page -> "Download on Itch.io" popup -> purchase
page -> claim bypass ("No thanks") -> download button. KayKit stays `manual`
(itch.io license text unclear, needs human click-through and CC0 verification);
exact steps print from the script.
**Change me if**: KayKit clarifies CC0 on itch.io (then automate).

### Curated set: 12 models + 4 sounds, all under budget
**Decision**: only the kept files are extracted and optimized (gltf-transform
`optimize`: dedupe/prune/weld/quantize). All 12 models <= 16.8 KB and <= 402
tris; staged total 174 KB. Textured kits (survival/pirate) keep their relative
`Textures/colormap.png` layout under per-kit folders.
**Change me if**: the game needs more models (extend MODELS in optimize-assets.mjs).

### Licenses verified 2026-10-15
Kenney site-wide CC0 (kenney.nl/support + Nature Kit page); Quaternius CC0, no
attribution (quaternius.com/faq.html); KayKit UNVERIFIED — confirm CC0 on the
itch.io page at download time. Poly Pizza excluded (licenses vary).
**Change me if**: any pack page shows a different license at download time.

### R1-012/013 wiring reverted to keep the game green
**Decision**: the first attempt at wiring `ui/panel.js` + `ui/craft-panel.js` into
`game.js` broke boot (dangling refs: `choosePreset`, TDZ `nearBench`). Reverted
`game.js` to the verbatim Stage C panel/craft blocks; the extracted modules stay
staged but UNWIRED. Rule: every R1 wiring task must pass `scripts/shot.mjs`
(zero console errors + screenshot) before commit, not just build+tests.
**Change me if**: you want the re-attempt to happen differently.

### KayKit dropped from scope
**Decision**: KayKit removed from `assets/sources.json` (license unverifiable
without a human on itch.io). Kenney's 8 packs + Quaternius cover every model
the game needs (trees, rocks, workbench, boats, hats via procedural fallback).
**Change me if**: KayKit publishes a clear CC0 pack with a direct link.

### WORLD_PLAN.md is the reviewable world proposal
**Decision**: concrete map/POIs/islands/routes drafted in `docs/WORLD_PLAN.md`
for user review (R1-002 already moved spawn to (-24,28); tunnel/thermal/island
numbers in tasks are first guesses until R2-007 reachability passes).
**Change me if**: the user corrects any placement (update plan + WORLD.md + tasks).

## Notes on Decisions

### Decision Process
When a decision is not covered in the prompt:
1. Choose the lighter and simpler option
2. Record it here with a "change me if" note
3. Continue without blocking

### Question Policy
- Max 5 questions when blocked
- Each question has a default
- Only ask when truly blocked

### Change Process
To change a decision:
1. Update this file with the new decision
2. Update affected code and documentation
3. Note the reason for the change
4. Test the change thoroughly
