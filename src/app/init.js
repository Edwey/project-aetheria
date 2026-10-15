/**
 * App initialization - Sets up the empty-but-running app
 */

import * as THREE from 'three';
import { create as createScene } from '../render/scene.js';
import { create as createCamera } from '../render/camera.js';
import { build } from '../gameplay/terrain.js';
import { create as createEnv } from '../gameplay/env.js';

const app = document.getElementById('app');

export function init() {
  // Create scene
  const scene = createScene();
  scene.scene = new THREE.Scene();
  scene.scene.background = new THREE.Color(0xcfe9f3);

  // Create camera
  const camera = createCamera();
  camera.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 500);
  camera.camera.position.set(0, 10, 10);
  camera.camera.lookAt(0, 0, 0);

  // Create renderer
  scene.renderer = new THREE.WebGLRenderer({ antialias: true });
  scene.renderer.setSize(window.innerWidth, window.innerHeight);
  scene.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  app.appendChild(scene.renderer.domElement);

  // Handle resize
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    scene.renderer.setSize(w, h);
    const a = w / h;
    camera.camera.left = -a;
    camera.camera.right = a;
    camera.camera.top = 1;
    camera.camera.bottom = -1;
    camera.camera.updateProjectionMatrix();
  });

  // Create terrain placeholder
  const world = build('placeholder');

  // Create environment
  const env = createEnv(world, 5);

  // Add a simple placeholder message
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#16301f';
  ctx.font = 'bold 24px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Project Aetheria - Stage B: Empty app running', 256, 64);
  ctx.font = '16px Nunito, sans-serif';
  ctx.fillStyle = '#4f6b58';
  ctx.fillText('Stage C will port the prototype with parity tests', 256, 96);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(20, 5, 1);
  sprite.position.set(0, 5, 0);
  scene.scene.add(sprite);

  // Render loop
  function animate() {
    requestAnimationFrame(animate);
    scene.renderer.render(scene.scene, camera.camera);
  }

  animate();

  console.log('Project Aetheria initialized - Stage B complete');
  console.log('World:', world);
  console.log('Environment:', env);
}
