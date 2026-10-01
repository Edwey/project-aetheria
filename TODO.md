# PROJECT SPECIFICATION & ARCHITECTURE BLUEPRINT
**Project Codename:** Project Aetheria (Lightweight Persistent 3D Archipelago)  
**Target Platform:** Web (Desktop & Mobile Browser)  
**Budget:** $0.00 (100% Free-Tier Architecture)  
**Target Bundle Size:** < 2.5MB initial load  

---

## 1. Executive Summary & Design Vision

A persistent, lightweight, multiplayer 3D diorama built as a floating archipelago. Visitors enter instantly as customizable glowing **Wisps** without an upfront login. They can navigate using point-and-click or WASD, glide between floating islands via updrafts, ring real-time pentatonic chimes with nearby visitors, stack zen rocks, carve 16x16 glowing runes, float messages in the perimeter cloud sea, and throw suggestions into the developer's wishing well. 

The aesthetic is **Low-Poly Cel-Shaded (Ghibli-style) by day**, transitioning seamlessly into **Bioluminescent Neon with soft Bloom by night** across an autonomous 12-minute synchronized loop.

---

## 2. Technical Stack & Infrastructure (All Free-Tier)

| Layer | Technology | Role / Justification |
| :--- | :--- | :--- |
| **Framework** | **React Three Fiber (R3F) + Vite** | Declarative 3D scene graphs, component reuse, fast HMR. |
| **3D Engine** | **Three.js** | WebGL/WebGPU rendering backbone. |
| **Animation** | **GSAP (GreenSock)** | Camera transitions, UI modals, item pop-ins, squish/stretch bounces. |
| **Styling** | **Tailwind CSS** | Minimalist HUD, responsive overlay interfaces. |
| **Real-Time Ephemeral** | **PartyKit (Cloudflare Workers)** | Free WebSockets for sub-50ms player position broadcasting and chime synchronization. |
| **Persistent Storage** | **Supabase (PostgreSQL)** | Free tier for persistent world notes, runes, wishing well entries, and community sparks. |
| **Audio** | **Three.js `PositionalAudio`** | Native Web Audio API spatial attenuation; 0 external runtime dependencies. |
| **Post-Processing** | **`@react-three/postprocessing`** | Selective Bloom for nighttime bioluminescence and runes. |
| **Asset Pipeline** | **Kenney.nl + Poly Pizza (CC0)** | Modular low-poly nature/fantasy assets; zero licensing or modeling fees. |
| **Hosting** | **Vercel or Cloudflare Pages** | Automated Git CI/CD deployments on global edge CDNs. |

---

## 3. Database Schema (Supabase SQL Migration)

Execute this script in your Supabase SQL Editor. It creates tables, constraints, indexes, and an automatic FIFO trigger ensuring world notes never exceed 150 items.

```sql
-- 1. COMMUNITY SPARK PROGRESS
create table public.world_progress (
  id int primary key default 1,
  total_sparks int default 0,
  target_sparks int default 1000,
  current_realm_phase int default 1,
  updated_at timestamp with time zone default now()
);
insert into public.world_progress (id, total_sparks, target_sparks) values (1, 0, 1000)
on conflict do nothing;

-- 2. DEV WISHING WELL
create table public.dev_wishes (
  id uuid default gen_random_uuid() primary key,
  author_name text default 'Anonymous Wisp',
  message text not null check (char_length(message) <= 140),
  created_at timestamp with time zone default now()
);

-- 3. PERSISTENT WORLD NOTES (Signs, Bottles, Runes)
create table public.world_notes (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('sign', 'bottle', 'rune')),
  content text not null check (char_length(content) <= 256), -- Max 100 chars text OR 256-char bitmask for 16x16 rune
  position float8[] not null, -- [x, y, z]
  author_name text default 'Drifting Wisp',
  color text default '#6ee7b7',
  created_at timestamp with time zone default now()
);

-- Index for spatial & chronological queries
create index idx_world_notes_created on public.world_notes (created_at desc);

-- FIFO Trigger: Ensure total notes never exceed 150
create or replace function enforce_note_limit() 
returns trigger as $$
begin
  delete from public.world_notes
  where id in (
    select id from public.world_notes
    order by created_at desc
    offset 150
  );
  return new;
end;
$$ language plpgsql;

create trigger tr_enforce_note_limit
after insert on public.world_notes
execute function enforce_note_limit();

-- Function to increment sparks
create or replace function add_sparks(amount int)
returns void as $$
begin
  update public.world_progress
  set total_sparks = total_sparks + amount,
      updated_at = now()
  where id = 1;
end;
$$ language plpgsql;
```

