/**
 * Aetheria — Phase 0: Physics & Feel Spike Interactive Showcase
 *
 * Verifies:
 * 1. Rigid Proxy Bounce Test (>= 5 bounces, restitution 0.85 from 4m drop)
 * 2. Tight Spaces Test (0.5m Grate without tunneling or snagging)
 * 3. Trench & Ditch Navigation (0.4m trench support & navigation)
 * 4. Cutaway Dither Shader (circular cutaway revealing occluded creature)
 * 5. Physics Step Performance (<0.05 ms/step benchmark)
 */

import * as THREE from 'three';
import {
  FlatHeightfieldWithTrench,
  RigidProxySimulator,
} from '../packages/sim/src/physics-spike.js';
import { createCutawayStandardMaterial } from '../packages/render/src/cutaway-shader.js';

// ---------------------------------------------------------------------------
// 1. Scene & Renderer Setup
// ---------------------------------------------------------------------------

const canvas = document.getElementById('game') as HTMLCanvasElement;
const loadingEl = document.getElementById('loading') as HTMLDivElement;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd7eff2);
scene.fog = new THREE.FogExp2(0xd7eff2, 0.015);

// Camera Setup (Isometric style perspective)
const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
let camDistance = 14;
let camPitch = 0.65; // ~37 degrees
let camYaw = Math.PI * 0.25; // 45 degrees isometric angle

function updateCameraPosition(targetPos: THREE.Vector3) {
  const cx = targetPos.x + camDistance * Math.cos(camPitch) * Math.sin(camYaw);
  const cy = targetPos.y + camDistance * Math.sin(camPitch);
  const cz = targetPos.z + camDistance * Math.cos(camPitch) * Math.cos(camYaw);
  camera.position.set(cx, cy, cz);
  camera.lookAt(targetPos.x, targetPos.y + 0.5, targetPos.z);
}

// ---------------------------------------------------------------------------
// 2. Lighting & Atmosphere
// ---------------------------------------------------------------------------

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xb0d8b8, 0.75);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xfffae8, 1.25);
sunLight.position.set(16, 28, 16);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 60;
sunLight.shadow.camera.left = -16;
sunLight.shadow.camera.right = 16;
sunLight.shadow.camera.top = 16;
sunLight.shadow.camera.bottom = -16;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

// ---------------------------------------------------------------------------
// 3. Ground & Environment Setup
// ---------------------------------------------------------------------------

const groundGeo = new THREE.PlaneGeometry(60, 60, 60, 60);
groundGeo.rotateX(-Math.PI / 2);

// Low-poly pastel grass material
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x76c985,
  roughness: 0.85,
  metalness: 0.05,
  flatShading: true,
});
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// Subtle grid lines to read movement & distance
const gridHelper = new THREE.GridHelper(50, 50, 0x58a867, 0x98dd9e);
gridHelper.position.y = 0.005;
scene.add(gridHelper);

// ---------------------------------------------------------------------------
// 4. Test Courses Props
// ---------------------------------------------------------------------------

// Course 1: 4m Bounce Drop Target
const targetCircleGeo = new THREE.RingGeometry(0.2, 1.8, 32);
targetCircleGeo.rotateX(-Math.PI / 2);
const targetCircleMat = new THREE.MeshBasicMaterial({
  color: 0x22c55e,
  transparent: true,
  opacity: 0.45,
  side: THREE.DoubleSide,
});
const targetCircle = new THREE.Mesh(targetCircleGeo, targetCircleMat);
targetCircle.position.set(0, 0.01, 0);
scene.add(targetCircle);

// Course 2: 0.5m Grate / Gap Obstacle
const grateGroup = new THREE.Group();
grateGroup.position.set(10, 0, 0);

// Two concrete support side pillars
const pillarMat = new THREE.MeshStandardMaterial({
  color: 0x829489,
  roughness: 0.7,
});
const pillarGeo = new THREE.BoxGeometry(0.4, 0.5, 3.0);

const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
leftPillar.position.set(-1.2, 0.25, 0);
leftPillar.castShadow = true;
leftPillar.receiveShadow = true;
grateGroup.add(leftPillar);

const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
rightPillar.position.set(1.2, 0.25, 0);
rightPillar.castShadow = true;
rightPillar.receiveShadow = true;
grateGroup.add(rightPillar);

