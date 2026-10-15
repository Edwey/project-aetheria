/**
 * World module - World API for multiple terrain bodies
 * Pure gameplay module - no THREE, no DOM, runs in Node
 */

'use strict';

export function create() {
  return {
    bodies: [],
    waterBodies: []
  };
}

export function ground(world, x, z) {
  // Find which body contains the point
  for (const body of world.bodies) {
    if (x >= -body.A && x <= body.A && z >= -body.A && z <= body.A) {
      return body;
    }
  }
  return null; // VOID
}
