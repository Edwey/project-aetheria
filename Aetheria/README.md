# Aetheria

A cozy, peaceful 3D browser game built with TypeScript, Three.js, and Rapier WASM physics.

## About

Aetheria is a single-player exploration game featuring three unique creatures—slime, wisp, and stone—each with multiple forms and abilities. Explore a procedurally generated world, gather resources, craft items, and build structures in a peaceful, stress-free environment.

**Visual Style**: Cozy low-poly aesthetic with soft pastel colors and painterly NPR shaders.

**Tech Stack**: Vite + TypeScript + Three.js + Rapier WASM + ECS architecture

## Features

- **Three Playable Forms**: Slime (liquid), Wisp (gas), Stone (solid)
- **Form Variants**: Each form has 4 unique variants with different gameplay
- **Procedural World**: Generated terrain with biomes, flora, and resources
- **Peaceful Gameplay**: No combat, damage, or punitive mechanics
- **Building System**: Place structures with ghost preview and snapping
- **Crafting**: Pocket recipes and workbench recipes
- **Weather System**: Dynamic weather and wind
- **Customization**: Colors, cosmetics, and body parameters
- **Save System**: Local persistence with auto-save

## Development Status

**Current Phase**: Planning complete, ready to begin Phase 1 (Core Architecture)

See [docs/PLAN.md](docs/PLAN.md) for the full development roadmap.

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

## Project Structure

```
Aetheria/
├── packages/
│   ├── core/      # ECS, math, types, events
│   ├── sim/       # Physics, forms, world, environment
│   ├── render/    # Three.js rendering, shaders
│   ├── ui/        # DOM UI, HUD, input
│   └── assets/    # GLB loading, manifests
├── app/           # Game entry point
└── docs/          # Documentation
```

## Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Technical architecture and design decisions
- [PLAN.md](docs/PLAN.md) - Development roadmap and phases
- [AGENT.md](docs/AGENT.md) - Rules for AI working on this codebase
- [CHARACTERS.md](docs/CHARACTERS.md) - Forms, abilities, controls, and physics constants
- [ENVIRONMENT.md](docs/ENVIRONMENT.md) - Biomes, weather, resources, crafting
- [WORLD.md](docs/WORLD.md) - World design, terrain, save format
- [PERFORMANCE.md](docs/PERFORMANCE.md) - Performance budgets and targets
- [DECISIONS.md](docs/DECISIONS.md) - Assumptions and design decisions
- [REFERENCES.md](docs/REFERENCES.md) - Reference games and inspirations

## License

MIT

## Acknowledgments

- Original prototype: Aetheria.html (physics rules reference)
- Asset sources: 3dassets.dev, Grab3D.com (CC0)
- Visual inspiration: A Short Hike, Susurrus, cozy-isle