// Overhead metal grate ceiling at exactly 0.5m height
const grateBarMat = new THREE.MeshStandardMaterial({
  color: 0x475569,
  metalness: 0.65,
  roughness: 0.35,
});
const grateTopGeo = new THREE.BoxGeometry(2.4, 0.08, 2.4);
const grateTop = new THREE.Mesh(grateTopGeo, grateBarMat);
grateTop.position.set(0, 0.54, 0);
grateTop.castShadow = true;
grateGroup.add(grateTop);

// Squeeze visual label
scene.add(grateGroup);

// Course 3: 0.4m Trench visual ditch
const trenchGroup = new THREE.Group();
trenchGroup.position.set(-10, 0, 0);

const trenchFloorGeo = new THREE.PlaneGeometry(0.4, 8);
trenchFloorGeo.rotateX(-Math.PI / 2);
const trenchFloorMat = new THREE.MeshStandardMaterial({
  color: 0x4d3826,
  roughness: 0.95,
});
const trenchFloor = new THREE.Mesh(trenchFloorGeo, trenchFloorMat);
trenchFloor.position.set(0, -0.29, 0);
trenchFloor.receiveShadow = true;
trenchGroup.add(trenchFloor);

// Trench left and right walls
const trenchWallGeo = new THREE.BoxGeometry(0.04, 0.3, 8);
const trenchWallMat = new THREE.MeshStandardMaterial({
  color: 0x6e5238,
  roughness: 0.9,
});
const leftWall = new THREE.Mesh(trenchWallGeo, trenchWallMat);
leftWall.position.set(-0.2, -0.15, 0);
trenchGroup.add(leftWall);

const rightWall = new THREE.Mesh(trenchWallGeo, trenchWallMat);
rightWall.position.set(0.2, -0.15, 0);
trenchGroup.add(rightWall);

scene.add(trenchGroup);

// Cutaway Occlusion Wall (Toggled with T)
const wallGeo = new THREE.BoxGeometry(3.5, 4.0, 0.6);
const { material: cutawayMat, uniforms: cutawayUniforms } = createCutawayStandardMaterial(
  {
    color: 0x8a7258,
    roughness: 0.85,
  },
  1.8,
  0.8
);
const cutawayWallMesh = new THREE.Mesh(wallGeo, cutawayMat);
cutawayWallMesh.position.set(0, 2.0, 3.5);
cutawayWallMesh.castShadow = true;
cutawayWallMesh.receiveShadow = true;
scene.add(cutawayWallMesh);

// ---------------------------------------------------------------------------
// 5. Living Slime Avatar Mesh (Procedural Rigid Proxy Visuals)
// ---------------------------------------------------------------------------

const avatarGroup = new THREE.Group();

// Outer jelly body
const slimeGeo = new THREE.SphereGeometry(0.35, 32, 24);
const slimeMat = new THREE.MeshPhysicalMaterial({
  color: 0x48e5c2,
  emissive: 0x145244,
  roughness: 0.15,
  transmission: 0.6,
  thickness: 0.8,
  ior: 1.33,
  clearcoat: 0.8,
  clearcoatRoughness: 0.1,
});
const slimeMesh = new THREE.Mesh(slimeGeo, slimeMat);
slimeMesh.castShadow = true;
avatarGroup.add(slimeMesh);

// Inner core crystal
const coreGeo = new THREE.OctahedronGeometry(0.12, 0);
const coreMat = new THREE.MeshStandardMaterial({
  color: 0x8ef5e8,
  emissive: 0x48e5c2,
  emissiveIntensity: 0.8,
  roughness: 0.1,
  metalness: 0.2,
});
const coreMesh = new THREE.Mesh(coreGeo, coreMat);
avatarGroup.add(coreMesh);

// Cute facial eyes
const eyeGeo = new THREE.SphereGeometry(0.045, 12, 12);
const eyeMat = new THREE.MeshBasicMaterial({ color: 0x142e1d });

const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
leftEye.position.set(0.11, 0.08, 0.31);
leftEye.scale.set(1.0, 1.4, 0.6);
avatarGroup.add(leftEye);

const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
rightEye.position.set(-0.11, 0.08, 0.31);
rightEye.scale.set(1.0, 1.4, 0.6);
avatarGroup.add(rightEye);

scene.add(avatarGroup);

// ---------------------------------------------------------------------------
// 6. Physics Simulation Instances
// ---------------------------------------------------------------------------

let activeCourse: 1 | 2 | 3 = 1;

// Course 1 & 2 use standard flat heightfield
const flatWorld = new FlatHeightfieldWithTrench(0, 0, 0);

