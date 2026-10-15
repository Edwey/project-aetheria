/**
 * Slime parity tests (Stage C). Thresholds from Prompt.txt section 12.
 * Prototype is source of truth; Light level (162 particles) unless noted.
 */
import assert from 'node:assert/strict';
import { Phys, slimeP, idleInp, settledSlime, bodyHeight, flatWorld, wallBox } from './_harness.js';

const DT = 1 / 60;

export const tests = {
  'constants: gravity -20, particle radius 0.07': () => {
    assert.equal(Phys.constants.G, -20);
    assert.equal(Phys.constants.RP, 0.07);
  },

  'particle counts: 642 Full, 162 Light': () => {
    assert.equal(Phys.makeSlime('sphere', 0, 5, 0, 3, 1).n, 642);
    assert.equal(Phys.makeSlime('sphere', 0, 5, 0, 2, 1).n, 162);
  },

  'fixed-step determinism: identical runs match to 1e-12': () => {
    const run = () => {
      const { body, world, P } = settledSlime();
      for (let i = 0; i < 60; i++) Phys.stepBody(body, world, P, idleInp({ mx: 0.5, jumpHeld: i > 30 }), DT);
      return [...body.com];
    };
    const a = run(), b = run();
    for (let i = 0; i < 3; i++) assert.ok(Math.abs(a[i] - b[i]) < 1e-12, `com[${i}] differs`);
  },

  'settles about 0.5 m above ground': () => {
    const { body, world } = settledSlime();
    const above = body.com[1] - Phys.groundHeight(world, body.com[0], body.com[2]);
    assert.ok(above > 0.3 && above < 0.8, `above=${above}`);
  },

  'jumpHeight: tap ~0.5 m': () => {
    const h = Phys.jumpHeight({ jmax: 15 }, 0).height;
    assert.ok(h > 0.4 && h < 0.7, `h=${h}`);
  },

  'jumpHeight: 0.3 s hold ~1.6 m': () => {
    const h = Phys.jumpHeight({ jmax: 15 }, 0.3).height;
    assert.ok(h > 1.1 && h < 2.1, `h=${h}`);
  },

  'jumpHeight: 0.85 s hold ~5 m': () => {
    const h = Phys.jumpHeight({ jmax: 15 }, 0.85).height;
    assert.ok(h > 3.8 && h < 5.8, `h=${h}`);
  },

  'sim tap jump rises, full charge rises far higher': () => {
    const rise = (holdSteps) => {
      const { body, world, P } = settledSlime();
      const y0 = body.com[1];
      for (let i = 0; i < holdSteps; i++) Phys.stepBody(body, world, P, idleInp({ jumpHeld: true }), DT);
      for (let i = 0; i < 3; i++) Phys.stepBody(body, world, P, idleInp(), DT);
      let peak = body.com[1];
      for (let i = 0; i < 240; i++) { Phys.stepBody(body, world, P, idleInp(), DT); peak = Math.max(peak, body.com[1]); }
      return peak - y0;
    };
    const tap = rise(3), full = rise(51);
    assert.ok(tap > 0.3, `tap=${tap}`);
    assert.ok(full > 3.5, `full=${full}`);
  },

  'blob passes the 0.95 m aetheria tunnel': () => {
    const { body, world, P } = settledSlime('slime', 'sphere', 3, 8);
    for (let i = 0; i < 720; i++) Phys.stepBody(body, world, P, idleInp({ mx: 1 }), DT);
    assert.ok(body.com[0] > 10.5, `x=${body.com[0]} (tunnel exit ~10.5)`);
  },

  'melted slime squeezes through a 0.7 m gap that blocks full size': () => {
    const { I3 } = { I3: [1, 0, 0, 0, 1, 0, 0, 0, 1] };
    const B = (cx, cy, cz, hx, hy, hz) => ({ c: [cx, cy, cz], h: [hx, hy, hz], R: I3.slice(), br: Math.hypot(hx, hy, hz), color: 0xffffff });
    const gapH = 0.7, gapW = 1.8, wall = 0.3, hw = gapW / 2 + wall / 2;
    const boxes = [
      B(0, gapH / 2, -hw, 2.5, gapH / 2, wall / 2),
      B(0, gapH / 2, hw, 2.5, gapH / 2, wall / 2),
      B(0, gapH + 0.25, 0, 2.5, 0.25, hw + wall / 2),
    ];
    const run = (melt) => {
      const A = 30, cs = 0.5, N = 120;
      const w = { A, cs, N, hg: new Float32Array((N + 1) * (N + 1)), hmax: 1, hmin: -1, boxes, spheres: [], cyls: [] };
      const P = slimeP('slime', { sticky: 0 });
      const b = Phys.makeSlime('sphere', -4, 1.2, 0, 2, 1);
      for (let i = 0; i < 720; i++) Phys.stepBody(b, w, P, idleInp({ mx: 1, melt }), DT);
      return b.com[0];
    };
    assert.ok(run(false) < 0, 'full size stalls at the 0.7 m gap');
    assert.ok(run(true) > 2.5, 'melted slime squeezes through');
  },

  'sticky climbs a 5 m wall, plain slime does not': () => {
    const climb = (sticky) => {
      const w = flatWorld([wallBox(5, 5)]);
      const P = slimeP('slime', { sticky });
      const b = Phys.makeSlime('sphere', 2, 1.2, 0, 2, 1);
      let peak = 0;
      for (let i = 0; i < 600; i++) { Phys.stepBody(b, w, P, idleInp({ mx: 1 }), DT); peak = Math.max(peak, b.com[1]); }
      return peak;
    };
    assert.ok(climb(0.5) > 4.5, 'sticky should top the 5 m wall');
    assert.ok(climb(0) < 2, 'plain slime stays at the base');
  },

  'melt goes below 0.65 m tall and recovers above 0.85 m': () => {
    const { body, world, P } = settledSlime();
    for (let i = 0; i < 120; i++) Phys.stepBody(body, world, P, idleInp({ melt: true }), DT);
    assert.ok(bodyHeight(body) < 0.65, `melted h=${bodyHeight(body)}`);
    for (let i = 0; i < 180; i++) Phys.stepBody(body, world, P, idleInp(), DT);
    assert.ok(bodyHeight(body) > 0.85, `recovered h=${bodyHeight(body)}`);
  },

  'glide caps the fall while Space is held in the air': () => {
    const { body, world, P } = settledSlime();
    for (let i = 0; i < 51; i++) Phys.stepBody(body, world, P, idleInp({ jumpHeld: true }), DT);
    for (let i = 0; i < 3; i++) Phys.stepBody(body, world, P, idleInp(), DT);
    let minVy = 0, glided = false;
    for (let i = 0; i < 240; i++) {
      Phys.stepBody(body, world, P, idleInp({ jumpHeld: true }), DT);
      minVy = Math.min(minVy, body.vcom[1]);
      if (body.gliding) glided = true;
    }
    assert.ok(glided, 'should enter glide');
    assert.ok(minVy > -4, `fall capped, minVy=${minVy}`);
  },

  'ground pound lands exactly one shockwave and never sticks': () => {
    const { body, world, P } = settledSlime();
    for (let i = 0; i < 51; i++) Phys.stepBody(body, world, P, idleInp({ jumpHeld: true }), DT);
    for (let i = 0; i < 5; i++) Phys.stepBody(body, world, P, idleInp(), DT);
    body.events.length = 0;
    Phys.stepBody(body, world, P, idleInp({ pound: true }), DT);
    for (let i = 0; i < 300 && body.pounding; i++) Phys.stepBody(body, world, P, idleInp(), DT);
    assert.equal(body.events.filter((e) => e.t === 'pound').length, 1);
    assert.ok(!body.pounding, 'pound must resolve');
  },
};
