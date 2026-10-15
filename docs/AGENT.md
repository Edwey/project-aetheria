# AGENT.md - Rules for AI Working on Project Aetheria

This document contains rules for any AI (cloud or local) working on this codebase.

## For Small/Local Models (Task Files)

When executing task files from `tasks/`:

1. **One task at a time** - Read the task file completely, complete it, then stop. Do not attempt multiple tasks in one session.

2. **Never rewrite whole files** - Make minimal, targeted edits. Use the exact line ranges specified in the task.

3. **Run tests after changes** - After each change, run `npm test` (or the specific test command in the task). If tests fail, stop and report the failure.

4. **Stop and report on failure** - If a test fails or an error occurs, stop immediately. Report the exact error message and what you were doing. Do not attempt to fix unless the task explicitly tells you to.

5. **No new features** - Only implement what the task describes. Do not add extra functionality, refactor, or optimize unless explicitly requested.

6. **Preserve formatting** - Keep the existing code style (indentation, spacing, comments). The prototype's formatting is the source of truth.

7. **Ask for clarification** - If a task is ambiguous or you cannot determine what to do, stop and ask for clarification rather than guessing.

## For All AI (Cloud and Local)

### Core Game Rules (Never Violate)

1. **Advantages Only (Rule 2)** - Every change must provide advantages to at least one form. No terrain, weather, wind, or water may slow, slip, or weigh down any form. If a change makes any form worse at any verb, revert it.

2. **Pure Gameplay Modules** - Files in `src/gameplay/` must import nothing (no THREE, no DOM) and must run in Node. They contain pure game logic only.

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

- **JSDoc Types** - Use JSDoc for type annotations in JavaScript ES modules.
- **No Comments Added/Removed** - Preserve existing comments. Do not add new comments unless fixing a bug.
- **Compact Code** - Collapse duplicate else branches, avoid unnecessary nesting, share abstractions.
- **Follow Existing Patterns** - Mimic the code style, use existing libraries and utilities, follow existing patterns.

### Dependencies

- **Verify Before Adding** - Before adding a dependency, check that this codebase already uses it (look at package.json, neighboring files).
- **When Adding**: Prefer running `npm add` instead of editing package.json directly.
- **Version Policy**: Strongly prefer versions published at least 7 days ago. Avoid floating ranges (`latest`, `*`, unbounded `>=`).
- **Three.js Version**: Pin r128 first. Upgrading is its own later task.

### Testing

- **Recreate Prototype Tests** - The prototype passed 48 headless tests. Recreate these in `tests/unit/` with the same thresholds.
- **Test in Node** - Gameplay module tests must run in Node (no THREE, no DOM).
- **Mutations Check** - For key rules, write a script that breaks the rule and confirms a test fails.

### Performance

- **Budgets** - See PERFORMANCE.md for budgets (400KB initial JS, 2.5MB first load, 4MB models gzipped).
- **Light Quality Default** - On touch devices, default to Light quality (162 particles, 48 motes).
- **Allocate Nothing Per Frame** - In hot loops, allocate nothing per frame. Use InstancedMesh for repeated flora/pieces.
- **FPS Governor** - When frames stay slow, lower quality mid-session. Never raise it mid-session.

### Prototype Pitfalls (From Section 8)

- **Heights from Grid** - Heights come from a pre-sampled grid (0.5m cells), never per-particle analytic noise.
- **Particle Speed Cap** - Enforce per-substep speed cap (MAXD = 0.09).
- **Arena Clamp** - The arena clamp must never count as a sticky contact.
- **Wind Push Law** - Use the push law (not relative drag) for wind so it never slows you.
- **Ground Judgment** - Judge "on the ground" with clearance (1.4m), not only the per-step contact flag.
- **Save Before Terrain Switch** - Always save before switching terrain.
- **Dive Safety** - Never stay stuck in a dive (safety timeout in Wisp).

### Documentation

- **Every Number in Docs** - Every number a player can feel must appear in CHARACTERS.md or ENVIRONMENT.md.
- **Update on Change** - When changing gameplay numbers, update the relevant documentation immediately.
- **DECISIONS.md** - Record every assumption you make with a "change me if" note.

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

- GitHub Actions runs on every push: install, lint, tests, assets:check, build.
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