// Course 3 uses flat heightfield with trench centered at -10
const trenchWorld = new FlatHeightfieldWithTrench(0.4, 0.3, -10);

let currentWorld: FlatHeightfieldWithTrench = flatWorld;
let ceilingLimit: number | undefined = undefined;

// Simulator instance
const simulator = new RigidProxySimulator(
  {
    restitution: 0.85,
    mass: 1.2,
    radius: 0.35,
    linearDamping: 0.05,
    friction: 0.2,
  },
  { x: 0, y: 4.0, z: 0 }
);

function switchCourse(course: 1 | 2 | 3) {
  activeCourse = course;

  document.querySelectorAll('.btn-course').forEach((btn) => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`btn-course-${course}`);
  if (activeBtn) activeBtn.classList.add('active');

  const courseTitle = document.getElementById('course-name')!;

  if (course === 1) {
    courseTitle.textContent = 'Course 1: 4m Bounce Drop Test (Restitution 0.85)';
    currentWorld = flatWorld;
    ceilingLimit = undefined;
    simulator.config.restitution = 0.85;
    simulator.config.radius = 0.35;
    simulator.reset({ x: 0, y: 4.0, z: 0 });
    slimeMesh.scale.set(1, 1, 1);
  } else if (course === 2) {
    courseTitle.textContent = 'Course 2: 0.5m Grate Squeeze (Zero Tunneling)';
    currentWorld = flatWorld;
    ceilingLimit = 0.5;
    simulator.config.restitution = 0.4;
    simulator.config.radius = 0.22; // Squeezed radius
    simulator.reset({ x: 10, y: 0.25, z: 2.2 });
    slimeMesh.scale.set(1.2, 0.63, 1.2);
  } else if (course === 3) {
    courseTitle.textContent = 'Course 3: 0.4m Trench Navigation (Rim Rolling / Walking)';
    currentWorld = trenchWorld;
    ceilingLimit = undefined;
    simulator.config.restitution = 0.4;
    simulator.config.radius = 0.35;
    simulator.reset({ x: -10, y: 1.0, z: 2.0 });
    slimeMesh.scale.set(1, 1, 1);
  }
}

// ---------------------------------------------------------------------------
// 7. Input Handling
// ---------------------------------------------------------------------------

const keysDown = new Set<string>();

window.addEventListener('keydown', (e) => {
  keysDown.add(e.code);

  if (e.code === 'Digit1') switchCourse(1);
  if (e.code === 'Digit2') switchCourse(2);
  if (e.code === 'Digit3') switchCourse(3);

  if (e.code === 'KeyR') {
    switchCourse(activeCourse);
  }

  if (e.code === 'KeyT') {
    cutawayWallMesh.visible = !cutawayWallMesh.visible;
    const btn = document.getElementById('btn-toggle-wall');
    if (btn) btn.classList.toggle('active', cutawayWallMesh.visible);
  }

  if (e.code === 'KeyQ') {
    camYaw += (e.shiftKey ? -1 : 1) * (Math.PI / 4);
  }
});

window.addEventListener('keyup', (e) => {
  keysDown.delete(e.code);
});

// UI Course Buttons
document.getElementById('btn-course-1')?.addEventListener('click', () => switchCourse(1));
document.getElementById('btn-course-2')?.addEventListener('click', () => switchCourse(2));
document.getElementById('btn-course-3')?.addEventListener('click', () => switchCourse(3));
document.getElementById('btn-toggle-wall')?.addEventListener('click', () => {
  cutawayWallMesh.visible = !cutawayWallMesh.visible;
  document.getElementById('btn-toggle-wall')?.classList.toggle('active', cutawayWallMesh.visible);
});

// Orbit Controls via Right-Mouse Drag
let isDragging = false;
let prevMouseX = 0;
let prevMouseY = 0;

window.addEventListener('mousedown', (e) => {
  if (e.button === 2) {
    isDragging = true;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  }
});

window.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const dx = e.clientX - prevMouseX;
    const dy = e.clientY - prevMouseY;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;

    camYaw -= dx * 0.008;
    camPitch = THREE.MathUtils.clamp(camPitch + dy * 0.006, 0.25, 1.2);
  }
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 2) isDragging = false;
});

