/**
 * Main entry point for Aetheria
 * Phase 1: Basic scene with ground plane
 */

import { createScene } from '@render';
import * as THREE from 'three';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const loading = document.getElementById('loading') as HTMLDivElement;

if (!canvas) {
  throw new Error('Canvas element not found');
}

// Create scene
const { scene, camera, renderer } = createScene({ canvas, shadows: true });

// Add ground plane
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x7cba60, // Green grass
  roughness: 0.9,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Add a simple cube to verify rendering
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xff6fa5 });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.set(0, 0.5, 0);
cube.castShadow = true;
cube.receiveShadow = true;
scene.add(cube);

// Hide loading
loading.style.display = 'none';

// Animation loop
let lastTime = performance.now();

function animate(currentTime: number) {
  requestAnimationFrame(animate);

  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  // Rotate cube for visual verification
  cube.rotation.y += deltaTime;

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

console.log('Aetheria Phase 1: Core Architecture - Basic scene running');
