/**
 * Aetheria — Phase 0: Physics & Feel Spike Interactive Showcase
 *
 * Verifies the physics foundation across ALL 9 FORMS:
 * - Slime: Oobleck (1), Dewdrop (2), Aether Bubble (3)
 * - Wisp: Mist (4), Zephyr (5), Lantern (6)
 * - Stone: Aerolite (7), Geode (8), Obsidian (9)
 *
 * Courses:
 * 1. 4m Drop Test (Restitution ordering & Dewdrop ballast splat)
 * 2. 0.5m Grate Squeeze (Zero tunneling / pinching)
 * 3. 0.4m Trench Navigation (Geode rim rolling vs walking avatar)
 * 4. Water Basin (Buoyancy: relative density < 1 floats, > 1 sinks)
 */

import * as THREE from 'three';
import {
  FlatHeightfieldWithTrench,
  RigidProxySimulator,
} from '../packages/sim/src/physics-spike.js';
import { createCutawayStandardMaterial } from '../packages/render/src/cutaway-shader.js';

// ---------------------------------------------------------------------------
// 1. Form Definitions for Phase 0
// ---------------------------------------------------------------------------

export type FormKey =
  | 'oobleck'
  | 'dewdrop'
  | 'aether_bubble'
  | 'mist'
  | 'zephyr'
  | 'lantern'
  | 'aerolite'
  | 'geode'
  | 'obsidian';

export interface FormSpec {
  id: FormKey;
  name: string;
  family: 'Slime' | 'Wisp' | 'Stone';
  mass: number;
  density: number;
  restitution: number;
  gravityScale: number; // relative to -20 m/s^2
  radius: number;
  friction: number;
  moveSpeed: number;
  jumpImpulse: number;
  color: number;
  glowColor: number;
}

const FORMS: Record<FormKey, FormSpec> = {
  oobleck: {
    id: 'oobleck',
    name: 'Oobleck',
    family: 'Slime',
    mass: 1.2,
    density: 1.12,
    restitution: 0.85, // Bounce champion
    gravityScale: 1.0,
    radius: 0.35,
    friction: 0.2,
    moveSpeed: 4.8,
    jumpImpulse: 7.5,
    color: 0x48e5c2,
    glowColor: 0x8ef5e8,
  },
  dewdrop: {
    id: 'dewdrop',
    name: 'Dewdrop',
    family: 'Slime',
    mass: 1.2, // Dry mass; scales to 2.0 with full ballast
    density: 0.85,
    restitution: 0.6, // Dry bounce; drops to 0.0 with full ballast splat
    gravityScale: 1.0,
    radius: 0.34,
    friction: 0.22,
    moveSpeed: 4.4,
    jumpImpulse: 6.2,
    color: 0x54a0ff,
    glowColor: 0x99ccff,
  },
  aether_bubble: {
    id: 'aether_bubble',
    name: 'Aether Bubble',
    family: 'Slime',
    mass: 0.4,
    density: 0.25,
    restitution: 0.5, // Airy soft bounce
    gravityScale: 0.35, // 0.35g floaty feel
    radius: 0.38,
    friction: 0.1,
    moveSpeed: 3.8,
    jumpImpulse: 4.8,
    color: 0xff9ff3,
    glowColor: 0xffd2f9,
  },
  mist: {
    id: 'mist',
    name: 'Mist',
    family: 'Wisp',
    mass: 0.3,
    density: 0.08,
    restitution: 0.1,
    gravityScale: 0.15, // Gaseous float
    radius: 0.32,
    friction: 0.05,
    moveSpeed: 4.2,
    jumpImpulse: 4.2,
    color: 0xdff9fb,
    glowColor: 0xffffff,
  },
  zephyr: {
    id: 'zephyr',
    name: 'Zephyr',
    family: 'Wisp',
    mass: 0.3,
    density: 0.12,
    restitution: 0.2,
    gravityScale: 0.25,
    radius: 0.3,
    friction: 0.05,
    moveSpeed: 6.5, // Swift horizontal breeze
    jumpImpulse: 5.5,
    color: 0x55efc4,
    glowColor: 0x00b894,
  },
  lantern: {
    id: 'lantern',
    name: 'Lantern',
    family: 'Wisp',
    mass: 0.8,
    density: 0.9,
    restitution: 0.25,
    gravityScale: 0.4,
    radius: 0.32,
    friction: 0.12,
    moveSpeed: 4.0,
    jumpImpulse: 5.0,
    color: 0xfeca57,
    glowColor: 0xff9f43,
  },
  aerolite: {
    id: 'aerolite',
    name: 'Aerolite',
    family: 'Stone',
    mass: 1.5,
    density: 0.55, // Naturally floats on water (< 1.0)!
    restitution: 0.3,
    gravityScale: 0.8,
    radius: 0.36,
    friction: 0.25,
    moveSpeed: 4.5,
    jumpImpulse: 6.0,
    color: 0xdfd8c8,
    glowColor: 0xf5f3ea,
  },
  geode: {
    id: 'geode',
    name: 'Geode',
    family: 'Stone',
    mass: 3.5,
    density: 2.6, // Heavy mineral rock
    restitution: 0.25,
    gravityScale: 1.0,
    radius: 0.45,
    friction: 0.05, // Near-zero rolling friction!
    moveSpeed: 5.2,
    jumpImpulse: 5.2,
    color: 0xa29bfe,
    glowColor: 0x6c5ce7,
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian',
    family: 'Stone',
    mass: 9.0, // Immense mass
    density: 5.0, // Sinks rapidly
    restitution: 0.15, // Solid, low rebound
    gravityScale: 1.25,
    radius: 0.4,
    friction: 0.35,
    moveSpeed: 3.5,
    jumpImpulse: 4.0,
    color: 0x2d3436,
    glowColor: 0x636e72,
  },
};

