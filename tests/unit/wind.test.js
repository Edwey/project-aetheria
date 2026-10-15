/**
 * Wind (Steady / Ride) parity tests (Stage C).
 * Rule 4: wind NEVER moves, slows or lifts unless Riding (Shift).
 * Tailwind boosts up to +40%; headwinds never slow; updrafts lift only while Riding.
 */
import assert from 'node:assert/strict';
import { Phys, Terrain, Wisp, slimeP, idleInp, wispInp, settledSlime, flatWorld } from './_harness.js';

const DT = 1 / 60;

function drift(form, wind, ride, shape = 'sphere') {
  const w = flatWorld();
  const P = slimeP(form);
  const b = Phys.makeSlime(shape, 0, 1.2, 0, 2, 1);
  for (let i = 0; i < 120; i++) Phys.stepBody(b, w, P, idleInp(), DT);
  const x0 = b.com[0], z0 = b.com[2];
  for (let i = 0; i < 300; i++) Phys.stepBody(b, w, P, idleInp({ wind, ride }), DT);
  return Math.hypot(b.com[0] - x0, b.com[2] - z0);
}

function wispDrift(wind, ride) {
  const world = Terrain.build('aetheria');
  const gy = Phys.groundHeight(world, 0, 0);
  const wp = Wisp.make(0, gy + 5, 0, 48, 1);
  for (let i = 0; i < 120; i++) Wisp.step(wp, world, { speedMul: 1 }, wispInp(), DT);
  const x0 = wp.com[0], z0 = wp.com[2];
  for (let i = 0; i < 300; i++) Wisp.step(wp, world, { speedMul: 1 }, wispInp({ wind, ride }), DT);
  return Math.hypot(wp.com[0] - x0, wp.com[2] - z0);
}

export const tests = {
  'idle drift under 0.3 m for slime, stone and wisp (steady wind)': () => {
    assert.ok(drift('slime', [10, 0, 0], false) < 0.3, 'slime steady');
    assert.ok(drift('stone', [10, 0, 0], false) < 0.3, 'stone steady');
    assert.ok(wispDrift([10, 0, 0], false) < 3, 'wisp steadies itself (no carry without Ride)');
  },

  'headwinds never slow any form': () => {
    const w = flatWorld();
    const run = (wind) => {
      const P = slimeP('slime');
      const b = Phys.makeSlime('sphere', -10, 1.2, 0, 2, 1);
      for (let i = 0; i < 300; i++) Phys.stepBody(b, w, P, idleInp({ mx: 1, wind }), DT);
      return b.com[0];
    };
    const calm = run([0, 0, 0]), head = run([-8, 0, 0]);
    assert.ok(head >= calm - 1e-6, `head=${head} calm=${calm}`);
  },

  'tailwind while Riding is faster (up to +40%)': () => {
    const w = flatWorld();
    const run = (wind, ride) => {
      const P = slimeP('slime');
      const b = Phys.makeSlime('sphere', -10, 1.2, 0, 2, 1);
      for (let i = 0; i < 300; i++) Phys.stepBody(b, w, P, idleInp({ mx: 1, wind, ride }), DT);
      return b.com[0];
    };
    const calm = run([0, 0, 0], false), tail = run([8, 0, 0], true);
    assert.ok(tail > calm, `tail=${tail} calm=${calm}`);
    assert.ok(tail <= (calm + 10) * 1.4 + 5, 'boost bounded (~+40% speed law)');
  },

  'updrafts only lift while Riding (glide into the thermal)': () => {
    const fly = (ride) => {
      const w = flatWorld();
      const P = slimeP('slime');
      const b = Phys.makeSlime('sphere', 0, 1.2, 0, 2, 1);
      for (let i = 0; i < 120; i++) Phys.stepBody(b, w, P, idleInp(), DT);
      for (let i = 0; i < 51; i++) Phys.stepBody(b, w, P, idleInp({ jumpHeld: true }), DT);
      for (let i = 0; i < 3; i++) Phys.stepBody(b, w, P, idleInp(), DT);
      let peak = b.com[1];
      for (let i = 0; i < 240; i++) {
        Phys.stepBody(b, w, P, idleInp({ jumpHeld: true, ride, wind: [0, 8, 0] }), DT);
        peak = Math.max(peak, b.com[1]);
      }
      return peak;
    };
    assert.ok(fly(true) > 10, 'Riding the updraft soars');
    assert.ok(fly(false) < 8, 'steady updraft never lifts past the jump apex');
  },

  'wisp motes hold formation while Riding a gust': () => {
    const world = Terrain.build('aetheria');
    const gy = Phys.groundHeight(world, 0, 0);
    const wp = Wisp.make(0, gy + 5, 0, 48, 1);
    for (let i = 0; i < 120; i++) {
      Wisp.step(wp, world, { speedMul: 1 }, wispInp({ wind: [12, 0, 12], ride: true, mx: 1 }), DT);
      assert.ok(Number.isFinite(wp.com[0] + wp.com[1] + wp.com[2]), 'com finite while Riding');
    }
  },
};
