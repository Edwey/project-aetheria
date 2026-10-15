# Project Aetheria

A cozy, peaceful 3D browser game where you explore a charming world as three magical forms: Slime (liquid), Wisp (gas), and Stone (solid).

## Vision

Project Aetheria is a serene exploration and building game. It features a hybrid world with a 240×240m landmass blending four biomes (plains, dunes, taiga, grove), a surrounding sea, and three sky islands reachable by gliding and climbing. The game is entirely peaceful—no combat, no damage, no enemies. Every form can perform every verb (move, jump, climb, glide, squeeze, hover, gather, craft, build, swim, emote), but each has unique perks.

## Quick Start

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Fetch and optimize assets
npm run assets:fetch
npm run assets:optimize
npm run assets:check
```

## Key Features

- **Three Forms**: Switch between Slime (squishy, sticky climbing), Wisp (floating, cloud-like), and Stone (rigid, piton climbing, rolling)
- **Hybrid World**: Landmass with four blended biomes, sea, and sky islands
- **Peaceful Gameplay**: No combat, no damage, no hunger—pure exploration and creativity
- **Crafting & Building**: Gather resources, craft items, and build structures
- **Day/Night Cycle**: Dynamic lighting and weather per biome
- **Customization**: Personalize your creature's appearance and cosmetics
- **Local Saves**: Progress saved to localStorage (plus IndexedDB for large data)

## Tech Stack

- **Runtime**: Vite + plain Three.js r128 + JavaScript ES modules with JSDoc types
- **No React/R3F/Tailwind/GSAP**: Lightest runtime for low-end phones
- **Target Device**: $150 Android phone, 2-3GB RAM, Chrome
- **Performance Goal**: 60 FPS (30 FPS minimum in "Light" quality)
- **Hosting**: Vercel (free tier)

## Controls

- **WASD/Arrows**: Move
- **Space**: Jump (charge for height), hold to glide (Slime/Stone) or rise (Wisp)
- **Shift**: Ride wind/carried by currents
- **Tab**: Switch form
- **M**: Melt (Slime), Pebble (Stone), Diffuse (Wisp)
- **C**: Spring (Slime), Condense (Wisp)
- **F**: Ground pound (Slime/Stone), Down-gust (Wisp)
- **H**: Heart emote
- **V**: Float mode (Wisp)
- **Q/E**: Rotate camera
- **Mouse wheel**: Zoom
- **P**: Toggle build mode
- **[ ]**: Select build piece
- **X**: Rotate build piece
- **Enter**: Place build piece
- **Delete/Backspace**: Remove nearby piece
- **1-8**: Emotes
- **B**: Toggle wind debug
- **R**: Respawn
- **T**: Toggle slow-mo

## Documentation

- [AGENT.md](docs/AGENT.md) - Rules for AI working on this project
- [PLAN.md](docs/PLAN.md) - Release roadmap and status
- [CHARACTERS.md](docs/CHARACTERS.md) - Forms, Core, verbs, controls, and numbers
- [ENVIRONMENT.md](docs/ENVIRONMENT.md) - Biomes, wind, weather, resources, crafting, building
- [WORLD.md](docs/WORLD.md) - Hybrid layout, sky islands, world API, save format
- [WATER.md](docs/WATER.md) - Water types, per-form perks, currents, buoyancy
- [ASSETS.md](docs/ASSETS.md) - Asset sources, licenses, pipeline, budgets
- [PERFORMANCE.md](docs/PERFORMANCE.md) - Performance budgets and targets
- [REFERENCES.md](docs/REFERENCES.md) - Reference games and what we borrow
- [DECISIONS.md](docs/DECISIONS.md) - Assumptions made and change notes
- [CREDITS.md](docs/CREDITS.md) - Asset credits (auto-generated)

## License

MIT License - see LICENSE file for details
