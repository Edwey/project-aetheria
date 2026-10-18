/**
 * Living Procedural Slime Mesh & Dynamic Softbody/Jelly Visuals
 * Matches the rich, tactile aesthetics and lively physical behavior of Aetheria.html
 */

import * as THREE from 'three';
import type { SlimeComponent, SlimeVariant, Transform } from '@sim/index.js';
import { createOutlineMaterial } from './textures.js';

export interface SlimeVisual {
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  outlineMesh: THREE.Mesh;
  coreMesh: THREE.Mesh;
  faceGroup: THREE.Group;
  leftEyeWhite: THREE.Mesh;
  rightEyeWhite: THREE.Mesh;
  leftPupil: THREE.Mesh;
  rightPupil: THREE.Mesh;
  leftCatchlight1: THREE.Mesh;
  rightCatchlight1: THREE.Mesh;
  leftCatchlight2: THREE.Mesh;
  rightCatchlight2: THREE.Mesh;
  mouth: THREE.Mesh;
  wingGroup: THREE.Group;
  wingLeft: THREE.Mesh;
  wingRight: THREE.Mesh;

  currentVariant: SlimeVariant;

  // Living animation & gelatin dynamics state
  wobbleY: number;
  wobbleVelY: number;
  prevVy: number;
  wasGrounded: boolean;
  facingAngle: number;
  blinkTimer: number;
  nextBlinkTime: number;
  wingFlapAngle: number;
}

/** Variant color palettes (top pastel, bottom richer shade) */
const VARIANT_COLORS: Record<SlimeVariant, { top: number; bot: number; core: number }> = {
  goo: {
    top: 0x8ef5e8,  // Luminous mint aqua
    bot: 0x2bbda8,
    core: 0x48e5c2,
  },
  jelly_ball: {
    top: 0xffa8cc,  // Sweet translucent pink
    bot: 0xf74288,
    core: 0xffe066, // Golden star glow
  },
  jelly_cube: {
    top: 0xa8d4ff,  // Ethereal periwinkle ice
    bot: 0x4d88e6,
    core: 0x66f0ff,
  },
};

/**
 * Apply vertical vertex color gradient to geometry
 */
function applyVertexGradient(geometry: THREE.BufferGeometry, topColorHex: number, botColorHex: number): void {
  const pos = geometry.attributes.position;
  if (!pos) return;

  const count = pos.count;
  const colors = new Float32Array(count * 3);
  const topC = new THREE.Color(topColorHex);
  const botC = new THREE.Color(botColorHex);
  const tmpC = new THREE.Color();

  let minY = 1e9;
  let maxY = -1e9;

  for (let i = 0; i < count; i++) {
    const y = pos.getY(i);
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const heightRange = Math.max(0.01, maxY - minY);

  for (let i = 0; i < count; i++) {
    const y = pos.getY(i);
    const t = THREE.MathUtils.clamp((y - minY) / heightRange, 0, 1);
    tmpC.copy(botC).lerp(topC, t);

    colors[i * 3] = tmpC.r;
    colors[i * 3 + 1] = tmpC.g;
    colors[i * 3 + 2] = tmpC.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

/**
 * Create base geometry for slime variants
 */
function createSlimeGeometry(variant: SlimeVariant): THREE.BufferGeometry {
  let geo: THREE.BufferGeometry;

  if (variant === 'jelly_cube') {
    // Soft chamfered box (like Aetheria's boxMesh)
    geo = new THREE.BoxGeometry(0.95, 0.95, 0.95, 12, 12, 12);
  } else if (variant === 'goo') {
    // Teardrop organic droplet shape with wider base
    geo = new THREE.SphereGeometry(0.55, 36, 28);
    const pos = geo.attributes.position;
    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y > 0) {
          const factor = 1.0 - y * 0.28;
          pos.setX(i, pos.getX(i) * factor);
          pos.setZ(i, pos.getZ(i) * factor);
        } else {
          // Broad spread at the bottom
          const spread = 1.0 + Math.abs(y) * 0.2;
          pos.setX(i, pos.getX(i) * spread);
          pos.setZ(i, pos.getZ(i) * spread);
        }
      }
      geo.computeVertexNormals();
    }
  } else {
    // Smooth, juicy bouncy sphere
    geo = new THREE.SphereGeometry(0.55, 36, 32);
  }

  const colors = VARIANT_COLORS[variant];
  applyVertexGradient(geo, colors.top, colors.bot);
  return geo;
}

/**
 * Translucent, juicy physical material for slimes
 */
function createSlimePhysicalMaterial(botColor: number): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.12,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    transmission: 0.55,
    transparent: true,
    opacity: 0.88,
    emissive: new THREE.Color(botColor).multiplyScalar(0.28),
    emissiveIntensity: 0.5,
  });
}