let currentForm: FormSpec = FORMS.oobleck;
let dewdropFullBallast = false; // Toggle with B or UI button

// ---------------------------------------------------------------------------
// 2. Three.js Scene Setup
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
let camPitch = 0.65;
let camYaw = Math.PI * 0.25;

function updateCameraPosition(targetPos: THREE.Vector3) {
  const cx = targetPos.x + camDistance * Math.cos(camPitch) * Math.sin(camYaw);
  const cy = targetPos.y + camDistance * Math.sin(camPitch);
  const cz = targetPos.z + camDistance * Math.cos(camPitch) * Math.cos(camYaw);
  camera.position.set(cx, cy, cz);
  camera.lookAt(targetPos.x, targetPos.y + 0.5, targetPos.z);
}

// Lighting
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

// Ground plane
const groundGeo = new THREE.PlaneGeometry(60, 60, 60, 60);
groundGeo.rotateX(-Math.PI / 2);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x76c985,
  roughness: 0.85,
  flatShading: true,
});
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.receiveShadow = true;
scene.add(groundMesh);

const gridHelper = new THREE.GridHelper(50, 50, 0x58a867, 0x98dd9e);
gridHelper.position.y = 0.005;
scene.add(gridHelper);

// ---------------------------------------------------------------------------
// 3. Test Course Obstacles & Props
// ---------------------------------------------------------------------------

// Course 1: 4m Bounce Drop Target Ring
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

const pillarMat = new THREE.MeshStandardMaterial({ color: 0x829489, roughness: 0.7 });
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

// Overhead metal grate bars ceiling at exactly 0.5m
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
scene.add(grateGroup);

// Course 3: 0.4m Trench visual ditch
const trenchGroup = new THREE.Group();
trenchGroup.position.set(-10, 0, 0);

const trenchFloorGeo = new THREE.PlaneGeometry(0.4, 8);
trenchFloorGeo.rotateX(-Math.PI / 2);
const trenchFloorMat = new THREE.MeshStandardMaterial({ color: 0x4d3826, roughness: 0.95 });
const trenchFloor = new THREE.Mesh(trenchFloorGeo, trenchFloorMat);
trenchFloor.position.set(0, -0.29, 0);
trenchFloor.receiveShadow = true;
trenchGroup.add(trenchFloor);

const trenchWallGeo = new THREE.BoxGeometry(0.04, 0.3, 8);
const trenchWallMat = new THREE.MeshStandardMaterial({ color: 0x6e5238, roughness: 0.9 });
const leftWall = new THREE.Mesh(trenchWallGeo, trenchWallMat);
leftWall.position.set(-0.2, -0.15, 0);
trenchGroup.add(leftWall);

