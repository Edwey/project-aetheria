/**
 * Procedural Slime Mesh & Visual Deformation (Phase 3)
 */

import * as THREE from 'three';
import type { SlimeComponent, SlimeVariant, Transform } from '@sim/index.js';

export interface SlimeVisual {
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  leftEye: THREE.Mesh;
  rightEye: THREE.Mesh;
  currentVariant: SlimeVariant;
}

/**
 * Create material for a slime variant
 */
function createSlimeMaterial(color: number, roughness = 0.3): THREE.Material {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.1,
  });
}

/**
 * Create geometry for a slime variant
 */
function createSlimeGeometry(variant: SlimeVariant): THREE.BufferGeometry {
  if (variant === 'jelly_cube') {
    // Chamfered / rounded box feel
    return new THREE.BoxGeometry(0.9, 0.9, 0.9, 8, 8, 8);
  } else if (variant === 'goo') {
    // Teardrop / slightly squashed organic sphere
    const geo = new THREE.SphereGeometry(0.5, 32, 24);
    const pos = geo.attributes.position;
    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        // Taper top slightly for teardrop droplet shape
        if (y > 0) {
          const factor = 1.0 - (y * 0.25);
          pos.setX(i, pos.getX(i) * factor);
          pos.setZ(i, pos.getZ(i) * factor);
        }
      }
      geo.computeVertexNormals();
    }
    return geo;
  } else {
    // jelly_ball: smooth bouncy sphere
    return new THREE.SphereGeometry(0.5, 32, 32);
  }
}

/**
 * Create cute face / eyes for the slime
 */
function createSlimeEyes(): { leftEye: THREE.Mesh; rightEye: THREE.Mesh } {
  const eyeGeo = new THREE.SphereGeometry(0.07, 16, 16);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x222233 });

  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.16, 0.12, 0.44);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.16, 0.12, 0.44);

  return { leftEye, rightEye };
}

/**
 * Create a procedural Slime visual group with body and cute face
 */
export function createSlimeMesh(variant: SlimeVariant = 'jelly_ball'): SlimeVisual {
  const group = new THREE.Group();

  const geometry = createSlimeGeometry(variant);
  const color = variant === 'goo' ? 0x60c5ba : variant === 'jelly_cube' ? 0x7eb6ff : 0xff6fa5;
  const material = createSlimeMaterial(color);

  const bodyMesh = new THREE.Mesh(geometry, material);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  const { leftEye, rightEye } = createSlimeEyes();
  group.add(leftEye);
  group.add(rightEye);

  return {
    group,
    bodyMesh,
    leftEye,
    rightEye,
    currentVariant: variant,
  };
}

/**
 * Update the slime mesh variant geometry and color
 */
export function setSlimeVisualVariant(visual: SlimeVisual, variant: SlimeVariant): void {
  if (visual.currentVariant === variant) return;

  visual.bodyMesh.geometry.dispose();
  visual.bodyMesh.geometry = createSlimeGeometry(variant);

  const color = variant === 'goo' ? 0x60c5ba : variant === 'jelly_cube' ? 0x7eb6ff : 0xff6fa5;
  (visual.bodyMesh.material as THREE.MeshStandardMaterial).color.setHex(color);

  // Position eyes based on shape
  if (variant === 'jelly_cube') {
    visual.leftEye.position.set(-0.18, 0.12, 0.46);
    visual.rightEye.position.set(0.18, 0.12, 0.46);
  } else {
    visual.leftEye.position.set(-0.16, 0.12, 0.44);
    visual.rightEye.position.set(0.16, 0.12, 0.44);
  }

  visual.currentVariant = variant;
}

/**
 * Update Slime visual mesh transforms and dynamic squash/stretch deformation
 */
export function updateSlimeVisual(
  visual: SlimeVisual,
  slime: SlimeComponent,
  transform: Transform
): void {
  // Sync position
  visual.group.position.set(
    transform.position.x,
    transform.position.y,
    transform.position.z
  );

  // Sync orientation
  visual.group.quaternion.set(
    transform.rotation.x,
    transform.rotation.y,
    transform.rotation.z,
    transform.rotation.w
  );

  // Dynamic scale deformation:
  // Combines physics squeeze/melt scale with jump squash & stretch
  let sx = slime.scale.x;
  let sy = slime.scale.y;
  let sz = slime.scale.z;

  if (slime.isChargingJump && slime.isGrounded) {
    // Squash down while charging jump
    const squash = 1.0 - (slime.jumpChargeTimer / 0.85) * 0.35;
    sy *= squash;
    sx *= 1.0 + (1.0 - squash) * 0.5;
    sz *= 1.0 + (1.0 - squash) * 0.5;
  } else if (!slime.isGrounded && slime.isGliding) {
    // Flatten like a parachute when gliding
    sy *= 0.65;
    sx *= 1.35;
    sz *= 1.35;
  }

  visual.group.scale.set(sx, sy, sz);

  // Ensure visual matches current variant
  if (visual.currentVariant !== slime.variant) {
    setSlimeVisualVariant(visual, slime.variant);
  }
}
