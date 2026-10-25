# Aetheria

A cozy, isometric, low-poly sandbox in the browser. Desktop only.

## About

Aetheria is a single-player exploration game on one connected island. You play one of nine permanent forms in three families (Slime, Wisp, Stone). Each form moves differently because of its physics: bounce, buoyancy, air, weight, momentum. You explore, gather, craft, build a home, redirect water, grow plants and befriend gentle wildlife. There is no combat, no hunger, no timers and no way to permanently break a save. Free to play, donations only, no ads, no account.

**Visual Style**: Flat-shaded faceted low-poly environment, smooth soft creatures, toon ramp lighting, tinted depth fog, gradient sky.

**Tech Stack**: Vite + TypeScript (strict) + Three.js (WebGL 2) + ECS + pnpm monorepo

**Physics**: Behind a `PhysicsWorld` interface. Decided in the Phase 0 spike (Jolt WASM vs custom sphere-vs-heightfield collider).

## Pillars

1. Nine forms, nine identities. Each form is a real choice, not a skin.
2. One connected world. No form locks a region; a form can make a route faster, never the only way.
3. Physics with purpose. Weight, buoyancy, air and momentum create play that is readable and forgiving.
4. Everyone can do everything. All nine forms can walk, jump, climb, glide, collect, craft, build and swim.
5. Alive in the first ten seconds. Every action answers with motion, a visual and a sound.
6. Cozy and safe. No death, no decay, no soft-locks, no lost work.

## Non-Goals (First Solo Release)

Combat, PvP, economy, phone or tablet support, co-op, modding platform, desktop wrapper, trading, cloud sync, WebGPU, hunger, tool breakage, structural collapse.

## The Nine Forms

| Family | Form | Identity |
| --- | --- | --- |
| Slime | Oobleck | Bounce champion. Planes across water at speed. |
| Slime | Dewdrop | Bouncy when dry, splats when full of water. |
| Slime | Aether Bubble | Low gravity, slow falls, soft floaty bounces. |
| Wisp | Mist | Light aerosol that hovers close to surfaces. |
| Wisp | Zephyr | Streamlined air. Gust dash pushes props. |
| Wisp | Lantern | Floats loose, condenses into dense hard light. |
| Stone | Aerolite | Pumice. Floats and skims water. Rides updrafts. |
| Stone | Geode | Rolling stone with near-zero friction. |
| Stone | Obsidian | Dense, wind-immune, sinks. |

## Development Status

**Current Phase**: Phase 0 — Spikes and Measurement

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
│   ├── core/      # Loop, fixed step, input commands, camera
│   ├── data/      # Forms, recipes, regions, all tuning numbers
│   ├── sim/       # Movement, abilities, water grid, weather, wildlife, farming
│   ├── physics/   # PhysicsWorld interface and adapter
│   ├── render/    # Three.js rendering, shaders
│   ├── audio/     # Procedural Web Audio
│   ├── build/     # Building system
│   ├── save/      # Save, export, import
│   ├── ui/        # DOM UI, HUD, menus
│   └── dev/       # Proving Grounds, perf hooks
├── app/           # Game entry point
└── docs/          # Documentation
```

## Documentation

- [PLAN.md](docs/PLAN.md) — Development roadmap and phases
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — Technical architecture
- [CHARACTERS.md](docs/CHARACTERS.md) — Forms, abilities, controls, physics
- [ENVIRONMENT.md](docs/ENVIRONMENT.md) — Regions, weather, resources, crafting, building
- [WORLD.md](docs/WORLD.md) — Island layout, terrain, save format
- [PERFORMANCE.md](docs/PERFORMANCE.md) — Performance budgets and targets
- [DECISIONS.md](docs/DECISIONS.md) — Assumptions and design decisions
- [WATER.md](docs/WATER.md) — Water mechanics
- [AGENT.md](docs/AGENT.md) — Rules for AI working on this codebase
- [REFERENCES.md](docs/REFERENCES.md) — Reference games and inspirations

## Reference Files

- `AETHERIA_MASTER_PLAN.md` — The canonical design document (v4). All docs derive from it.
- `Aetheria.html` — A throwaway tester/reference build. Not the real game; its code is not copied.

## License

MIT
