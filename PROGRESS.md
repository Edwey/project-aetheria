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
| 2026-10-02 | **Phase 2: Islands & Shaders** | Expanded world scale: 3 islands spaced across sky with sculpted rocky under-crags, floating satellite motes, suspended catenary bridge, animated pulsing catapult pad with spores, swirling geyser updraft vent. Fixed `Textures/colormap.png` 404s and `SkeletonUtils` export bug. Tuned Ghibli day sky and bioluminescent night bloom. Bundle: 1.36 MB (388 KB gzip). |
| 2026-10-02 | **Phase 5: Multiplayer & Polish** | Full Phase 5 suite: 5A Multiplayer Presence (PartyKit edge WS + RemoteWisps ghost lerp), 5B Wardrobe Customizer (Reflection Pool modal + 3D preview + 6 colors / 4 hats + storage persist), 5C World Completion (4th island Echo Crag + Well-Crag Rope Bridge + Catapult elastic screen-shake & zoom recoil), 5D Mobile Touch Controls (glassmorphism virtual joystick + jump/glide buttons). Bundle: 408 KB gzip. |

---

## 🔄 In Progress

| Phase | Task | Status | Blockers / Notes |
| :--- | :--- | :--- | :--- |
| **Phase 1: Foundation** | Vite + R3F + Tailwind + GSAP scaffold | ✅ Done | `npm run dev` / `npm run build` / `npm run lint` pass |
| **Phase 2: Islands & Shaders** | Kenney CC0 GLBs + IslandBed crags + Traversal + Day/Night Shaders | ✅ Done | Three islands expanded (26r/22r/22r), cloud sea lowered, traversal complete |
| **Phase 3: Wisp Avatar & Movement** | Procedural Wisp + WASD/Click + Glider + Zone Camera + Bridge | ✅ Done | Avatar + Glider + MMORPG Zone Camera + 3D Kenney Skyway Bridge complete |
| **Phase 4: World Interactions & Persistence** | Pentatonic Chimes + Modals (Notes, Well, Runes) + Supabase | ✅ Done | Interactive Chime Pillars, NoteSigns, Bottles, Wishing Well & RuneDraw modal live |
| **Phase 5: HUD, Polish & Multiplayer** | Community Spark + PartyKit presence + Wardrobe + Touch Controls | ✅ Done | Complete: 5A Presence, 5B Wardrobe, 5C Echo Crag & Catapult Recoil, 5D Mobile Controls |
| **Phase 6: Immersion & Expression** | Cloud Waves & Shore Foam + Spatial Audio + Spirit Emotes + Celestial Aurora | 🔄 In Progress | Active implementation |

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
- [x] Three islands load (Arrival Plaza, Zen Chime Isle, Creator's Well)
- [x] Materials swap at day/night boundary with bioluminescent bloom
- [x] Traversal pieces placed & animated (suspended catenary bridge, updraft vent, catapult pad)
- [x] Organic multi-tiered island crags with floating satellites & motes (replaced generic cylinders)
- [x] Cloud sea expanded and lowered to create grand atmospheric depth
- [x] Fixed missing `colormap.png` texture and `SkeletonUtils` export bug
- [x] GLB sizes < 200 KB each (all raw assets ~200 KB total)
- [x] Bundle under 2.5 MB (1.36 MB / 388 KB gzip)

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
- [x] Spark bar: realtime `world_progress` updates
- [x] Wardrobe UI: color picker + hat cycle + live 3D preview
- [x] Mobile: virtual joystick + tap-to-jump + touch-hold glide
- [x] Catapult cinematic camera recoil & elastic shake
- [x] Echo Crag 4th micro-island + Well-Crag Rope Bridge
- [x] `npm run build` → `dist` 408 KB gzip (budget < 2.5 MB)
- [x] Lint + typecheck pass

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

## 🔍 Under Review (Not Approved — Do Not Implement Yet)

### Proposal: Dev-only in-browser scene editor (`?edit` mode)

**Problem:** Object placement currently lives in code (`ISLANDS` / `TRAVERSAL` in `constants.js`). The user wants to move/hide objects through a GUI instead of asking an agent for every tweak.

**Proposed solution (dev-only, invisible in production, zero prod-bundle impact via lazy DEV-gated import):**

1. **GUI panel (leva, free):** open `http://localhost:5199/?edit` → floating panel with per-object X/Y/Z sliders, show/hide toggle (= delete without code), day/night time scrubber to judge placement at night.
2. **Drag in the scene:** click any island/bridge/pad → TransformControls gizmo → drag it like a level editor.
3. **Copy-back-to-code:** one button copies new positions as JSON to paste into `constants.js` (permanent).

**Planned files:** `src/editor/usePlacementStore.js` (zustand overrides, no UI deps), `src/editor/Placeable.jsx` (wrapper group: override position/visible + click-to-select + ref registry), `src/editor/EditorMode.jsx` (lazy Leva panel + TransformControls), one-line `<Placeable>` wrap on each island/pad root, bridge `from`/`to` via store, `timeOverride` support in `DayNightCycle`, lazy `<EditorMode/>` mount in `Scene.jsx` behind `import.meta.env.DEV` + `?edit`.

**Why not Blender / three.js editor:** arranging blind — no day/night lighting, fog, or bloom preview. In-browser shows the real scene.

**Open questions for review:**
- Slider panel only, or also drag-gizmo (more invasive)?
- Should hidden state persist to `localStorage` between reloads?
- Who owns `constants.js` write-back — user pastes, or agent applies on request?

**Status:** Parked. `leva` was test-installed then fully reverted (`npm uninstall` + lockfile restored) — tree contains zero editor code. Awaiting user approval before any implementation.

---

## ✅ Vetted External Sources (license-checked, borrow per AGENT_RULES §6)

| Source | License | Verdict | What to take | For phase |
| :--- | :--- | :--- | :--- | :--- |
| `pmndrs/BVHEcctrl` (R3F character controller, no physics engine, three-mesh-bvh collisions) | MIT ✅ | **APPROVED for study/borrow** | Grounded-movement math (capsule, slopes, stairs) as reference for `WispController`; or depend on `bvhecctrl` (tiny, no physics dep). Young package (2025) — agent must test, not blindly trust. | Phase 3 |
| `pmndrs/ecctrl` (R3F controller toolkit) | MIT ✅ but needs `@react-three/rapier` | **REJECTED as dependency** (physics engine violates bundle discipline); docs OK as reading (touch controls, animation states) | Nothing in-tree; patterns only | — |
| Kenney Starter Kits (3D Platformer etc.) | CC0 ✅ but **Godot/GDScript, not web** | **REJECTED for code**; optional design-feel reference only | Read movement *feel*, reimplement in JS | — |
| Old MMORPG codebases (general) | Usually proprietary or GPL | **BANNED** — license poison + tech mismatch (C++/C#/Java clients, binary protocols, zone servers; nothing transfers to Vite+R3F+PartyKit) | Nothing. If user names a specific repo, vet URL+license+stack before touching it. | — |
| YouTube/build-along island tutorials | Usually unlicensed | Learn technique only; no copy-paste without a license | Technique only | — |

---

*Update this file after every phase completion. Commit with `chore: update PROGRESS.md`.*
