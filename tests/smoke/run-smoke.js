/**
 * Page smoke test stub (Stage B).
 * Full three.js + DOM drive comes in Stage C.
 * For now: verifies pure modules import in Node without exception.
 */
import assert from 'node:assert/strict';

const mods = [
  '../../src/gameplay/physics.js',
  '../../src/gameplay/terrain.js',
  '../../src/gameplay/env.js',
  '../../src/gameplay/wisp.js',
  '../../src/gameplay/profile.js',
  '../../src/gameplay/craft.js',
  '../../src/gameplay/build.js',
  '../../src/gameplay/forms.js',
  '../../src/gameplay/events.js',
  '../../src/gameplay/world.js',
  '../../src/gameplay/water.js',
];

let ok = 0;
for (const m of mods) {
  await import(m);
  ok += 1;
  console.log(`ok - import ${m}`);
}
assert.equal(ok, mods.length);
console.log(`smoke: ${ok} pure modules import cleanly`);
