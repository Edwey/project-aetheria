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
| 2026-10-02 | **Phase 1: Foundation** | Vite 7 + React 19 + R3F + Drei + postprocessing + Tailwind v4 + GSAP + Zustand. Ortho isometric camera. 12-min wall-clock day/night (`t = (Date.now() % 720000) / 720000`). Folder tree from TODO.md §4. Placeholder island/traversal meshes (Kenney GLBs still Phase 2). |
| 2026-10-02 | **Supabase migration RUN** | Direct Postgres via `eu-west-1` pooler (`aws-0-eu-west-1.pooler.supabase.com:6543`, user `postgres.<ref>`). `001_initial_schema.sql` executed — tables confirmed: `dev_wishes`, `world_notes`, `world_progress`. Region is **eu-west-1** (direct `db.<ref>` host does not exist on new projects). |
| 2026-10-02 | **Chime samples** | Synthesized C4/D4/E4/G4/A4 (sine + harmonics, 2.5 s decay) → `public/sounds/*.mp3` ~41 KB each. |
| 2026-10-02 | **Kenney GLBs (16)** | Nature Kit + Fantasy Town 2.0 (CC0) downloaded, 16 sensible picks in `public/models/` (all < 200 KB, total ~200 KB). See Asset Inventory. |
| 2026-10-02 | **Playwright screenshot** | Headless Chromium shot on `:5199` — scene renders, 0 JS errors (only SwiftShader ReadPixels perf warnings). Layout correct (3 islands + bridge + pillars + HUD). Known: heavy day-fog wash, veil text lingered — flagged for Phase 2 material pass. |

---

## 🔄 In Progress

| Phase | Task | Status | Blockers / Notes |
| :--- | :--- | :--- | :--- |
| **Phase 1: Foundation** | Vite + R3F + Tailwind + GSAP scaffold | ✅ Done | `npm run dev` / `npm run build` / `npm run lint` pass |
| | Supabase project created + migration run | ✅ Done | Ran 2026-10-02 via eu-west-1 pooler. Tables live. Client SDK not installed yet (Phase 4). |
| | Orthographic isometric camera | ✅ Done | `src/components/canvas/Scene.jsx` + `ISO_CAMERA` in `constants.js` |
| | 12-min synchronized day/night cycle | ✅ Done | `src/components/canvas/DayNightCycle.jsx` — DEV console logs `t` once per second |
| **Phase 2: Islands** | Kenney CC0 GLBs + toon/emissive swap | ⬜ Next | Procedural discs stand in until assets land in `public/models/` |

---

## 📋 Upcoming Phases (from TODO.md §7)

```
[Phase 2: Islands & Shaders]
  ├── Replace placeholders with Arrival Plaza, Zen Chime Isle, Creator's Well (Kenney CC0 GLBs)
  ├── MeshToonMaterial (day) + Emissive Bloom (night) — bloom already wired, refine with assets
  └── Polish bridges, updraft vents, catapult pads

[Phase 3: Wisp Avatar & Movement]
  ├── Procedural Wisp (glow + trail + hat)
  ├── WispController (WASD + click-to-move)
  ├── Glider mechanic (Space / touch-hold)
  └── PartyKit WebSocket presence (`party/server.js` is a stub)

[Phase 4: World Interactions & Persistence]
  ├── 16×16 RuneDrawModal → CanvasTexture on cliffs
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
- [x] `npm run dev` starts without errors
- [x] `npm run build` succeeds (JS ~1.27 MB / **361 KB gzip** — under 2.5 MB)
- [x] `npm run lint` clean
- [x] Canvas renders in a real browser — headless Chromium shot on `http://localhost:5199` (note: `:5173` is taken by a Laravel server on this machine)
- [x] Orthographic camera framed on islands area (screenshot: 3 islands + bridge + pillars visible)
- [x] Day/night loop: DEV console logs `t` 0→1 over 12 min (`[aetheria] t=...`)
- [x] Lighting color shifts: warm day → cool night (sun/ambient/fog lerp)
- [x] Fog color interpolates (slightly too strong at day peak — everything pale yellow; tune `fog` near/far + cloud-sea contrast in Phase 2)
- [x] No Three.js errors in browser console (only headless-GPU ReadPixels perf warnings; intro veil text lingered in shot — verify veil unmount)
- [x] Supabase tables live (`world_notes`, `dev_wishes`, `world_progress` via pooler check)

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

