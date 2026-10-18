/**
 * Living Stone Creature Mesh & Mineral Physics Visuals (Phase 5)
 * Heavy faceted geometry, visible rolling rotation, crystal sail wings, and pebble shrink
 */

import * as THREE from 'three';
import type { StoneComponent, StoneVariant, Transform } from '@sim/index.js';
import { createOutlineMaterial } from './textures.js';

export interface StoneVisual {
  group: THREE.Group;
  rotatorGroup: THREE.Group; // Group that rolls and tumbles along ground
  bodyMesh: THREE.Mesh;
  outlineMesh: THREE.Mesh;
  sailGroup: THREE.Group;
  currentVariant: StoneVariant;
}

const STONE_COLORS: Record<StoneVariant, { main: number; band: number; outline: number; sail: number }> = {
  boulder: {
    main: 0xd6c2aa,    // Warm textured desert sandstone
    band: 0x9e856e,
    outline: 0x3d2f24,
    sail: 0xffd166,
  },
  pillar: {
    main: 0x8ba69c,    // Cool slate basalt
    band: 0x5a736a,
    outline: 0x22332c,
    sail: 0x70d6ff,
  },
  shard: {
    main: 0xc4b5fd,    // Pale lavender quartz geode
    band: 0x8b5cf6,
    outline: 0x3b1d6b,
    sail: 0xe0aaff,
  },
};

/**
 * Procedural pseudo-noise to create geological rock strata
 */
function noise3(x: number, y: number, z: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Apply geological strata / rock bands to geometry vertices
 */
function applyStoneBands(geometry: THREE.BufferGeometry, mainHex: number, bandHex: number): void {
  const pos = geometry.attributes.position;
  if (!pos) return;

  const count = pos.count;
  const colors = new Float32Array(count * 3);
  const mainC = new THREE.Color(mainHex);
  const bandC = new THREE.Color(bandHex);
  const tmpC = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // Geological band noise based on height and position
    const n = noise3(Math.round(x * 4), Math.round(y * 6), Math.round(z * 4));
    const bandFactor = Math.sin(y * 8.0 + n * 1.5) * 0.5 + 0.5;

    tmpC.copy(mainC).lerp(bandC, bandFactor * 0.6);

    colors[i * 3] = tmpC.r;
    colors[i * 3 + 1] = tmpC.g;
    colors[i * 3 + 2] = tmpC.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

/**
 * Create faceted geometry for each stone variant
 */
function createStoneGeometry(variant: StoneVariant): THREE.BufferGeometry {
  let geo: THREE.BufferGeometry;

  if (variant === 'pillar') {
    // Sturdy hexagonal column with chiseled facets
    geo = new THREE.CylinderGeometry(0.38, 0.44, 1.35, 6, 4);
  } else if (variant === 'shard') {
    // Sharp faceted quartz crystal / octahedron geode
    geo = new THREE.OctahedronGeometry(0.62, 0);
    // Elongate vertically
    geo.scale(0.85, 1.45, 0.85);
  } else {
    // Boulder: faceted icosahedron / dodecahedron
    geo = new THREE.DodecahedronGeometry(0.58, 1);
  }

  const colors = STONE_COLORS[variant];
  applyStoneBands(geo, colors.main, colors.band);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Create Crystal Sail wings (deployed when holding Space in air)
 */
function createCrystalSail(colorHex: number): THREE.Group {
  const group = new THREE.Group();

  const sailGeo = new THREE.BufferGeometry();
  const verts = new Float32Array([
    0.1, 0, 0,
    1.1, 0.35, 0.3,
    1.3, 0.45, -0.15,
    0.8, 0.15, -0.4,
    0.1, 0, -0.2,
  ]);
  sailGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  sailGeo.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4]);
  sailGeo.computeVertexNormals();

  const sailMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 0.5,
    roughness: 0.2,
    metalness: 0.2,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
  });

  const right = new THREE.Mesh(sailGeo, sailMat);
  right.position.set(0.35, 0.2, 0);

  const left = new THREE.Mesh(sailGeo, sailMat);
  left.scale.set(-1, 1, 1);
  left.position.set(-0.35, 0.2, 0);

  group.add(right);
  group.add(left);
  group.visible = false;

  return group;
}

/**
 * Construct the full Stone visual
 */
