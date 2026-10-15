/**
 * src/gameplay/terrain.js <- Terrain - ported verbatim from Aetheria Slime Lab.html (Stage C).
 * THE PROTOTYPE IS SOURCE OF TRUTH FOR EVERY NUMBER. Do not change behaviour.
 * Height grids, biome blending.
 */


const Terrain = (function () {
'use strict';
const D = Math.PI / 180;
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

function rotMat(yaw, rx, rz) { // Ry * Rx * Rz, degrees, row-major
  const cy = Math.cos(yaw*D), sy = Math.sin(yaw*D);
  const cx = Math.cos(rx*D), sx = Math.sin(rx*D);
  const cz = Math.cos(rz*D), sz = Math.sin(rz*D);
  const Ry = [cy,0,sy, 0,1,0, -sy,0,cy];
  const Rx = [1,0,0, 0,cx,-sx, 0,sx,cx];
  const Rz = [cz,-sz,0, sz,cz,0, 0,0,1];
  const mul = (A, B) => { const C = new Array(9); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) C[r*3+c] = A[r*3]*B[c] + A[r*3+1]*B[3+c] + A[r*3+2]*B[6+c]; return C; };
  return mul(mul(Ry, Rx), Rz);
}

function rng(seed) {
  let a = seed;
  return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

function builder(A) {
  const T = { A, boxes: [], spheres: [], cyls: [], visualOnly: [] };
  T.box = function (cx, cy, cz, hx, hy, hz, yaw, rx, rz, color, extra) {
    const o = { c: [cx, cy, cz], h: [hx, hy, hz], R: rotMat(yaw || 0, rx || 0, rz || 0), br: Math.hypot(hx, hy, hz), color: color || 0xb9b2a3 };
    if (extra) Object.assign(o, extra);
    T.boxes.push(o); return o;
  };
  T.sphere = function (cx, cy, cz, r, color, extra) {
    const o = { c: [cx, cy, cz], r, color: color || 0x9a9a9a, on: true };
    if (extra) Object.assign(o, extra);
    T.spheres.push(o); return o;
  };
  T.cyl = function (x, y0, z, r, h, extra) { // vertical capsule from y0 to y0+h
    const o = { c: [x, y0, z], r, h, on: true };
    if (extra) Object.assign(o, extra);
    T.cyls.push(o); return o;
  };
  T.ramp = function (x0, z0, len, wid, angle, yaw, color, platformLen) {
    const hl = len/2, ht = 0.5, a = angle*D;
    const lx = hl*Math.cos(a) + ht*Math.sin(a), ly = hl*Math.sin(a) - ht*Math.cos(a);
    const cy = Math.cos(yaw*D), sy = Math.sin(yaw*D);
    T.box(x0 + lx*cy, ly, z0 - lx*sy, hl, ht, wid/2, yaw, 0, angle, color);
    if (platformLen > 0) {
      const H = len*Math.sin(a), px = len*Math.cos(a) + platformLen/2;
      T.box(x0 + px*cy, H/2, z0 - px*sy, platformLen/2, H/2, wid/2, yaw, 0, 0, color);
    }
  };
  T.tunnel = function (cx, cz, len, gapH, gapW, color) {
    const wall = 0.3, hw = gapW/2 + wall/2;
    T.box(cx, gapH/2, cz - hw, len/2, gapH/2, wall/2, 0, 0, 0, color);
    T.box(cx, gapH/2, cz + hw, len/2, gapH/2, wall/2, 0, 0, 0, color);
    T.box(cx, gapH + 0.25, cz, len/2, 0.25, hw + wall/2, 0, 0, 0, color);
  };
  T.border = function () {
    const c = 0x8f8a80;
    T.box(0, 1.25, -(A + 0.5), A + 1, 1.25, 0.5, 0, 0, 0, c);
    T.box(0, 1.25, A + 0.5, A + 1, 1.25, 0.5, 0, 0, 0, c);
    T.box(-(A + 0.5), 1.25, 0, 0.5, 1.25, A + 1, 0, 0, 0, c);
    T.box(A + 0.5, 1.25, 0, 0.5, 1.25, A + 1, 0, 0, 0, c);
  };
  return T;
}

/* ================= Aetheria: four blended biomes ================= */
const BIOMES = ['Lush Plains', 'Sunstone Dunes', 'Frostpeak Taiga', 'Mystic Grove'];
function biomeW(x, z) {
  const xw = x + 5*Math.sin(z*0.06 + 1) + 2*Math.sin(z*0.17);
  const zw = z + 5*Math.sin(x*0.055) + 2*Math.sin(x*0.19 + 2);
  const e = sm(-7, 7, xw), s = sm(-7, 7, zw);
  return [(1-e)*s, e*s, (1-e)*(1-s), e*(1-s)]; // plains, dunes, taiga, grove
}
function hPlains(x, z) { return 0.9*Math.sin(x*0.11 + 1)*Math.cos(z*0.09) + 0.5*Math.sin(x*0.23 + z*0.19) + 0.15*Math.sin(x*0.7)*Math.sin(z*0.6); }
function hDunes(x, z) {
  const u = x*0.17 + z*0.11 + 1.4*Math.sin(z*0.045);
  return 3.0*Math.pow(0.5 + 0.5*Math.sin(u), 1.6) + 0.08*Math.sin(x*1.3 + z*0.9);
}
function hTaiga(x, z) {
  const r = Math.hypot(x, z), m = sm(8, 58, r);
  const ridge = 1 - Math.abs(Math.sin(x*0.085 + Math.sin(z*0.06)*1.6) * Math.cos(z*0.075 + 1));
  return m*(5 + 7*ridge) + 0.7*Math.sin(x*0.21 + z*0.17) + 0.35*Math.sin(x*0.5)*Math.sin(z*0.43);
}
function hGrove(x, z) { return 1.6*Math.sin(x*0.2)*Math.sin(z*0.17) + 1.0*Math.sin(x*0.09 + z*0.12 + 2) + 0.4*Math.sin(x*0.55 + z*0.5); }
function hRaw(x, z) {
  const w = biomeW(x, z);
  return w[0]*hPlains(x, z) + w[1]*hDunes(x, z) + w[2]*hTaiga(x, z) + w[3]*hGrove(x, z);
}
const HUT = { cx: -20, cz: 16, half: 4 };
const HUT_H = hRaw(HUT.cx, HUT.cz);
function hAeth(x, z) {
  const d = Math.hypot(x - HUT.cx, z - HUT.cz), t = 1 - sm(7, 13, d);
  return hRaw(x, z) * (1 - t) + HUT_H * t;
}
function colorAeth(x, z, h, ny) {
  const w = biomeW(x, z), p = 0.5 + 0.5*Math.sin(x*0.5)*Math.sin(z*0.45);
  const steep = sm(0.92, 0.72, ny); // 0 flat, 1 steep
  let r = 0, g = 0, b = 0;
  { const c = [0.40 + 0.08*p, 0.72 + 0.06*p, 0.35], d = [0.58, 0.47, 0.34];
    r += w[0]*lerp(c[0], d[0], steep*0.8); g += w[0]*lerp(c[1], d[1], steep*0.8); b += w[0]*lerp(c[2], d[2], steep*0.8); }
  { const c = [0.93 - 0.06*p, 0.80 - 0.06*p, 0.54 - 0.05*p], d = [0.80, 0.62, 0.40];
    r += w[1]*lerp(c[0], d[0], steep*0.7); g += w[1]*lerp(c[1], d[1], steep*0.7); b += w[1]*lerp(c[2], d[2], steep*0.7); }
  { let c = [0.26, 0.46, 0.36]; const rock = [0.55, 0.56, 0.60], snow = [0.95, 0.97, 1.0];
    const sr = Math.min(1, steep*1.4), sn = sm(5.5, 8.0, h) * (1 - steep*0.7);
    c = [lerp(c[0], rock[0], sr), lerp(c[1], rock[1], sr), lerp(c[2], rock[2], sr)];
    c = [lerp(c[0], snow[0], sn), lerp(c[1], snow[1], sn), lerp(c[2], snow[2], sn)];
    r += w[2]*c[0]; g += w[2]*c[1]; b += w[2]*c[2]; }
  { const t = [0.34, 0.56, 0.55], v = [0.52, 0.38, 0.68], k = sm(0.35, 0.75, p);
    r += w[3]*lerp(t[0], v[0], k); g += w[3]*lerp(t[1], v[1], k); b += w[3]*lerp(t[2], v[2], k); }
  return [r, g, b];
}

function buildAetheria(T, A) {
  const r = rng(11);
  const placed = [];
  const slopeAt = (x, z) => { const e = 0.6; return Math.hypot(hAeth(x+e, z) - hAeth(x-e, z), hAeth(x, z+e) - hAeth(x, z-e)) / (2*e); };
  const free = (x, z, d) => { for (const p of placed) { const dx = x - p[0], dz = z - p[1], m = (d + p[2]) * 0.5; if (dx*dx + dz*dz < m*m) return false; } return true; };
  const awayFromHut = (x, z) => Math.hypot(x - HUT.cx, z - HUT.cz) > 11 && Math.hypot(x + 12, z - 14) > 3.5;
  function scatter(count, minD, test) {
    const out = [];
    for (let tries = 0; tries < count * 500 && out.length < count; tries++) {
      const x = (r()*2 - 1)*(A - 4), z = (r()*2 - 1)*(A - 4);
      if (!awayFromHut(x, z) || !test(x, z, biomeW(x, z)) || !free(x, z, minD)) continue;
      placed.push([x, z, minD]); out.push([x, z]);
    }
    return out;
  }
  const flora = { trees: [], rocks: [], geodes: [], clays: [], flowers: [] };
  const addTree = (kind, x, z, s, trunkR, trunkH) => {
    const y = hAeth(x, z);
    const col = T.cyl(x, y - 0.2, z, trunkR * s, trunkH * s + 0.2, { tag: 'tree', kind });
    const tr = { kind, x, y, z, s, col, cd: 0, rnd: r() };
    if (kind === 'mushroom') tr.cap = T.sphere(x, y + 1.9 * s, z, 0.95 * s, 0x9b6bd6, { tag: 'cap' });
    flora.trees.push(tr);
  };
  scatter(42, 4.0, (x, z, w) => w[0] > 0.8 && slopeAt(x, z) < 0.35).forEach(p => addTree('oak', p[0], p[1], 0.85 + r()*0.5, 0.32, 2.4));
  scatter(100, 2.8, (x, z, w) => w[2] > 0.8 && hAeth(x, z) < 7.8 && slopeAt(x, z) < 0.6).forEach(p => addTree('pine', p[0], p[1], 0.8 + r()*0.6, 0.26, 1.8));
  scatter(28, 4.5, (x, z, w) => w[1] > 0.8 && slopeAt(x, z) < 0.4).forEach(p => addTree('cactus', p[0], p[1], 0.8 + r()*0.6, 0.38, 2.4));
  scatter(38, 4.0, (x, z, w) => w[3] > 0.8 && slopeAt(x, z) < 0.45).forEach(p => addTree('mushroom', p[0], p[1], 0.8 + r()*0.7, 0.22, 1.8));
  scatter(20, 3.0, (x, z, w) => Math.max(w[0], w[1], w[2], w[3]) > 0.6 && slopeAt(x, z) < 0.7).forEach(p => {
    const rad = 0.6 + r()*0.9, y = hAeth(p[0], p[1]) + rad*0.3;
    flora.rocks.push(T.sphere(p[0], y, p[1], rad, 0x8c8a85, { tag: 'rock' }));
  });
  [[1, 5], [2, 4], [3, 4]].forEach(([bi, n]) => {
    scatter(n, 4.0, (x, z, w) => w[bi] > 0.8 && slopeAt(x, z) < 0.5).forEach(p => {
      flora.geodes.push(T.sphere(p[0], hAeth(p[0], p[1]) + 0.2, p[1], 0.55, 0x9a6bff, { tag: 'geode' }));
    });
  });
  [[0, 4], [3, 4]].forEach(([bi, n]) => {
    scatter(n, 4.0, (x, z, w) => w[bi] > 0.8 && slopeAt(x, z) < 0.4).forEach(p => {
      flora.clays.push(T.sphere(p[0], hAeth(p[0], p[1]) + 0.1, p[1], 0.6, 0x8aa0b4, { tag: 'clay' }));
    });
  });
  const addFlowers = (n, bi, type, colors) => {
    for (let tries = 0, got = 0; tries < n * 40 && got < n; tries++) {
      const x = (r()*2 - 1)*(A - 4), z = (r()*2 - 1)*(A - 4), w = biomeW(x, z);
      if (w[bi] < 0.75 || !awayFromHut(x, z) || slopeAt(x, z) > 0.5) continue;
      let ok = true; for (const t of flora.trees) { if (Math.abs(t.x - x) < 1 && Math.abs(t.z - z) < 1) { ok = false; break; } }
      if (!ok) continue;
      flora.flowers.push({ x, y: hAeth(x, z), z, type, color: colors[(r()*colors.length) | 0], alive: true, timer: 0 }); got++;
    }
  };
  addFlowers(90, 0, 'petal', [0xff8fb8, 0xffd75e, 0xffffff, 0xc89bff]);
  addFlowers(24, 1, 'petal', [0xff9a3c, 0xffc04d]);
  addFlowers(32, 2, 'petal', [0x8fd3ff, 0xcfe9ff]);
  addFlowers(70, 3, 'spore', [0x7ff5dd, 0xb08cff, 0x8affc0]);

  // test hut with roof and near-wall cutaway (plains)
  const cx = HUT.cx, cz = HUT.cz, hy = HUT_H, hf = HUT.half, wallH = 3, th = 0.3, floorTop = hy + 0.2;
  T.box(cx, hy + 0.1, cz, hf + 0.3, 0.1, hf + 0.3, 0, 0, 0, 0xb98a5a, { tag: 'floor' });
  T.box(cx, floorTop + wallH/2, cz - hf, hf, wallH/2, th/2, 0, 0, 0, 0xd9b98a, { tag: 'wall', n: [0, -1] });
  const gap = 1.3, segW = (hf - gap) / 2;
  T.box(cx - gap - segW, floorTop + wallH/2, cz + hf, segW, wallH/2, th/2, 0, 0, 0, 0xd9b98a, { tag: 'wall', n: [0, 1] });
  T.box(cx + gap + segW, floorTop + wallH/2, cz + hf, segW, wallH/2, th/2, 0, 0, 0, 0xd9b98a, { tag: 'wall', n: [0, 1] });
  T.box(cx - hf, floorTop + wallH/2, cz, th/2, wallH/2, hf, 0, 0, 0, 0xcaa77a, { tag: 'wall', n: [-1, 0] });
  T.box(cx + hf, floorTop + wallH/2, cz, th/2, wallH/2, hf, 0, 0, 0, 0xcaa77a, { tag: 'wall', n: [1, 0] });
  T.box(cx, floorTop + wallH + 0.15, cz, hf + 0.7, 0.15, hf + 0.7, 0, 0, 0, 0xb5523b, { tag: 'roof' });
  T.box(cx - 1.6, floorTop + 0.4, cz - 1.2, 0.9, 0.4, 0.55, 0, 0, 0, 0x8a5a33, { tag: 'prop' });
  T.box(cx + hf - 0.9, floorTop + 0.6, cz - 1.5, 0.45, 0.6, 0.9, 0, 0, 0, 0x4a4a52, { tag: 'fireplace' });
  T.box(cx - hf + 1.1, floorTop + 0.3, cz + 1.8, 0.9, 0.3, 1.2, 0, 0, 0, 0x6d8cc2, { tag: 'bed' });
  T.visualOnly.push({ c: [cx + 0.3, floorTop + 0.02, cz + 0.4], h: [1.6, 0.02, 1.1], color: 0xd1566b });
  return { flora, hut: { cx, cz, hy: floorTop, half: hf } };
}

/* ================= definitions ================= */
const defs = {
  aetheria: {
    label: 'Aetheria (4 biomes)', A: 60, h: hAeth, noBorder: true, color: colorAeth, biome: biomeW, spawn: [-12, 14],
    build(T, A) { return buildAetheria(T, A); }
  },
  playground: {
    label: 'Playground', A: 26, ground: [0.46, 0.70, 0.44], dirt: [0.58, 0.46, 0.34], checker: true,
    h: () => 0,
    build(T) {
      for (let i = 0; i < 8; i++) { const top = 0.3*(i+1); T.box(7 + i*0.8, top/2, -9, 0.4, top/2, 2.2, 0, 0, 0, 0xb7a58a); }
      T.ramp(-16, -11, 6, 4, 20, 0, 0xd2a679, 3);
      T.ramp(-16, -4, 5, 4, 35, 0, 0xc58f5b, 3);
      T.ramp(-16, 3, 4, 4, 50, 0, 0xb5764a, 3);
      [0.4, 0.8, 1.2, 1.7].forEach((hgt, i) => T.box(-8 + i*3.6, hgt/2, 12, 1.2, hgt/2, 1.2, 0, 0, 0, [0xa9c4d8, 0x8fb3cf, 0x749fc2, 0x5b8bb3][i]));
      T.tunnel(8, 8, 5, 0.95, 1.8, 0xc9b27c);
      T.sphere(10, 0.9, 16, 1.1, 0x9aa09a); T.sphere(-3, 0.8, -17, 1.0, 0xa59f98); T.sphere(16, 0.7, -2, 0.9, 0x8f9a94);
    }
  },
  hills: {
    label: 'Rolling hills', A: 26, ground: [0.40, 0.66, 0.38], dirt: [0.60, 0.48, 0.34], checker: true,
    h: (x, z) => 1.2*Math.sin(x*0.16)*Math.cos(z*0.13) + 0.7*Math.sin(x*0.07 + z*0.09 + 1) + 0.25*Math.sin(x*0.45 + z*0.38)
      + 3.2*Math.exp(-((x-9)*(x-9) + (z+7)*(z+7))/14) + 2.4*Math.exp(-((x+10)*(x+10) + (z-9)*(z-9))/10),
    build(T) { }
  },
  stairs: {
    label: 'Stairs', A: 26, ground: [0.52, 0.64, 0.50], dirt: [0.58, 0.48, 0.38], checker: true,
    h: () => 0,
    build(T) {
      const flight = (z, sh, steps, col) => { for (let i = 0; i < steps; i++) { const top = sh*(i+1); T.box(3 + i*0.8, top/2, z, 0.4, top/2, 2.2, 0, 0, 0, col); } };
      flight(-16, 0.2, 10, 0xc9d3b0); flight(-9, 0.35, 10, 0xb5c49a); flight(-2, 0.55, 10, 0xa0b384);
      flight(5, 0.8, 8, 0x8ba26e); flight(12, 1.1, 6, 0x778f5a);
    }
  },
  ramps: {
    label: 'Ramps 15 to 75 deg', A: 26, ground: [0.50, 0.62, 0.70], dirt: [0.55, 0.50, 0.46], checker: true,
    h: () => 0,
    build(T) {
      [15, 30, 45, 60, 75].forEach((ang, i) => {
        const z = -12 + i*6, len = 3.2/Math.sin(ang*D), xEnd = -14 + len*Math.cos(ang*D);
        T.ramp(-14, z, len, 4, ang, 0, [0xd9c08a, 0xcfa56f, 0xc58a55, 0xb86f45, 0xa9573a][i], 10 - xEnd);
        if (i < 4) T.box(-2, 0.25, z + 3, 12, 0.25, 0.15, 0, 0, 0, 0x7a7469);
      });
    }
  },
  rocky: {
    label: 'Rocky ground', A: 26, ground: [0.52, 0.56, 0.46], dirt: [0.50, 0.46, 0.40], checker: true,
    h: (x, z) => 0.55*Math.sin(x*0.35 + z*0.2) + 0.5*Math.sin(z*0.41 - x*0.17) + 0.28*Math.sin(x*0.9)*Math.sin(z*0.8) + 0.12*Math.sin(x*2.1 + z*1.7),
    build(T) {
      const r = rng(7);
      for (let i = 0; i < 16; i++) {
        let x, z; do { x = (r()*2 - 1)*22; z = (r()*2 - 1)*22; } while (Math.hypot(x, z) < 4.5);
        const rad = 0.5 + r()*0.9;
        T.sphere(x, defs.rocky.h(x, z) + rad*0.35, z, rad, 0x8c8a85);
      }
      for (let i = 0; i < 10; i++) {
        let x, z; do { x = (r()*2 - 1)*22; z = (r()*2 - 1)*22; } while (Math.hypot(x, z) < 4.5);
        const hx = 0.5 + r()*0.8, hy = 0.4 + r()*0.6, hz = 0.5 + r()*0.8;
        T.box(x, defs.rocky.h(x, z) + hy*0.5, z, hx, hy, hz, r()*180, (r()-0.5)*30, (r()-0.5)*30, 0x7d7a74);
      }
    }
  },
  walls: {
    label: 'Wall course', A: 26, ground: [0.60, 0.60, 0.64], dirt: [0.55, 0.52, 0.50], checker: true,
    h: () => 0,
    build(T) {
      [0.5, 1.0, 1.6, 2.4, 3.5, 5.0].forEach((hgt, i) => T.box(-12 + i*4.6, hgt/2, 0, 0.3, hgt/2, 7, 0, 0, 0, [0xd8c7a0, 0xcbb487, 0xbda06f, 0xae8c58, 0x9c773f, 0x8a632d][i]));
      T.tunnel(-10, 15, 6, 0.95, 1.8, 0xc9b27c);
      T.tunnel(4, -16, 6, 1.1, 1.8, 0xb6c9a0);
    }
  }
};

function build(name) {
  const d = defs[name] || defs.aetheria;
  const A = d.A || 26;
  const T = builder(A);
  const extra = d.build(T, A) || {};
  if (!d.noBorder) T.border();
  const cs = 0.5, N = Math.round(2 * A / cs), W = N + 1;
  const hg = new Float32Array(W * W);
  let hmax = -1e9, hmin = 1e9;
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
    const hv = d.h(-A + i*cs, -A + j*cs); hg[j*W + i] = hv;
    if (hv > hmax) hmax = hv;
    if (hv < hmin) hmin = hv;
  }
  const sp = d.spawn || [0, 0];
  return {
    name, label: d.label, A, cs, N, hg, hmax: Math.max(hmax, 0) + 0.3, hmin,
    boxes: T.boxes, spheres: T.spheres, cyls: T.cyls, visualOnly: T.visualOnly,
    ground: d.ground || [0.5, 0.7, 0.4], dirt: d.dirt || [0.58, 0.46, 0.34], checker: !!d.checker,
    colorAt: d.color || null, biomeAt: d.biome || null,
    flora: extra.flora || null, hut: extra.hut || null,
    spawn: [sp[0], d.h(sp[0], sp[1]) + 1.6, sp[1]]
  };
}

const list = Object.keys(defs).map(k => ({ id: k, label: defs[k].label }));
return { build, list, BIOMES };
})();

// ESM named exports (parity with the prototype return table; default keeps the namespace).
export const { build, list, BIOMES } = Terrain;
export default Terrain;
