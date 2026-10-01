# Project Aetheria — Implementation Plan (Plan.md)

> Derived from the architecture blueprint (TODO.md) and the recommended zero-dollar toolchain guide.
> This file serves as the single source of truth for the agent/IDE setup and phase-by-phase execution.

---

## 1. IDE & Agent (The Builder)

**Chosen:** VS Code + **Roo Code** extension (open-source, native MCP support)  
**Model:** Google **Gemini 2.5 Flash / Flash Lite** via **Google AI Studio** (free tier, 1M+ token context)  
**Alternative fallbacks:** OpenRouter free tier, DeepSeek (pennies if needed)

**Why:** 100% free forever, runs terminal commands, reads/writes files, checks build errors autonomously, MCP-native.

> If you prefer a richer UX and don't mind a trial: **Windsurf** (Cascade agent, generous free) or **Cursor** (14-day Pro trial).

---

## 2. MCP Servers to Configure (Hands & Eyes)

Add these three free MCP servers in Roo Code / Cline / Cursor settings:

| MCP Server | Package | Purpose |
| :--- | :--- | :--- |
| **Supabase MCP** | `@modelcontextprotocol/server-supabase` | Live DB schema, run migrations, verify tables/data without opening dashboard |
| **Puppeteer / Browser MCP** | `@modelcontextprotocol/server-puppeteer` (or `browser-mcp`) | Headless browser → `localhost:5173` → read WebGL/console errors → self-fix 3D bugs |
| **Fetch / Context7 MCP** | `@modelcontextprotocol/server-fetch` + Context7 (or `context7-mcp`) | Real-time docs for `@react-three/fiber`, `@react-three/drei`, `partykit` — no outdated syntax |

**Config example (Roo Code `.roo/mcp.json` or Cursor `mcp.json`):**

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "<your-personal-access-token>",
        "SUPABASE_PROJECT_REF": "<your-project-ref>"
      }
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

> Get Supabase Personal Access Token: Settings → Access Tokens → Generate.  
> Project Ref: found in Supabase dashboard URL (`https://supabase.com/dashboard/project/<ref>`).

---

## 3. Specialized Task Chain (Don't Make One Tool Do Everything)

| Task | Tool | How to Use |
| :--- | :--- | :--- |
| **2D HUD, Modals, Pixel Matrix** | **v0.dev** (free daily credits) | Prompt: *"Build a minimalist, cozy Tailwind CSS modal with a 16×16 clickable pixel-art grid for drawing runes, glowing teal on dark slate."* → Copy JSX into `src/components/dom/Modals/RuneDrawModal.jsx` |
| **3D Models & Optimization** | **Kenney.nl** + **gltf.report** (100% free) | Download Nature Kit + Fantasy Kit → drag `.glb` into gltf.report → inspect draw calls → compress with Draco/Meshopt → place in `public/models/` |
| **Taste & Design Guardrails** | **TasteSkill** (`tasteskill.dev`) | Create `.clinerules` (or `.cursorrules`) at repo root with core principles (see below) |

---

## 4. TasteSkill Rules — `.clinerules` (Commit to Repo)

Create this file at `C:\Users\HP\Documents\OpenWorld\.clinerules`:

```markdown
# Project Aetheria — Aesthetic & Engineering Rules (TasteSkill)

## Visual
- Use smooth GSAP tweens: `power2.out` or `back.out(1.7)` for UI popups/modals.
- Never use raw unshaded primary colors; use curated pastel (day) / neon (night) palettes.
- Keep 3D meshes instanced where possible (trees, rocks, chime pillars).
- Avoid generic AI loading spinners; use floating ambient particles.
- Strictly adhere to the modular Archipelago architecture (Section 4 of TODO.md).

## Code
- Prefer `@react-three/drei` helpers (`Html`, `Text`, `Effects`, `Environment`) over raw Three.js.
- Keep components small; one island = one component file.
- All user-generated text goes through `src/utils/sanitize.js` before DB.
- Bundle discipline: initial JS < 2.5 MB. No PhysX/Ammo — raycasting + bounding spheres only.

## Resilience
- If PartyKit WS or Supabase fails → degrade to single-player zen garden, never crash.
- All network calls wrapped in try/catch with toast fallback.

## Audio
- PositionalAudio only; 120 BPM quantized chimes, 300 ms debounce per pillar.
- Pentatonic set: C4, D4, E4, G4, A4 (preloaded in `public/sounds/`).
```

---

## 5. Recommended Starting Workflow (Copy-Paste Ready)

### 5.1 One-Time Setup

```bash
# 1. Install VS Code + Roo Code extension
# 2. Get free API key: https://aistudio.google.com/apikey → paste into Roo Code settings
# 3. Add the three MCP servers above (supabase, puppeteer, context7)
# 4. Save this file as PLAN.md in repo root
# 5. Save TODO.md as PROJECT_BLUEPRINT.md (or keep both)
```

### 5.2 Opening Prompt for Roo Code (Phase 1 Kickoff)

> **Paste this exact prompt into Roo Code to start Phase 1:**
>
> *"Read `PROJECT_BLUEPRINT.md` (or `TODO.md`). Initialize our project using Vite with React Three Fiber, Tailwind CSS, and GSAP. Set up the folder tree outlined in Section 4, and construct **Phase 1**: the Canvas scene with an Orthographic Isometric Camera and the 12-minute synchronized Day/Night lighting system."*

---

## 6. Phase Breakdown (from TODO.md §7 — Strict Order)

