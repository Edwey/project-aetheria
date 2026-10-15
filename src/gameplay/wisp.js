/**
 * src/gameplay/wisp.js <- Wisp - ported verbatim from Aetheria Slime Lab.html (Stage C).
 * THE PROTOTYPE IS SOURCE OF TRUTH FOR EVERY NUMBER. Do not change behaviour.
 * Wisp mote cloud.
 * Stage C: `Phys` was a browser global in the prototype; ES import here (same numbers).
 */

import { groundHeight, forEachContact } from './physics.js';

const Wisp = (function () {
'use strict';
const SUB = 2, HS = 1024;
const MAXSPEED = 5, ACCEL = 14, PR = 0.12, WIND_CAP = 10, TETHER = 2.2, FLOAT_COST = 20, HOVER_COST = 3, FLOAT_REFILL = 60, LOW_H = 1.4, SINK = 2.5;   // full breath = 5 s of rising, or about 33 s of just staying aloft

function make(cx, cy, cz, n, size) {
  n = n || 96; size = size || 1;
  const wp = {
    n, size, kind: 'wisp',
    x: new Float64Array(3*n), v: new Float64Array(3*n), a: new Float64Array(3*n),
    com: [cx, cy, cz], vcom: [0, 0, 0], radius: 0.6,
    breath: 100, floating: false, grounded: false, groundT: 0, dashCd: 0, wet: 0, diving: false, diveQueued: false, airT: 0, anchored: false, tail: 0, climbing: false, prevHeld: false, exhausted: false, diveT: 0, floatMode: false, low: true,
    head: new Int32Array(HS), next: new Int32Array(n), events: []
  };
  let s = 12345;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let i = 0; i < n; i++) {
    let x, y, z; do { x = rnd()*2 - 1; y = rnd()*2 - 1; z = rnd()*2 - 1; } while (x*x + y*y + z*z > 1);
    wp.x[3*i] = cx + x*0.45*size; wp.x[3*i+1] = cy + y*0.45*size; wp.x[3*i+2] = cz + z*0.45*size;
  }
  return wp;
}

function stats(wp) {
  const n = wp.n, x = wp.x, v = wp.v;
  let cx = 0, cy = 0, cz = 0, vx = 0, vy = 0, vz = 0;
  for (let i = 0; i < n; i++) { cx += x[3*i]; cy += x[3*i+1]; cz += x[3*i+2]; vx += v[3*i]; vy += v[3*i+1]; vz += v[3*i+2]; }
  wp.com[0] = cx/n; wp.com[1] = cy/n; wp.com[2] = cz/n; wp.vcom[0] = vx/n; wp.vcom[1] = vy/n; wp.vcom[2] = vz/n;
  let r2 = 0;
  for (let i = 0; i < n; i++) { const dx = x[3*i]-wp.com[0], dy = x[3*i+1]-wp.com[1], dz = x[3*i+2]-wp.com[2]; r2 += dx*dx + dy*dy + dz*dz; }
  wp.radius = Math.sqrt(r2 / n);
}

// inp: {mx,mz,jumpHeld,dash,mode(-1 diffuse,0,1 condense),wind:[x,y,z],wetAmt,bw:[4 biome weights],time}
function step(wp, w, P, inp, dt) {
  const n = wp.n, x = wp.x, v = wp.v, a = wp.a, head = wp.head, next = wp.next;
  const mx = inp.mx || 0, mz = inp.mz || 0, mag = Math.min(1, Math.hypot(mx, mz));
  const bw = inp.bw || [1, 0, 0, 0], mode = inp.mode || 0, size = wp.size;
  const wet = inp.wetAmt || 0; wp.wet = wet;
  // Wind: Steady by default (never moves, slows or lifts the wisp, so it is safe to leave it AFK).
  // Hold Ride (Shift) and the wind carries and boosts you: tailwinds are faster, headwinds never slow you, updrafts lift you.
  const riding = !!inp.ride; wp.riding = riding; wp.anchored = !riding;
  let wind = riding ? (inp.wind || [0, 0, 0]).slice() : [0, 0, 0], tailwind = 0;
  if (riding && mag > 0.05) {
    const dx = mx / mag, dz = mz / mag, dn = wind[0] * dx + wind[2] * dz;
    if (dn < 0) { wind[0] -= dn * dx; wind[2] -= dn * dz; } else tailwind = Math.min(1, dn / 4);
  }
  wp.tail = tailwind;

  // breath: Space floats, F dashes
  if (wp.dashCd > 0) wp.dashCd -= dt;
  // ---- Rise / Float / Sink: one simple model ----
  // ON THE GROUND (or within LOW_H of it): free. Breath refills fast and Float mode switches itself off.
  // RISE  = hold Space. Goes up, drains breath fast (20 per second, 5 s from full). Rising right next to the ground is free.
  // FLOAT = you switch it on with V while up in the air. Holds your altitude and drains breath slowly (3 per second, about 33 s from full).
  // SINK  = anything else while up in the air. Sinks gently and costs nothing, so a wisp always comes down.
  // Out of breath: Float switches off, you cannot rise, you sink until you touch down. Riding an updraft pauses the drain and refills.
  // The tap hop and the down-gust (F) are free. Rain slows the Float drain to a third.
  const clearance = wp.com[1] - groundHeight(w, wp.com[0], wp.com[2]);
  const low = wp.grounded || clearance < LOW_H;
  wp.low = low;
  if (inp.floatToggle) wp.floatMode = !wp.floatMode && !wp.exhausted && !low;
  if (low) { wp.breath = Math.min(100, wp.breath + FLOAT_REFILL * dt); wp.exhausted = false; wp.floatMode = false; }
  if (wet > 0) wp.breath = Math.min(100, wp.breath + 2 * wet * dt);
  if (wind[1] > 1) { wp.breath = 100; wp.exhausted = false; }          // riding an updraft or thermal
  wp.floating = !!inp.jumpHeld && !wp.exhausted && wp.breath > 0;      // true while rising
  if (wp.floating) { if (!low) wp.breath = Math.max(0, wp.breath - FLOAT_COST * dt); if (wp.breath <= 0) { wp.exhausted = true; wp.floating = false; wp.floatMode = false; } }
  else if (wp.floatMode && !(wind[1] > 1)) { wp.breath = Math.max(0, wp.breath - HOVER_COST * dt); if (wp.breath <= 0) { wp.breath = 0; wp.exhausted = true; wp.floatMode = false; } }
  if (wp.diving) wp.floatMode = false;
  if (inp.jumpHeld && !wp.prevHeld && clearance < 1.2) { for (let i = 0; i < n; i++) v[3*i+1] += 6; wp.events.push({ t: 'puff', x: wp.com[0], y: wp.com[1], z: wp.com[2] }); }   // tap Space: free puff (a hop)
  wp.prevHeld = !!inp.jumpHeld;
  if (inp.pound && !wp.diving) {
    if (low) { for (let i = 0; i < n; i++) v[3*i+1] += 9; wp.diveQueued = true; }
    else { for (let i = 0; i < n; i++) { v[3*i] *= 0.3; v[3*i+1] = -22; v[3*i+2] *= 0.3; } wp.diving = true; wp.diveQueued = false; wp.diveT = 0; }
  }
  if (wp.diveQueued && !wp.grounded && wp.vcom[1] < 0.5 && wp.airT > 0.15) {
    for (let i = 0; i < n; i++) { v[3*i] *= 0.3; v[3*i+1] = -22; v[3*i+2] *= 0.3; } wp.diving = true; wp.diveQueued = false; wp.diveT = 0;
  }
  if (inp.dash && wp.dashCd <= 0 && wp.breath >= 30) {
    wp.breath -= 30; wp.dashCd = 0.8;
    let dx = mx, dz = mz; const l = Math.hypot(dx, dz);
    if (l < 0.1) { dx = inp.fx || 0; dz = inp.fz || 1; } else { dx /= l; dz /= l; }
    for (let i = 0; i < n; i++) { v[3*i] += dx * 12; v[3*i+2] += dz * 12; v[3*i+1] += 1.5; }
    wp.events.push({ t: 'dash' });
  }

  let kCoh = 2.5, rep = 0.22 * Math.sqrt(size), speedMul = 1;
  if (mode > 0) { kCoh *= 4; rep = 0.14 * Math.sqrt(size); speedMul = 1.4; }
  else if (mode < 0) { kCoh *= 0.3; rep = 0.35 * Math.sqrt(size); speedMul = 0.6; }
  if (wp.diving) { kCoh *= 3; rep *= 0.7; }              // the cloud tightens into a bolt while diving
  kCoh *= 1 + 0.5 * bw[2];            // cold taiga air pulls it tight
  kCoh *= 1 - 0.3 * bw[1];            // dune heat expands it
  const maxSpeed = MAXSPEED * speedMul * (P && P.speedMul ? P.speedMul : 1) * (1 + 0.4 * tailwind);
  const h = dt / SUB, cell = Math.max(0.1, rep);
  const t = inp.time || 0;
  wp.grounded = false; wp.landed = false;

  for (let s = 0; s < SUB; s++) {
    stats(wp);
    const c = wp.com, vc = wp.vcom;
    head.fill(-1);
    for (let i = 0; i < n; i++) {
      const ix = Math.floor(x[3*i] / cell), iy = Math.floor(x[3*i+1] / cell), iz = Math.floor(x[3*i+2] / cell);
      const k = ((ix * 73856093) ^ (iy * 19349663) ^ (iz * 83492791)) & (HS - 1);
      next[i] = head[k]; head[k] = i;
    }
    // cap on centre-of-mass speed (soft brake)
    const hs = Math.hypot(vc[0], vc[2]); let bx = 0, bz = 0;
    if (hs > maxSpeed) { const f = (hs - maxSpeed) / hs; bx = -vc[0] * f * 8; bz = -vc[2] * f * 8; }
    const drag = 0.8 + (mag > 0.05 ? 0 : (riding ? 1.2 : 2.7));   // idle and not riding: settles and holds position
    for (let i = 0; i < n; i++) {
      const k = 3*i;
      let ax = mx * ACCEL * speedMul + bx, ay = wp.floatMode ? 0 : -SINK, az = mz * ACCEL * speedMul + bz;   // Float holds altitude; otherwise it sinks gently
      if (wp.floating) ay = -SINK + 9 * Math.max(0, Math.min(1, (w.hmax + 25 - c[1]) / 5));   // rising, with a soft ceiling 25 m above the highest ground
      if (wp.climbing) v[k+1] += (3 - v[k+1]) * Math.min(1, 8 * h);                     // wall-hug: drift up at 3 m/s
      // cohesion toward the centroid, clamped
      let cxk = (c[0] - x[k]) * kCoh, cyk = (c[1] - x[k+1]) * kCoh, czk = (c[2] - x[k+2]) * kCoh;
      const cl = Math.sqrt(cxk*cxk + cyk*cyk + czk*czk);
      if (cl > 8) { const f = 8 / cl; cxk *= f; cyk *= f; czk *= f; }
      ax += cxk; ay += cyk; az += czk;
      // self repulsion (stops the cloud collapsing to a point)
      const ix = Math.floor(x[k] / cell), iy = Math.floor(x[k+1] / cell), iz = Math.floor(x[k+2] / cell);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
        const key = (((ix+dx) * 73856093) ^ ((iy+dy) * 19349663) ^ ((iz+dz) * 83492791)) & (HS - 1);
        for (let j = head[key]; j >= 0; j = next[j]) {
          if (j === i) continue;
          const rx = x[k] - x[3*j], ry = x[k+1] - x[3*j+1], rz = x[k+2] - x[3*j+2], d2 = rx*rx + ry*ry + rz*rz;
          if (d2 < rep * rep && d2 > 1e-10) { const d = Math.sqrt(d2), f = 220 * (rep - d) / d; ax += rx*f; ay += ry*f; az += rz*f; }
        }
      }
      // turbulence (cheap curl-like noise) keeps it alive
      ax += 0.6 * Math.sin(x[k+1]*3.1 + t*1.7 + i); ay += 0.3 * Math.sin(x[k]*2.7 - t*1.3 + i*1.3); az += 0.6 * Math.cos(x[k+1]*2.9 + t*1.1 + i*0.7);
      // wind (wisps are five times more affected than slimes)
      let wax = 2.0 * wind[0], waz = 2.0 * wind[2], way = (wind[1] > 0.5) ? 3 * (wind[1] - v[k+1]) : 0;   // updrafts lift you (Ride only)
      const wl = Math.sqrt(wax*wax + waz*waz); if (wl > WIND_CAP) { wax *= WIND_CAP / wl; waz *= WIND_CAP / wl; }   // steering (14) always beats wind (10)
      if (way > WIND_CAP) way = WIND_CAP;
      ax += wax; ay += way; az += waz;
      v[k] += ax*h; v[k+1] += ay*h; v[k+2] += az*h;
      if (wp.diving) { v[k+1] = Math.min(v[k+1], -18); v[k] *= 0.97; v[k+2] *= 0.97; }   // a dive keeps its speed until it lands
      if (wp.floatMode && !wp.floating) v[k+1] *= (1 - 6 * h);                           // Float: stop and hang
      const dh = 1 - (wp.diving ? 0.8 : drag)*h, dv = 1 - 0.8*h; v[k] *= dh; v[k+1] *= dv; v[k+2] *= dh;
      const sp = Math.sqrt(v[k]*v[k] + v[k+1]*v[k+1] + v[k+2]*v[k+2]);
      if (sp > 18) { const f = 18 / sp; v[k] *= f; v[k+1] *= f; v[k+2] *= f; }
      x[k] += v[k]*h; x[k+1] += v[k+1]*h; x[k+2] += v[k+2]*h;
    }
    // collisions: slide along surfaces, bounce a little
    const lim = w.A - 0.12, r = PR * size; let wallN = 0, wnx = 0, wnz = 0;
    for (let i = 0; i < n; i++) {
      const k = 3*i;
      if (x[k] < -lim) { x[k] = -lim; if (v[k] < 0) v[k] = 0; } else if (x[k] > lim) { x[k] = lim; if (v[k] > 0) v[k] = 0; }
      if (x[k+2] < -lim) { x[k+2] = -lim; if (v[k+2] < 0) v[k+2] = 0; } else if (x[k+2] > lim) { x[k+2] = lim; if (v[k+2] > 0) v[k+2] = 0; }
      { // the Core keeps the cloud together: hard tether to the centroid
        const dx = x[k] - wp.com[0], dy = x[k+1] - wp.com[1], dz = x[k+2] - wp.com[2], d2 = dx*dx + dy*dy + dz*dz, R = TETHER * size * (mode < 0 ? 1.3 : 1);
        if (d2 > R * R) { const d = Math.sqrt(d2), f = R / d, rv = (v[k]*dx + v[k+1]*dy + v[k+2]*dz) / d; x[k] = wp.com[0] + dx*f; x[k+1] = wp.com[1] + dy*f; x[k+2] = wp.com[2] + dz*f; if (rv > 0) { v[k] -= rv*dx/d; v[k+1] -= rv*dy/d; v[k+2] -= rv*dz/d; } }
      }
      forEachContact(w, x[k], x[k+1], x[k+2], r, (nx, ny, nz, pen) => {
        x[k] += nx*pen; x[k+1] += ny*pen; x[k+2] += nz*pen;
        const vn = v[k]*nx + v[k+1]*ny + v[k+2]*nz;
        if (vn < 0) { const f = 1.25 * vn; v[k] -= f*nx; v[k+1] -= f*ny; v[k+2] -= f*nz; }
        if (ny > 0.5) wp.grounded = true;
        if (ny > 0.2) wp.landed = true;
        if (ny < 0.6 && ny > -0.9) { wallN++; wnx += nx; wnz += nz; }
      });
    }
    { const wl = Math.hypot(wnx, wnz); const into = wl > 1e-6 ? -(mx * wnx + mz * wnz) / wl : 0; wp.climbing = wallN >= 3 && mag > 0.05 && into > 0.25; }   // steering into a wall: hug it and drift up
  }
  stats(wp);
  if (wp.grounded) wp.airT = 0; else wp.airT += dt;
  if (wp.diving) {
    wp.diveT += dt;
    if (wp.grounded || wp.landed) { wp.diving = false; wp.events.push({ t: 'pound', x: wp.com[0], y: wp.com[1], z: wp.com[2] }); }
    else if (wp.diveT > 2) wp.diving = false;                  // safety: never stay stuck in a dive
  }
}

return { make, step, stats, constants: { MAXSPEED, ACCEL } };
})();

// ESM named exports (parity with the prototype return table; default keeps the namespace).
export const { make, step, stats, constants } = Wisp;
export default Wisp;
