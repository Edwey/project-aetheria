/**
 * Environment module - Weather, wind, biome blending
 * Pure gameplay module - no THREE, no DOM, runs in Node
 */

'use strict';

export function create(world, seed) {
  return {
    world,
    t: 0,
    override: 'auto',
    thermals: [],
    mushrooms: [],
    gust: { t: 0, len: 0, next: 8 },
    wx: []
  };
}

export function update(env, dt) {
  env.t += dt;
}

export function sample(env, x, y, z) {
  return {
    wind: [0, 0, 0],
    mat: { mu: 1, speed: 1, jump: 1, gravity: 1 },
    weather: { type: 'none', amt: 0 },
    biome: 0,
    strength: 0
  };
}