const rightWall = new THREE.Mesh(trenchWallGeo, trenchWallMat);
rightWall.position.set(0.2, -0.15, 0);
trenchGroup.add(rightWall);
scene.add(trenchGroup);

// Course 4: Water Basin (Centered at 0, 0, -10)
const waterBasinGroup = new THREE.Group();
waterBasinGroup.position.set(0, 0, -10);

const waterGeo = new THREE.PlaneGeometry(8, 8);
waterGeo.rotateX(-Math.PI / 2);
const waterMat = new THREE.MeshStandardMaterial({
  color: 0x38bdf8,
  transparent: true,
  opacity: 0.65,
  roughness: 0.1,
  metalness: 0.1,
});
const waterMesh = new THREE.Mesh(waterGeo, waterMat);
waterMesh.position.set(0, 0.02, 0);
waterBasinGroup.add(waterMesh);

const basinFloorGeo = new THREE.BoxGeometry(8.2, 0.2, 8.2);
const basinFloorMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
const basinFloor = new THREE.Mesh(basinFloorGeo, basinFloorMat);
basinFloor.position.set(0, -1.5, 0);
waterBasinGroup.add(basinFloor);
scene.add(waterBasinGroup);

// Cutaway Occlusion Wall (Toggled with T)
const wallGeo = new THREE.BoxGeometry(3.5, 4.0, 0.6);
const { material: cutawayMat, uniforms: cutawayUniforms } = createCutawayStandardMaterial(
  { color: 0x8a7258, roughness: 0.85 },
  1.8,
  0.8
);
const cutawayWallMesh = new THREE.Mesh(wallGeo, cutawayMat);
cutawayWallMesh.position.set(0, 2.0, 3.5);
cutawayWallMesh.castShadow = true;
cutawayWallMesh.receiveShadow = true;
scene.add(cutawayWallMesh);

// ---------------------------------------------------------------------------
// 4. Creature Avatar Mesh Setup
// ---------------------------------------------------------------------------

const avatarGroup = new THREE.Group();

// Main body mesh
const bodyGeo = new THREE.SphereGeometry(0.35, 32, 24);
const bodyMat = new THREE.MeshPhysicalMaterial({
  color: currentForm.color,
  roughness: 0.2,
  metalness: 0.1,
  clearcoat: 0.6,
  transmission: 0.4,
});
const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
bodyMesh.castShadow = true;
avatarGroup.add(bodyMesh);

// Inner core
const coreGeo = new THREE.OctahedronGeometry(0.12, 0);
const coreMat = new THREE.MeshStandardMaterial({
  color: currentForm.glowColor,
  emissive: currentForm.color,
  emissiveIntensity: 0.6,
});
const coreMesh = new THREE.Mesh(coreGeo, coreMat);
avatarGroup.add(coreMesh);

// Eyes
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
// 5. Physics Simulator & Courses
// ---------------------------------------------------------------------------

let activeCourse: 1 | 2 | 3 | 4 = 1;
const flatWorld = new FlatHeightfieldWithTrench(0, 0, 0);
const trenchWorld = new FlatHeightfieldWithTrench(0.4, 0.3, -10);

let currentWorld: FlatHeightfieldWithTrench = flatWorld;
let ceilingLimit: number | undefined = undefined;

// Simulator instance
const simulator = new RigidProxySimulator(
  {
    radius: currentForm.radius,
    mass: currentForm.mass,
    restitution: currentForm.restitution,
    friction: currentForm.friction,
    gravity: -20 * currentForm.gravityScale,
    maxStepHeight: 0.35,
  },
  { x: 0, y: 4.0, z: 0 }
);

