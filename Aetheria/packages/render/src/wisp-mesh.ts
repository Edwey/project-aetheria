/**
 * Living Wisp Creature Mesh & Gaseous Mote Simulation (Phase 4)
 * Swirling motes, inner luminous core, light emission, and airy gas aesthetics
 */

import * as THREE from 'three';
import type { WispComponent, WispVariant, Transform } from '@sim/index.js';
import { getSoftCircleTexture } from './textures.js';

export interface WispVisual {
  group: THREE.Group;
  pointsMesh: THREE.Points;
  pointsGeo: THREE.BufferGeometry;
  coreMesh: THREE.Mesh;
  pointLight: THREE.PointLight;
  currentVariant: WispVariant;
  moteCount: number;
}

const WISP_COLORS: Record<WispVariant, { core: number; motes: number; light: number }> = {
  cloud: {
    core: 0xa8dcff,  // Soft glowing sky blue
    motes: 0xcde8ff,
    light: 0x8ec5fc,
  },
  motes: {
    core: 0xffb8f0,  // Luminous sparkling lavender
    motes: 0xffd9f7,
    light: 0xf3a4eb,
  },
  ring: {
    core: 0xb5f2cc,  // Ethereal emerald aura
    motes: 0xd8fae5,
    light: 0x9de9b8,
  },
};

/**
 * Create a Wisp visual group with motes points and central glowing core
 */
export function createWispMesh(variant: WispVariant = 'cloud'): WispVisual {
  const group = new THREE.Group();
  const colors = WISP_COLORS[variant];

  // 1. Motes Points representation
  const maxMotes = 32;
  const positions = new Float32Array(maxMotes * 3);
  const colorsArr = new Float32Array(maxMotes * 3);

  const pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pointsGeo.setAttribute('color', new THREE.BufferAttribute(colorsArr, 3));

  const pointsMat = new THREE.PointsMaterial({
    size: 0.45,
    map: getSoftCircleTexture(),
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const pointsMesh = new THREE.Points(pointsGeo, pointsMat);
  pointsMesh.frustumCulled = false;
  group.add(pointsMesh);

  // 2. Glowing Core Crystal
  const coreGeo = new THREE.IcosahedronGeometry(0.22, 1);
  const coreMat = new THREE.MeshStandardMaterial({
    color: colors.core,
    emissive: colors.core,
    emissiveIntensity: 1.2,
    roughness: 0.15,
    transparent: true,
    opacity: 0.95,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  group.add(coreMesh);

  // 3. Central Point Light
  const pointLight = new THREE.PointLight(colors.light, 1.2, 10, 1.8);
  pointLight.position.set(0, 0, 0);
  group.add(pointLight);

  return {
    group,
    pointsMesh,
    pointsGeo,
    coreMesh,
    pointLight,
    currentVariant: variant,
    moteCount: variant === 'cloud' ? 24 : variant === 'ring' ? 12 : 10,
  };
}

/**
 * Switch Wisp variant
 */
export function setWispVisualVariant(visual: WispVisual, variant: WispVariant): void {
  if (visual.currentVariant === variant) return;

  visual.currentVariant = variant;
  visual.moteCount = variant === 'cloud' ? 24 : variant === 'ring' ? 12 : 10;

  const colors = WISP_COLORS[variant];
  const mat = visual.coreMesh.material as THREE.MeshStandardMaterial;
  mat.color.setHex(colors.core);
  mat.emissive.setHex(colors.core);

  visual.pointLight.color.setHex(colors.light);
}

/**
 * Update Wisp animation, floating motes, and light pulsing
 */
export function updateWispVisual(
  visual: WispVisual,
  wisp: WispComponent,
  transform: Transform,
  linearVelocity?: { x: number; y: number; z: number },
  dt = 1 / 60
): void {
  // 1. Sync world position of central core
  visual.group.position.set(
    transform.position.x,
    transform.position.y,
    transform.position.z
  );

  const time = performance.now() * 0.001;
  const colors = WISP_COLORS[visual.currentVariant];
  const baseColor = new THREE.Color(colors.motes);

  // 2. Animate central glowing core
  visual.coreMesh.rotation.y += dt * 2.0;
  visual.coreMesh.rotation.x = Math.sin(time * 2.5) * 0.3;

  // Pulse core size slightly with breath and floating state
  const breathFactor = 0.8 + (wisp.breath / wisp.maxBreath) * 0.35;
  const floatBob = Math.sin(time * 3.5) * 0.05;
  visual.coreMesh.scale.setScalar(breathFactor * (1.0 + floatBob));
  visual.pointLight.intensity = (wisp.isRising ? 1.6 : wisp.isFloating ? 1.3 : 1.0) * breathFactor;

  // 3. Update Mote points in local space
  const posAttr = visual.pointsGeo.attributes.position as THREE.BufferAttribute;
  const colAttr = visual.pointsGeo.attributes.color as THREE.BufferAttribute;

  const motes = wisp.moteOffsets;
  const count = Math.min(motes.length, 32);

  // Trailing velocity offset: motes trail behind movement
  const trailX = (linearVelocity?.x || 0) * -0.06;
  const trailY = (linearVelocity?.y || 0) * -0.06;
  const trailZ = (linearVelocity?.z || 0) * -0.06;

  // Condense (C) pulls motes tighter, Diffuse (M) spreads them out
  let spreadMult = 1.0;
  if (wisp.isCondensed) spreadMult = 0.55;
  else if (wisp.isDiffused) spreadMult = 1.65;

  for (let i = 0; i < count; i++) {
    const off = motes[i];
    if (!off) continue;
    // Gentle floating orbital wobble for each mote
    const orbit = time * 1.5 + i * 0.6;
    const wobbleX = Math.sin(orbit) * 0.12;
    const wobbleY = Math.cos(orbit * 1.2) * 0.12;
    const wobbleZ = Math.sin(orbit * 0.8) * 0.12;

    const mx = (off.x + wobbleX) * spreadMult + trailX;
    const my = (off.y + wobbleY) * spreadMult + trailY;
    const mz = (off.z + wobbleZ) * spreadMult + trailZ;

    posAttr.setXYZ(i, mx, my, mz);

    // Mote brightness pulsation
    const shimmer = 0.75 + 0.25 * Math.sin(time * 4.0 + i * 1.3);
    colAttr.setXYZ(i, baseColor.r * shimmer, baseColor.g * shimmer, baseColor.b * shimmer);
  }

  // Clear inactive motes
  for (let i = count; i < 32; i++) {
    posAttr.setXYZ(i, 0, -999, 0);
  }

  posAttr.needsUpdate = true;
  colAttr.needsUpdate = true;
  visual.pointsGeo.setDrawRange(0, count);

  // Sync variant if needed
  if (visual.currentVariant !== wisp.variant) {
    setWispVisualVariant(visual, wisp.variant);
  }
}

/**
 * Dispose Three.js resources
 */
export function disposeWispVisual(visual: WispVisual, scene: THREE.Scene): void {
  scene.remove(visual.group);
  visual.pointsGeo.dispose();
  (visual.pointsMesh.material as THREE.Material).dispose();
  visual.coreMesh.geometry.dispose();
  (visual.coreMesh.material as THREE.Material).dispose();
}
