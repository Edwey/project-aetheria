/**
 * World module - World API for multiple terrain bodies
 * Pure gameplay module - no THREE, no DOM, runs in Node
 */

'use strict';

let lastSafeGround = null;

export function create() {
  return {
    bodies: [],
    waterBodies: [],
    lastSafeGround: null
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

export function updateLastSafeGround(world, x, y, z) {
  const body = ground(world, x, z);
  if (body && y > body.h(x, z)) {
    world.lastSafeGround = [x, y, z];
  }
}

export function getLastSafeGround(world) {
  return world.lastSafeGround;
}

/**
 * Wrap Terrain.build output into a WorldSet structure.
 * For R1 single landmass, this wraps the single body.
 * R2 will add sky islands as additional bodies.
 */
export function wrapTerrain(terrain) {
  const world = create();
  world.bodies.push(terrain);
  world.lastSafeGround = terrain.spawn;
  return world;
}