function applyForm(formKey: FormKey) {
  currentForm = FORMS[formKey];

  // Update simulator properties
  simulator.config.radius = currentForm.radius;
  simulator.config.mass = currentForm.mass;
  simulator.config.restitution = currentForm.restitution;
  simulator.config.friction = currentForm.friction;
  simulator.config.gravity = -20 * currentForm.gravityScale;

  // Dewdrop Ballast special handling
  const ballastRow = document.getElementById('ballast-control');
  if (ballastRow) {
    ballastRow.style.display = formKey === 'dewdrop' ? 'flex' : 'none';
  }
  if (formKey === 'dewdrop' && dewdropFullBallast) {
    simulator.config.mass = 2.0;
    simulator.config.restitution = 0.0; // Flat splat!
  }

  // Update Visuals
  bodyMat.color.setHex(currentForm.color);
  coreMat.color.setHex(currentForm.glowColor);
  coreMat.emissive.setHex(currentForm.color);

  // Geometry switch for stone vs slime/wisp
  if (currentForm.family === 'Stone') {
    bodyGeo.dispose();
    bodyMesh.geometry = new THREE.DodecahedronGeometry(currentForm.radius, 1);
    bodyMat.roughness = 0.85;
    bodyMat.metalness = 0.2;
    bodyMat.transmission = 0.0;
    coreMesh.visible = false;
  } else if (currentForm.family === 'Wisp') {
    bodyGeo.dispose();
    bodyMesh.geometry = new THREE.SphereGeometry(currentForm.radius, 24, 16);
    bodyMat.roughness = 0.1;
    bodyMat.metalness = 0.0;
    bodyMat.transmission = 0.7;
    coreMesh.visible = true;
  } else {
    bodyGeo.dispose();
    bodyMesh.geometry = new THREE.SphereGeometry(currentForm.radius, 32, 24);
    bodyMat.roughness = 0.2;
    bodyMat.metalness = 0.05;
    bodyMat.transmission = 0.45;
    coreMesh.visible = true;
  }

  // Active button highlight
  document.querySelectorAll('.btn-form').forEach((btn) => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`btn-form-${formKey.replace('_', '-')}`);
  if (activeBtn) activeBtn.classList.add('active');

  // Update Telemetry Header
  document.getElementById('telemetry-form-title')!.textContent = `${currentForm.name} (${currentForm.family})`;
  updateTelemetryDisplay();
}

function switchCourse(course: 1 | 2 | 3 | 4) {
  activeCourse = course;

  document.querySelectorAll('.btn-course').forEach((btn) => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`btn-course-${course}`);
  if (activeBtn) activeBtn.classList.add('active');

  if (course === 1) {
    currentWorld = flatWorld;
    ceilingLimit = undefined;
    simulator.reset({ x: 0, y: 4.0, z: 0 });
  } else if (course === 2) {
    currentWorld = flatWorld;
    ceilingLimit = 0.5;
    simulator.reset({ x: 10, y: 0.25, z: 2.2 });
  } else if (course === 3) {
    currentWorld = trenchWorld;
    ceilingLimit = undefined;
    simulator.reset({ x: -10, y: 1.0, z: 2.0 });
  } else if (course === 4) {
    currentWorld = flatWorld;
    ceilingLimit = undefined;
    simulator.reset({ x: 0, y: 2.5, z: -10 });
  }
}

// ---------------------------------------------------------------------------
// 6. User Input & Controls Handling
// ---------------------------------------------------------------------------

const keysDown = new Set<string>();
let coyoteTime = 0;
let jumpBuffer = 0;

// Focus window on click to guarantee keyboard capture
window.addEventListener('click', () => {
  window.focus();
});

window.addEventListener('keydown', (e) => {
  keysDown.add(e.code);

  // Direct Number Key Selection for 9 Forms (1-9)
  if (e.code === 'Digit1') applyForm('oobleck');
  if (e.code === 'Digit2') applyForm('dewdrop');
  if (e.code === 'Digit3') applyForm('aether_bubble');
  if (e.code === 'Digit4') applyForm('mist');
  if (e.code === 'Digit5') applyForm('zephyr');
  if (e.code === 'Digit6') applyForm('lantern');
  if (e.code === 'Digit7') applyForm('aerolite');
  if (e.code === 'Digit8') applyForm('geode');
  if (e.code === 'Digit9') applyForm('obsidian');

  // Space for Jump (registers in jumpBuffer)
  if (e.code === 'Space') {
    e.preventDefault();
    jumpBuffer = 0.12; // 120ms jump buffer
  }

  // Dewdrop ballast toggle
  if (e.code === 'KeyB' && currentForm.id === 'dewdrop') {
    toggleDewdropBallast();
  }

  // Reset / Drop
  if (e.code === 'KeyR') {
    switchCourse(activeCourse);
  }

  // Cutaway Toggle
  if (e.code === 'KeyT') {
    cutawayWallMesh.visible = !cutawayWallMesh.visible;
    document.getElementById('btn-toggle-wall')?.classList.toggle('active', cutawayWallMesh.visible);
  }

  // Camera 90-degree snap
  if (e.code === 'KeyQ') {
    camYaw += (e.shiftKey ? -1 : 1) * (Math.PI / 4);
  }
});

