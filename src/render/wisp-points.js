/**
 * Wisp points module - Wisp point cloud rendering.
 * Ported from game.js writeWisp() and makePoints().
 */

import * as THREE from 'three';
import { writeWisp } from './creature.js';

/**
 * Create point material for wisp motes.
 * @param {number} n - Number of points
 * @param {number} color - Base color
 * @param {number} sizeM - Size multiplier
 * @param {boolean} additive - Use additive blending
 * @returns {THREE.PointsMaterial}
 */
export function makePoints(n, color, sizeM, additive) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * n), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(3 * n), 3));
  geo.computeBoundingSphere();

  const mat = new THREE.PointsMaterial({
    size: 0.15,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending
  });

  const points = new THREE.Points(geo);
  points.frustumCulled = false;
  return { points, geometry: geo, material: mat };
}

/**
 * Update wisp point cloud from physics.
 * Re-exported from creature.js for backward compatibility.
 */
export { writeWisp } from './creature.js';