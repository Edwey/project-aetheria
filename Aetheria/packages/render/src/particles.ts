/**
 * Particle Effects for Creature Actions (Landing puffs, jump bursts, shockwaves)
 */

import * as THREE from 'three';
import { getSoftCircleTexture } from './textures.js';

export interface ParticleEffectManager {
  spawnDustPuff(x: number, y: number, z: number, count?: number, speed?: number): void;
  spawnShockwave(x: number, y: number, z: number, radius?: number, color?: number): void;
  update(dt: number): void;
  dispose(): void;
}

export function createParticleManager(scene: THREE.Scene): ParticleEffectManager {
  // 1. Dust puff particle pool
  const MAX_DUST = 80;
  const dustPositions = new Float32Array(MAX_DUST * 3);
  const dustColors = new Float32Array(MAX_DUST * 3);

  const dustData: Array<{
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
  }> = [];

  for (let i = 0; i < MAX_DUST; i++) {
    dustPositions[i * 3 + 1] = -999; // Offscreen
    dustData.push({ x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 0.8 });
  }

  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

  const dustMat = new THREE.PointsMaterial({
    size: 0.35,
    map: getSoftCircleTexture(),
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const dustPoints = new THREE.Points(dustGeo, dustMat);
  dustPoints.frustumCulled = false;
  scene.add(dustPoints);

  let dustIndex = 0;

  // 2. Shockwave expanding ground rings pool
  const MAX_RINGS = 5;
  const shockwaves: Array<{
    mesh: THREE.Mesh;
    timer: number;
    maxDuration: number;
    maxRadius: number;
    active: boolean;
  }> = [];

  const ringGeo = new THREE.RingGeometry(0.85, 1.0, 48);
  ringGeo.rotateX(-Math.PI / 2);

  for (let i = 0; i < MAX_RINGS; i++) {
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.visible = false;
    scene.add(ringMesh);

    shockwaves.push({
      mesh: ringMesh,
      timer: 0,
      maxDuration: 0.6,
      maxRadius: 3.5,
      active: false,
    });
  }

  return {
    spawnDustPuff(x: number, y: number, z: number, count = 12, speed = 1.8): void {
      for (let k = 0; k < count; k++) {
        const p = dustData[dustIndex];
        dustIndex = (dustIndex + 1) % MAX_DUST;
        if (!p) continue;

        const angle = Math.random() * Math.PI * 2;
        const sp = speed * (0.3 + Math.random() * 0.7);

        p.x = x + Math.cos(angle) * 0.25;
        p.y = y + 0.05;
        p.z = z + Math.sin(angle) * 0.25;
        p.vx = Math.cos(angle) * sp;
        p.vy = 0.6 + Math.random() * 1.2;
        p.vz = Math.sin(angle) * sp;
        p.life = 0.75 + Math.random() * 0.25;
        p.maxLife = p.life;
      }
    },

    spawnShockwave(x: number, y: number, z: number, radius = 3.5, color = 0xffffff): void {
      const sw = shockwaves.find((s) => !s.active) || shockwaves[0];
      if (!sw) return;
      sw.active = true;
      sw.timer = 0;
      sw.maxRadius = radius;
      sw.mesh.position.set(x, y + 0.04, z);
      (sw.mesh.material as THREE.MeshBasicMaterial).color.setHex(color);
      (sw.mesh.material as THREE.MeshBasicMaterial).opacity = 0.8;
      sw.mesh.scale.set(0.5, 0.5, 0.5);
      sw.mesh.visible = true;
    },

    update(dt: number): void {
      // Update dust particles
      const pos = dustGeo.attributes.position as THREE.BufferAttribute;
      const col = dustGeo.attributes.color as THREE.BufferAttribute;

      for (let i = 0; i < MAX_DUST; i++) {
        const p = dustData[i];
        if (p && p.life > 0) {
          p.life -= dt;
          p.vx *= 0.93;
          p.vz *= 0.93;
          p.vy -= 1.8 * dt; // Gravity
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;

          const progress = Math.max(0, p.life / p.maxLife);
          pos.setXYZ(i, p.x, p.y, p.z);
          col.setXYZ(i, 0.95 * progress, 0.9 * progress, 0.8 * progress);
        } else {
          pos.setXYZ(i, 0, -999, 0);
          col.setXYZ(i, 0, 0, 0);
        }
      }

      pos.needsUpdate = true;
      col.needsUpdate = true;

      // Update shockwave rings
      for (const sw of shockwaves) {
        if (!sw.active) continue;

        sw.timer += dt;
        const progress = sw.timer / sw.maxDuration;

        if (progress >= 1.0) {
          sw.active = false;
          sw.mesh.visible = false;
        } else {
          const currentScale = 0.5 + progress * (sw.maxRadius - 0.5);
          sw.mesh.scale.set(currentScale, currentScale, currentScale);
          (sw.mesh.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1.0 - progress);
        }
      }
    },

    dispose(): void {
      scene.remove(dustPoints);
      dustGeo.dispose();
      dustMat.dispose();

      for (const sw of shockwaves) {
        scene.remove(sw.mesh);
        (sw.mesh.material as THREE.Material).dispose();
      }
      ringGeo.dispose();
    },
  };
}
