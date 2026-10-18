/**
 * Main entry point for Aetheria
 * Phase 3: Slime Creature (Liquid Form: Goo, Jelly Ball, Jelly Cube)
 */

import { createScene } from '@render/index.js';
import { createSlimeMesh, updateSlimeVisual, setSlimeVisualVariant } from '@render/slime-mesh.js';
import { createWorld as createECSWorld, getComponent } from '@core/index.js';
import {
  initPhysicsSystem,
  physicsSystem,
  createPhysicsEntity,
  TransformComponent,
  createSlimeEntity,
  setSlimeVariant,
  updateSlime,
  SlimeComponentSymbol,
  type SlimeComponent,
  type SlimeVariant,
  type Transform,
} from '@sim/index.js';
import { createInputManager } from '@ui/index.js';
import * as THREE from 'three';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const loading = document.getElementById('loading') as HTMLDivElement;
const variantNameLabel = document.getElementById('variant-name') as HTMLSpanElement;

if (!canvas) {
  throw new Error('Canvas element not found');
}

async function main() {
  // 1. Create Three.js scene
  const { scene, camera, renderer } = createScene({ canvas, shadows: true });
  scene.background = new THREE.Color(0xbde0fe); // Soft pastel sky
  scene.fog = new THREE.FogExp2(0xbde0fe, 0.015);

  // 2. Create ECS world and initialize Rapier physics
  const world = createECSWorld();
  await initPhysicsSystem(world, { x: 0, y: -20, z: 0 });

  // 3. Ground terrain (visual + physics)
  const groundGeometry = new THREE.BoxGeometry(160, 2, 160);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x7cba60, // Cozy pastel meadow green
    roughness: 0.85,
    metalness: 0.05,
  });
  const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
  groundMesh.position.set(0, -1, 0);
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  // Physics static ground collider: top surface at y = 0
  createPhysicsEntity(world, {
    position: { x: 0, y: -1, z: 0 },
    mass: 0,
    shape: 'box',
    size: { x: 80, y: 1, z: 80 },
    isStatic: true,
    friction: 0.7,
    restitution: 0.1,
  });

  // 4. Add test obstacle: 5m climbing wall to showcase sticky wall climbing
  const wallGeometry = new THREE.BoxGeometry(12, 5.5, 1);
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4a373, // Warm sandstone
    roughness: 0.9,
  });
  const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
  wallMesh.position.set(0, 2.75, -10);
  wallMesh.castShadow = true;
  wallMesh.receiveShadow = true;
  scene.add(wallMesh);

  createPhysicsEntity(world, {
    position: { x: 0, y: 2.75, z: -10 },
    mass: 0,
    shape: 'box',
    size: { x: 6, y: 2.75, z: 0.5 },
    isStatic: true,
    friction: 0.8,
  });

  // Add decorative rocks / platforms
  const platformGeo = new THREE.BoxGeometry(4, 1.5, 4);
  const platformMat = new THREE.MeshStandardMaterial({ color: 0xccd5ae, roughness: 0.9 });
  const platformMesh = new THREE.Mesh(platformGeo, platformMat);
  platformMesh.position.set(8, 0.75, -4);
  platformMesh.castShadow = true;
  platformMesh.receiveShadow = true;
  scene.add(platformMesh);

  createPhysicsEntity(world, {
    position: { x: 8, y: 0.75, z: -4 },
    mass: 0,
    shape: 'box',
    size: { x: 2, y: 0.75, z: 2 },
    isStatic: true,
  });

  // 5. Spawn Player Slime Entity
  let activeVariant: SlimeVariant = 'jelly_ball';
  const slimeEntity = createSlimeEntity(world, {
    position: { x: 0, y: 1.5, z: 0 },
    variant: activeVariant,
  });

  // Create procedural visual mesh in Three.js
  const slimeVisual = createSlimeMesh(activeVariant);
  scene.add(slimeVisual.group);

  // 6. Input Manager
  const inputManager = createInputManager();

  // Wire HUD variant selection buttons
  const variantBtns = {
    goo: document.getElementById('btn-goo'),
    jelly_ball: document.getElementById('btn-jelly-ball'),
    jelly_cube: document.getElementById('btn-jelly-cube'),
  };

  function updateHUDVariant(variant: SlimeVariant) {
    activeVariant = variant;
    setSlimeVariant(world, slimeEntity, variant);
    setSlimeVisualVariant(slimeVisual, variant);

    const labels: Record<SlimeVariant, string> = {
      goo: 'Goo (Sticky & Fluid)',
      jelly_ball: 'Jelly Ball (Bouncy & Nimble)',
      jelly_cube: 'Jelly Cube (Firm & Stable)',
    };
    if (variantNameLabel) {
      variantNameLabel.textContent = labels[variant];
    }

    Object.entries(variantBtns).forEach(([v, btn]) => {
      if (btn) {
        if (v === variant) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });
  }

  Object.entries(variantBtns).forEach(([v, btn]) => {
    btn?.addEventListener('click', () => updateHUDVariant(v as SlimeVariant));
  });

  // Hide loading overlay
  if (loading) {
    loading.style.display = 'none';
  }

  // 7. Main Loop (Fixed 60Hz physics + smooth rendering & camera)
  const FIXED_DT = 1 / 60;
  let lastTime = performance.now();
  let accumulator = 0;
  const cameraOffset = new THREE.Vector3(0, 5, 12);

  function animate(currentTime: number) {
    requestAnimationFrame(animate);

    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;
    accumulator += deltaTime;

    // Check keyboard variant selection (1, 2, 3)
    const requested = inputManager.getSelectedVariant();
    if (requested && requested !== activeVariant) {
      updateHUDVariant(requested);
      inputManager.resetVariantSelection();
    }

    const input = inputManager.getInput();

    // Step physics with fixed timestep
    while (accumulator >= FIXED_DT) {
      updateSlime(world, slimeEntity, input, FIXED_DT);
      physicsSystem(world, FIXED_DT);
      accumulator -= FIXED_DT;
    }

    // Sync visual slime representation
    const slimeComp = getComponent<SlimeComponent>(world, slimeEntity, SlimeComponentSymbol);
    const transform = getComponent<Transform>(world, slimeEntity, TransformComponent);

    if (slimeComp && transform) {
      updateSlimeVisual(slimeVisual, slimeComp, transform);

      // Smooth camera follow
      const targetCamPos = new THREE.Vector3(
        transform.position.x + cameraOffset.x,
        transform.position.y + cameraOffset.y,
        transform.position.z + cameraOffset.z
      );
      camera.position.lerp(targetCamPos, 0.1);
      camera.lookAt(transform.position.x, transform.position.y + 0.5, transform.position.z);
    }

    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);
  console.log('Aetheria Phase 3: Slime Creature (Goo, Jelly Ball, Jelly Cube) active');
}

main().catch(console.error);
