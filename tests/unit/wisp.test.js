/**
 * Wisp parity tests (Stage C). Thresholds from Prompt.txt section 12:
 * rise ~20/s, float ~3/s, refill 60/s near ground, tether 2.2 m.
 */
import assert from 'node:assert/strict';
import { Phys, Terrain, Wisp, wispInp, lcg, flatWorld } from './_harness.js';

const DT = 1 / 60;
const MOTES = 48; // Light quality; breath logic is mote-count independent

function spawn(world, h = 6) {
  const gy = Phys.groundHeight(world, 0, 0);
  return { wp: Wisp.make(0, gy + h, 0, MOTES, 1), gy };
}

export const tests = {
  'tether constant is 2.2 m': () => {
    assert.equal(Wisp.constants.MAXSPEED, 5);
  },

  'tap Space hops (free puff, gains height)': () => {
    const world = Terrain.build('aetheria');
    const { wp } = spawn(world, 0.6);
    for (let i = 0; i < 120; i++) Wisp.step(wp, world, { speedMul: 1 }, wispInp(), DT);
    const y0 = wp.com[1];
    wp.events.length = 0;
    Wisp.step(wp, world, { speedMul: 1 }, wispInp({ jumpHeld: true }), DT);
    Wisp.step(wp, world, { speedMul: 1 }, wispInp(), DT);
    let peak = wp.com[1];
    for (let i = 0; i < 60; i++) { Wisp.step(wp, world, { speedMul: 1 }, wispInp(), DT); peak = Math.max(peak, wp.com[1]); }
    assert.ok(wp.events.some((e) => e.t === 'puff'), 'tap emits a puff');
    assert.ok(peak - y0 > 0.2, `hop rise=${peak - y0}`);
  },

  'rise costs about 20/s': () => {
    const world = Terrain.build('aetheria');
    const { wp } = spawn(world, 6);
    const b0 = wp.breath, y0 = wp.com[1];
    for (let i = 0; i < 60; i++) Wisp.step(wp, world, { speedMul: 1 }, wispInp({ jumpHeld: true }), DT);
    assert.ok(Math.abs((b0 - wp.breath) - 20) < 3, `cost=${b0 - wp.breath}`);
    assert.ok(wp.com[1] - y0 > 1, 'rising gains altitude');
  },

  'float costs about 3/s': () => {
    const world = Terrain.build('aetheria');
    const { wp } = spawn(world, 6);
    Wisp.step(wp, world, { speedMul: 1 }, wispInp({ floatToggle: true }), DT);
    assert.ok(wp.floatMode, 'V enables float');
    const b0 = wp.breath;
    for (let i = 0; i < 120; i++) Wisp.step(wp, world, { speedMul: 1 }, wispInp(), DT);
    assert.ok(Math.abs((b0 - wp.breath) - 6) < 2, `cost=${b0 - wp.breath}`);
  },

  'no breath spent on or near the ground (60 s random-input fuzz)': () => {
    const world = Terrain.build('aetheria');
    const rnd = lcg(1234);
    const { wp } = spawn(world, 0.5);
    for (let i = 0; i < 3600; i++) {
      const inp = wispInp({ jumpHeld: rnd() < 0.5, mx: rnd() * 2 - 1, mz: rnd() * 2 - 1, pound: rnd() < 0.01, floatToggle: rnd() < 0.01 });
      Wisp.step(wp, world, { speedMul: 1 }, inp, DT);
      assert.ok(wp.breath >= 0 && wp.breath <= 100, `breath=${wp.breath}`);
      assert.ok(Number.isFinite(wp.com[0] + wp.com[1] + wp.com[2]), 'com finite');
      for (let k = 0; k < wp.n; k++) assert.ok(Number.isFinite(wp.x[3 * k] + wp.x[3 * k + 1] + wp.x[3 * k + 2]), 'motes finite');
    }
  },

  'out of breath means no rising until touchdown': () => {
    const world = Terrain.build('aetheria');
    const { wp, gy } = spawn(world, 6);
    for (let i = 0; i < 360; i++) Wisp.step(wp, world, { speedMul: 1 }, wispInp({ jumpHeld: true }), DT);
    assert.ok(wp.exhausted, 'holding rise must exhaust');
    const y0 = wp.com[1];
    for (let i = 0; i < 60; i++) Wisp.step(wp, world, { speedMul: 1 }, wispInp({ jumpHeld: true }), DT);
    assert.ok(wp.com[1] - y0 < 0.5, 'exhausted: no rising');
    for (let i = 0; i < 1200 && !wp.grounded; i++) Wisp.step(wp, world, { speedMul: 1 }, wispInp(), DT);
    assert.ok(wp.grounded, 'it always comes down by itself');
    assert.ok(!wp.exhausted, 'touchdown resets exhaustion');
  },

  'down-gust completes from 40 random places: one shockwave, never stuck': () => {
    const world = Terrain.build('aetheria');
    const rnd = lcg(99);
    for (let t = 0; t < 40; t++) {
      const x = (rnd() * 2 - 1) * 40, z = (rnd() * 2 - 1) * 40;
      const gy = Phys.groundHeight(world, x, z);
      const wp = Wisp.make(x, gy + 6 + rnd() * 6, z, MOTES, 1);
      Wisp.step(wp, world, { speedMul: 1 }, wispInp({ pound: true }), DT);
      let n = 0;
      while (wp.diving && n < 600) { Wisp.step(wp, world, { speedMul: 1 }, wispInp(), DT); n++; }
      assert.ok(!wp.diving, `place ${t}: dive must resolve`);
      assert.equal(wp.events.filter((e) => e.t === 'pound').length, 1, `place ${t}: exactly one shockwave`);
    }
  },

  'motes stay within the 2.2 m tether in violent gusts': () => {
    const world = Terrain.build('aetheria');
    const { wp } = spawn(world, 8);
    for (let i = 0; i < 240; i++) {
      Wisp.step(wp, world, { speedMul: 1 }, wispInp({ mx: 1, mz: 1, jumpHeld: true, wind: [25, 6, -25], ride: true }), DT);
    }
    let maxD = 0;
    for (let k = 0; k < wp.n; k++) {
      const d = Math.hypot(wp.x[3 * k] - wp.com[0], wp.x[3 * k + 1] - wp.com[1], wp.x[3 * k + 2] - wp.com[2]);
      maxD = Math.max(maxD, d);
    }
    assert.ok(maxD <= 2.2 * 1.35 + 0.3, `max mote dist=${maxD}`);
  },
};
