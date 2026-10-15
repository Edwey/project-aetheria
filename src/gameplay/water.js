/**
 * Water module - Water physics and rendering data
 * Pure gameplay module - no THREE, no DOM, runs in Node
 */

'use strict';

export function create(world) {
  return {
    world,
    bodies: []
  };
}

export function sample(water, x, y, z) {
  return {
    inWater: false,
    depth: 0,
    surfaceY: 0,
    current: [0, 0, 0]
  };
}