**You (5 min):**
1. Open the running app (or `npm run dev`) and confirm the three placeholder islands, HUD cycle bar, and console `t` logs.
2. Create a Supabase project at https://supabase.com/dashboard → run `supabase/migrations/001_initial_schema.sql` in SQL Editor → paste URL + anon key into `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
3. Download Kenney Nature + Fantasy CC0 kits → compress via https://gltf.report/ → drop into `public/models/` (see Asset Inventory).

**Agent next (Phase 2):** Swap procedural island discs for Kenney GLBs, instance props, tune day/night materials.

---

## 📦 Asset Inventory (Pre-Phase 2)

| Asset | Source | Status | Size |
| :--- | :--- | :--- | :--- |
| `platform_grass.glb` (island base) | Kenney Nature Kit | ✅ In `public/models/` | 12.5 KB |
| `bridge_wood.glb` | Kenney Nature Kit | ✅ In `public/models/` | 15.7 KB |
| `pillar-stone.glb` (chime pillars) | Kenney Fantasy Town 2.0 | ✅ In `public/models/` | 11.3 KB |
| `fountain-round.glb` (pool / wishing well) | Kenney Fantasy Town 2.0 | ✅ In `public/models/` | 85 KB |
| `mushroom_redTall.glb` (catapult cap) | Kenney Nature Kit | ✅ In `public/models/` | 6.5 KB |
| `sign.glb` (world notes) | Kenney Nature Kit | ✅ In `public/models/` | 5 KB |
| `lantern.glb`, `fence.glb` (dressing) | Kenney Fantasy Town 2.0 | ✅ In `public/models/` | 15 / 7.7 KB |
| `tree_pineTallA` / `tree_default` / `tree_oak` | Kenney Nature Kit | ✅ In `public/models/` | 7–15 KB |
| `rock_largeA` / `rock_smallA` / `stone_smallA` (zen stacking) | Kenney Nature Kit | ✅ In `public/models/` | 2.6–7.5 KB |
| `flower_redA.glb`, `grass.glb` (dressing) | Kenney Nature Kit | ✅ In `public/models/` | 7 / 11.5 KB |
| `c4.mp3`–`a4.mp3` | Synthesized (sine + harmonics) | ✅ In `public/sounds/` | ~41 KB each |
| `hats.glb` | — | ⬜ Skipped | No hats in these kits; keep procedural hat in Phase 3 |

> All GLBs already < 200 KB raw (total ~200 KB) — no Draco pass needed. Full kits stashed outside repo (Temp).

---

## 🐛 Known Issues / Decisions

| Date | Issue | Resolution |
| :--- | :--- | :--- |
| 2026-10-02 | Official `@modelcontextprotocol/server-supabase` doesn't exist | Using community `supabase-mcp` instead |
| 2026-10-02 | `@modelcontextprotocol/server-puppeteer` deprecated | Still works; alternative `browser-mcp` if issues arise |
| 2026-10-02 | Blueprint stores (`useWispStore` / `useWorldStore`) need a lib | **Zustand 5** (free, tiny). Documented here per AGENT_RULES §6. |
| 2026-10-02 | Tailwind v3 vs v4 | **Tailwind v4** via `@tailwindcss/vite` — still $0, smaller config. |
| 2026-10-02 | Kenney GLBs not in repo yet | Phase 1 uses toon-shaded placeholder geometry in island/traversal components. Replace internals in Phase 2; do not rewrite the component files. |
| 2026-10-02 | Port 5173 may already be occupied | Confirmed: a Laravel Vite server owns `:5173` on this machine. Use `:5199` (`vite --port 5199 --strictPort`). |
| 2026-10-02 | Supabase region is eu-west-1 | Direct `db.<ref>.supabase.co` does not resolve on new projects. DDL path: pooler `aws-0-eu-west-1.pooler.supabase.com:6543`, user `postgres.<ref>`, DB password. Runner script kept outside repo (Temp). |
| 2026-10-02 | Day-peak fog wash | Screenshot shows everything pale yellow at day peak + veil text lingering. Phase 2 must widen `fog` near/far, deepen cloud-sea color, verify veil unmounts. |

---

*Update this file after every phase completion. Commit with `chore: update PROGRESS.md`.*
