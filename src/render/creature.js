/**
 * Creature module - Creature mesh rendering with outline support.
 * Handles slime/stone body mesh and wisp point cloud with optional outlines.
 */

import * as THREE from 'three';
import { addOutline, removeOutline, setOutlineVisible, setOutlineWidth, setOutlineColor } from './outline.js';

/**
 * Create creature body mesh (slime/stone) with optional outline.
 * @param {THREE.Scene} scene
 * @param {object} body - Physics body from physics.js
 * @param {object} profile - Profile with look settings
 * @returns {object} { mesh, geometry, positionAttr, colorAttr, outlineMesh, update: function }
 */
export function createBodyMesh(scene, body, profile) {
  const n = body.n;
  const posAttr = new THREE.Float32BufferAttribute(new Float32Array(3 * n), 3);
  const colAttr = new THREE.Float32BufferAttribute(new Float32Array(3 * n), 3);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  colAttr.setUsage(THREE.DynamicDrawUsage);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', posAttr);
  geo.setAttribute('color', colAttr);
  geo.computeBoundingSphere();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    metalness: 0.1,
    flatShading: false
  });

  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial());
  mesh.geometry = geo;
  mesh.material = mat;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;

  // Add outline
  let outlineMesh = null;
  const outlineWidth = 0.025;

  function createOutline() {
    if (!mesh.geometry) return;
    const outlineMesh = mesh.clone();
    outlineMesh.material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      depthTest: true
    });
    const radius = mesh.geometry.boundingSphere?.radius || 0.5;
    outlineMesh.scale.multiplyScalar(1 + 0.025 / Math.max(radius, 0.5));
    outlineMesh.renderOrder = -1;
    mesh.add(outlineMesh);
    return outlineMesh;
  }

  const outlineMeshRef = { current: null };

  function updateOutlineVisibility(enabled) {
    if (outlineMeshRef.current) {
      outlineMeshRef.current.visible = enabled;
    }
  }

  function updateOutlineWidth(width) {
    if (outlineMeshRef.current) {
      const radius = mesh.geometry.boundingSphere?.radius || 0.5;
      outlineMeshRef.current.scale.setScalar(1 + width / Math.max(radius, 0.5));
    }
  }

  function setOutlineColor(color) {
    if (outlineMeshRef.current) {
      outlineMeshRef.current.material.color.set(color);
    }
  }

  return {
    mesh,
    geometry: geo,
    positionAttr: posAttr,
    colorAttr: colAttr,
    outlineMesh: outlineMeshRef,
    updateOutlineVisibility,
    updateOutlineWidth,
    setOutlineColor,
    createOutline
  };
}

/**
 * Create wisp point cloud with optional outline (core only).
 * @param {THREE.Scene} scene
 * @param {object} wisp - Wisp physics object
 * @param {object} profile - Profile with look settings
 * @returns {object} { points, geometry, positionAttr, colorAttr, coreMesh, outlineMesh, update: function }
 */
export function createWispMesh(scene, wisp, profile) {
  const n = wisp.n;
  const posAttr = new THREE.Float32BufferAttribute(new Float32Array(3 * n), 3);
  const colAttr = new THREE.Float32BufferAttribute(new Float32Array(3 * n), 3);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  colAttr.setUsage(THREE.DynamicDrawUsage);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', posAttr);
  geo.setAttribute('color', colAttr);
  geo.computeBoundingSphere();

  const mat = new THREE.PointsMaterial({
    size: 0.15,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(new THREE.BufferGeometry(), mat);
  points.geometry = geo;
  points.frustumCulled = false;

  // Core mesh for outline (single sphere at center)
  const coreGeo = new THREE.SphereGeometry(0.5, 16, 12);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.3,
    depthWrite: false
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreMesh.visible = false; // Hidden, only for outline
  coreMesh.frustumCulled = false;

  let outlineMeshRef = null;

  function createOutline() {
    const outlineMesh = coreMesh.clone();
    outlineMesh.material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      depthTest: true
    });
    outlineMesh.scale.multiplyScalar(1.05);
    outlineMesh.renderOrder = -1;
coreMesh.add(outlineMesh);
      return outlineMesh;
    }

  function updateOutlineVisibility(enabled) {
    if (outlineMeshRef.current) {
      outlineMeshRef.current.visible = enabled;
    }
  }

  function updateOutlineWidth(width) {
    if (outlineMeshRef.current) {
      outlineMeshRef.current.scale.setScalar(1 + width / 0.5);
    }
  }

  function setOutlineColor(color) {
    if (outlineMeshRef.current) {
      outlineMeshRef.current.material.color.set(color);
    }
  }

  return {
    points,
    geometry: geo,
    positionAttr: posAttr,
    colorAttr: colAttr,
    coreMesh,
    outlineMesh: outlineMeshRef,
    createOutline,
    updateOutlineVisibility,
    updateOutlineWidth,
    setOutlineColor
  };
}

/**
 * Update outline visibility based on quality settings.
 * @param {object} creatureRef - Object with outlineMeshRef
 * @param {number} quality - 2 for Light, 3 for Full
 */
export function updateOutlineForQuality(creatureRef, quality) {
  const hasOutline = quality >= 3; // Full quality only
  if (creatureRef.updateOutlineVisibility) {
    creatureRef.updateOutlineVisibility(hasOutline);
  }
}

export { addOutline, removeOutline, setOutlineVisible, setOutlineWidth, setOutlineColor } from './outline.js';