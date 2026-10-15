import assert from 'node:assert/strict';
import { build, groundHeight } from '../../src/gameplay/terrain.js';
import { create, sample, update } from '../../src/gameplay/env.js';

export const tests = {
  'terrain build returns grid': () => {
    const w = build('test');
    assert.ok(w.hg instanceof Float32Array);
    assert.equal(typeof groundHeight(w, 0, 0), 'number');
  },
  'env sample is steady by default (no wind push)': () => {
    const w = build('test');
    const env = create(w, 1);
    update(env, 1 / 60);
    const s = sample(env, 0, 1, 0);
    assert.deepEqual(s.wind, [0, 0, 0]);
  },
};
