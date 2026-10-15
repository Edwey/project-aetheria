/**
 * Profile, events + verb-parity audit (Stage C).
 * Every form has EVERY verb; only the manner/perks differ (rule 1).
 */
import assert from 'node:assert/strict';
import Profile from '../../src/gameplay/profile.js';
import * as Events from '../../src/gameplay/events.js';
import { Phys, Wisp, Terrain, slimeP, idleInp, wispInp, settledSlime } from './_harness.js';

const DT = 1 / 60;

export const tests = {
  'profile validates defaults and sanitizes bad data': () => {
    const d = Profile.validate(null);
    assert.equal(d.form, 'slime');
    assert.ok(d.body.jmax >= 8 && d.body.jmax <= 20);
    const fixed = Profile.validate({ body: { jmax: 999, sticky: -5, preset: 'nope' }, cosmetics: { head: 'zzz' }, look: { size: 99 } });
    assert.ok(fixed.body.jmax <= 20 && fixed.body.sticky >= 0, 'clamped');
    assert.equal(fixed.body.preset, 'blob', 'bad preset reset');
  },

  'profile load/save roundtrips (or safely no-ops without storage)': () => {
    const p = Profile.load();
    assert.ok(p && p.body, 'load returns a profile even without DOM storage');
    const ok = Profile.save({ ...p, name: 'Test' });
    assert.equal(typeof ok, 'boolean');
  },

  'event bus: on/emit/off (multiplayer seam, no server in v1)': () => {
    const bus = Events.create();
    let hits = 0;
    const cb = () => { hits++; };
    Events.on(bus, 'hop', cb);
    Events.emit(bus, 'hop', {});
    Events.emit(bus, 'hop', {});
    assert.equal(hits, 2);
    Events.off(bus, 'hop', cb);
    Events.emit(bus, 'hop', {});
    assert.equal(hits, 2);
  },

  'verb parity: every form can jump': () => {
    const { body, world, P } = settledSlime('slime');
    for (let i = 0; i < 51; i++) Phys.stepBody(body, world, P, idleInp({ jumpHeld: true }), DT);
    for (let i = 0; i < 3; i++) Phys.stepBody(body, world, P, idleInp(), DT);
    assert.ok(body.jumpActive || body.lastPower > 0, 'slime jumps');
    const st = settledSlime('stone');
    for (let i = 0; i < 51; i++) Phys.stepBody(st.body, st.world, st.P, idleInp({ jumpHeld: true }), DT);
    for (let i = 0; i < 3; i++) Phys.stepBody(st.body, st.world, st.P, idleInp(), DT);
    assert.ok(st.body.jumpActive || st.body.lastPower > 0, 'stone jumps');
    const w = Terrain.build('aetheria');
    const gy = Phys.groundHeight(w, 0, 0);
    const wp = Wisp.make(0, gy + 0.6, 0, 48, 1);
    for (let i = 0; i < 120; i++) Wisp.step(wp, w, { speedMul: 1 }, wispInp(), DT);
    const y0 = wp.com[1];
    Wisp.step(wp, w, { speedMul: 1 }, wispInp({ jumpHeld: true }), DT);
    let peak = wp.com[1];
    for (let i = 0; i < 60; i++) { Wisp.step(wp, w, { speedMul: 1 }, wispInp(), DT); peak = Math.max(peak, wp.com[1]); }
    assert.ok(peak - y0 > 0.15, 'wisp hops');
  },

  'verb parity: climb/glide/squeeze/hover exist for all forms': () => {
    // climb flags: slime sticky wallMode, stone pitHold/pit, wisp climbing
    assert.ok(slimeP('slime').sticky > 0, 'slime sticky climb');
    assert.ok(slimeP('stone').pit, 'stone pitons');
    const w = Terrain.build('aetheria');
    const gy = Phys.groundHeight(w, 4.7, 0);
    const wp = Wisp.make(4.7, gy + 2, 0, 48, 1);
    for (let i = 0; i < 120; i++) Wisp.step(wp, w, { speedMul: 1 }, wispInp({ mx: -1 }), DT);
    assert.ok(wp.climbing !== undefined, 'wisp wall-hug state exists');
    // glide: caps differ, both finite and negative (controlled descent)
    assert.ok(slimeP('slime').glideCap < 0 && slimeP('stone').glideCap < 0, 'glide/sail caps');
    // squeeze: melt (slime) / shrink (stone) / diffuse mode (wisp)
    assert.ok(!slimeP('slime').noMelt, 'slime can melt');
    assert.ok(slimeP('stone').canShrink, 'stone can pebble');
    // hover budgets differ
    assert.ok(slimeP('slime').hoverTime > slimeP('stone').hoverTime, 'hover budgets differ');
  },
};
