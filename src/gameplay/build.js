/**
 * Build module - Building logic and structure data
 * Pure gameplay module - no THREE, no DOM, runs in Node
 */

'use strict';

const FT = 0.25;
const WALL_H = 3;
const DOOR_GAP = 0.7;

const KIND = {
  foundation: 'floor',
  wall: 'wall',
  doorwall: 'wall',
  roof: 'roof',
  table: 'prop',
  bed: 'prop',
  campfire: 'ground',
  torch: 'ground',
  bowl: 'ground',
  workbench: 'ground'
};

const RADIUS = {
  table: 0.9,
  bed: 1.2,
  campfire: 0.6,
  torch: 0.25,
  bowl: 0.35,
  workbench: 1.0
};

const LIGHTS = {
  campfire: true,
  torch: true
};

const PLACEABLE = Object.keys(KIND);

export function create(world) {
  return { world, list: [], nextId: 1 };
}

export function stackCap(form) {
  return form === 'stone' ? 80 : 40;
}

export { FT, WALL_H, DOOR_GAP, KIND, RADIUS, LIGHTS, PLACEABLE };
