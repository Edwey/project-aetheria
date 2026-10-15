/**
 * Shared headless harness for parity tests (Stage C).
 * World/behaviour source of truth: Aetheria Slime Lab.html (ported verbatim).
 */
import Phys from '../../src/gameplay/physics.js';
import Terrain from '../../src/gameplay/terrain.js';
import Profile from '../../src/gameplay/profile.js';
import Wisp from '../../src/gameplay/wisp.js';

export const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export function baseP(over = {}) {
  return { ...Profile.DEFAULT.body, gscale: 1, jboost: 1, gripMul: 1, speedMul: 1, spring: false, ...over };
}

export function slimeP(form = 'slime', over = {}) {
  return Phys.formParams(form, baseP(over), {});
}

export function idleInp(over = {}) {
  return { mx: 0, mz: 0, jumpHeld: false, melt: false, pound: false, heart: false, ride: false, wind: [0, 0, 0], ...over };
}

export function wispInp(over = {}) {
  return {
    mx: 0, mz: 0, jumpHeld: false, dash: false, mode: 0, wind: [0, 0, 0],
    wetAmt: 0, bw: [1, 0, 0, 0], time: 0, fx: 0, fz: 1,
    pound: false, floatToggle: false, ride: false, ...over,
  };
}

export function flatWorld(boxes = []) {
  const A = 30, cs = 0.5, N = 120;
  return { A, cs, N, hg: new Float32Array((N + 1) * (N + 1)), hmax: 1, hmin: -1, boxes, spheres: [], cyls: [] };
}

export function wallBox(cx, h = 5, alongZ = 3) {
  return { c: [cx, h / 2, 0], h: [0.3, h / 2, alongZ], R: I3.slice(), br: Math.hypot(0.3, h / 2, alongZ), color: 0xffffff };
}

/** Settle a slime body on the aetheria world. Returns { body, world, P }. */
export function settledSlime(form = 'slime', shape = 'sphere', x = null, z = null, over = {}) {
  const world = Terrain.build('aetheria');
  const P = slimeP(form, over);
  const sx = x ?? world.spawn[0], sz = z ?? world.spawn[2];
  const gy = Phys.groundHeight(world, sx, sz);
  const body = Phys.makeSlime(shape, sx, gy + 1.5, sz, 2, 1);
  for (let i = 0; i < 180; i++) Phys.stepBody(body, world, P, idleInp(), 1 / 60);
  return { body, world, P };
}

export function bodyHeight(b) {
  let lo = 1e9, hi = -1e9;
  for (let i = 0; i < b.n; i++) {
    const y = b.x[3 * i + 1];
    if (y < lo) lo = y;
    if (y > hi) hi = y;
  }
  return hi - lo;
}

/** Deterministic LCG for fuzz/placement (tests must be stable). */
export function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export { Phys, Terrain, Profile, Wisp };
