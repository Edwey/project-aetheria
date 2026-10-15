import assert from 'node:assert/strict';
import { RES, RECIPES, BENCH_RANGE } from '../../src/gameplay/craft.js';
import { stackCap } from '../../src/gameplay/build.js';

export const tests = {
  'has 7 resources': () => assert.equal(RES.length, 7),
  'pocket vs bench recipes exist': () => {
    assert.ok(RECIPES.some((r) => r.station === 'pocket'));
    assert.ok(RECIPES.some((r) => r.station === 'bench'));
  },
  'bench range is 5': () => assert.equal(BENCH_RANGE, 5),
  'stone stacks higher than others': () => {
    assert.ok(stackCap('stone') > stackCap('slime'));
  },
};