---

## 4. Project Directory Structure

```text
├── party/                      # PartyKit Real-time WebSocket Server
│   └── server.js               # Ephemeral state: player positions, audio triggers
├── partykit.json
├── public/
│   ├── models/                 # CC0 Low-poly GLTF/GLB models (Kenney)
│   │   ├── bridge.glb
│   │   ├── island_base.glb
│   │   ├── props.glb
│   │   └── hats.glb
│   └── sounds/                 # Pentatonic chime samples (C4, D4, E4, G4, A4)
│       ├── c4.mp3
│       ├── d4.mp3
│       ├── e4.mp3
│       ├── g4.mp3
│       └── a4.mp3
├── src/
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── Scene.jsx              # Canvas, Orthographic Camera, Post-processing
│   │   │   ├── DayNightCycle.jsx      # Synchronized 12-min lighting & fog loop
│   │   │   ├── islands/
│   │   │   │   ├── ArrivalPlaza.jsx   # Spawn pad, reflection pool, signs
│   │   │   │   ├── ZenChimeIsle.jsx   # Musical pillars, stackable rocks
│   │   │   │   └── CreatorWell.jsx    # Dev well, changelog wall, charging portal
│   │   │   ├── traversal/
│   │   │   │   ├── WoodenBridge.jsx   # Plaza <-> Zen Island walkway
│   │   │   │   ├── CatapultPad.jsx    # Bouncy mushroom jump-pad
│   │   │   │   └── UpdraftVent.jsx    # Geyser air-lift zone
│   │   │   └── items/
│   │   │       ├── NoteSign.jsx       # 3D clickable wooden sign
│   │   │       ├── FloatingBottle.jsx # Bobbing bottle in cloud perimeter
│   │   │       ├── WallRune.jsx       # 16x16 CanvasTexture glowing rune
│   │   │       └── StackableRock.jsx  # Optimistic local drag-and-drop rock
│   │   ├── wisp/
│   │   │   ├── WispAvatar.jsx         # Procedural glowing mesh + hat + trail
│   │   │   ├── WispController.jsx     # Hybrid WASD + Tap-to-move + Glider state
│   │   │   ├── GliderWings.jsx        # Ethereal wings deployed during slow-fall
│   │   │   └── RemoteWisps.jsx        # Connected players rendered via PartyKit
│   │   └── dom/
│   │       ├── HUD.jsx                # Day/night icon, Spark progress bar
│   │       ├── Modals/
│   │       │   ├── CustomizerModal.jsx# Color picker & hat wardrobe
│   │       │   ├── DevWellModal.jsx   # Wish submission form
│   │       │   ├── NoteModal.jsx      # Sign/bottle creation form
│   │       │   └── RuneDrawModal.jsx  # 16x16 interactive pixel drawing matrix
│   ├── hooks/
│   │   ├── useAudioChimes.js          # Positional 120 BPM quantized audio engine
│   │   ├── useMultiplayer.js          # PartyKit WebSocket listener & broadcaster
│   │   └── useWorldState.js           # Supabase Realtime synchronization
│   ├── stores/
│   │   ├── useWispStore.js            # Local player customization & input store
│   │   └── useWorldStore.js           # Persistent notes, sparks, active modals
│   ├── utils/
│   │   ├── sanitize.js                # URL stripper & profanity regex filter
│   │   └── constants.js               # Island coords, pentatonic tones, limits
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
└── vite.config.js
```

---

## 5. Core Mathematical & Architectural Algorithms

### 5.1 Synchronized 12-Minute Day/Night Cycle (Zero Server Bandwidth)
All clients worldwide share the identical sun angle and lighting state without sending continuous server packets.

$$\text{Cycle Time} = 720 \text{ seconds (12 minutes)}$$

$$\text{Progress } t = \frac{(\text{UnixTime} \pmod{720000})}{720000} \in [0.0, 1.0)$$

