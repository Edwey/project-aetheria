/**
 * Toon shading module - MeshToonMaterial with 3-4 step gradient ramp.
 * Centralised toon material creation for consistent shading across world materials.
 */

import * as THREE from 'three';

/**
 * Create a gradient texture for toon shading.
 * @param {number} steps - Number of toon bands (3-4)
 * @returns {THREE.Texture} Gradient texture
 */
export function createToonGradient(steps = 4) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const brightness = t * 0.7 + 0.3; // 0.3 to 1.0
    ctx.fillStyle = `rgb(${Math.round(brightness * 255)}, ${Math.round(brightness * 255)}, ${Math.round(brightness * 255)})`;
    ctx.fillRect(Math.round(i * size / (steps - 1)), 0, Math.ceil(size / (steps - 1)), 1);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Create a MeshToonMaterial with the shared gradient map.
 * @param {object} params - Material parameters
 * @param {THREE.Color|number|string} params.color - Base color
 * @param {number} [params.roughness=0.95] - Roughness
 * @param {number} [params.steps=4] - Number of toon steps (3-4)
 * @param {THREE.Texture} [params.map] - Optional texture map
 * @param {boolean} [params.vertexColors=false] - Use vertex colors
 * @returns {THREE.MeshToonMaterial}
 */
export function makeToon({ color, roughness = 0.95, steps = 4, map, vertexColors = false } = {}) {
  if (!makeToon._gradient) {
    makeToon._gradient = createToonGradient(4);
  }
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: makeToon._gradient,
    roughness,
    map,
    vertexColors,
    flatShading: false
  });
}

/**
 * Create a toon material specifically for ground with vertex colors.
 */
export function createGroundToonMaterial(world) {
  return makeToon({
    color: 0xffffff,
    roughness: 0.95,
    vertexColors: true,
    map: world.checker ? createCheckerTexture() : null
  });
}

/**
 * Create checker texture for ground (if needed).
 */
function createCheckerTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 2; const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 2, 2); g.fillStyle = '#e3e8e0'; g.fillRect(1, 0, 1, 1); g.fillRect(0, 1, 1, 1);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter; t.encoding = THREE.sRGBEncoding; return t;
}