window.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('wheel', (e) => {
  camDistance = THREE.MathUtils.clamp(camDistance + e.deltaY * 0.015, 6, 28);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------------------------------------------------------------------------
// 8. Main Loop & Performance Telemetry
// ---------------------------------------------------------------------------

// Telemetry DOM elements
const elFps = document.getElementById('val-fps')!;
const elStepTime = document.getElementById('val-step-time')!;
const elBounces = document.getElementById('val-bounces')!;
const elVy = document.getElementById('val-vy')!;
const elRestitution = document.getElementById('val-restitution')!;
const elContacts = document.getElementById('val-contacts')!;

let frameCount = 0;
let lastFpsTime = performance.now();
let lastTime = performance.now();
const FIXED_DT = 1 / 60;
let accumulator = 0;

// Hide loading screen
loadingEl.style.opacity = '0';
setTimeout(() => {
  loadingEl.style.display = 'none';
}, 300);

function animate(now: number) {
  requestAnimationFrame(animate);

  const delta = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  accumulator += delta;

  // Read movement inputs relative to camera yaw
  let inputX = 0;
  let inputZ = 0;
  if (keysDown.has('KeyW') || keysDown.has('ArrowUp')) inputZ -= 1;
  if (keysDown.has('KeyS') || keysDown.has('ArrowDown')) inputZ += 1;
  if (keysDown.has('KeyA') || keysDown.has('ArrowLeft')) inputX -= 1;
  if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) inputX += 1;

  // Jump input
  if (keysDown.has('Space')) {
    simulator.applyJumpImpulse(6.5);
  }

  // Camera-relative input transformation
  const forwardX = Math.sin(camYaw);
  const forwardZ = Math.cos(camYaw);
  const rightX = Math.cos(camYaw);
  const rightZ = -Math.sin(camYaw);

  const moveDirX = inputX * rightX - inputZ * forwardX;
  const moveDirZ = inputX * rightZ - inputZ * forwardZ;

  let stepDurationMs = 0;

  // Fixed physics time-stepping
  while (accumulator >= FIXED_DT) {
    const t0 = performance.now();

    // Step physics simulator
    simulator.step(FIXED_DT, currentWorld, ceilingLimit);

    // Apply horizontal input drive
    if (moveDirX !== 0 || moveDirZ !== 0) {
      const driveSpeed = activeCourse === 2 ? 3.0 : 4.5;
      simulator.vel.x = moveDirX * driveSpeed;
      simulator.vel.z = moveDirZ * driveSpeed;
    }

    stepDurationMs = performance.now() - t0;
    accumulator -= FIXED_DT;
  }

  // Synchronize 3D avatar position with simulator
  avatarGroup.position.set(simulator.pos.x, simulator.pos.y, simulator.pos.z);

  // Dynamic squash-and-stretch based on vertical velocity
  const vy = simulator.vel.y;
  let squashY = 1.0;
  if (activeCourse !== 2) {
    squashY = THREE.MathUtils.clamp(1.0 + vy * 0.04, 0.65, 1.45);
    const squashXZ = 1.0 / Math.sqrt(squashY);
    slimeMesh.scale.set(squashXZ, squashY, squashXZ);
  }

  // Subtle core wobble
  coreMesh.rotation.x += 0.02;
  coreMesh.rotation.y += 0.03;

  // Face rotation toward movement direction
  if (moveDirX !== 0 || moveDirZ !== 0) {
    const targetAngle = Math.atan2(moveDirX, moveDirZ);
    avatarGroup.rotation.y = THREE.MathUtils.lerp(
      avatarGroup.rotation.y,
      targetAngle,
      0.15
    );
  }

  // Update cutaway shader uniform with avatar position
  cutawayUniforms.avatarPosition.value.copy(avatarGroup.position);

  // Update smooth camera follow
  updateCameraPosition(avatarGroup.position);

  // Render scene
  renderer.render(scene, camera);

  // Telemetry updates
  frameCount++;
  if (now - lastFpsTime >= 500) {
    const currentFps = Math.round((frameCount * 1000) / (now - lastFpsTime));
    elFps.textContent = currentFps.toString();
    elStepTime.textContent = `${stepDurationMs.toFixed(3)} ms`;
    elBounces.textContent = simulator.bounceCount.toString();
    elVy.textContent = `${vy.toFixed(2)} m/s`;
    elRestitution.textContent = simulator.config.restitution.toFixed(2);
    elContacts.textContent = simulator.isGrounded ? '1 (Ground)' : '0 (Air)';
    frameCount = 0;
    lastFpsTime = now;
  }
}

requestAnimationFrame(animate);