```javascript
// src/components/canvas/DayNightCycle.jsx
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

const CYCLE_DURATION_MS = 720000; // 12 minutes in ms

export function DayNightCycle() {
  const lightRef = useRef();
  const dayColor = new THREE.Color('#fffbeb');
  const nightColor = new THREE.Color('#1e1b4b');
  const ambientDay = new THREE.Color('#fde68a');
  const ambientNight = new THREE.Color('#312e81');

  useFrame(({ scene }) => {
    const progress = (Date.now() % CYCLE_DURATION_MS) / CYCLE_DURATION_MS;
    const angle = progress * Math.PI * 2;

    // Orbit Sun/Moon
    if (lightRef.current) {
      lightRef.current.position.set(
        Math.cos(angle) * 40,
        Math.sin(angle) * 40,
        Math.sin(angle) * 20
      );
      
      const isDay = Math.sin(angle) > 0;
      lightRef.current.intensity = THREE.MathUtils.lerp(
        lightRef.current.intensity,
        isDay ? 1.5 : 0.2,
        0.05
      );
      lightRef.current.color.lerp(isDay ? dayColor : nightColor, 0.05);

      // Interpolate Scene Fog and Ambient Light
      scene.fog.color.lerp(isDay ? ambientDay : ambientNight, 0.02);
    }
  });

  return (
    <>
      <directionalLight ref={lightRef} castShadow shadow-mapSize={[1024, 1024]} />
      <ambientLight intensity={0.4} />
      <fog attach="fog" args={['#fffbeb', 30, 90]} />
    </>
  );
}
```

---

### 5.2 Hybrid Movement State Machine & Glider Mechanics
The Wisp Controller supports WASD keyboard navigation, raycast click-to-move, catapult jumping, updraft elevation, and slow-fall gliding.

```
       [ GROUND STATE ] (Floating bob: sin(time))
         ├── WASD / Click -> Move on XZ plane
         ├── Step on Catapult -> Add upward velocity (+Y impulse)
         └── Step on Updraft  -> Continuous upward force
                  │
                  ▼ (In Air: Y > 2.0)
       [ AIRBORNE STATE ]
         ├── Gravity pulls downward (-9.8 * delta)
         └── User holds [SPACE] / [TOUCH HOLD]
                  │
                  ▼
       [ GLIDER MODE ]
         ├── Terminal fall velocity capped at -0.5 (80% descent reduction)
         ├── Deploy Ethereal Wing particles
         └── Steer freely over the void
```

---

### 5.3 16x16 Rune Bitmap Serialization
Runes are serialized as 256-character binary strings (`"0000000001100000..."`), compressed, and rendered to 3D stone surfaces via a dynamic HTML5 CanvasTexture.

```javascript
// src/utils/runeUtils.js
import * as THREE from 'three';

export function createRuneTexture(bitString, glowColor = '#38bdf8') {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#0f172a'; // Dark slate backing
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = glowColor;

  for (let i = 0; i < 256; i++) {
    if (bitString[i] === '1') {
      const x = (i % 16) * 4;
      const y = Math.floor(i / 16) * 4;
      ctx.fillRect(x, y, 4, 4);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter; // Keep sharp pixel art look
  return texture;
}
```

---

### 5.4 Text Sanitization Engine (Anti-Phishing & Anti-Spam)
All notes, bottles, and dev wishes run through this filter before entering the database:

```javascript
// src/utils/sanitize.js
const URL_REGEX = /(https?:\/\/|www\.|\.com|\.org|\.net|\.xyz|\.gg|\.io|[a-z0-9]+\.[a-z]{2,})/gi;
const PROFANITY_LIST = ['badword1', 'slur2']; // Expand with standard open-source blocklist

export function sanitizeText(input) {
  if (!input || typeof input !== 'string') return '';
  
  // 1. Strip URLs / Phishing vectors
  let clean = input.replace(URL_REGEX, '[redacted]');
  
  // 2. Strip Script/HTML tags
  clean = clean.replace(/<[^>]*>?/gm, '');

  // 3. Profanity masking
  PROFANITY_LIST.forEach((word) => {
    const reg = new RegExp(`\\b${word}\\b`, 'gi');
    clean = clean.replace(reg, '***');
  });

  // 4. Enforce max character limit (100 chars)
  return clean.trim().slice(0, 100);
}
```

---

## 6. PartyKit Real-Time Networking Protocol

The PartyKit WebSocket server runs on Cloudflare Workers and synchronizes player positions and pentatonic audio events with zero database overhead.