window.addEventListener('keyup', (e) => {
  keysDown.delete(e.code);
});

function toggleDewdropBallast() {
  dewdropFullBallast = !dewdropFullBallast;
  const btn = document.getElementById('btn-toggle-ballast');
  if (btn) {
    if (dewdropFullBallast) {
      btn.textContent = 'Ballast: FULL (e=0.0, Splats Flat!)';
      btn.classList.add('full');
      simulator.config.mass = 2.0;
      simulator.config.restitution = 0.0;
    } else {
      btn.textContent = 'Ballast: Dry (e=0.60, Bouncy)';
      btn.classList.remove('full');
      simulator.config.mass = 1.2;
      simulator.config.restitution = 0.6;
    }
  }
  updateTelemetryDisplay();
}

// UI Form Buttons
document.querySelectorAll('.btn-form').forEach((btn) => {
  btn.addEventListener('click', () => {
    const formKey = btn.getAttribute('data-form') as FormKey;
    if (formKey) applyForm(formKey);
  });
});

document.getElementById('btn-toggle-ballast')?.addEventListener('click', toggleDewdropBallast);

// UI Course Buttons
document.getElementById('btn-course-1')?.addEventListener('click', () => switchCourse(1));
document.getElementById('btn-course-2')?.addEventListener('click', () => switchCourse(2));
document.getElementById('btn-course-3')?.addEventListener('click', () => switchCourse(3));
document.getElementById('btn-course-4')?.addEventListener('click', () => switchCourse(4));
document.getElementById('btn-toggle-wall')?.addEventListener('click', () => {
  cutawayWallMesh.visible = !cutawayWallMesh.visible;
  document.getElementById('btn-toggle-wall')?.classList.toggle('active', cutawayWallMesh.visible);
});

// Camera Drag Controls
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
// 7. Telemetry Display Updates
// ---------------------------------------------------------------------------

const elMassDensity = document.getElementById('val-mass-density')!;
const elRestitution = document.getElementById('val-restitution')!;
const elGravity = document.getElementById('val-gravity')!;
const elStepTime = document.getElementById('val-step-time')!;
const elVy = document.getElementById('val-vy')!;
const elBounces = document.getElementById('val-bounces')!;
const elContacts = document.getElementById('val-contacts')!;

function updateTelemetryDisplay() {
  const massVal = currentForm.id === 'dewdrop' && dewdropFullBallast ? '2.0 kg' : `${currentForm.mass.toFixed(1)} kg`;
  const restVal = currentForm.id === 'dewdrop' && dewdropFullBallast ? '0.00 (Splat)' : currentForm.restitution.toFixed(2);
  elMassDensity.textContent = `${massVal} / ${currentForm.density.toFixed(2)}`;
  elRestitution.textContent = restVal;
  elGravity.textContent = `${currentForm.gravityScale.toFixed(2)}g (${(-20 * currentForm.gravityScale).toFixed(1)} m/s²)`;
}

// ---------------------------------------------------------------------------
// 8. Main Loop & Fixed Time-Step Integration
// ---------------------------------------------------------------------------

