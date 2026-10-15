/**
 * Terrain module - Height grids, biome blending, world building
 * Pure gameplay module - no THREE, no DOM, runs in Node
 */

'use strict';

export function build(name) {
  return {
    name,
    label: name,
    A: 60,
    cs: 0.5,
    N: 480,
    hg: new Float32Array(481 * 481),
    hmax: 10,
    hmin: 0,
    boxes: [],
    spheres: [],
    cyls: [],
    ground: [0.5, 0.7, 0.4],
    dirt: [0.58, 0.46, 0.34],
    colorAt: null,
    biomeAt: null,
    flora: null,
    spawn: [0, 2, 0]
  };
}

export function groundHeight(world, x, z) {
  return 0;
}

export function forEachContact(world, x, y, z, r, callback) {
  // Placeholder - no colliders yet
}