export function createStoneMesh(variant: StoneVariant = 'boulder'): StoneVisual {
  const group = new THREE.Group();
  const rotatorGroup = new THREE.Group();
  group.add(rotatorGroup);

  const geo = createStoneGeometry(variant);
  const colors = STONE_COLORS[variant];

  // 1. Faceted Stone Material (flatShading: true gives tangible mineral facets)
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.78,
    metalness: 0.1,
    flatShading: true,
  });
  const bodyMesh = new THREE.Mesh(geo, mat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  rotatorGroup.add(bodyMesh);

  // 2. Chiseled cartoon outline
  const outlineMat = createOutlineMaterial(colors.outline, 0.035);
  const outlineMesh = new THREE.Mesh(geo, outlineMat);
  rotatorGroup.add(outlineMesh);

  // 3. Crystal Sail Wings
  const sailGroup = createCrystalSail(colors.sail);
  group.add(sailGroup);

  return {
    group,
    rotatorGroup,
    bodyMesh,
    outlineMesh,
    sailGroup,
    currentVariant: variant,
  };
}

/**
 * Switch Stone variant
 */
export function setStoneVisualVariant(visual: StoneVisual, variant: StoneVariant): void {
  if (visual.currentVariant === variant) return;

  visual.bodyMesh.geometry.dispose();
  visual.outlineMesh.geometry.dispose();

  const newGeo = createStoneGeometry(variant);
  visual.bodyMesh.geometry = newGeo;
  visual.outlineMesh.geometry = newGeo;

  const colors = STONE_COLORS[variant];
  const mat = visual.outlineMesh.material as THREE.ShaderMaterial;
  if (mat.uniforms && mat.uniforms['outlineColor']) {
    mat.uniforms['outlineColor'].value.setHex(colors.outline);
  }

  visual.currentVariant = variant;
}

/**
 * Update Stone visuals, 3D rolling physics rotation, and crystal sail
 */
export function updateStoneVisual(
  visual: StoneVisual,
  stone: StoneComponent,
  transform: Transform,
  linearVelocity?: { x: number; y: number; z: number },
  dt = 1 / 60
): void {
  // 1. Sync world position
  visual.group.position.set(
    transform.position.x,
    transform.position.y,
    transform.position.z
  );

  // 2. Realistic 3D Rolling / Tumbling along ground velocity
  const vx = linearVelocity?.x || 0;
  const vz = linearVelocity?.z || 0;
  const horizSpeed = Math.hypot(vx, vz);

  if (stone.isGrounded && horizSpeed > 0.15) {
    // Angular rotation speed: v / R
    const radius = 0.55;
    const angSpeed = (horizSpeed / radius) * dt;

    // Rolling rotation axis is perpendicular to direction of movement: (vz, 0, -vx)
    const rollAxis = new THREE.Vector3(vz / horizSpeed, 0, -vx / horizSpeed);
    const deltaQuat = new THREE.Quaternion().setFromAxisAngle(rollAxis, angSpeed);
    visual.rotatorGroup.quaternion.premultiply(deltaQuat);
  }

  // 3. Pebble Shrinking (M key)
  let sx = stone.scale.x;
  let sy = stone.scale.y;
  let sz = stone.scale.z;

  if (stone.isPebbleShrunk) {
    const pebble = 0.65;
    sx *= pebble;
    sy *= pebble;
    sz *= pebble;
  }

  // Jump charge anticipation
  if (stone.isChargingJump && stone.isGrounded) {
    const squash = 1.0 - (stone.jumpChargeTimer / 0.9) * 0.25;
    sy *= squash;
    sx *= 1.0 + (1.0 - squash) * 0.4;
    sz *= 1.0 + (1.0 - squash) * 0.4;
  }

  visual.group.scale.set(sx, sy, sz);

  // 4. Crystal Sail Glide
  const isSailGliding = !stone.isGrounded && stone.isSailGliding;
  visual.sailGroup.visible = isSailGliding;

  if (isSailGliding) {
    const time = performance.now() * 0.001;
    const sailFlap = Math.sin(time * 6.0) * 0.1;
    visual.sailGroup.rotation.y = Math.atan2(vx, vz);
    visual.sailGroup.rotation.x = sailFlap;
  }

  // Sync variant if changed
  if (visual.currentVariant !== stone.variant) {
    setStoneVisualVariant(visual, stone.variant);
  }
}

/**
 * Dispose Three.js resources
 */
export function disposeStoneVisual(visual: StoneVisual, scene: THREE.Scene): void {
  scene.remove(visual.group);
  visual.bodyMesh.geometry.dispose();
  (visual.bodyMesh.material as THREE.Material).dispose();
  visual.outlineMesh.geometry.dispose();
  (visual.outlineMesh.material as THREE.Material).dispose();
}
