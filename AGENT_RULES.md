# AGENT_RULES.md — Universal Agent Constraints for Project Aetheria

> **Single source of truth for ALL AI agents, regardless of IDE.**
> Tool-specific files (`.clinerules`, `.cursorrules`, `.windsurfrules`) must reference this file.
> `TODO.md` is the architecture spec. `PROGRESS.md` is the live state. This file is the law.

---

## 1. Hard Constraints (Never Violate)

1. **$0.00 Rule:** No paid deps, no credit-card servers, no paid asset packs. Supabase free + PartyKit free + CC0 only.
2. **Bundle discipline:** Initial JS **< 2.5 MB**. No PhysX/Ammo — raycasting + bounding spheres + light math only.
3. **No slop aesthetic:** No default inputs, no harsh unshaded colors, no system-font dumps. Every interactive element gets GSAP micro-animation (`power2.out` / `back.out(1.7)`) + spatial audio feedback.
4. **Resilient fallback:** If PartyKit WS or Supabase fails, degrade to single-player zen garden — never crash. All network calls in try/catch with toast fallback.
5. **Sanitize everything:** All user text through `src/utils/sanitize.js` before DB. Limits: 100 chars notes, 140 wishes, 256 rune bits.
6. **Modular archipelago:** One island = one component file. Prefer `@react-three/drei` helpers over raw Three.js. Keep meshes instanced.
7. **Audio:** PositionalAudio only. Pentatonic C4/D4/E4/G4/A4, 120 BPM quantized, 300 ms debounce per pillar.

---

## 2. IDE Choice — Pick One at a Time

**Yes, you can install both Roo Code and Cline, but don't run both simultaneously.** They share extension hooks — keybindings, status bar, MCP hooks will fight.

**Verdict: Pick Roo Code.** Custom Modes (Architect / Code / Ask), more free providers (Google AI Studio, OpenRouter), flexible approvals. Keep Cline uninstalled or disabled.

---

## 3. Token-Hopper Strategy (Cursor → Antigravity → Windsurf → Roo Code)

Hopping as free credits expire works **only if you avoid Agent Context Drift** (each IDE has hidden memory: Cursor reads `.cursorrules`, Antigravity uses task manager artifacts, Windsurf uses Cascade flows).

### Golden Rule 1 — PROGRESS.md State Anchor
Before exiting an IDE (or running out of tokens), prompt:
> *"Update `PROGRESS.md` with: 1) What we completed, 2) Current bugs/blockers, and 3) The exact next 3 steps."*

Opening prompt in the next tool:
> *"Read `TODO.md` and `PROGRESS.md`. Understand the current architecture and state. Do not rewrite existing working components. Let's tackle the next step listed in `PROGRESS.md`."*

### Golden Rule 2 — Strict Git Commits (Safety Net)
Never switch IDEs without committing:
```bash
git add .
git commit -m "Cursor session end: wisp physics and bridge complete"
```
If the next agent breaks shaders, `git reset --hard` in 2 seconds.

### Golden Rule 3 — This File Is the Law
All tool-specific rule files reference this file. Never duplicate constraints — update here.

---

## 4. Recommended Tool Sequence & Task Delegation

```text
[STAGE 1: CURSOR TRIAL] → [STAGE 2: ANTIGRAVITY] → [STAGE 3: WINDSURF] → [STAGE 4: ROO CODE / PERMANENT]
 Scaffolding & Scene         3D Traversal & Shaders    Modals & PartyKit WS      Free Forever (Gemini)
```

| Stage | Tool | Build Here | Why |
| :--- | :--- | :--- | :--- |
| 1 | Cursor (trial) | Vite + R3F scaffold, Tailwind config, iso camera, 3 island meshes | Multi-file Composer generates dozens of files fast |
| 2 | Google Antigravity | Wisp controller (WASD + click + glide), catapults, updrafts, toon shaders | Agentic loop + browser inspection handles math/bugs |
| 3 | Windsurf (Cascade) | HUD, 16×16 rune modal, Supabase well, PartyKit WS | Full-stack JS integration with minimal hallucination |
| 4 | Roo Code + Gemini Flash | Polish, debug, maintain forever | 1M+ context, high daily limits, $0 permanent |

---

## 5. Specialized Sub-Tools (Delegate, Don't Generalize)

| Task | Tool | Output Path |
| :--- | :--- | :--- |
| 2D HUD / modals / pixel grid | v0.dev | `src/components/dom/Modals/*.jsx` |
| 3D models + Draco compress | Kenney.nl + gltf.report | `public/models/*.glb` (< 200 KB each) |
| Taste guardrails | TasteSkill (this file §1) | Enforced every PR |

---

## 6. What NOT to Do

- Do not rewrite working components when switching IDEs.
- Do not introduce a new state library without updating `PROGRESS.md` Known Issues.
- Do not commit `.env` with real keys. Only `.env.example`.
- Do not force-push `main`. Branch per phase, PR per phase.
- **Do not copy code from old MMORPG repos or any source without a verified license.** Borrowed code must be MIT / Apache-2.0 / CC0 only, single-purpose (one mechanic, not whole repos), and recorded in `PROGRESS.md` Vetted Sources with URL + license + what was taken. GPL/copyleft and proprietary/leaked code are banned (they would poison our MIT license).
- Do not add a physics engine (Rapier/Cannon/PhysX/Ammo) — bundle discipline (§1). Exception requires user approval + PROGRESS.md entry.
