/**
 * Stone parity tests (Stage C). Stone = slime body at full stiffness + pitons,
 * crystal sail, pebble shrink. Advantages only (never slower at any verb).
 */
import assert from 'node:assert/strict';
import { Phys, slimeP, idleInp, settledSlime, bodyHeight, flatWorld, wallBox } from './_harness.js';
import { stackCap } from '../../src/gameplay/craft.js';

const DT = 1 / 60;

export const tests = {
  'stone params: pitons, sail cap -3, no melt, can shrink': () => {
    const P = slimeP('stone');
    assert.equal(P.pit, true);
    assert.equal(P.glideCap, -3);
    assert.equal(P.noMelt, true);
    assert.equal(P.canShrink, true);
    assert.equal(P.stiff, 1);
  },

  'stone hover (0.5 s) is shorter than slime hover (0.8 s)': () => {
    assert.equal(slimeP('stone').hoverTime, 0.5);
    assert.equal(slimeP('slime').hoverTime, 0.8);
  },

  'stack cap 80 vs 40': () => {
    assert.equal(stackCap('stone'), 80);
    assert.equal(stackCap('slime'), 40);
    assert.equal(stackCap('wisp'), 40);
  },

  'pitons climb and hang without slipping': () => {
    const w = flatWorld([wallBox(5, 5)]);
    const P = slimeP('stone');
    const b = Phys.makeSlime('sphere', 2, 1.2, 0, 2, 1);
    let peak = 0;
    for (let i = 0; i < 600; i++) { Phys.stepBody(b, w, P, idleInp({ mx: 1 }), DT); peak = Math.max(peak, b.com[1]); }
    assert.ok(peak > 3.5, `peak=${peak}`);
    assert.ok(Math.abs(b.com[0] - 5) < 1.6, `hangs at wall, x=${b.com[0]}`);
  },

  'crystal sail caps the fall and lands one shockwave': () => {
    const { body, world, P } = settledSlime('stone');
    for (let i = 0; i < 51; i++) Phys.stepBody(body, world, P, idleInp({ jumpHeld: true }), DT);
    for (let i = 0; i < 3; i++) Phys.stepBody(body, world, P, idleInp(), DT);
    let minVy = 0, sailed = false;
    for (let i = 0; i < 240; i++) {
      Phys.stepBody(body, world, P, idleInp({ jumpHeld: true }), DT);
      minVy = Math.min(minVy, body.vcom[1]);
      if (body.gliding) sailed = true;
    }
    assert.ok(sailed, 'sail should engage');
    assert.ok(minVy > -4.5, `sail cap, minVy=${minVy}`);
  },

  'pebble shrinks to 0.65, fits where full size stalls, grows back': () => {
    const P = slimeP('stone');
    const { body, world } = settledSlime('stone');
    for (let i = 0; i < 120; i++) Phys.stepBody(body, world, P, idleInp({ melt: true }), DT);
    assert.ok(Math.abs(body.scale - 0.65) < 0.03, `scale=${body.scale}`);
    for (let i = 0; i < 180; i++) Phys.stepBody(body, world, P, idleInp(), DT);
    assert.ok(Math.abs(body.scale - 1) < 0.03, `regrew scale=${body.scale}`);
  },

  'stone walks at full ground speed (advantage audit: never slower)': () => {
    const run = (form) => {
      const w = flatWorld();
      const P = slimeP(form);
      const b = Phys.makeSlime('sphere', -10, 1.2, 0, 2, 1);
      for (let i = 0; i < 300; i++) Phys.stepBody(b, w, P, idleInp({ mx: 1 }), DT);
      return b.com[0];
    };
    const stone = run('stone'), slime = run('slime');
    assert.ok(stone >= slime * 0.9, `stone=${stone} slime=${slime}`);
  },
};