```
[Phase 1: Foundation]
  ├── Initialize Vite + React Three Fiber + Tailwind CSS + GSAP
  ├── Setup Supabase project & run SQL Migration (TODO.md §3)
  └── Configure Isometric Orthographic Camera & Synchronized Day/Night Lighting

[Phase 2: Islands & Shaders]
  ├── Assemble Starter Trio using Kenney CC0 low-poly meshes:
  │     1. Arrival Plaza (Spawn, Reflection Pool)
  │     2. Zen Chime Isle (Pillars, Rock Altar)
  │     3. Creator's Well (Wishing Well, Changelog, Portal)
  ├── Apply Ghibli MeshToonMaterial (Day) & Emissive Bloom (Night)
  └── Connect islands via Suspended Bridges, Updraft Vents, Catapult Pads

[Phase 3: Wisp Avatar & Movement]
  ├── Build procedural Wisp mesh (glowing sphere + particle trail + customizable hat)
  ├── Implement WispController (WASD + Nav raycasting)
  ├── Implement Glider mechanic (Space / touch-hold slow fall)
  └── Wire PartyKit WebSocket for multiplayer wisp presence

[Phase 4: World Interactions & Persistence]
  ├── 16×16 Pixel Drawing Modal → Render Runes on cliff surfaces
  ├── Wooden Signs & Floating Cloud Bottles (FIFO 150-note queue via Supabase)
  ├── Dev Wishing Well Modal → Sends requests directly to Supabase table
  └── Pentatonic Chime Pillars (PositionalAudio with 300ms debounce)

[Phase 5: HUD & Polish]
  ├── Global Community Spark counter progress bar (⚡ X% charged)
  ├── Reflection Pool Wardrobe UI (Change wisp color & hats)
  └── Mobile touch control optimization (tap-to-glide & touch-hold glide)
```

---

## 7. Environment Variables (`.env.example` — Commit This)

```bash
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# PartyKit
VITE_PARTYKIT_HOST=localhost:1999
# In production: wss://<your-party-party>.partykit.dev

# Optional: Analytics / Feature flags
VITE_ENABLE_ANALYTICS=false
```

> Never commit real `.env` — only `.env.example`.

---

## 8. Supabase Migration (Ready to Run)

**File:** `supabase/migrations/001_initial_schema.sql` (create this folder/file when Phase 1 starts)

Content is **exactly** the SQL block from `TODO.md` §3 (lines 38–100).  
Run via Supabase MCP or Supabase Dashboard → SQL Editor.

---

## 9. PartyKit Server Scaffold (`party/server.js`)

Scaffold in Phase 3. Reference implementation in `TODO.md` §6 (lines 322–398).  
Run locally: `npx partykit dev` (separate terminal from `npm run dev`).

---

## 10. Asset Checklist (Download Before Phase 2)

| Asset | Source | Destination |
| :--- | :--- | :--- |
| `island_base.glb` | Kenney Nature Kit | `public/models/` |
| `bridge.glb` | Kenney Nature Kit | `public/models/` |
| `props.glb` (rocks, signs, well) | Kenney Fantasy Kit | `public/models/` |
| `hats.glb` | Kenney Fantasy Kit | `public/models/` |
| `c4.mp3` … `a4.mp3` | Generate pentatonic tones (or Kenney Audio) | `public/sounds/` |

> Compress all `.glb` via [gltf.report](https://gltf.report/) (Draco + Meshopt) before commit.

---

## 11. Verification Checklist Per Phase

| Phase | Must Pass Before Next Phase |
| :--- | :--- |
| 1 | `npm run dev` → canvas renders, ortho camera framed, day/night loop runs 12-min sync (check console `t` value) |
| 2 | Three islands load, materials swap day/night, traversal pieces placed, no console errors |
| 3 | Wisp spawns, WASD + click-to-move works, glider deploys on Space/hold, RemoteWisps appear via PartyKit |
| 4 | Rune modal draws → saves to Supabase → renders on cliff; signs/bottles persist FIFO 150; wishing well writes; chimes play positional audio |
| 5 | Spark bar updates realtime, wardrobe UI swaps color/hat, mobile touch works, bundle < 2.5 MB (`npm run build` → `dist` size) |

---

## 12. Git Hygiene

- **Branch per phase:** `phase-1-foundation`, `phase-2-islands`, etc.
- **PR per phase** with screenshots/video (Puppeteer MCP can auto-capture).
- **Conventional commits:** `feat:`, `fix:`, `chore:`, `refactor:`.
- **Never force-push main** — PR review even if solo.

---

## 13. Quick Commands Reference

```bash
# Dev (two terminals)
npm run dev           # Vite + R3F on :5173
npx partykit dev      # PartyKit WS on :1999

# Build & Preview
npm run build
npm run preview

# Lint / Typecheck (add to package.json scripts)
npm run lint
npm run typecheck

# Supabase MCP (via agent) — examples
# "List tables in public schema"
# "Run migration 001_initial_schema.sql"
# "Select * from world_notes limit 5"
```

---

## 14. Next Immediate Action

1. Open VS Code in `C:\Users\HP\Documents\OpenWorld`
2. Install Roo Code extension
3. Add Gemini Flash API key + 3 MCP servers
4. Create `.clinerules` from Section 4
5. Run the **Opening Prompt** from Section 5.2 in Roo Code

That kicks off **Phase 1** autonomously. Come back here to verify the checklist before moving to Phase 2.