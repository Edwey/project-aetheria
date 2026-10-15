/**
 * Flora module - InstancedMesh flora rendering with GLB manifest + procedural fallback.
 * Ported from game.js buildFlora() with GLB support.
 */

import * as THREE from 'three';
import { getModelUrl } from '../app/assets.js';

const FLORA_MODELS = {
  oak: 'tree-oak',
  pine: 'tree-pine',
  cactus: 'cactus',
  mushroom: 'mushroom',
  flower: 'flower',
  rock: 'rock'
};

/**
 * Create InstancedMesh for a flora type with GLB or procedural fallback.
 */
async function createFloraMesh(kind, count, getMatrixFn, getColorFn, baseMaterial) {
  const modelId = FLORA_MODELS[kind];
  const url = modelId ? getModelUrl(modelId) : null;

  if (url) {
    try {
      const loader = new THREE.GLTFLoader();
      const gltf = await loader.loadAsync(url);
      const mesh = gltf.scene.clone(true);
      mesh.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          node.frustumCulled = false;
        }
      });
      const instancedMesh = new THREE.InstancedMesh(mesh.geometry, mesh.material, count);
      instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      instancedMesh.instanceColor = null;
      instancedMesh.frustumCulled = false;
      return { instancedMesh, dispose: () => { mesh.geometry.dispose(); mesh.material.dispose(); } };
    } catch (e) {
      console.warn(`Failed to load GLB for ${kind}:`, e);
    }
  }

  // Procedural fallback - will be handled by caller
  return null;
}

/**
 * Build flora with InstancedMesh per species, using GLB manifest with procedural fallback.
 * @param {THREE.Scene} scene
 * @param {object} world - World object from Terrain.build()
 * @param {object} assets - Material/texture cache
 * @returns {Promise<object>} { meshes: Array<THREE.InstancedMesh>, dispose: function }
 */