/**
 * Create Glider wings for the slime
 */
function createGliderWings(): { group: THREE.Group; left: THREE.Mesh; right: THREE.Mesh } {
  const group = new THREE.Group();

  const wingGeo = new THREE.BufferGeometry();
  const verts = new Float32Array([
    0.1, 0, 0.1,
    0.9, 0.1, 0.4,
    1.1, 0.15, -0.05,
    0.7, 0.08, -0.35,
    0.1, 0, -0.15,
  ]);
  wingGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  wingGeo.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4]);
  wingGeo.computeVertexNormals();

  const wingMat = new THREE.MeshBasicMaterial({
    color: 0x8ef5e8,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const right = new THREE.Mesh(wingGeo, wingMat);
  right.position.set(0.25, 0.2, 0);

  const left = new THREE.Mesh(wingGeo, wingMat);
  left.scale.set(-1, 1, 1);
  left.position.set(-0.25, 0.2, 0);

  group.add(right);
  group.add(left);
  group.visible = false;

  return { group, left, right };
}

/**
 * Construct the full living Slime visual group
 */
export function createSlimeMesh(variant: SlimeVariant = 'jelly_ball'): SlimeVisual {
  const group = new THREE.Group();

  // 1. Slime Body Mesh
  const geo = createSlimeGeometry(variant);
  const colors = VARIANT_COLORS[variant];
  const mat = createSlimePhysicalMaterial(colors.bot);
  const bodyMesh = new THREE.Mesh(geo, mat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 2. Cartoon Outline Mesh
  const outlineMat = createOutlineMaterial(0x133820, 0.035);
  const outlineMesh = new THREE.Mesh(geo, outlineMat);
  outlineMesh.castShadow = false;
  outlineMesh.receiveShadow = false;
  group.add(outlineMesh);

  // 3. Floating Inner Glowing Core
  const coreGeo = new THREE.OctahedronGeometry(0.18, 0);
  const coreMat = new THREE.MeshStandardMaterial({
    color: colors.core,
    emissive: colors.core,
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreMesh.position.set(0, 0, 0);
  group.add(coreMesh);

  // 4. Expressive Living Face
  const faceGroup = new THREE.Group();

  const eyeWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.25,
  });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x182c20 });
  const catchlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const eyeWhiteGeo = new THREE.SphereGeometry(0.09, 16, 14);
  const pupilGeo = new THREE.SphereGeometry(0.052, 14, 12);
  const catchGeo1 = new THREE.SphereGeometry(0.018, 8, 8);
  const catchGeo2 = new THREE.SphereGeometry(0.01, 8, 8);

  // Left Eye setup
  const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  leftEyeWhite.position.set(-0.16, 0.1, 0.46);
  leftEyeWhite.scale.set(1.0, 1.25, 1.0);

  const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
  leftPupil.position.set(-0.16, 0.1, 0.52);

  const leftCatchlight1 = new THREE.Mesh(catchGeo1, catchlightMat);
  leftCatchlight1.position.set(-0.145, 0.12, 0.55);

  const leftCatchlight2 = new THREE.Mesh(catchGeo2, catchlightMat);
  leftCatchlight2.position.set(-0.175, 0.08, 0.55);

  // Right Eye setup
  const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  rightEyeWhite.position.set(0.16, 0.1, 0.46);
  rightEyeWhite.scale.set(1.0, 1.25, 1.0);

  const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
  rightPupil.position.set(0.16, 0.1, 0.52);

  const rightCatchlight1 = new THREE.Mesh(catchGeo1, catchlightMat);
  rightCatchlight1.position.set(0.175, 0.12, 0.55);

  const rightCatchlight2 = new THREE.Mesh(catchGeo2, catchlightMat);
  rightCatchlight2.position.set(0.145, 0.08, 0.55);

  // Smile Mouth
  const mouthGeo = new THREE.TorusGeometry(0.065, 0.014, 8, 16, Math.PI);
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x182c20 });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, -0.06, 0.5);
  mouth.rotation.z = Math.PI; // Smile curve

  faceGroup.add(leftEyeWhite);
  faceGroup.add(rightEyeWhite);
  faceGroup.add(leftPupil);
  faceGroup.add(rightPupil);
  faceGroup.add(leftCatchlight1);
  faceGroup.add(rightCatchlight1);
  faceGroup.add(leftCatchlight2);
  faceGroup.add(rightCatchlight2);
  faceGroup.add(mouth);

  group.add(faceGroup);

  // 5. Glider Wings
  const { group: wingGroup, left: wingLeft, right: wingRight } = createGliderWings();
  group.add(wingGroup);

  return {
    group,
    bodyMesh,
    outlineMesh,
    coreMesh,
    faceGroup,
    leftEyeWhite,
    rightEyeWhite,
    leftPupil,
    rightPupil,
    leftCatchlight1,
    rightCatchlight1,
    leftCatchlight2,
    rightCatchlight2,
    mouth,
    wingGroup,
    wingLeft,
    wingRight,
    currentVariant: variant,
    wobbleY: 0,
    wobbleVelY: 0,
    prevVy: 0,
    wasGrounded: true,
    facingAngle: 0,
    blinkTimer: 0,
    nextBlinkTime: 3.5,
    wingFlapAngle: 0,
  };
}