```javascript
// party/server.js
export default class Server {
  constructor(room) {
    this.room = room;
  }

  onConnect(conn, ctx) {
    // Notify room of new arrival
  }

  onMessage(message, sender) {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'MOVE':
        // Broadcast wisp position & rotation to all other connections
        this.room.broadcast(
          JSON.stringify({
            type: 'PLAYER_MOVED',
            id: sender.id,
            x: data.x,
            y: data.y,
            z: data.z,
            state: data.state // 'walking' | 'gliding'
          }),
          [sender.id] // Do not echo back to sender
        );
        break;

      case 'PLAY_CHIME':
        // Broadcast audio trigger with 120BPM quantized timestamp
        this.room.broadcast(
          JSON.stringify({
            type: 'CHIME_TRIGGERED',
            note: data.note,
            pillarId: data.pillarId,
            position: data.position
          })
        );
        break;

      case 'GRAB_ROCK':
        // Optimistic ownership transfer
        this.room.broadcast(
          JSON.stringify({
            type: 'ROCK_HELD',
            rockId: data.rockId,
            heldBy: sender.id,
            color: data.color
          })
        );
        break;

      case 'DROP_ROCK':
        this.room.broadcast(
          JSON.stringify({
            type: 'ROCK_PLACED',
            rockId: data.rockId,
            position: data.position
          })
        );
        break;
    }
  }

  onClose(conn) {
    // Clean up disconnected player
    this.room.broadcast(
      JSON.stringify({
        type: 'PLAYER_LEFT',
        id: conn.id
      })
    );
  }
}
```

---

## 7. Implementation Roadmap for Collaborators & AI Agents

Follow these execution stages in strict order:

```
[Phase 1: Foundation]
  ├── Initialize Vite + React Three Fiber + Tailwind CSS
  ├── Setup Supabase project & run SQL Migration (Section 3)
  └── Configure Isometric Orthographic Camera & Synchronized Day/Night Lighting

[Phase 2: Islands & Shaders]
  ├── Assemble Starter Trio using Kenney CC0 low-poly meshes:
  │     1. Arrival Plaza (Spawn, Reflection Pool)
  │     2. Zen Chime Isle (Pillars, Rock Altar)
  │     3. Creator's Well (Wishing Well, Changelog, Portal)
  ├── Apply Ghibli MeshToonMaterial (Day) & Emissive Bloom (Night)
  └── Connect islands via Suspended Bridges, Updraft Vents, and Catapult Pads

[Phase 3: Wisp Avatar & Movement]
  ├── Build procedural Wisp mesh (glowing sphere + particle trail + customizable hat)
  ├── Implement WispController (WASD + Nav raycasting)
  ├── Implement Glider mechanic (Space / touch-hold slow fall)
  └── Wire PartyKit WebSocket for multiplayer wisp presence

[Phase 4: World Interactions & Persistence]
  ├── 16x16 Pixel Drawing Modal -> Render Runes on cliff surfaces
  ├── Wooden Signs & Floating Cloud Bottles (FIFO 150-note queue via Supabase)
  ├── Dev Wishing Well Modal -> Sends requests directly to Supabase table
  └── Pentatonic Chime Pillars (PositionalAudio with 300ms debounce)

[Phase 5: HUD & Polish]
  ├── Global Community Spark counter progress bar (`⚡ X% charged`)
  ├── Reflection Pool Wardrobe UI (Change wisp color & hats)
  └── Mobile touch control optimization (tap-to-glide & touch-hold glide)
```

---

## 8. Agent Instructions: Rules of Engagement

Any AI agent or engineer contributing to this repository must follow these rules:

1. **The $0.00 Rule:** Never introduce paid third-party dependencies, hosted server instances requiring credit cards, or paid asset packs. Rely exclusively on Supabase free tier, PartyKit free tier, and CC0 assets.
2. **Bundle Discipline:** Keep the initial JavaScript bundle under **2.5MB**. Do not import full modeling suites or heavy physics engines (e.g., PhysX/Ammo). Use simple raycasting, bounding spheres, and lightweight math.
3. **No Slop Aesthetic:** Adhere to `tasteskill.dev` guidelines. Maintain high aesthetic standards: avoid default browser inputs, harsh saturated unshaded colors, or unstyled system fonts. Every interactive element must have smooth GSAP micro-animations and spatial audio feedback.
4. **Resilient Offline Fallback:** If the WebSocket server or Supabase goes down, the world **must not crash**. The client must gracefully degrade into a single-player exploratory zen garden.