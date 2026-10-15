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

/**
 * Dispose creature meshes and resources.
 * @param {THREE.Scene} scene
 * @param {THREE.Mesh|null} mesh - Body mesh
 * @param {THREE.BufferGeometry|null} geo - Body geometry
 * @param {THREE.Points|null} wispPts - Wisp points
 * @param {THREE.BufferGeometry|null} wispGeo - Wisp geometry
 * @param {THREE.PointLight|null} wispLight - Wisp light
 */
export function disposeCreature(scene, mesh, geo, wispPts, wispGeo, wispLight) {
  if (mesh) { scene.remove(mesh); geo.dispose(); }
  if (wispPts) { scene.remove(wispPts); wispGeo.dispose(); }
  return { mesh: null, geo: null, wispPts: null, wispGeo: null, wispLight: null };
}

/**
 * Update body mesh from physics body.
 * @param {object} body - Physics body from physics.js
 * @param {THREE.BufferAttribute} posAttr - Position attribute
 * @param {THREE.BufferAttribute} colAttr - Color attribute
 * @param {THREE.BufferGeometry} geo - Geometry
 * @param {string} formKind - Current form ('slime', 'stone', 'wisp')
 * @param {object} profile - Profile with look settings
 * @param {THREE.Color} botC - Bottom color
 * @param {THREE.Color} topC - Top color
 * @param {function} lerp - Lerp function
 * @param {object} PRESETS - Body presets
 * @param {object} profile - Profile
 * @param {function} noise3 - Noise function
 * @param {number} size - Creature size
 */
export function writeBodyMesh(body, posAttr, colAttr, geo, formKind, profile, botC, topC, lerp, PRESETS, noise3) {
  const a = posAttr.array, x = body.x, n = body.n;
  let minY = 1e9, maxY = -1e9;
  for (let i = 0; i < n; i++) { const y = x[3*i+1]; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  for (let i = 0; i < 3 * n; i++) a[i] = x[i];
  posAttr.needsUpdate = true; geo.computeVertexNormals();
  if (formKind === 'slime') {
    const H = Math.max(0.05, maxY - minY), ca = colAttr.array;
    for (let i = 0; i < n; i++) { const hn = (x[3*i+1] - minY) / H; ca[3*i] = lerp(botC.r, topC.r, hn); ca[3*i+1] = lerp(botC.g, topC.g, hn); ca[3*i+2] = lerp(botC.b, topC.b, hn); }
    colAttr.needsUpdate = true;
  } else if (formKind === 'stone') {
    const size = profile.look.size;
    for (let i = 0; i < body.n; i++) {
      const qy = body.q[3*i+1] / (0.6 * profile.look.size);
      const k = noise3(Math.round(body.q[3*i] * 5), Math.round(qy * 5), Math.round(body.q[3*i+2] * 5));
      const g = 0.78 + 0.3 * k;
      const tmpC = new THREE.Color().copy(botC).lerp(topC, 0.5 + 0.5 * qy);
      const tmpC2 = new THREE.Color().copy(botC).lerp(topC, 0.5 + 0.5 * body.q[3*i+1] / (0.6 * profile.look.size));
      const g2 = 0.78 + 0.3 * noise3(Math.round(body.q[3*i] * 5), Math.round(body.q[3*i+1] / (0.6 * profile.look.size) * 5), Math.round(body.q[3*i+2] * 5));
      colAttr.array[3*i] = tmpC2.r * g2; colAttr.array[3*i+1] = tmpC2.g * g2; colAttr.array[3*i+2] = tmpC2.b * g2;
    }
    colAttr.needsUpdate = true;
  }
}

/**
 * Update wisp point cloud from physics.
 * @param {object} wisp - Wisp physics object
 * @param {Float32Array} wispPos - Position array
 * @param {Float32Array} wispCol - Color array
 * @param {THREE.BufferGeometry} wispGeo - Wisp geometry
 * @param {THREE.PointLight} wispLight - Wisp light
 * @param {THREE.PointsMaterial} wispMat - Wisp material
 * @param {THREE.Color} avgC - Average color
 * @param {function} lerp - Lerp function
 * @param {THREE.Color} botC - Bottom color
 * @param {THREE.Color} topC - Top color
 */
export function writeWisp(wisp, wispPos, wispCol, wispGeo, wispLight, wispMat, botC, topC, lerp, avgC) {
  const x = wisp.x, n = wisp.n; let minY = 1e9, maxY = -1e9;
  for (let i = 0; i < n; i++) { const y = x[3*i+1]; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  const H = Math.max(0.2, maxY - minY);
  for (let i = 0; i < n; i++) {
    wispPos[3*i] = wisp.x[3*i]; wispPos[3*i+1] = wisp.x[3*i+1]; wispPos[3*i+2] = wisp.x[3*i+2];
    const hn = (wisp.x[3*i+1] - minY) / H;
    wispCol[3*i] = lerp(botC.r, topC.r, hn); wispCol[3*i+1] = lerp(botC.g, topC.g, hn); wispCol[3*i+2] = lerp(botC.b, topC.b, hn);
  }
  wispGeo.attributes.position.needsUpdate = true; wispGeo.attributes.color.needsUpdate = true;
  wispLight.position.set(wisp.com[0], wisp.com[1], wisp.com[2]); wispLight.color.copy(avgC);
  wispMat.opacity = Math.min(1, 0.9 + 0.1 * wisp.wet); wispLight.intensity = 0.8 + 0.6 * wisp.wet;
}

/**
 * Get surface point on creature in direction from center.
 * @param {number} dx - Direction X
 * @param {number} dy - Direction Y
 * @param {number} dz - Direction Z
 * @param {THREE.Vector3} out - Output vector
 * @param {object} body - Physics body (for slime/stone)
 * @param {object} wisp - Wisp physics object (for wisp)
 * @param {object} profile - Profile with look settings
 * @param {THREE.Vector3} facing - Facing direction
 * @returns {THREE.Vector3} Output vector
 */
export function surfacePoint(dx, dy, dz, out, body, wisp, profile, facing) {
  const c = wisp ? wisp.com : body.com;
  if (wisp) { const s = 0.2 * profile.look.size; out.set(c[0] + dx * s, c[1] + dy * s, c[2] + dz * s); return out; }
  const x = body.x, n = body.n; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
  let best = -2, bi = 0;
  for (let i = 0; i < n; i++) {
    const rx = x[3*i] - c[0], ry = x[3*i+1] - c[1], rz = x[3*i+2] - c[2], d = (rx * dx + ry * dy + rz * dz) / (Math.sqrt(rx*rx + ry*ry + rz*rz) + 1e-6);
    if (d > best) { best = d; bi = i; }
  }
  const rx = x[3*bi] - c[0], ry = x[3*bi+1] - c[1], rz = x[3*bi+2] - c[2], rl = Math.sqrt(rx*rx + ry*ry + rz*rz) + 1e-6;
  out.set(c[0] + rx * (1 + 0.04 / rl), c[1] + ry * (1 + 0.04 / rl), c[2] + rz * (1 + 0.04 / rl)); return out;
}