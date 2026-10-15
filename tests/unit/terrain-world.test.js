/**
 * World parity tests (Stage C): seeded flora, trunk collision,
 * hut door admits / wall blocks. Uses the real aetheria terrain.
 */
import assert from 'node:assert/strict';
import { Phys, Terrain, slimeP, idleInp } from './_harness.js';

const DT = 1 / 60;

function drive(shape, P, x, y, z, mx, mz, steps) {
  const world = Terrain.build('aetheria');
  const b = Phys.makeSlime(shape, x, y, z, 2, 1);
  for (let i = 0; i < steps; i++) Phys.stepBody(b, world, P, idleInp({ mx, mz }), DT);
  return { b, world };
}

export const tests = {
  'seeded flora counts are stable across builds': () => {
    const a = Terrain.build('aetheria'), b = Terrain.build('aetheria');
    assert.equal(a.flora.trees.length, b.flora.trees.length);
    assert.equal(a.flora.flowers.length, b.flora.flowers.length);
    assert.ok(a.flora.trees.length > 100, 'a real forest');
    for (let i = 0; i < a.flora.trees.length; i++) {
      assert.equal(a.flora.trees[i].x, b.flora.trees[i].x);
      assert.equal(a.flora.trees[i].z, b.flora.trees[i].z);
    }
  },

  'no particle enters a trunk': () => {
    const world = Terrain.build('aetheria');
    const t = world.flora.trees[0];
    const P = slimeP('slime');
    // drive straight through the trunk line
    const b = Phys.makeSlime('sphere', t.x - 3, t.y + 1.5, t.z, 2, 1);
    let minEdge = Infinity;
    for (let i = 0; i < 480; i++) {
      Phys.stepBody(b, world, P, idleInp({ mx: 1 }), DT);
      for (let k = 0; k < b.n; k++) {
        const dx = b.x[3 * k] - t.x, dz = b.x[3 * k + 2] - t.z;
        const py = b.x[3 * k + 1];
        if (py > t.col.c[1] && py < t.col.c[1] + t.col.h) minEdge = Math.min(minEdge, Math.hypot(dx, dz) - t.col.r);
      }
    }
    assert.ok(minEdge > -0.12, `deepest trunk penetration=${minEdge}`);
  },

  'a hut with a door gap admits, a wall blocks': () => {
    const P = slimeP('slime');
    const probe = Terrain.build('aetheria');
    const { cx, cz, half, hy } = probe.hut;
    const floorY = hy + 0.2;
    // through the door (gap centred on cx, +z face)
    const door = drive('sphere', P, cx, floorY + 1.2, cz + half + 3, 0, -1, 480);
    assert.ok(door.b.com[2] < cz + half - 0.5, `door admits, z=${door.b.com[2]}`);
    // into the plain wall segment (segment centre, same +z face)
    const gap = 1.3, segW = (half - gap) / 2, segX = cx - gap - segW;
    const wall = drive('sphere', P, segX, floorY + 1.2, cz + half + 3, 0, -1, 480);
    assert.ok(wall.b.com[2] > cz + half - 0.5, `wall blocks, z=${wall.b.com[2]}`);
  },

  'ground API: height grid, never NaN in bounds': () => {
    const world = Terrain.build('aetheria');
    for (let x = -59; x <= 59; x += 7) {
      for (let z = -59; z <= 59; z += 7) {
        const h = Phys.groundHeight(world, x, z);
        assert.ok(Number.isFinite(h), `NaN at ${x},${z}`);
      }
    }
  },
};
