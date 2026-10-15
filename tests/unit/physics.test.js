import assert from 'node:assert/strict';
import * as Phys from '../../src/gameplay/physics.js';

export const tests = {
  'gravity is -20': () => assert.equal(Phys.G, -20),
  'particle radius 0.07': () => assert.equal(Phys.RP, 0.07),
  'fixed step 1/60 with 4 substeps': () => assert.equal(Phys.SUB, 4),
  'charge time 0.85s': () => assert.equal(Phys.CHARGE_T, 0.85),
  'speed cap per substep defined': () => {
    assert.ok(Phys.MAXD > 0 && Phys.MAXD < 1);
  },
};
