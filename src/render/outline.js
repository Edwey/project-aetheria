/**
 * Outline module - Inverted-hull outline pass for creatures only.
 * Thin outline (under 0.03m) using scaled back-face geometry.
 */

import * as THREE from 'three';

const OUTLINE_WIDTH = 0.025; // meters, under 0.03m per spec

/**
 * Create outline material for inverted hull rendering.
 * @param {THREE.Color|number|string} color - Outline color
 * @param {number} [width=OUTLINE_WIDTH] - Outline width
 * @returns {THREE.Material}
 */
export function createOutlineMaterial(color = 0x000000, width = OUTLINE_WIDTH) {
  return new THREE.MeshBasicMaterial({
    color,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    depthTest: true
  });
}

/**
 * Add inverted-hull outline to a mesh.
 * Clones the geometry, scales it slightly, and uses BackSide material.
 * @param {THREE.Mesh} mesh - The mesh to outline
 * @param {THREE.Color|number|string} [color=0x000000] - Outline color
 * @param {number} [width=OUTLINE_WIDTH] - Outline width in meters
 * @returns {THREE.Mesh} The outline mesh (added as child of original mesh)
 */
export function addOutline(mesh, color = 0x000000, width = OUTLINE_WIDTH) {
  const outlineMesh = mesh.clone();
  outlineMesh.material = createOutlineMaterial(0x000000, width);
  outlineMesh.scale.multiplyScalar(1 + width / Math.max(mesh.geometry.boundingSphere?.radius || 1, 0.5));
  outlineMesh.renderOrder = mesh.renderOrder - 1; // Render before main mesh
  mesh.add(outlineMesh);
  return outlineMesh;
}

/**
 * Remove outline from a mesh.
 * @param {THREE.Mesh} mesh - The mesh with outline child
 */
export function removeOutline(mesh) {
  for (let i = mesh.children.length - 1; i >= 0; i--) {
    const child = mesh.children[i];
    if (child.material && child.material.side === THREE.BackSide) {
      mesh.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }
  }
}

/**
 * Toggle outline visibility on a mesh.
 * @param {THREE.Mesh} mesh - The mesh with outline child
 * @param {boolean} visible - Whether outline should be visible
 */
export function setOutlineVisible(mesh, visible) {
  for (const child of mesh.children) {
    if (child.material && child.material.side === THREE.BackSide) {
      child.visible = visible;
    }
  }
}

/**
 * Check if a mesh has an outline.
 * @param {THREE.Mesh} mesh
 * @returns {boolean}
 */
export function hasOutline(mesh) {
  return mesh.children.some(child => child.material && child.material.side === THREE.BackSide);
}

/**
 * Set outline width on all outlines of a mesh.
 * @param {THREE.Mesh} mesh
 * @param {number} width
 */
export function setOutlineWidth(mesh, width) {
  for (const child of mesh.children) {
    if (child.material && child.material.side === THREE.BackSide) {
      child.scale.setScalar(1 + width / Math.max(mesh.geometry.boundingSphere?.radius || 1, 0.5));
    }
  }
}

/**
 * Set outline color on all outlines of a mesh.
 * @param {THREE.Mesh} mesh
 * @param {THREE.Color|number|string} color
 */
export function setOutlineColor(mesh, color) {
  for (const child of mesh.children) {
    if (child.material && child.material.side === THREE.BackSide) {
      child.material.color.set(color);
    }
  }
}