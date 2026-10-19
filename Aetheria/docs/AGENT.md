# AGENT.md - Rules for AI Working on Project Aetheria

This document contains rules for any AI (cloud or local) working on this codebase.

## For Small/Local Models (Task Files)

When executing task files from `tasks/`:

1. **One task at a time** - Read the task file completely, complete it, then stop. Do not attempt multiple tasks in one session.

2. **Never rewrite whole files** - Make minimal, targeted edits. Use the exact line ranges specified in the task.

3. **Run tests after changes** - After each change, run `npm test` (or the specific test command in the task). If tests fail, stop and report the failure.

4. **Stop and report on failure** - If a test fails or an error occurs, stop immediately. Report the exact error message and what you were doing. Do not attempt to fix unless the task explicitly tells you to.

5. **No new features** - Only implement what the task describes. Do not add extra functionality, refactor, or optimize unless explicitly requested.

6. **Preserve formatting** - Keep the existing code style (indentation, spacing, comments). Use Prettier for formatting.

7. **Ask for clarification** - If a task is ambiguous or you cannot determine what to do, stop and ask for clarification rather than guessing.

## For All AI (Cloud and Local)

### Core Game Rules (Never Violate)

1. **Advantages Only (Rule 2)** - Every change must provide advantages to at least one form. No terrain, weather, wind, or water may slow, slip, or weigh down any form. If a change makes any form worse at any verb, revert it.

2. **Pure Simulation Modules** - Files in `packages/sim/` must import nothing from render or UI. They contain pure game logic only and must run in Node.

3. **Physics Constants** - The prototype's numbers are the source of truth. All physical constants are documented in CHARACTERS.md and ENVIRONMENT.md. Do not change them without updating documentation.

4. **Steady/Ride Wind (Rule 4)** - Wind and currents are STEADY by default—they never move, slow, or lift a creature. Holding Ride (Shift) lets them carry and boost you. Headwinds never slow you; tailwinds can speed you up.

5. **Peaceful Game** - No combat, no damage, no drowning, no hunger. Never add systems that punish the player.

### Advantage Audit Table

Every change must fill in this table. A cell that reads "worse" blocks the change.

| Verb | Slime | Wisp | Stone |
|------|-------|------|-------|
| Move | same/better | same/better | same/better |
| Jump | same/better | same/better | same/better |
| Climb | same/better | same/better | same/better |
| Glide | same/better | same/better | same/better |
| Squeeze | same/better | same/better | same/better |
| Hover | same/better | same/better | same/better |
| Gather | same/better | same/better | same/better |
| Craft | same/better | same/better | same/better |
| Build | same/better | same/better | same/better |
| Swim | same/better | same/better | same/better |
| Emote | same/better | same/better | same/better |

### Code Style

- **TypeScript Strict Mode** - Use TypeScript with strict mode enabled. No `any` types unless absolutely necessary.
- **TSDoc Comments** - Use TSDoc for type annotations in TypeScript.
- **Minimal Comments** - Code should be self-documenting. Add comments only for complex logic.
- **Compact Code** - Collapse duplicate else branches, avoid unnecessary nesting, share abstractions.
- **Follow Existing Patterns** - Mimic the code style, use existing libraries and utilities, follow existing patterns.
- **Prettier** - Use Prettier for consistent formatting.

### Dependencies

- **Verify Before Adding** - Before adding a dependency, check that this codebase already uses it (look at package.json).
- **When Adding**: Prefer running `pnpm add` instead of editing package.json directly.
- **Version Policy**: Strongly prefer versions published at least 7 days ago. Avoid floating ranges (`latest`, `*`, unbounded `>=`).
- **Three.js Version**: Pin r128+ in package.json. Upgrading is its own later task.
- **Physics**: Single-engine architecture via `PhysicsWorld` interface (Phase 6 spike: Jolt Physics WASM single-thread build vs custom 162-particle PBD slime solver).

### Architecture Rules

- **Layer Dependency** - Never import from higher layers. Core has no dependencies. Sim depends only on core. Render depends on core and sim (read-only). UI depends on core and sim (read-only). Assets depends on core.
- **ECS Data Flow** - Simulation owns component data. Rendering reads component data to update Three.js objects. Never store Three.js objects in components.
- **Forms as Pure Data (Phase 5b)** - All nine forms are data rows in Table A1. Adding a form never adds a system.
- **Universal Movement Verbs** - All forms support walk, jump, climb, glide, and hop.
- **Type Safety** - Use branded types for entity IDs. Use discriminated unions for variant data.
- **No Circular Dependencies** - Package graph must be a DAG.

### Testing & CI Performance Gates

- **Unit Tests** - Test pure functions in isolation. Core and sim packages must have no Three.js dependencies in tests.
- **Integration Tests** - Test package interactions in test fixtures.
- **ECS Tests** - Test entity lifecycle, component queries, system execution.
- **CI Performance Gates (Phase 6 Exit Criterion)** - Gated via `perf-budget.json`: physics benchmark ms/step (<2ms mobile, <3.5ms desktop), bundle size checks (<400KB initial JS, <800KB WASM gzip), and 6x CPU-throttled browser frame test (frame time <16.6ms, draw calls 25-35, triangles <60k).
- **Playwright Tests** - End-to-end gameplay scenarios and UI interaction.

### Performance

- **Budgets** - See PERFORMANCE.md for budgets (400KB initial JS, 2.5MB first load, 4MB models gzipped).
- **Zero Allocations in Hot Loops** - Reuse objects, use object pools, avoid GC pressure.
- **InstancedMesh** - Use InstancedMesh for repeated geometry (flora, particles).
- **Mobile Slime Skinning** - 162 simulation particles driving render mesh via GPU Phong-tessellation skinning.
- **FPS Governor** - When frames stay slow, lower quality mid-session. Never raise it mid-session.

### Prototype Reference

- **Tester Only** - `Aetheria.html` is a throwaway tester build for feel only; its code is not copied.
- **Physics Constants** - Numbers in CHARACTERS.md, ENVIRONMENT.md, and PLAN.md are the source of truth.
- **Keep Rules** - All core game pillars and rules (Rule 2 advantages only, Rule 4 steady wind, Universal Moor rule, peaceful game) must be preserved.

### Documentation

- **Every Number in Docs** - Every number a player can feel must appear in CHARACTERS.md or ENVIRONMENT.md.
- **Update on Change** - When changing gameplay numbers, update the relevant documentation immediately.
- **DECISIONS.md** - Record every assumption you make with a "change me if" note.
- **ARCHITECTURE.md** - Reference ARCHITECTURE.md for structure decisions.

### Git Workflow

- **Commit After Every Step** - Commit after each logical step with a short message.
- **Never Leave Build/Tests Red** - If build fails or tests fail, fix before committing.
- **Format**:
  ```bash
  git commit -m "$(cat <<'EOF'
  Brief description of change.

  Generated with [Devin](https://devin.ai)

  Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
  EOF
  )"
  ```

### CI

- GitHub Actions runs on every push: install, lint, tests, build.
- Build fails if bundle exceeds budget.
- Tests must pass before merging.

### Asking Questions

- Max 5 questions when blocked
- Each question must have a default you'll use if I don't answer
- Only ask when truly blocked (cannot proceed without clarification)

### Honesty

- Say plainly what is untested (no real-device testing)
- Report what failed and what you could not do
- When in doubt, choose the simpler option and log it in DECISIONS.md
