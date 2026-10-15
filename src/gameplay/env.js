/**
 * src/gameplay/env.js <- Env - ported verbatim from Aetheria Slime Lab.html (Stage C).
 * THE PROTOTYPE IS SOURCE OF TRUTH FOR EVERY NUMBER. Do not change behaviour.
 * Wind (steady/ride), weather, ground materials.
 */


const Env = (function () {
'use strict';
const TAU = Math.PI * 2;
const WXT = ['rain', 'sand', 'snow', 'spore'];   // weather type of biome 0..3
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function rng(seed) {
  let a = seed;
  return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// bilinear height + gradient from the world grid (same layout as physics.js)
const g3 = [0, 0, 0];
function ground(w, x, z) {
  const cs = w.cs, N = w.N, hg = w.hg, W = N + 1;
  let fx = (x + w.A) / cs, fz = (z + w.A) / cs;
  if (fx < 0) fx = 0; else if (fx > N - 1e-6) fx = N - 1e-6;
  if (fz < 0) fz = 0; else if (fz > N - 1e-6) fz = N - 1e-6;
  const i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, k = j * W + i;
  const h00 = hg[k], h10 = hg[k+1], h01 = hg[k+W], h11 = hg[k+W+1];
  g3[0] = h00*(1-u)*(1-v) + h10*u*(1-v) + h01*(1-u)*v + h11*u*v;
  g3[1] = ((h10-h00)*(1-v) + (h11-h01)*v) / cs;
  g3[2] = ((h01-h00)*(1-u) + (h11-h10)*u) / cs;
}

function create(world, seed) {
  const r = rng(seed || 5);
  const env = { world, t: 0, override: 'auto', thermals: [], mushrooms: [], gust: { t: 0, len: 0, next: 8 }, wx: [] };

  // thermals sit on dune crests (local height maxima inside the dunes biome)
  if (world.biomeAt) {
    for (let x = -world.A + 4; x < world.A - 4; x += 2) for (let z = -world.A + 4; z < world.A - 4; z += 2) {
      if (world.biomeAt(x, z)[1] < 0.6) continue;
      ground(world, x, z); const h = g3[0]; if (h < 1.5) continue;
      let top = true;
      for (let a = 0; a < 8 && top; a++) { ground(world, x + Math.cos(a*TAU/8)*3, z + Math.sin(a*TAU/8)*3); if (g3[0] > h) top = false; }
      if (top) env.thermals.push({ x, z, r: 5, base: h, top: h + 12 });
    }
    if (env.thermals.length > 40) env.thermals.length = 40;
  }
  if (world.flora) world.flora.trees.forEach(t => { if (t.kind === 'mushroom') env.mushrooms.push({ x: t.x, z: t.z, r: 1.2 * t.s, base: t.y + 2.8 * t.s, top: t.y + 2.8 * t.s + 8 }); });

  // one weather state machine per biome: clear -> building -> active -> clearing
  const dur = [() => 25 + r() * 45, () => 10, () => 60 + r() * 120, () => 15];
  for (let b = 0; b < 4; b++) {
    const phase = (r() * 4) | 0; env.wx.push({ phase, t: 0, len: dur[phase]() });
  }
  env.durFn = dur;
  return env;
}

function update(env, dt) {
  env.t += dt;
  const g = env.gust;
  if (g.len > 0) { g.t += dt; if (g.t >= g.len) { g.len = 0; g.next = env.t + 6 + Math.random() * 8; } }
  else if (env.t >= g.next) { g.len = 2 + Math.random() * 2; g.t = 0; }
  env.wx.forEach(s => {
    s.t += dt;
    if (s.t >= s.len) { s.phase = (s.phase + 1) % 4; s.t = 0; s.len = env.durFn[s.phase](); }
  });
}
function gustValue(env) { const g = env.gust; return g.len > 0 ? Math.sin(Math.PI * Math.min(1, g.t / g.len)) : 0; }

function weatherFor(env, biome) {
  const s = env.wx[biome]; let amt = 0;
  if (s.phase === 1) amt = s.t / s.len; else if (s.phase === 2) amt = 1; else if (s.phase === 3) amt = 1 - s.t / s.len;
  return { type: WXT[biome], amt };
}
function dominant(w) { let bi = 0; for (let i = 1; i < 4; i++) if (w[i] > w[bi]) bi = i; return bi; }
// weather at a position: manual override wins, otherwise the dominant biome's machine
function weatherAt(env, x, z) {
  if (env.override === 'off') return { type: 'none', amt: 0 };
  if (env.override !== 'auto') return { type: env.override, amt: 1 };
  if (!env.world.biomeAt) return { type: 'none', amt: 0 };
  return weatherFor(env, dominant(env.world.biomeAt(x, z)));
}

const BASE_STRENGTH = [1.5, 3.5, 4.0, 1.0];
const _out = { wind: [0, 0, 0], mat: { mu: 1, speed: 1, jump: 1, gravity: 1 }, weather: { type: 'none', amt: 0 }, biome: 0, strength: 0 };
// wind and ground material at a point. Returns a shared object: copy values you keep.
function sample(env, x, y, z) {
  const world = env.world, t = env.t;
  const w = world.biomeAt ? world.biomeAt(x, z) : [1, 0, 0, 0];
  const wx = weatherAt(env, x, z);
  _out.weather = wx; _out.biome = dominant(w);
  let S = 0; for (let i = 0; i < 4; i++) S += w[i] * BASE_STRENGTH[i];
  const ang = 0.7 + 1.2 * Math.sin(TAU * t / 90);
  let mul = 1 + 0.6 * gustValue(env);
  if (wx.type === 'sand') mul *= 1 + 0.6 * wx.amt; else if (wx.type === 'snow') mul *= 1 - 0.3 * wx.amt; else if (wx.type === 'rain') mul *= 1 + 0.1 * wx.amt;
  let vx = Math.cos(ang) * S * mul, vz = Math.sin(ang) * S * mul, vy = 0;
  ground(world, x, z);
  const h = g3[0], gx = g3[1], gz = g3[2], slope = Math.hypot(gx, gz);
  // taiga: cold air drains downhill on slopes steeper than ~15 degrees
  if (w[2] > 0.01 && slope > 0.27) { vx += -gx * 2 * w[2]; vz += -gz * 2 * w[2]; }
  // grove: swirling vortices (curl of a slow 2D scalar field, ~12 m cells)
  if (w[3] > 0.01) {
    const a = x * 0.52 + t * 0.1, b = z * 0.47 - t * 0.08;
    const dpx = 0.52 * Math.cos(a) * Math.cos(b), dpz = -0.47 * Math.sin(a) * Math.sin(b);
    vx += dpz * 2.4 * w[3]; vz += -dpx * 2.4 * w[3];
  }
  // windward slopes speed the wind up
  if (slope > 0.02) { const up = (vx * gx + vz * gz) / (Math.hypot(vx, vz) + 1e-6) / (slope + 1e-6); if (up > 0) { const f = 1 + 0.3 * Math.min(1, slope) * up; vx *= f; vz *= f; } }
  // thermals over dune crests, updrafts over mushroom caps
  for (let i = 0; i < env.thermals.length; i++) {
    const th = env.thermals[i], dx = x - th.x, dz = z - th.z, d2 = dx*dx + dz*dz;
    if (d2 < th.r * th.r && y > th.base - 1 && y < th.top) { const k = 1 - Math.sqrt(d2) / th.r; vy += 4 * k * k * (1 - sm(th.top - 4, th.top, y)); }
  }
  for (let i = 0; i < env.mushrooms.length; i++) {
    const m = env.mushrooms[i], dx = x - m.x, dz = z - m.z;
    if (dx*dx + dz*dz < m.r * m.r && y > m.base - 0.5 && y < m.top) vy += 3;
  }
  if (wx.type === 'spore') vy += 0.8 * wx.amt;
  _out.wind[0] = vx; _out.wind[1] = vy; _out.wind[2] = vz;
  _out.strength = Math.hypot(vx, vz);

  // ground material: bonuses only (no form ever gets slower or slipperier from terrain)
  const m = _out.mat;
  m.mu = 1; m.speed = 1; m.jump = 1;
  m.gravity = w[0] + w[1] + w[2] + w[3] * 0.9;           // the grove is a little floaty
  if (wx.type === 'rain') m.jump *= 1 + 0.2 * wx.amt;
  if (wx.type === 'spore') m.gravity *= 1 - 0.15 * wx.amt;
  return _out;
}

return { create, update, sample, weatherFor, weatherAt, dominant, WXT };
})();

// ESM named exports (parity with the prototype return table; default keeps the namespace).
export const { create, update, sample, weatherFor, weatherAt, dominant, WXT } = Env;
export default Env;
