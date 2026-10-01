# Project Aetheria — Lightweight Persistent 3D Archipelago

> A persistent, lightweight, multiplayer 3D diorama built as a floating archipelago.
> Enter instantly as a customizable glowing **Wisp** — no login required.

**Target:** Web (Desktop & Mobile Browser) · **Budget:** $0.00 (100% free-tier) · **Initial load:** < 2.5 MB

---

## Vision

Visitors spawn on the Arrival Plaza as Wisps and can:

- Navigate via **point-and-click or WASD**, glide between islands via updrafts
- Ring **real-time pentatonic chimes** with nearby visitors
- Stack zen rocks, carve **16×16 glowing runes**, float messages in the cloud sea
- Throw suggestions into the developer's **wishing well**

Aesthetic: **Low-poly cel-shaded (Ghibli-style) by day → bioluminescent neon with soft bloom by night**, on an autonomous synchronized **12-minute loop**.

## Features

- [ ] Instant Wisp avatar (color + hat, glow trail)
- [ ] Hybrid movement: WASD + tap-to-move + glider (Space / touch-hold slow-fall)
- [ ] 3 islands: Arrival Plaza, Zen Chime Isle, Creator's Well
- [ ] Traversal: wooden bridge, catapult mushroom pad, updraft geyser vents
- [ ] Pentatonic chime pillars with positional audio (120 BPM quantized, 300 ms debounce)
- [ ] Persistent signs / cloud bottles / runes (Supabase, FIFO cap 150)
- [ ] 16×16 rune pixel editor → CanvasTexture on cliff walls
- [ ] Dev wishing well + changelog wall + community spark progress bar (`⚡ X% charged`)
- [ ] Offline fallback: single-player zen garden if WS/DB goes down

## Tech Stack (all free-tier)

| Layer | Technology | Role |
| :--- | :--- | :--- |
| Framework | React Three Fiber + Vite | Declarative 3D, fast HMR |
| 3D Engine | Three.js | WebGL rendering |
| Animation | GSAP | Camera, modals, pop-ins, squash & stretch |
| Styling | Tailwind CSS | Minimalist HUD + overlays |
| Real-time ephemeral | PartyKit (Cloudflare Workers) | <50 ms positions + chime sync |
| Persistent storage | Supabase (PostgreSQL) | Notes, runes, wishes, sparks |
| Audio | Three.js `PositionalAudio` | Native Web Audio, zero extra deps |
| Post-processing | `@react-three/postprocessing` | Selective bloom for night/runes |
| Assets | Kenney.nl + Poly Pizza (CC0) | Low-poly nature/fantasy, zero fees |
| Hosting | Vercel | Git CI/CD on global edge CDN |

## How It Works

### 1. Synchronized 12-minute day/night cycle (zero server bandwidth)

All clients derive identical lighting from wall-clock time — no packets needed:

```text
t = (UnixTime mod 720000) / 720000  ∈ [0, 1)
```

See `src/components/canvas/DayNightCycle.jsx` (in `TODO.md` §5.1 for reference implementation).

### 2. Movement state machine

```text
[ GROUND ] --WASD/click--> move on XZ · --catapult--> +Y impulse · --updraft--> lift
   |
   v (Y > 2.0)
[ AIRBORNE ] --gravity--> fall · --hold SPACE/touch--> [ GLIDER: fall capped at -0.5, wings out ]
```

### 3. Rune bitmap serialization

Runes are 256-char bitstrings (`"000...110..."`) stored in `world_notes.content`, rendered via `CanvasTexture` with `NearestFilter` for crisp pixels.

### 4. Sanitization

All user text is stripped of URLs/phishing vectors, HTML/script tags, and profanity, then trimmed to limits (100 chars text, 140 wishes, 256 rune bits). See `src/utils/sanitize.js` in `TODO.md` §5.4.

### 5. PartyKit protocol

Ephemeral only — no DB overhead:

- `MOVE` → `PLAYER_MOVED` (pos + `walking | gliding`)
- `PLAY_CHIME` → `CHIME_TRIGGERED` (note + pillarId + pos)
- `GRAB_ROCK` → `ROCK_HELD` · `DROP_ROCK` → `ROCK_PLACED`
- Disconnect → `PLAYER_LEFT`

See `party/server.js` in `TODO.md` §6.

## Database (Supabase)

Run the migration in `TODO.md` §3 in your Supabase SQL Editor. Summary:

- `world_progress(id=1, total_sparks, target_sparks=1000, current_realm_phase)` + `add_sparks(amount)`
- `dev_wishes(id, author_name, message ≤140, created_at)`
- `world_notes(id, type in sign|bottle|rune, content ≤256, position float8[3], author_name, color, created_at)` + index on `created_at DESC` + FIFO trigger capping at 150 rows

## Project Structure

```text
├── party/                  # PartyKit WS server (positions, chimes)
│   └── server.js
├── partykit.json
├── public/
│   ├── models/             # CC0 GLBs (bridge, island_base, props, hats)
│   └── sounds/             # Pentatonic samples c4/d4/e4/g4/a4.mp3
├── src/
│   ├── components/canvas/  # Scene, DayNightCycle, islands/, traversal/, items/
│   ├── components/wisp/    # WispAvatar, WispController, GliderWings, RemoteWisps
│   ├── components/dom/     # HUD + Modals (Customizer, DevWell, Note, RuneDraw)
│   ├── hooks/              # useAudioChimes, useMultiplayer, useWorldState
│   ├── stores/             # useWispStore, useWorldStore
│   ├── utils/              # sanitize.js, constants.js, runeUtils.js
│   ├── App.jsx / main.jsx / index.css
├── package.json / vite.config.js
└── TODO.md                 # Full architecture blueprint (source of truth)
```

## Getting Started

> Full scaffolding lands in Phase 1. Placeholder until then.

```bash
# 1. Clone
git clone <your-repo-url>
cd project-aetheria

# 2. Install (after `npm create vite`)
npm install

# 3. Env — copy and fill Supabase + PartyKit values
cp .env.example .env

# 4. Run Supabase migration from TODO.md §3, then:
npm run dev        # web
npx partykit dev   # realtime (separate terminal)
```

Required env (planned):

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PARTYKIT_HOST=
```

## Roadmap

```text
[Phase 1: Foundation]      Vite + R3F + Tailwind · Supabase migration · ortho camera + day/night
[Phase 2: Islands]         Plaza + Zen Isle + Creator Well · toon + emissive · bridges/vents/pads
[Phase 3: Wisp + Net]      Procedural wisp + controller + glider · PartyKit presence
[Phase 4: Interactions]    Rune editor · signs/bottles (FIFO) · wishing well · chime pillars
[Phase 5: HUD & Polish]    Spark bar · wardrobe UI · mobile touch optimization
```

## Contributing / Agent Rules

Any contributor or AI agent **must** follow these:

1. **The $0.00 Rule:** No paid deps, no credit-card servers, no paid asset packs. Supabase free + PartyKit free + CC0 only.
2. **Bundle discipline:** Initial JS **< 2.5 MB**. No PhysX/Ammo — raycasting + bounding spheres + light math only.
3. **No slop aesthetic:** No default inputs, no harsh unshaded colors, no system-font dumps. Every interactive element gets GSAP micro-animation + spatial audio feedback.
4. **Resilient fallback:** If WS or Supabase fails, degrade to single-player zen garden — never crash.

See `TODO.md` for the full blueprint (§1–§8).

## License

MIT — see `LICENSE` (to be added). CC0 assets remain under their original terms (Kenney.nl, Poly Pizza).