/**
 * Switch visual variant
 */
export function setSlimeVisualVariant(visual: SlimeVisual, variant: SlimeVariant): void {
  if (visual.currentVariant === variant) return;

  visual.bodyMesh.geometry.dispose();
  visual.outlineMesh.geometry.dispose();

  const newGeo = createSlimeGeometry(variant);
  visual.bodyMesh.geometry = newGeo;
  visual.outlineMesh.geometry = newGeo;

  const colors = VARIANT_COLORS[variant];
  const mat = visual.bodyMesh.material as THREE.MeshPhysicalMaterial;
  mat.emissive.setHex(colors.bot).multiplyScalar(0.28);

  (visual.coreMesh.material as THREE.MeshStandardMaterial).color.setHex(colors.core);
  (visual.coreMesh.material as THREE.MeshStandardMaterial).emissive.setHex(colors.core);

  // Adjust face placement for cube vs rounded
  const zOff = variant === 'jelly_cube' ? 0.49 : 0.46;
  visual.leftEyeWhite.position.z = zOff;
  visual.rightEyeWhite.position.z = zOff;
  visual.leftPupil.position.z = zOff + 0.06;
  visual.rightPupil.position.z = zOff + 0.06;
  visual.leftCatchlight1.position.z = zOff + 0.08;
  visual.rightCatchlight1.position.z = zOff + 0.08;
  visual.leftCatchlight2.position.z = zOff + 0.08;
  visual.rightCatchlight2.position.z = zOff + 0.08;
  visual.mouth.position.z = zOff + 0.05;

  visual.currentVariant = variant;
}

/**
 * Update Slime visual animation, gelatin physics wobble, breathing, and facial expressions
 */
