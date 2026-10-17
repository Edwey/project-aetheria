/**
 * Main entry point for Aetheria
 * Phase 2: Physics integration with falling sphere
 */

import { createScene } from '@render/index.js';
import { createWorld as createECSWorld, createEntity, addComponent, addResource } from '@core/index.js';
import { initPhysicsSystem, physicsSystem, createPhysicsEntity, PhysicsWorldResource } from '@sim/index.js';
import * as THREE from 'three';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const loading = document.getElementById('loading') as HTMLDivElement;

if (!canvas) {
  throw new Error('Canvas element not found');
}

async function main() {
  // Create scene
  const { scene, camera, renderer } = createScene({ canvas, shadows: true });

  // Create ECS world
  const world = createECSWorld();

  // Initialize physics
  await initPhysicsSystem(world);

  // Add ground plane (static visual only for now)
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x7cba60, // Green grass
    roughness: 0.9,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Create physics sphere
  const sphereEntity = createPhysicsEntity(world, {
    position: { x: 0, y: 10, z: 0 },
    mass: 1.0,
    shape: 'sphere',
    size: 0.5,
  });

  // Create visual sphere
  const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xff6fa5 });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  scene.add(sphere);

  // Hide loading
  loading.style.display = 'none';

  // Animation loop
  let lastTime = performance.now();
  const FIXED_DT = 1 / 60;

  function animate(currentTime: number) {
    requestAnimationFrame(animate);

    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Step physics
    physicsSystem(world, FIXED_DT);

    // Sync visual sphere with physics entity
    const physicsWorld = world.resources.get(PhysicsWorldResource) as any;
    if (physicsWorld) {
      // For now, we need to get the Rapier body position
      // This is a simplified sync - Phase 3 will do proper ECS sync
      const rapierWorld = physicsWorld.world;
      const bodies = rapierWorld.bodies();
      if (bodies.length > 0) {
        const pos = bodies[0].translation();
        sphere.position.set(pos.x, pos.y, pos.z);
      }
    }

    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);

  console.log('Aetheria Phase 2: Physics Integration - Falling sphere running');
}

main().catch(console.error);