let lastTime = performance.now();
const FIXED_DT = 1 / 60;
let accumulator = 0;
let stepDurationMs = 0;

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

  // Coyote time & Jump buffer timers
  if (simulator.isGrounded) {
    coyoteTime = 0.1; // 100ms coyote time
  } else {
    coyoteTime = Math.max(0, coyoteTime - delta);
  }

  jumpBuffer = Math.max(0, jumpBuffer - delta);

  // Jump Execution: if jump was buffered and creature can jump
  if (jumpBuffer > 0 && (simulator.isGrounded || coyoteTime > 0)) {
    simulator.applyJumpImpulse(currentForm.jumpImpulse, true);
    jumpBuffer = 0;
    coyoteTime = 0;
  }

  // Read movement inputs relative to camera yaw
  let inputX = 0;
  let inputZ = 0;
  if (keysDown.has('KeyW') || keysDown.has('ArrowUp')) inputZ -= 1;
  if (keysDown.has('KeyS') || keysDown.has('ArrowDown')) inputZ += 1;
  if (keysDown.has('KeyA') || keysDown.has('ArrowLeft')) inputX -= 1;
  if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) inputX += 1;

  // Camera-relative input transformation
  const forwardX = Math.sin(camYaw);
  const forwardZ = Math.cos(camYaw);
  const rightX = Math.cos(camYaw);
  const rightZ = -Math.sin(camYaw);

  const moveDirX = inputX * rightX - inputZ * forwardX;
  const moveDirZ = inputX * rightZ - inputZ * forwardZ;

  // Fixed physics time-stepping
  while (accumulator >= FIXED_DT) {
    const t0 = performance.now();

    // In Water Basin: apply buoyant force based on relative density
    const inWater = activeCourse === 4 && Math.abs(simulator.pos.x) < 4 && Math.abs(simulator.pos.z + 10) < 4 && simulator.pos.y < 0.2;
    if (inWater) {
      const submerged = THREE.MathUtils.clamp((0.2 - (simulator.pos.y - currentForm.radius)) / (2 * currentForm.radius), 0, 1);
      const buoyancyAccel = (-simulator.config.gravity / currentForm.density) * submerged;
      simulator.vel.y += buoyancyAccel * FIXED_DT;
      // Hydrodynamic damping
      simulator.vel.x *= Math.max(0, 1 - 2.5 * FIXED_DT);
      simulator.vel.y *= Math.max(0, 1 - 2.5 * FIXED_DT);
      simulator.vel.z *= Math.max(0, 1 - 2.5 * FIXED_DT);
    }

    // Step physics simulator
    simulator.step(FIXED_DT, currentWorld, ceilingLimit);

    // Apply horizontal input drive
    if (moveDirX !== 0 || moveDirZ !== 0) {
      simulator.vel.x = moveDirX * currentForm.moveSpeed;
      simulator.vel.z = moveDirZ * currentForm.moveSpeed;
    }

    stepDurationMs = performance.now() - t0;
    accumulator -= FIXED_DT;
  }

  // Synchronize 3D avatar position with simulator
  avatarGroup.position.set(simulator.pos.x, simulator.pos.y, simulator.pos.z);

  // Dynamic visual squash & stretch based on velocity and ballast
  const vy = simulator.vel.y;
  let squashY = 1.0;
  let squashXZ = 1.0;

  if (currentForm.id === 'dewdrop' && dewdropFullBallast && simulator.isGrounded) {
    // Dewdrop flat splat deformation
    squashY = 0.35;
    squashXZ = 1.6;
  } else if (currentForm.family === 'Slime') {
    // Normal elastic slime squash
    squashY = THREE.MathUtils.clamp(1.0 + vy * 0.045, 0.65, 1.45);
    squashXZ = 1.0 / Math.sqrt(squashY);
  } else if (currentForm.family === 'Stone') {
    // Stone rolling rotation
    const hSpeed = Math.hypot(simulator.vel.x, simulator.vel.z);
    if (hSpeed > 0.05 && simulator.isGrounded) {
      bodyMesh.rotation.x += (simulator.vel.z / currentForm.radius) * delta;
      bodyMesh.rotation.z -= (simulator.vel.x / currentForm.radius) * delta;
    }
  }

  bodyMesh.scale.set(squashXZ, squashY, squashXZ);

  // Core idle rotation
  coreMesh.rotation.x += 0.02;
  coreMesh.rotation.y += 0.03;

  // Face rotation toward movement direction
  if (moveDirX !== 0 || moveDirZ !== 0) {
    const targetAngle = Math.atan2(moveDirX, moveDirZ);
    avatarGroup.rotation.y = THREE.MathUtils.lerp(avatarGroup.rotation.y, targetAngle, 0.15);
  }

  // Update cutaway shader uniform with avatar position
  cutawayUniforms.avatarPosition.value.copy(avatarGroup.position);

  // Update smooth camera follow
  updateCameraPosition(avatarGroup.position);

  // Render scene
  renderer.render(scene, camera);

  // Real-time telemetry updates
  elStepTime.textContent = `${stepDurationMs.toFixed(3)} ms`;
  elVy.textContent = `${vy.toFixed(2)} m/s`;
  elBounces.textContent = simulator.bounceCount.toString();
  elContacts.textContent = simulator.isGrounded ? '1 (Grounded)' : '0 (Air)';
}

requestAnimationFrame(animate);