export async function buildFlora(scene, world, assets = {}) {
  const F = world.flora;
  if (!F) return { meshes: [], dispose: () => {} };

  const meshes = [];
  const disposers = [];

  // Count by kind
  const trees = F.trees;
  const counts = { oak: 0, pine: 0, cactus: 0, mushroom: 0 };
  trees.forEach(t => { counts[t.kind]++; });

  // Materials (shared)
  const stemMat = new THREE.MeshStandardMaterial({ roughness: 0.9 });
  const ballMat = new THREE.MeshStandardMaterial({ roughness: 0.85 });
  const coneMat = new THREE.MeshStandardMaterial({ roughness: 0.9 });
  const capMat = new THREE.MeshStandardMaterial({ roughness: 0.5, emissive: 0x3a2a66, emissiveIntensity: 0.9 });
  const rockMat = new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true });
  const geodeMat = new THREE.MeshStandardMaterial({ color: 0x9a6bff, emissive: 0x5a2ad0, emissiveIntensity: 0.9, roughness: 0.25, flatShading: true });
  const clayMat = new THREE.MeshStandardMaterial({ color: 0x8aa0b4, roughness: 1 });
  const petalMat = new THREE.MeshStandardMaterial({ roughness: 0.6, emissive: 0x331122, emissiveIntensity: 0.5 });
  const sporeMat = new THREE.MeshStandardMaterial({ roughness: 0.4, emissive: 0x44ddbb, emissiveIntensity: 1.2 });

  // Geometries (procedural fallbacks)
  const stemGeo = new THREE.CylinderGeometry(1, 1, 1, 8); stemGeo.translate(0, 0.5, 0);
  const coneGeo = new THREE.ConeGeometry(1, 1, 9); coneGeo.translate(0, 0.5, 0);
  const ballGeo = new THREE.SphereGeometry(1, 12, 9);
  const capGeo = new THREE.SphereGeometry(1, 12, 8);
  const rockGeo = new THREE.IcosahedronGeometry(1, 1);
  const geodeGeo = new THREE.IcosahedronGeometry(1, 0);
  const clayGeo = new THREE.SphereGeometry(1, 12, 8);
  const petalGeo = new THREE.SphereGeometry(1, 6, 5);
  const sporeGeo = new THREE.SphereGeometry(1, 8, 6);

  // Tree InstancedMeshes (procedural fallback for now)
  const n = { oak: 0, pine: 0, cactus: 0, mushroom: 0 };
  trees.forEach(t => n[t.kind]++);

  const stems = new THREE.InstancedMesh(stemGeo, stemMat, trees.length);
  stems.castShadow = true; stems.frustumCulled = false; stems.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(stems); meshes.push(stems);

  const balls = new THREE.InstancedMesh(ballGeo, ballMat, n.oak + n.cactus);
  balls.castShadow = true; balls.frustumCulled = false; balls.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(balls); meshes.push(balls);

  const cones = new THREE.InstancedMesh(coneGeo, coneMat, n.pine * 2);
  cones.castShadow = true; cones.frustumCulled = false; cones.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(cones); meshes.push(cones);

  const caps = new THREE.InstancedMesh(capGeo, capMat, n.mushroom);
  caps.castShadow = true; caps.frustumCulled = false; caps.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(caps); meshes.push(caps);

  // Rocks
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, F.rocks.length);
  rocks.castShadow = true; rocks.receiveShadow = true; rocks.frustumCulled = false; rocks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(rocks); meshes.push(rocks);

  // Geodes
  const geodes = new THREE.InstancedMesh(geodeGeo, geodeMat, F.geodes.length);
  geodes.castShadow = true; geodes.receiveShadow = true; geodes.frustumCulled = false; geodes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(geodes); meshes.push(geodes);

  // Clays
  const clays = new THREE.InstancedMesh(clayGeo, clayMat, F.clays.length);
  clays.receiveShadow = true; clays.frustumCulled = false; clays.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(clays); meshes.push(clays);

  // Flowers
  const petals = F.flowers.filter(f => f.type === 'petal');
  const spores = F.flowers.filter(f => f.type === 'spore');
  const pm = new THREE.InstancedMesh(petalGeo, petalMat, petals.length);
  pm.castShadow = false; pm.frustumCulled = false; pm.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(pm); meshes.push(pm);
  const sp = new THREE.InstancedMesh(sporeGeo, sporeMat, spores.length);
  sp.castShadow = false; sp.frustumCulled = false; sp.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(sp); meshes.push(sp);

  // Dummy for matrix calculations
  const dummy = new THREE.Object3D();

  function setI(mesh, i, x, y, z, sx, sy, sz, color, ry) {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, ry || 0, 0);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    if (color !== undefined && mesh.instanceColor) {
      mesh.setColorAt(i, new THREE.Color(color));
    }
  }

  function flush(mesh) {
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  // Place trees
  let si = 0, bi = 0, ci = 0, pi = 0;
  const greens = [0x4fae4a, 0x5cbf55, 0x6bcf5e, 0x45a043];
  const pines = [0x2f6b4a, 0x35785a, 0x2a5f44];
  const capc = [0x9b6bd6, 0x4fd1c5, 0xc27ad6, 0x6ba8e6];

  trees.forEach(t => {
    const s = t.s; t.parts = [];
    if (t.kind === 'oak') {
      setI(stems, si++, t.x, t.y - 0.1, t.z, 0.32*s, 2.5*s, 0.32*s, 0x7a5233);
      setI(balls, bi++, t.x, t.y + 3.0*s, t.z, 1.7*s, 1.45*s, 1.7*s, [0x4fae4a, 0x5cbf55, 0x6bcf5e, 0x45a043][(t.rnd * 4) | 0]);
    } else if (t.kind === 'pine') {
      setI(stems, si++, t.x, t.y - 0.1, t.z, 0.26*s, 1.9*s, 0.26*s, 0x5b3f2b);
      setI(cones, ci++, t.x, t.y + 1.5*s, t.z, 1.5*s, 2.5*s, 1.5*s, [0x2f6b4a, 0x35785a, 0x2a5f44][(t.rnd * 3) | 0]);
      setI(cones, ci++, t.x, t.y + 2.9*s, t.z, 1.05*s, 2.1*s, 1.05*s, [0x2f6b4a, 0x35785a, 0x2a5f44][(t.rnd * 3) | 0]);
    } else if (t.kind === 'cactus') {
      setI(stems, si++, t.x, t.y - 0.1, t.z, 0.38*s, 2.5*s, 0.38*s, 0x5fae5a);
      setI(balls, bi++, t.x, t.y + 2.45*s, t.z, 0.38*s, 0.38*s, 0.38*s, 0x6bc066);
    } else { // mushroom
      setI(stems, si++, t.x, t.y - 0.1, t.z, 0.22*s, 1.9*s, 0.22*s, 0xf1e6d2);
      setI(caps, pi++, t.x, t.y + 1.95*s, t.z, 1.1*s, 0.7*s, 1.1*s, [0x9b6bd6, 0x4fd1c5, 0xc27ad6, 0x6ba8e6][(t.rnd * 4) | 0]);
    }
  });

  // Rocks
  F.rocks.forEach((r, i) => {
    const color = 0x8c8a85 + ((i * 0x050505) & 0x1f1f1f);
    setI(rocks, i, r.c[0], r.c[1], r.c[2], r.r, r.r * 0.85, r.r, color, i);
  });

  // Geodes
  F.geodes.forEach((g, i) => {
    setI(geodes, i, g.c[0], g.c[1], g.c[2], g.r, g.r * 0.9, g.r, undefined, i);
    g.mesh = geodes; g.idx = i;
  });

  // Clays
  F.clays.forEach((g, i) => {
    setI(clays, i, g.c[0], g.c[1] - 0.15, g.c[2], g.r, g.r * 0.6, g.r);
    g.mesh = clays; g.idx = i;
  });

  // Flowers
  petals.forEach((f, i) => {
    f.mesh = pm; f.idx = i; f.size = 0.17;
    setI(pm, i, f.x, f.y + 0.16, f.z, 0.17, 0.17, 0.17, f.color);
  });
  spores.forEach((f, i) => {
    f.mesh = sp; f.idx = i; f.size = 0.15;
    setI(sp, i, f.x, f.y + 0.3, f.z, 0.15, 0.15, 0.15, f.color);
  });

  // Flush all
  [stems, balls, cones, caps, rocks, geodes, clays, petals.length && pm, spores.length && sp].filter(Boolean).forEach(m => {
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  const dispose = () => {
    [stems, balls, cones, caps, rocks, geodes, clays].forEach(m => {
      m.geometry.dispose(); m.material.dispose();
    });
    petals.length && pm.geometry.dispose(); pm.material.dispose();
    spores.length && sp.geometry.dispose(); sp.material.dispose();
  };

  return { meshes, dispose };
}