export function updateSlimeVisual(
  visual: SlimeVisual,
  slime: SlimeComponent,
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

  // 2. Smooth Facing Direction
  const vx = linearVelocity?.x || 0;
  const vz = linearVelocity?.z || 0;
  const horizSpeed = Math.hypot(vx, vz);

  if (horizSpeed > 0.3) {
    const targetAngle = Math.atan2(vx, vz);
    // Smooth angle interpolation
    let diff = targetAngle - visual.facingAngle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    visual.facingAngle += diff * Math.min(1.0, dt * 10);
  }

  visual.group.rotation.set(0, visual.facingAngle, 0);

  // 3. Gelatin Damped Spring Wobble (Vertical inertia on landing / jump)
  const currentVy = linearVelocity?.y || 0;
  const justLanded = !visual.wasGrounded && slime.isGrounded;

  if (justLanded) {
    // Impact impulse proportional to downward landing speed
    const impactSpeed = Math.abs(visual.prevVy);
    if (impactSpeed > 2.0) {
      visual.wobbleVelY -= Math.min(impactSpeed * 0.12, 1.2);
    }
  } else if (visual.wasGrounded && !slime.isGrounded && currentVy > 2.0) {
    // Jump takeoff upward stretch impulse
    visual.wobbleVelY += Math.min(currentVy * 0.08, 0.8);
  }

  visual.wasGrounded = slime.isGrounded;
  visual.prevVy = currentVy;

  // Spring-damper physics simulation for gelatin wobble
  const springK = 80.0; // Spring stiffness
  const damping = 10.0; // Damping ratio
  const springForce = -springK * visual.wobbleY - damping * visual.wobbleVelY;
  visual.wobbleVelY += springForce * dt;
  visual.wobbleY += visual.wobbleVelY * dt;

  // Clamp wobble to prevent extreme distortion
  visual.wobbleY = THREE.MathUtils.clamp(visual.wobbleY, -0.4, 0.5);

  // 4. Idle Organic Breathing
  const time = performance.now() * 0.001;
  const breathing = Math.sin(time * 3.2) * 0.035;

  // 5. Combine Scales: Base * Slime State * Gelatin Wobble * Breathing
  let sx = slime.scale.x;
  let sy = slime.scale.y;
  let sz = slime.scale.z;

  // Apply breathing when grounded and not charging jump
  if (slime.isGrounded && !slime.isChargingJump && !slime.isMelting) {
    sy += breathing;
    sx -= breathing * 0.5;
    sz -= breathing * 0.5;
  }

  // Jump charge anticipation squash (deep pancake compression)
  if (slime.isChargingJump && slime.isGrounded) {
    const chargeRatio = THREE.MathUtils.clamp(slime.jumpChargeTimer / 0.85, 0, 1);
    const squash = 1.0 - chargeRatio * 0.42;
    sy *= squash;
    sx *= 1.0 + (1.0 - squash) * 0.65;
    sz *= 1.0 + (1.0 - squash) * 0.65;
  } else if (!slime.isGrounded) {
    // Air dynamics: stretch when rising, flatten when falling
    if (currentVy > 1.0) {
      const riseStretch = Math.min(currentVy * 0.035, 0.3);
      sy += riseStretch;
      sx -= riseStretch * 0.4;
      sz -= riseStretch * 0.4;
    } else if (currentVy < -2.0) {
      const fallFlatten = Math.min(Math.abs(currentVy) * 0.025, 0.25);
      sy -= fallFlatten;
      sx += fallFlatten * 0.4;
      sz += fallFlatten * 0.4;
    }
  }

  // Apply dynamic gelatin spring wobble
  sy += visual.wobbleY;
  sx -= visual.wobbleY * 0.5;
  sz -= visual.wobbleY * 0.5;

  // Velocity lean / elongation when moving fast
  if (horizSpeed > 1.0 && slime.isGrounded) {
    const forwardSquish = Math.min(horizSpeed * 0.02, 0.12);
    sz += forwardSquish;
    sx -= forwardSquish * 0.5;
  }

  // Melt into puddle
  if (slime.isMelting) {
    sy = Math.min(sy, 0.32);
    sx = Math.max(sx, 1.45);
    sz = Math.max(sz, 1.45);
  }

  visual.group.scale.set(sx, sy, sz);

  // 6. Natural Blinking & Facial Expressions
  visual.blinkTimer += dt;
  let eyeScaleY = 1.25;

  if (visual.blinkTimer > visual.nextBlinkTime) {
    const blinkProgress = visual.blinkTimer - visual.nextBlinkTime;
    if (blinkProgress < 0.12) {
      // Fast closed blink
      eyeScaleY = Math.abs(1.0 - (blinkProgress / 0.06)) * 1.25;
      eyeScaleY = Math.max(0.08, eyeScaleY);
    } else {
      visual.blinkTimer = 0;
      visual.nextBlinkTime = 2.5 + Math.random() * 3.5;
    }
  }

  visual.leftEyeWhite.scale.y = eyeScaleY;
  visual.rightEyeWhite.scale.y = eyeScaleY;
  const eyesOpen = eyeScaleY > 0.4;
  visual.leftPupil.visible = eyesOpen;
  visual.rightPupil.visible = eyesOpen;
  visual.leftCatchlight1.visible = eyesOpen;
  visual.rightCatchlight1.visible = eyesOpen;
  visual.leftCatchlight2.visible = eyesOpen;
  visual.rightCatchlight2.visible = eyesOpen;

  // 7. Inner Core Floating Charm Bobbing & Pulsing
  visual.coreMesh.rotation.y += dt * 1.5;
  visual.coreMesh.rotation.x = Math.sin(time * 2.0) * 0.2;
  visual.coreMesh.position.y = Math.sin(time * 3.0) * 0.05;

  // 8. Glider Wings Deployment & Flapping
  const isGliding = !slime.isGrounded && slime.isGliding;
  visual.wingGroup.visible = isGliding;

  if (isGliding) {
    visual.wingFlapAngle += dt * 12.0;
    const flap = Math.sin(visual.wingFlapAngle) * 0.25;
    visual.wingRight.rotation.z = flap;
    visual.wingLeft.rotation.z = -flap;
  }

  // Sync variant if changed
  if (visual.currentVariant !== slime.variant) {
    setSlimeVisualVariant(visual, slime.variant);
  }
}

/**
 * Dispose Three.js resources
 */
export function disposeSlimeVisual(visual: SlimeVisual, scene: THREE.Scene): void {
  scene.remove(visual.group);
  visual.bodyMesh.geometry.dispose();
  (visual.bodyMesh.material as THREE.Material).dispose();
  visual.outlineMesh.geometry.dispose();
  (visual.outlineMesh.material as THREE.Material).dispose();
  visual.coreMesh.geometry.dispose();
  (visual.coreMesh.material as THREE.Material).dispose();
}
