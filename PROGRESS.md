# Project Aetheria — Progress Tracker

> Living document. Update after each phase/major step. Commit alongside code.

---

## ✅ Completed

| Date | Item | Details |
| :--- | :--- | :--- |
| 2026-10-02 | Repo initialized | `git init` + `README.md` + `TODO.md` + `LICENSE` (MIT) + `.gitignore` |
| 2026-10-02 | GitHub published | https://github.com/Edwey/project-aetheria (public) |
| 2026-10-02 | Agent toolchain docs | `PLAN.md` (full implementation plan), `.clinerules` (TasteSkill), `.env.example` |
| 2026-10-02 | Supabase migration | `supabase/migrations/001_initial_schema.sql` (exact from TODO.md §3) |
| 2026-10-02 | MCP packages verified | `supabase-mcp`, `@modelcontextprotocol/server-puppeteer`, `@upstash/context7-mcp` |
| 2026-10-02 | MCP env vars added | User confirmed `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CONTEXT7_API_KEY` in local `.env` |

---

## 🔄 In Progress

| Phase | Task | Status | Blockers / Notes |
| :--- | :--- | :--- | :--- |
| **Phase 1: Foundation** | Vite + R3F + Tailwind + GSAP scaffold | ⬜ Not started | Run opening prompt in Roo Code |
| | Supabase project created + migration run | ⬜ Not started | Need to create project at supabase.com |
| | Orthographic isometric camera | ⬜ Not started | |
| | 12-min synchronized day/night cycle | ⬜ Not started | Verify `t = (Date.now() % 720000) / 720000` in console |

---

## 📋 Upcoming Phases (from TODO.md §7)

```
[Phase 2: Islands & Shaders]
  ├── Arrival Plaza, Zen Chime Isle, Creator's Well (Kenney CC0 GLBs)
  ├── MeshToonMaterial (day) + Emissive Bloom (night)
  └── Bridges, Updraft Vents, Catapult Pads

[Phase 3: Wisp Avatar & Movement]
  ├── Procedural Wisp (glow + trail + hat)
  ├── WispController (WASD + click-to-move)
  ├── Glider mechanic (Space / touch-hold)
  └── PartyKit WebSocket presence

[Phase 4: World Interactions & Persistence]
  ├── 16×16 RuneDrawModal (v0.dev) → CanvasTexture on cliffs
  ├── Signs / Bottles / Runes (Supabase FIFO 150)
  ├── Dev Wishing Well modal
  └── Pentatonic Chime Pillars (PositionalAudio)

[Phase 5: HUD & Polish]
  ├── Community Spark progress bar (realtime)
  ├── Reflection Pool Wardrobe (color + hat swap)
  └── Mobile touch optimization + bundle < 2.5 MB
```

---

## 🔧 MCP Status

| Server | Package | Configured | Tested | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Supabase | `supabase-mcp` | ✅ Env vars in `.env` | ⬜ | Needs Supabase project created first |
| Puppeteer | `@modelcontextprotocol/server-puppeteer` | ✅ No auth needed | ⬜ | Runs local Chromium |
| Context7 | `@upstash/context7-mcp` | ✅ Optional API key in `.env` | ⬜ | Works without key (rate limited) |

**Roo Code / Cursor MCP config** (add to `.roo/mcp.json` or `mcp.json`):

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "supabase-mcp"],
      "env": {
        "SUPABASE_URL": "${env:SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${env:SUPABASE_SERVICE_ROLE_KEY}"
      }
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {
        "CONTEXT7_API_KEY": "${env:CONTEXT7_API_KEY}"
      }
    }
  }
}
```

---

## 🧪 Verification Checklist (Per Phase)

### Phase 1 — Foundation
- [ ] `npm run dev` starts without errors
- [ ] Canvas renders (black/white scene visible)
- [ ] Orthographic camera framed on islands area
- [ ] Day/night loop runs: console logs `t` value 0→1 over 12 min
- [ ] Lighting color shifts: warm day → cool night
- [ ] Fog color interpolates
- [ ] No Three.js warnings in console

### Phase 2 — Islands
- [ ] Three islands load (Plaza, Zen Isle, Well)
- [ ] Materials swap at day/night boundary
- [ ] Traversal pieces placed (bridge, vents, catapult)
- [ ] Instanced meshes for repeated props (rocks, trees)
- [ ] GLB sizes < 200 KB each (Draco compressed)

### Phase 3 — Wisp + Net
- [ ] Wisp spawns at Plaza with glow + trail
- [ ] WASD moves on XZ plane
- [ ] Click-to-move raycast works
- [ ] Catapult gives +Y impulse
- [ ] Updraft applies continuous lift
- [ ] Space / touch-hold → glider wings deploy, fall capped at -0.5
- [ ] PartyKit: RemoteWisps appear, positions sync < 50 ms

### Phase 4 — Interactions
- [ ] RuneDrawModal: 16×16 grid draws → saves bitstring → renders on cliff
- [ ] Sign modal: text → saves → 3D sign appears
- [ ] Bottle modal: text → saves → bobs in cloud perimeter
- [ ] FIFO trigger: 151st note deletes oldest
- [ ] Wishing well: message → `dev_wishes` table
- [ ] Chime pillars: click → positional pentatonic note, 300 ms debounce

### Phase 5 — Polish
- [ ] Spark bar: realtime `world_progress` updates
- [ ] Wardrobe UI: color picker + hat cycle
- [ ] Mobile: tap-to-move, touch-hold glide
- [ ] `npm run build` → `dist` < 2.5 MB gzipped
- [ ] Lint + typecheck pass

---

## 📝 Next Action Required

**User:** Create Supabase project at https://supabase.com/dashboard → run `supabase/migrations/001_initial_schema.sql` in SQL Editor.

**Then:** Open VS Code in `C:\Users\HP\Documents\OpenWorld` → Install Roo Code → Add Gemini Flash key + 3 MCPs → Paste Phase 1 opening prompt:

> *"Read `PROJECT_BLUEPRINT.md` (or `TODO.md`). Initialize our project using Vite with React Three Fiber, Tailwind CSS, and GSAP. Set up the folder tree outlined in Section 4, and construct Phase 1: the Canvas scene with an Orthographic Isometric Camera and the 12-minute synchronized Day/Night lighting system."*

---

## 📦 Asset Inventory (Pre-Phase 2)

| Asset | Source | Status | Destination |
| :--- | :--- | :--- | :--- |
| `island_base.glb` | Kenney Nature Kit | ⬜ Download | `public/models/` |
| `bridge.glb` | Kenney Nature Kit | ⬜ Download | `public/models/` |
| `props.glb` | Kenney Fantasy Kit | ⬜ Download | `public/models/` |
| `hats.glb` | Kenney Fantasy Kit | ⬜ Download | `public/models/` |
| `c4.mp3`–`a4.mp3` | Kenney Audio / generate | ⬜ Download | `public/sounds/` |

> Compress all GLBs via https://gltf.report/ (Draco + Meshopt) before commit.

---

## 🐛 Known Issues / Decisions

| Date | Issue | Resolution |
| :--- | :--- | :--- |
| 2026-10-02 | Official `@modelcontextprotocol/server-supabase` doesn't exist | Using community `supabase-mcp` instead |
| 2026-10-02 | `@modelcontextprotocol/server-puppeteer` deprecated | Still works; alternative `browser-mcp` if issues arise |

---

*Update this file after every phase completion. Commit with `chore: update PROGRESS.md`.*