/**
 * src/app/game.js <- main app - ported verbatim from Aetheria Slime Lab.html (Stage C).
 * THE PROTOTYPE IS SOURCE OF TRUTH FOR EVERY NUMBER. Do not change behaviour.
 * Rendering, input, HUD, harvesting, UI. Wrapped in initGame(); no behaviour change.
 */

import * as THREE from 'three';
import { createScene } from '../render/scene.js';
import { buildGroundChunks, createGroundMaterial } from '../render/ground.js';
import { buildFlora } from '../render/flora.js';
import { createBodyMesh, createWispMesh, updateOutlineForQuality } from '../render/creature.js';
import { createPanel } from '../ui/panel.js';
import Phys from '../gameplay/physics.js';
import Terrain from '../gameplay/terrain.js';
import Env from '../gameplay/env.js';
import Wisp from '../gameplay/wisp.js';
import Profile from '../gameplay/profile.js';
import Craft from '../gameplay/craft.js';
import Build from '../gameplay/build.js';
import createCraftPanel from '../ui/craft-panel.js';
import { createBuildPanel } from '../ui/build-panel.js';
import { createCustomizePanel } from '../ui/customize.js';
import { createInput } from './input.js';
import { createTouchControls } from '../ui/touch.js';
import { startLoop } from './loop.js';
import { createGovernor } from './quality.js';
import { saveGame, flushGame, loadGame, registerAutoFlush } from './save.js';
import { loadManifest, getModelUrl, hasModel } from './assets.js';


// Optional GLTF loader: the prototype used an optional CDN GLTFLoader and every
// cosmetic keeps a procedural-primitive fallback (see tryGLB guard below).
// We intentionally do NOT import it here; R1 wires manifest ids per ASSETS.md.

export async function initGame() {
const $ = id => document.getElementById(id);
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
const FIXED = 1 / 60;

// Quality governor must exist before the quality select wiring below;
// it only needs `coarse`. (Moved up from the R1-014/015/016 wiring block.)
const governor = createGovernor(coarse ? 'light' : 'full');
let quality = governor.quality === 'full' ? 3 : 2;

/* ================= profile ================= */
let profile = Profile.load();
let saveTimer = 0;
function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(() => Profile.save(profile), 400); }
let formKind = profile.form;
const P = Object.assign({ gscale: 1, jboost: 1, gripMul: 1, speedMul: 1, spring: false }, profile.body);
const PRESETS = {
  blob:  { label: 'Blob',       shape: 'sphere', stiff: 0.22, pressure: 1.0, skin: 0.9,  grip: 0.55, sticky: 0.5 },
  goo:   { label: 'Goo',        shape: 'sphere', stiff: 0.10, pressure: 1.0, skin: 0.45, grip: 0.8,  sticky: 0.8 },
  ball:  { label: 'Jelly ball', shape: 'sphere', stiff: 0.40, pressure: 1.0, skin: 0.9,  grip: 0.5,  sticky: 0.3 },
  cube:  { label: 'Jelly cube', shape: 'cube',   stiff: 0.45, pressure: 1.0, skin: 0.9,  grip: 0.5,  sticky: 0.5 }
};
PRESETS.cube.sticky = 0.3;
const sizeJump = () => Math.pow(1 / profile.look.size, 0.3), sizeSpeed = () => Math.pow(profile.look.size, -0.2);

/* ================= three.js ================= */
const S = createScene(coarse, $('c'));
const renderer = S.renderer;
const scene = S.scene;
const cam = S.cam;
const view = S.view;
const pxPerM = S.pxPerM;
const resize = S.resize;
const applySceneTime = S.applyTime;
const pointMats = S.pointMats;
const updatePointSizes = S.updatePointSizes;
const sun = S.sun;
const hemi = S.hemi;
const checker = S.checker;
const softTex = S.softTex;
const SKY_DAY = S.SKY_DAY;
const SKY_DUSK = S.SKY_DUSK;
const SKY_NIGHT = S.SKY_NIGHT;
const SUN_C = S.SUN_C;
const MOON_C = S.MOON_C;
const sunOff = S.sunOffVec;
const _hutLightInit = S.hutLightRef;

let hutLight = null;

// Re-export applyTime for game.js usage (adds time display)
const applyTime = (t) => {
  S.applyTime(t);
  const hh = Math.floor(t), mm = Math.floor((t - hh) * 60);
  $('timeOut').textContent = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
};
// NOTE: time + weather input listeners live in ui/panel.js (R1-012).

/* ================= panel: form, body, sliders ================= */
// R1-012: built by ui/panel.js AFTER applyTime exists (panel stores it for
// event handlers). Getters keep form/quality/env live; game.js keeps owning
// the bindings (spawnForm etc. assign them).
const sliderEls = {};
const panel = createPanel({
  $, profile, P, PRESETS, Phys, coarse, saveSoon, switchForm, spawnForm,
  sliderEls,
  governor, setQuality: (v) => { quality = v; },
  get formKind() { return formKind; },
  get env() { return env; },
  applyTime,
});
const { syncFormButtons, syncSliders, choosePreset } = panel;

/* ================= world ================= */
let world = null, worldGroup = null, env = null;
let hutParts = [], shaking = [];
const dummy = new THREE.Object3D(), tmpC = new THREE.Color(), tmpC2 = new THREE.Color();
function mkInst(geo, mat, count) { const m = new THREE.InstancedMesh(geo, mat, Math.max(1, count)); m.castShadow = true; m.frustumCulled = false; worldGroup.add(m); return m; }
function setI(mesh, i, x, y, z, sx, sy, sz, color, ry) {
  dummy.position.set(x, y, z); dummy.rotation.set(0, ry || 0, 0); dummy.scale.set(sx, sy, sz); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
  if (color !== undefined) mesh.setColorAt(i, tmpC.setHex(color));
}
function flush(mesh) { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; }

function buildGround() {
  const A = world.A, cs = world.cs, N = world.N, W = N + 1, hg = world.hg;
  const pos = new Float32Array(W * W * 3), uv = new Float32Array(W * W * 2), col = new Float32Array(W * W * 3);
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) { const k = j * W + i, x = -A + i * cs, z = -A + j * cs; pos[3*k] = x; pos[3*k+1] = hg[k]; pos[3*k+2] = z; uv[2*k] = x / 2; uv[2*k+1] = z / 2; }
  const idx = new Uint32Array(N * N * 6); let q = 0;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * W + i, b = a + 1, c = a + W, d = c + 1; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals();
  const nrm = g.attributes.normal;
  for (let k = 0; k < W * W; k++) {
    const ny = nrm.getY(k), x = pos[3*k], z = pos[3*k+2], h = pos[3*k+1];
    if (world.colorAt) { const c = world.colorAt(x, z, h, ny); col[3*k] = c[0]; col[3*k+1] = c[1]; col[3*k+2] = c[2]; }
    else { const t = Math.min(1, Math.max(0, (0.94 - ny) / 0.2)), lift = 0.04 * h; for (let m = 0; m < 3; m++) col[3*k + m] = Math.min(1, world.ground[m] * (1 - t) + world.dirt[m] * t + lift); }
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }); if (world.checker) mat.map = checker;
  const mesh = new THREE.Mesh(g, mat); mesh.receiveShadow = true; worldGroup.add(mesh);
}
function buildProps() {
  const m4 = new THREE.Matrix4();
  world.boxes.forEach(b => {
    const o = { color: b.color, roughness: 0.8 };
    if (b.tag === 'wall' || b.tag === 'roof') o.transparent = true;
    if (b.tag === 'fireplace') { o.emissive = 0xff6a20; o.emissiveIntensity = 0.6; }
    const mat = new THREE.MeshStandardMaterial(o);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.h[0]*2, b.h[1]*2, b.h[2]*2), mat);
    mesh.position.set(b.c[0], b.c[1], b.c[2]); const R = b.R; m4.set(R[0], R[1], R[2], 0, R[3], R[4], R[5], 0, R[6], R[7], R[8], 0, 0, 0, 0, 1);
    mesh.quaternion.setFromRotationMatrix(m4); mesh.castShadow = true; mesh.receiveShadow = true; worldGroup.add(mesh);
    if (b.tag === 'wall') hutParts.push({ mat, kind: 'wall', n: b.n });
    if (b.tag === 'roof') hutParts.push({ mat, kind: 'roof', n: [0, 0] });
    if (b.tag === 'fireplace') { hutLight = new THREE.PointLight(0xffa24a, 1, 11, 1.6); hutLight.position.set(b.c[0] - 0.9, b.c[1] + 0.5, b.c[2]); worldGroup.add(hutLight); }
  });
  (world.visualOnly || []).forEach(b => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.h[0]*2, b.h[1]*2, b.h[2]*2), new THREE.MeshStandardMaterial({ color: b.color, roughness: 1 }));
    mesh.position.set(b.c[0], b.c[1], b.c[2]); mesh.receiveShadow = true; worldGroup.add(mesh);
  });
  world.spheres.forEach(s => {
    if (s.tag === 'geode' || s.tag === 'clay' || s.tag === 'rock' || s.tag === 'cap') return;
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(s.r, 32, 20), new THREE.MeshStandardMaterial({ color: s.color, roughness: 0.9 }));
    mesh.position.set(s.c[0], s.c[1], s.c[2]); mesh.castShadow = true; mesh.receiveShadow = true; worldGroup.add(mesh);
  });
}
let groundChunks = null;
let groundCulling = null;

async function loadTerrain(id) {
  if (worldGroup) { scene.remove(worldGroup); worldGroup.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  if (groundChunks) {
    for (const mesh of groundChunks) {
      scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material && !mesh.material.isShared) mesh.material.dispose();
    }
    groundChunks = null;
    groundCulling = null;
  }
  clearItems(); shaking = []; hutParts = []; hutLight = null;
  world = Terrain.build(id); worldGroup = new THREE.Group();
  
  // Chunked ground
  const groundMat = createGroundMaterial(world, checker);
  const groundResult = buildGroundChunks(scene, world, groundMat);
  groundChunks = groundResult.chunks;
  groundCulling = groundResult.updateCulling;
  groundMat.isShared = true; // prevent disposal per-chunk
  
  buildProps(); 
  await buildFlora(scene, world);
  scene.add(worldGroup);
  env = Env.create(world, 5); env.override = $('weather').value || 'auto';
  if (typeof initBuildState === 'function' && craftReady) initBuildState();
  applyTime(parseFloat($('time').value));
}

/* ================= items, audio, hearts, ring ================= */
const ITEM = {
  timber: { label: 'Timber', geo: () => new THREE.BoxGeometry(0.5, 0.18, 0.18), color: 0x9a6a3a, emi: 0x1a0d00 },
  sap: { label: 'Sap', geo: () => new THREE.SphereGeometry(0.14, 10, 8), color: 0xffb43a, emi: 0x6a3d00 },
  fiber: { label: 'Fibre', geo: () => new THREE.CylinderGeometry(0.05, 0.05, 0.45, 6), color: 0x8fd16a, emi: 0x1d3a0e },
  starstone: { label: 'Starstone', geo: () => new THREE.OctahedronGeometry(0.2), color: 0xb48cff, emi: 0x4b2a9a },
  clay: { label: 'Clay', geo: () => new THREE.SphereGeometry(0.16, 10, 8), color: 0x8aa0b4, emi: 0x000000 },
  petal: { label: 'Petals', geo: () => new THREE.SphereGeometry(0.1, 8, 6), color: 0xff8fb8, emi: 0x6a1f3a },
  spore: { label: 'Spores', geo: () => new THREE.SphereGeometry(0.1, 8, 6), color: 0x7ff5dd, emi: 0x1f8a74 }
};
const inv = {}; Object.keys(Craft.ITEMS).forEach(k => inv[k] = 0);
Object.values(ITEM).forEach(d => { d.g = d.geo(); d.m = new THREE.MeshStandardMaterial({ color: d.color, emissive: d.emi, emissiveIntensity: 1, roughness: 0.5 }); });
let craftReady = false;
const invList = $('invList');
function renderInv() {
  invList.innerHTML = '';
  Object.keys(Craft.ITEMS).forEach(k => {
    const raw = Craft.RES.indexOf(k) >= 0; if (!raw && !inv[k]) return;
    const li = document.createElement('li'), a = document.createElement('span'), b = document.createElement('span');
    a.textContent = Craft.ITEMS[k]; b.textContent = raw ? inv[k] + '/' + Craft.stackCap(formKind) : String(inv[k]); li.append(a, b); invList.appendChild(li);
  });
  if (craftReady) renderCraft();
}
const items = [];
function spawnItem(type, x, y, z, fly) {
  if (items.length > 80) { const o = items.shift(); scene.remove(o.mesh); }
  const d = ITEM[type], mesh = new THREE.Mesh(d.g, d.m); mesh.position.set(x, y, z); mesh.castShadow = true; scene.add(mesh);
  const a = Math.random() * Math.PI * 2, sp = 1.2 + Math.random() * 1.6;
  items.push({ type, mesh, x, y, z, vx: Math.cos(a) * sp, vy: 3.5 + Math.random() * 2, vz: Math.sin(a) * sp, age: fly ? 1 : 0, fly: !!fly, bob: Math.random() * 6 });
}
function clearItems() { items.forEach(o => scene.remove(o.mesh)); items.length = 0; }
function updateItems(dt) {
  const c = com();
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i]; it.age += dt;
    if (!it.fly) {
      it.vy -= 14 * dt; it.x += it.vx * dt; it.y += it.vy * dt; it.z += it.vz * dt;
      const gh = Phys.groundHeight(world, it.x, it.z) + 0.25;
      if (it.y < gh) { it.y = gh; it.vy = -it.vy * 0.35; it.vx *= 0.7; it.vz *= 0.7; if (Math.abs(it.vy) < 1) it.vy = 0; }
    }
    const dx = c[0] - it.x, dy = c[1] - it.y, dz = c[2] - it.z, d = Math.sqrt(dx*dx + dy*dy + dz*dz);
    if (it.age > 0.7 && d < 4.5) { it.fly = true; const sp = (3 + (4.5 - d) * 5) * dt, k = Math.min(1, sp / (d + 1e-6)); it.x += dx * k; it.y += dy * k; it.z += dz * k; }
    if (d < 0.85 && it.age > 0.5 && inv[it.type] < Craft.stackCap(formKind)) { inv[it.type]++; scene.remove(it.mesh); items.splice(i, 1); renderInv(); chime([880], 0.05); emoTrigger('happy', 0.6); corePulse = 1; saveSave(); continue; }
    if (it.age > 70) { scene.remove(it.mesh); items.splice(i, 1); continue; }
    it.mesh.rotation.y += dt * 2.2; it.mesh.position.set(it.x, it.y + (it.fly ? 0 : Math.sin(it.age * 4 + it.bob) * 0.05), it.z);
  }
}
let ac = null;
function chime(freqs, vol) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    if (!ac) ac = new AC(); if (ac.state === 'suspended') ac.resume();
    freqs.forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime + i * 0.09; o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.06, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5); o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + 0.55); });
  } catch (e) { /* audio is optional */ }
}
const heartTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.font = '52px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ff6fa5'; g.fillText('\u2665', 32, 36); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; })();
const hearts = []; for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTex, transparent: true, depthTest: false, opacity: 0 })); s.visible = false; scene.add(s); hearts.push({ s, t: 9, x: 0, y: 0, z: 0 }); }
function popHearts(x, y, z) { hearts.forEach((h, i) => { h.t = -i * 0.06; h.x = x + (Math.random() - 0.5) * 1.4; h.y = y + 0.8; h.z = z + (Math.random() - 0.5) * 1.4; }); }
function updateHearts(dt) { hearts.forEach(h => { h.t += dt; if (h.t < 0 || h.t > 1.4) { h.s.visible = false; return; } h.s.visible = true; h.s.position.set(h.x, h.y + h.t * 1.8, h.z); const k = 0.55 + 0.45 * Math.min(1, h.t * 4); h.s.scale.set(k, k, k); h.s.material.opacity = 1 - sm(0.6, 1.4, h.t); }); }
const ring = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring); let ringT = 9;
function ringAt(x, z) { ringT = 0; ring.position.set(x, Phys.groundHeight(world, x, z) + 0.1, z); ring.visible = true; }

/* ================= creature: slime / stone body or wisp cloud ================= */
const topC = new THREE.Color(), botC = new THREE.Color(), eyeC = new THREE.Color(), avgC = new THREE.Color();
function syncLookColors() {
  topC.set(profile.look.top); botC.set(profile.look.bottom); eyeC.set(profile.look.eyeColor);
  avgC.copy(topC).lerp(botC, 0.5);
  slimeMat.opacity = profile.look.translucency; slimeMat.clearcoat = profile.look.gloss; slimeMat.roughness = 0.4 - 0.28 * profile.look.gloss;
  userEmis.copy(avgC).multiplyScalar(0.22); pupilMat.color.copy(eyeC); mouthMat.color.copy(eyeC);
  wingMat.color.copy(avgC);
}
const slimeMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, emissive: 0x13311b, emissiveIntensity: 0.55, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.08, transparent: true, opacity: 0.86 });
const stoneMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.75, flatShading: true });
const userEmis = new THREE.Color(0x13311b);
const wispMat = new THREE.PointsMaterial({ size: 20, sizeAttenuation: false, map: softTex, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
pointMats.push([wispMat, 0.6]);
const wispLight = new THREE.PointLight(0xaaffee, 0.8, 8, 1.5); wispLight.visible = false; scene.add(wispLight);
let body = null, wisp = null, mesh = null, geo = null, posAttr = null, colAttr = null, wispPts = null, wispGeo = null, wispPos = null, wispCol = null;
const facing = { x: 0, z: 1 }, tgt = { x: 0, y: 1, z: 0 };
const COM0 = [0, 0, 0];
function com() { return wisp ? wisp.com : (body ? body.com : COM0); }
function vcom() { return wisp ? wisp.vcom : (body ? body.vcom : COM0); }
function events() { return wisp ? wisp.events : body.events; }

function disposeCreature() {
  if (mesh) { scene.remove(mesh); geo.dispose(); mesh = null; }
  if (wispPts) { scene.remove(wispPts); wispGeo.dispose(); wispPts = null; }
  body = null; wisp = null; wispLight.visible = false;
}
function noise3(x, y, z) { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); }
function spawnForm(kind, pos, keepPos) {
  let at = pos;
  if (!at) { at = (keepPos && (body || wisp)) ? [com()[0], com()[1] + 0.3, com()[2]] : world.spawn; }
  disposeCreature(); formKind = kind; profile.form = kind; syncFormButtons();
  const size = profile.look.size;
  if (kind === 'wisp') {
    wisp = Wisp.make(at[0], at[1], at[2], quality >= 3 ? 96 : 48, size);
    wispGeo = new THREE.BufferGeometry(); wispPos = new Float32Array(wisp.n * 3); wispCol = new Float32Array(wisp.n * 3);
    wispGeo.setAttribute('position', new THREE.BufferAttribute(wispPos, 3)); wispGeo.setAttribute('color', new THREE.BufferAttribute(wispCol, 3));
    wispPts = new THREE.Points(wispGeo, wispMat); wispPts.frustumCulled = false; scene.add(wispPts); wispLight.visible = true;
  } else {
    const shape = kind === 'slime' ? PRESETS[profile.body.preset].shape : 'sphere';
    body = Phys.makeSlime(shape, at[0], at[1], at[2], kind === 'stone' ? 2 : quality, size);
    geo = new THREE.BufferGeometry();
    posAttr = new THREE.BufferAttribute(new Float32Array(body.n * 3), 3); posAttr.setUsage(THREE.DynamicDrawUsage);
    colAttr = new THREE.BufferAttribute(new Float32Array(body.n * 3), 3); colAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', posAttr); geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(body.n * 3), 3)); geo.setAttribute('color', colAttr);
    geo.setIndex(new THREE.BufferAttribute(body.idx, 1));
    mesh = new THREE.Mesh(geo, kind === 'stone' ? stoneMat : slimeMat); mesh.castShadow = true; mesh.frustumCulled = false; scene.add(mesh);
    if (kind === 'stone') { // fixed patterned colours so rolling is visible
      for (let i = 0; i < body.n; i++) {
        const qy = body.q[3*i+1] / (0.6 * size), k = noise3(Math.round(body.q[3*i] * 5), Math.round(qy * 5), Math.round(body.q[3*i+2] * 5)), g = 0.78 + 0.3 * k;
        tmpC.copy(botC).lerp(topC, 0.5 + 0.5 * qy); colAttr.array[3*i] = tmpC.r * g; colAttr.array[3*i+1] = tmpC.g * g; colAttr.array[3*i+2] = tmpC.b * g;
      }
      colAttr.needsUpdate = true;
    }
  }
  meltOn = false; springOn = false; P.spring = false; modeSel = 0; syncActionButtons(); updateActionLabels();
  tgt.x = at[0]; tgt.y = at[1]; tgt.z = at[2];
  eyes.forEach(E => E.e.position.set(at[0], at[1], at[2])); buildCosmetics(); if (!coreObj) buildCore(); saveSoon(); renderInv();
}
let formCd = 0;
function switchForm(kind) {
  if (kind === formKind || formCd > 0) return;
  const c = com(), at = [c[0], c[1] + 0.2, c[2]];
  ringAt(c[0], c[2]); chime([523, 784], 0.05); spawnForm(kind, at); formCd = 1.5;
}
function writeBodyMesh() {
  const a = posAttr.array, x = body.x, n = body.n;
  let minY = 1e9, maxY = -1e9;
  for (let i = 0; i < n; i++) { const y = x[3*i+1]; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  for (let i = 0; i < 3 * n; i++) a[i] = x[i];
  posAttr.needsUpdate = true; geo.computeVertexNormals();
  if (formKind === 'slime') {
    const H = Math.max(0.05, maxY - minY), ca = colAttr.array;
    for (let i = 0; i < n; i++) { const hn = (x[3*i+1] - minY) / H; ca[3*i] = lerp(botC.r, topC.r, hn); ca[3*i+1] = lerp(botC.g, topC.g, hn); ca[3*i+2] = lerp(botC.b, topC.b, hn); }
    colAttr.needsUpdate = true;
  }
}
function writeWisp() {
  const x = wisp.x, n = wisp.n; let minY = 1e9, maxY = -1e9;
  for (let i = 0; i < n; i++) { const y = x[3*i+1]; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  const H = Math.max(0.2, maxY - minY);
  for (let i = 0; i < n; i++) {
    wispPos[3*i] = x[3*i]; wispPos[3*i+1] = x[3*i+1]; wispPos[3*i+2] = x[3*i+2];
    const hn = (x[3*i+1] - minY) / H; wispCol[3*i] = lerp(botC.r, topC.r, hn); wispCol[3*i+1] = lerp(botC.g, topC.g, hn); wispCol[3*i+2] = lerp(botC.b, topC.b, hn);
  }
  wispGeo.attributes.position.needsUpdate = true; wispGeo.attributes.color.needsUpdate = true;
  wispLight.position.set(wisp.com[0], wisp.com[1], wisp.com[2]); wispLight.color.copy(avgC);
  wispMat.opacity = Math.min(1, 0.9 + 0.1 * wisp.wet); wispLight.intensity = 0.8 + 0.6 * wisp.wet;
}
const _sp = new THREE.Vector3();
// point on the creature's surface in direction (dx,dy,dz) from its centre
function surfacePoint(dx, dy, dz, out) {
  const c = com();
  if (wisp) { const s = 0.2 * profile.look.size; out.set(c[0] + dx * s, c[1] + dy * s, c[2] + dz * s); return out; }
  const x = body.x, n = body.n; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
  let best = -2, bi = 0;
  for (let i = 0; i < n; i++) {
    const rx = x[3*i] - c[0], ry = x[3*i+1] - c[1], rz = x[3*i+2] - c[2], d = (rx * dx + ry * dy + rz * dz) / (Math.sqrt(rx*rx + ry*ry + rz*rz) + 1e-6);
    if (d > best) { best = d; bi = i; }
  }
  const rx = x[3*bi] - c[0], ry = x[3*bi+1] - c[1], rz = x[3*bi+2] - c[2], rl = Math.sqrt(rx*rx + ry*ry + rz*rz) + 1e-6;
  out.set(c[0] + rx * (1 + 0.04 / rl), c[1] + ry * (1 + 0.04 / rl), c[2] + rz * (1 + 0.04 / rl)); return out;
}

/* ================= face: eyes, mouth, emotions ================= */
const pupilMat = new THREE.MeshBasicMaterial({ color: 0x16301f }), eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
const catchMat = new THREE.MeshBasicMaterial({ color: 0xffffff }), mouthMat = new THREE.MeshBasicMaterial({ color: 0x16301f });
const eyes = [0, 1].map(() => {
  const e = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 12), eyeWhiteMat), p = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 10), pupilMat);
  const c1 = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), catchMat), c2 = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), catchMat);
  scene.add(e); scene.add(p); scene.add(c1); scene.add(c2); return { e, p, c1, c2 };
});
const arcGeo = new THREE.TorusGeometry(0.1, 0.014, 6, 14, Math.PI), dotGeo = new THREE.SphereGeometry(1, 8, 6);
const mouth = new THREE.Group(); scene.add(mouth);
const arcA = new THREE.Mesh(arcGeo, mouthMat), arcB = new THREE.Mesh(arcGeo, mouthMat), dotM = new THREE.Mesh(dotGeo, mouthMat);
mouth.add(arcA); mouth.add(arcB); mouth.add(dotM);
const emo = { timers: {}, manual: null, manualT: 0, idle: 0, blinkT: 0, nextBlink: 4, cur: { ey: 1, tilt: 0, pupil: 1, curve: 0.35, open: 0 }, name: 'neutral' };
function emoTrigger(name, dur) { emo.timers[name] = Math.max(emo.timers[name] || 0, dur); }
function emoManual(name) { emo.manual = name; emo.manualT = 2.5; if (name === 'love') { const c = com(); popHearts(c[0], c[1], c[2]); } chime([659, 784], 0.04); }
function pickEmotion() {
  if (emo.manualT > 0 && emo.manual) return emo.manual;
  let best = 'neutral', bp = 0;
  for (const k in emo.timers) if (emo.timers[k] > 0) { const p = Profile.EMOTIONS[k].pri; if (p >= bp) { bp = p; best = k; } }
  return best;
}
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3(), anchors = { head: new THREE.Vector3(), back: new THREE.Vector3(), eyeL: new THREE.Vector3(), eyeR: new THREE.Vector3(), mouth: new THREE.Vector3(), out: new THREE.Vector3() };
function updateFace(dt) {
  for (const k in emo.timers) if (emo.timers[k] > 0) emo.timers[k] -= dt;
  if (emo.manualT > 0) emo.manualT -= dt;
  const name = pickEmotion(); emo.name = name;
  const tgtE = Profile.EMOTIONS[name], k = Math.min(1, dt * 10), c = emo.cur;
  c.ey = lerp(c.ey, tgtE.ey, k); c.tilt = lerp(c.tilt, tgtE.tilt, k); c.pupil = lerp(c.pupil, tgtE.pupil, k); c.curve = lerp(c.curve, tgtE.curve, k); c.open = lerp(c.open, tgtE.open, k);
  emo.blinkT += dt; let blink = 1;
  if (emo.blinkT > emo.nextBlink) { const bt = emo.blinkT - emo.nextBlink; blink = bt < 0.12 ? Math.abs(1 - bt / 0.06) : 1; if (bt > 0.12) { emo.blinkT = 0; emo.nextBlink = 3 + Math.random() * 3; } }
  const size = profile.look.size, style = profile.look.eyeStyle;
  let sx = 1, sy = 1.3, sz = 1;
  if (style === 'round') sy = 1; else if (style === 'sparkle') sy = 1.15; else if (style === 'sleepy') sy = 0.55;
  const cm = com(), fx = facing.x, fz = facing.z;
  for (let s = 0; s < 2; s++) {
    const ang = (s === 0 ? -1 : 1) * 0.42, ca = Math.cos(ang), sa = Math.sin(ang);
    _d.set(fx * ca + fz * sa, 0.3, -fx * sa + fz * ca).normalize();
    surfacePoint(_d.x, _d.y, _d.z, _a);
    const E = eyes[s]; E.e.position.lerp(_a, Math.min(1, dt * 18));
    E.e.position.y += (s === 0 ? 1 : -1) * c.tilt * 0.01;
    E.e.scale.set(sx * size, sy * c.ey * blink * size, sz * size);
    E.p.position.copy(E.e.position).addScaledVector(_d, 0.058 * size); E.p.scale.setScalar(c.pupil * size * (style === 'sparkle' ? 1.15 : 1)); E.p.visible = blink > 0.5 && c.ey > 0.5;
    E.c1.position.copy(E.p.position).add(_b.set(0.02, 0.025, 0.02).multiplyScalar(size)); E.c1.scale.setScalar(size * (style === 'sparkle' ? 1.6 : 1)); E.c1.visible = E.p.visible;
    E.c2.position.copy(E.p.position).add(_b.set(-0.015, -0.02, 0.02).multiplyScalar(size)); E.c2.visible = E.p.visible && style === 'sparkle';
    (s === 0 ? anchors.eyeL : anchors.eyeR).copy(E.e.position);
  }
  // mouth
  const fl = Math.hypot(fx, fz) || 1; _d.set(fx / fl, -0.32, fz / fl).normalize();
  surfacePoint(_d.x, _d.y, _d.z, anchors.mouth); mouth.position.lerp(anchors.mouth, Math.min(1, dt * 18));
  _b.copy(mouth.position).add(_d); mouth.lookAt(_b);
  const ms = profile.look.mouth, curve = c.curve, open = c.open > 0.5 || ms === 'dot';
  arcA.visible = arcB.visible = false; dotM.visible = false;
  if (open) { dotM.visible = true; const r = 0.03 + 0.035 * c.open; dotM.scale.set(r * size, r * size * (1 + c.open * 0.3), r * 0.5 * size); dotM.position.set(0, 0, 0); }
  else if (ms === 'cat') {
    [arcA, arcB].forEach((a, i) => { a.visible = true; a.scale.set(0.5 * size, Math.max(0.2, Math.abs(curve)) * 0.5 * size, 1); a.rotation.z = curve >= 0 ? Math.PI : 0; a.position.set((i ? 1 : -1) * 0.05 * size, curve >= 0 ? 0.02 * size : -0.02 * size, 0); });
  } else { arcA.visible = true; arcA.scale.set(0.8 * size, Math.max(0.2, Math.abs(curve)) * size, 1); arcA.rotation.z = curve >= 0 ? Math.PI : 0; arcA.position.set(0, curve >= 0 ? 0.04 * size : -0.04 * size, 0); }
  // head / back anchors for cosmetics
  surfacePoint(0, 1, 0, anchors.head); surfacePoint(-fx, 0.25, -fz, anchors.back);
}

/* ================= core charm ================= */
let coreObj = null; // every creature has a Core: it keeps the body together and is where items go
const flakesGeo = (() => { const g = new THREE.BufferGeometry(), a = new Float32Array(14 * 3); for (let i = 0; i < 14; i++) { a[3*i] = (Math.random() - 0.5) * 0.7; a[3*i+1] = (Math.random() - 0.5) * 0.7; a[3*i+2] = (Math.random() - 0.5) * 0.7; } g.setAttribute('position', new THREE.BufferAttribute(a, 3)); return g; })();
const flakesMat = new THREE.PointsMaterial({ size: 8, sizeAttenuation: false, map: softTex, color: 0xffd75e, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }); pointMats.push([flakesMat, 0.16]);
function shapeGeo(pts, depth, scale) { const sh = new THREE.Shape(); pts.forEach((p, i) => i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1])); const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false }); g.center(); g.scale(scale, scale, scale); return g; }
function buildCore() {
  if (coreObj) { scene.remove(coreObj); coreObj = null; }
  const id = profile.look.core;
  const emi = (c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.8, roughness: 0.3 });
  if (id === 'crystal') coreObj = new THREE.Mesh(new THREE.OctahedronGeometry(0.17), emi(0x7fd3ff));
  else if (id === 'star') { const pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.45 : 1, a = Math.PI / 2 + i * Math.PI / 5; pts.push([Math.cos(a) * r, Math.sin(a) * r]); } coreObj = new THREE.Mesh(shapeGeo(pts, 0.35, 0.19), emi(0xffd75e)); }
  else if (id === 'heart') { const pts = []; for (let i = 0; i < 24; i++) { const t = i / 24 * Math.PI * 2; pts.push([16 * Math.pow(Math.sin(t), 3), 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)]); } coreObj = new THREE.Mesh(shapeGeo(pts, 6, 0.011), emi(0xff6fa5)); }
  else coreObj = new THREE.Points(flakesGeo, flakesMat);
  scene.add(coreObj);
}
let corePulse = 0;
function updateCore(dt, t) {
  if (!coreObj) return; const c = com();
  corePulse = Math.max(0, corePulse - dt * 3);
  coreObj.position.set(c[0], c[1] + Math.sin(t * 2) * 0.03, c[2]); coreObj.rotation.y += dt * 1.2; coreObj.scale.setScalar(profile.look.size * (1 + 0.5 * corePulse));
}

/* ================= cosmetics (primitive meshes; optional GLB overrides) ================= */
// R1-018: canonical manifest ids via app/assets.js (was: legacy
// assets/manifest.json fetch). Non-blocking: procedural fallbacks rule
// until it resolves. NOTE: THREE.GLTFLoader is absent from the three r128
// module build, so GLB overrides stay dormant until a loader lands (R5).
loadManifest().catch(() => {});
function tryGLB(id, group) {
  const url = getModelUrl(id);
  if (!url || !THREE.GLTFLoader) return;
  try { new THREE.GLTFLoader().load(url, g => { while (group.children.length) group.remove(group.children[0]); group.add(g.scene); }, undefined, () => {}); } catch (e) { /* keep primitives */ }
}

const cosm = { head: null, face: null, back: null, aura: null, trail: null };
function disposeCosm(slot) { const o = cosm[slot]; if (o) { scene.remove(o.obj); } cosm[slot] = null; }
const trailHist = []; for (let i = 0; i < 28; i++) trailHist.push([0, -100, 0]);
function makePoints(n, color, sizeM, additive) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const m = new THREE.PointsMaterial({ size: 8, sizeAttenuation: false, map: softTex, vertexColors: true, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }); pointMats.push([m, sizeM]);
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.userData.base = new THREE.Color(color); updatePointSizes(); return p;
}
function buildCosmetics() {
  ['head', 'face', 'back', 'aura', 'trail'].forEach(disposeCosm);
  const C = profile.cosmetics;
  if (C.head !== 'none') { const o = makeHead(C.head); scene.add(o); cosm.head = { obj: o, p: new THREE.Vector3().copy(anchors.head), v: new THREE.Vector3(), id: C.head }; }
  if (C.face !== 'none') { const o = makeFace(C.face); scene.add(o); cosm.face = { obj: o, id: C.face }; }
  if (C.back !== 'none') { const o = makeBack(C.back); scene.add(o); cosm.back = { obj: o, p: new THREE.Vector3().copy(anchors.back), v: new THREE.Vector3(), id: C.back }; }
  if (C.aura !== 'none') { const n = C.aura === 'sparkles' ? 24 : 12, o = makePoints(n, C.aura === 'sparkles' ? 0xffe27a : 0xb6ff7a, C.aura === 'sparkles' ? 0.1 : 0.16, true); scene.add(o); cosm.aura = { obj: o, n, id: C.aura }; }
  if (C.trail !== 'none') { const o = makePoints(trailHist.length, C.trail === 'stars' ? 0xffe27a : 0xff9fc4, 0.14, true); scene.add(o); cosm.trail = { obj: o, id: C.trail, acc: 0 }; for (const h of trailHist) { h[0] = 0; h[1] = -100; h[2] = 0; } }
}
function springTo(s, target, dt, k, damp) { // damped spring on a position
  _b.copy(target).sub(s.p).multiplyScalar(k).addScaledVector(s.v, -damp); s.v.addScaledVector(_b, dt); s.p.addScaledVector(s.v, dt);
  if (s.p.distanceToSquared(target) > 9) { s.p.copy(target); s.v.set(0, 0, 0); }
}
function updateCosmetics(dt, t) {
  const size = profile.look.size, up = 0.04 * size;
  if (cosm.head) {
    const s = cosm.head; _a.copy(anchors.head); _a.y += up; springTo(s, _a, dt, 60, 8);
    s.obj.position.copy(s.p); s.obj.scale.setScalar(size); const lag = _b.copy(_a).sub(s.p);
    s.obj.rotation.z = THREE.MathUtils.clamp(-lag.x * 3, -0.5, 0.5); s.obj.rotation.x = THREE.MathUtils.clamp(lag.z * 3, -0.5, 0.5);
    if (s.id === 'halo') s.obj.position.y += Math.sin(t * 2.5) * 0.04;
  }
  if (cosm.back) {
    const s = cosm.back; springTo(s, anchors.back, dt, 60, 8); s.obj.position.copy(s.p); s.obj.scale.setScalar(size); s.obj.rotation.y = Math.atan2(-facing.x, -facing.z) + Math.PI;
    if (s.obj.userData.flap) { const f = Math.sin(t * 6) * 0.25; s.obj.userData.flap[0].rotation.z = f; s.obj.userData.flap[1].rotation.z = -f; }
  }
  if (cosm.face) {
    const o = cosm.face.obj, u = o.userData;
    if (u.l) { u.l.position.copy(anchors.eyeL); u.r.position.copy(anchors.eyeR); }
    const ang = Math.atan2(facing.x, facing.z);
    if (cosm.face.id === 'glasses') {
      u.l.position.addScaledVector(_d.set(facing.x, 0, facing.z), 0.07 * size); u.r.position.addScaledVector(_d, 0.07 * size); u.l.rotation.y = u.r.rotation.y = ang; u.l.scale.setScalar(size); u.r.scale.setScalar(size);
      u.bridge.position.copy(u.l.position).add(u.r.position).multiplyScalar(0.5); u.bridge.rotation.y = ang; u.bridge.rotation.z = Math.PI / 2;
    } else { u.l.position.y -= 0.12 * size; u.r.position.y -= 0.12 * size; u.l.position.addScaledVector(_d.set(facing.x, 0, facing.z), 0.03); u.r.position.addScaledVector(_d, 0.03); u.l.rotation.y = u.r.rotation.y = ang; u.l.scale.set(size, 0.5 * size, 0.4 * size); u.r.scale.set(size, 0.5 * size, 0.4 * size); }
  }
  const c = com();
  if (cosm.aura) {
    const a = cosm.aura, pos = a.obj.geometry.attributes.position, col = a.obj.geometry.attributes.color, base = a.obj.userData.base;
    for (let i = 0; i < a.n; i++) {
      const ang = t * (0.8 + (i % 3) * 0.2) + i * 2.4, r = (0.8 + 0.25 * Math.sin(t + i)) * size, y = Math.sin(t * 1.3 + i * 1.7) * 0.5;
      pos.setXYZ(i, c[0] + Math.cos(ang) * r, c[1] + y, c[2] + Math.sin(ang) * r);
      const f = a.id === 'fireflies' ? 0.5 + 0.5 * Math.sin(t * 4 + i * 3) : 0.7 + 0.3 * Math.sin(t * 5 + i); col.setXYZ(i, base.r * f, base.g * f, base.b * f);
    }
    pos.needsUpdate = true; col.needsUpdate = true;
  }
  if (cosm.trail) {
    const tr = cosm.trail, vc = vcom(); tr.acc += dt;
    if (tr.acc > 0.06) { tr.acc = 0; trailHist.pop(); const sp = Math.hypot(vc[0], vc[2]); trailHist.unshift(sp > 0.8 ? [c[0] - vc[0] * 0.05, c[1] - 0.3, c[2] - vc[2] * 0.05] : [0, -100, 0]); }
    const pos = tr.obj.geometry.attributes.position, col = tr.obj.geometry.attributes.color, base = tr.obj.userData.base;
    for (let i = 0; i < trailHist.length; i++) { const h = trailHist[i], f = 1 - i / trailHist.length; pos.setXYZ(i, h[0], h[1], h[2]); col.setXYZ(i, base.r * f, base.g * f, base.b * f); }
    pos.needsUpdate = true; col.needsUpdate = true;
  }
}

/* ================= glider wings (slime) ================= */
const wingGeo = (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0.3,0,0.3, 1.7,0.15,0.7, 2.0,0.2,-0.1, 1.4,0.1,-0.6, 0.3,0,-0.3]), 3)); g.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4]); g.computeVertexNormals(); return g; })();
const wingMat = new THREE.MeshBasicMaterial({ color: 0x58e07e, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
const wings = new THREE.Group(); wings.visible = false; const wingR = new THREE.Group(), wingL = new THREE.Group();
wingR.add(new THREE.Mesh(wingGeo, wingMat)); const wl = new THREE.Mesh(wingGeo, wingMat); wl.scale.x = -1; wingL.add(wl); wings.add(wingR); wings.add(wingL); scene.add(wings);
let wingAmt = 0, flap = 0;
function updateWings(dt) {
  wingAmt += (((body && body.gliding) ? 1 : 0) - wingAmt) * Math.min(1, dt * 10); wings.visible = wingAmt > 0.02;
  if (wings.visible) { const c = com(); flap += dt * 9; wings.position.set(c[0], c[1] + 0.25, c[2]); wings.rotation.y = Math.atan2(facing.x, facing.z); wings.scale.setScalar(wingAmt * profile.look.size); const f = Math.sin(flap) * 0.18 + 0.08; wingR.rotation.z = f; wingL.rotation.z = -f; }
}

/* ================= camera ================= */
const ELEV = Math.atan(1 / Math.SQRT2);
let az = Math.PI / 4, azT = az, shakeAmp = 0;
function updateCamera(dt) {
  az += (azT - az) * Math.min(1, dt * 9);
  const c = com();
  tgt.x += (c[0] - tgt.x) * Math.min(1, dt * 7); tgt.z += (c[2] - tgt.z) * Math.min(1, dt * 7); tgt.y += (c[1] - tgt.y) * Math.min(1, dt * 1.6);
  const lim = view * 0.6; tgt.y = Math.max(c[1] - lim, Math.min(c[1] + lim, tgt.y));
  let sx = 0, sy = 0; if (shakeAmp > 0.002) { sx = (Math.random() - 0.5) * shakeAmp; sy = (Math.random() - 0.5) * shakeAmp; shakeAmp *= Math.pow(0.02, dt); }
  const D = 120, ce = Math.cos(ELEV), se = Math.sin(ELEV);
  cam.position.set(tgt.x + Math.sin(az) * ce * D + sx, tgt.y + se * D + sy, tgt.z + Math.cos(az) * ce * D); cam.lookAt(tgt.x + sx, tgt.y + sy, tgt.z);
  sun.position.set(tgt.x + sunOff.x, tgt.y + sunOff.y, tgt.z + sunOff.z); sun.target.position.set(tgt.x, tgt.y, tgt.z);
}

/* ================= actions and input ================= */
let meltOn = false, springOn = false, modeSel = 0;
function updateActionLabels() {
  const w = formKind === 'wisp', st = formKind === 'stone';
  $('aMelt').textContent = w ? 'Diffuse (M)' : st ? 'Pebble (M)' : 'Puddle melt (M)'; $('aSpring').textContent = w ? 'Condense (C)' : 'Coiled spring (C)'; $('aPound').textContent = w ? 'Down-gust (F)' : 'Ground pound (F)';
  $('mbtn').textContent = w ? 'Diffuse' : st ? 'Pebble' : 'Melt'; $('pbtn').textContent = w ? 'Gust' : 'Pound';
  $('aMelt').disabled = false; $('mbtn').disabled = false;
  $('aFloat').style.display = w ? '' : 'none'; $('vbtn').style.display = w ? '' : 'none';
}
function syncActionButtons() {
  $('aMelt').setAttribute('aria-pressed', formKind === 'wisp' ? modeSel === -1 : meltOn); $('aSpring').setAttribute('aria-pressed', formKind === 'wisp' ? modeSel === 1 : springOn);
}
function toggleMelt() { if (formKind === 'wisp') modeSel = modeSel === -1 ? 0 : -1; else meltOn = !meltOn; syncActionButtons(); }
function toggleSpring() { if (formKind === 'wisp') modeSel = modeSel === 1 ? 0 : 1; else { springOn = !springOn; P.spring = springOn; } syncActionButtons(); }
$('aMelt').addEventListener('click', e => { toggleMelt(); e.currentTarget.blur(); });
$('aSpring').addEventListener('click', e => { toggleSpring(); e.currentTarget.blur(); });
$('aFloat').addEventListener('click', e => { inp.pendingFloat = true; e.currentTarget.blur(); });
$('aHeart').addEventListener('click', e => { inp.pendingHeart = true; e.currentTarget.blur(); });
$('aPound').addEventListener('click', e => { inp.pendingPound = true; e.currentTarget.blur(); });

let windDebug = false;
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (e.repeat) return;
  if (k === 'q') azT += Math.PI / 2; else if (k === 'e') azT -= Math.PI / 2;
  else if (k === 'r') spawnForm(formKind, world.spawn); else if (k === 't') toggleSlow();
  else if (k === 'm') toggleMelt(); else if (k === 'c') toggleSpring();
  else if (k === 'h') inp.pendingHeart = true; else if (k === 'f') inp.pendingPound = true; else if (k === 'b') windDebug = !windDebug;
  else if (k === 'tab') { const order = ['slime', 'wisp', 'stone']; switchForm(order[(order.indexOf(formKind) + 1) % 3]); }
  else if (k === 'v') inp.pendingFloat = true;
  else if (k === 'p') toggleBuild(); else if (k === '[') cyclePiece(-1); else if (k === ']') cyclePiece(1); else if (k === 'x') rotateGhost();
  else if (k === 'enter') placeGhost(); else if (k === 'backspace' || k === 'delete') removeNear();
  else if (k >= '1' && k <= '8') emoManual(Profile.MANUAL[+k - 1]);
  else if (k === '=' || k === '+') zoom(0.82); else if (k === '-') zoom(1.22);
  else if (k === 'w') { windDebug = !windDebug; $('windArrow').style.display = windDebug ? 'block' : 'none'; }
  else if (k === '/') { debugInfo = !debugInfo; $('debugInfo').style.display = debugInfo ? 'block' : 'none'; }
});
window.addEventListener('blur', () => { keys.clear(); inp.touchJump = false; });
window.addEventListener('wheel', e => zoom(e.deltaY > 0 ? 1.1 : 0.9), { passive: true });
function zoom(f) { view = Math.max(3.5, Math.min(26, view * f)); resize(); }
function toggleSlow() { slowToggle.setSlow(!slowToggle._slow); $('slow').setAttribute('aria-pressed', slowToggle._slow); }
$('slow').addEventListener('click', e => { toggleSlow(); e.currentTarget.blur(); });
$('reset').addEventListener('click', e => { spawnForm(formKind, world.spawn); e.currentTarget.blur(); });
$('rotL').addEventListener('click', e => { azT += Math.PI / 2; e.currentTarget.blur(); });
$('rotR').addEventListener('click', e => { azT -= Math.PI / 2; e.currentTarget.blur(); });
$('zoomIn').addEventListener('click', e => { zoom(0.82); e.currentTarget.blur(); });
$('zoomOut').addEventListener('click', e => { zoom(1.22); e.currentTarget.blur(); });
if (coarse) $('touch').classList.add('on');
const winp = { mx: 0, mz: 0, jumpHeld: false, dash: false, mode: 0, wind: [0, 0, 0], wetAmt: 0, bw: [1, 0, 0, 0], time: 0, fx: 0, fz: 1 };
let moveMag = 0;
function readInput() {
  let ix = inp.moveX;
  let iz = inp.moveZ;
  const l = Math.hypot(ix, iz); if (l > 1) { ix /= l; iz /= l; } moveMag = Math.min(1, l);
  const sa = Math.sin(az), ca = Math.cos(az);
  const mx = -sa * iz + ca * ix, mz = -ca * iz - sa * ix;
  inp.mx = mx; inp.mz = mz; inp.jumpHeld = inp.jumpHeld || inp.touchJump; inp.melt = meltOn; inp.pound = inp.actionF || inp.pendingPound; inp.heart = inp.actionH || inp.pendingHeart;
  inp.ride = winp.ride = inp.rideHeld || inp.touchRide; winp.pound = inp.actionF || inp.pendingPound; winp.floatToggle = inp.actionV || inp.pendingFloat;
  winp.mx = mx; winp.mz = mz; winp.jumpHeld = inp.jumpHeld; winp.dash = false; winp.mode = modeSel; winp.fx = facing.x; winp.fz = facing.z;
  if ((inp.actionH || inp.pendingHeart) && wisp) { const c = com(); popHearts(c[0], c[1], c[2]); emoTrigger('love', 2); chime([659, 784, 988, 1319], 0.05); }
  inp.pendingPound = false; inp.pendingHeart = false; inp.pendingFloat = false;
  input.endFrame();
  if (l > 0.15) { const m = Math.hypot(mx, mz) || 1; facing.x += (mx / m - facing.x) * 0.2; facing.z += (mz / m - facing.z) * 0.2; const f = Math.hypot(facing.x, facing.z) || 1; facing.x /= f; facing.z /= f; }
}

/* ================= harvesting and interactions ================= */
function bumpTree(t) {
  t.cd = t.cdLen || (formKind === 'stone' ? 3 : 7); t.shake = 0.55; if (shaking.indexOf(t) < 0) shaking.push(t);
  const y = t.y + 1.9 * t.s, drop = (type, n) => { for (let i = 0; i < n; i++) spawnItem(type, t.x, y, t.z); };
  const sticky = formKind === 'slime' ? 1 : 0; /* slime perk: sticky hits bring extra sap */
  if (t.kind === 'oak') { drop('timber', 2); drop('sap', 1 + sticky); } else if (t.kind === 'pine') { drop('timber', 1); drop('sap', 1 + sticky); } else if (t.kind === 'cactus') drop('fiber', 2); else drop('spore', 3);
  chime([523, 659], 0.05); emoTrigger('happy', 1);
}
function breakBreakable(g, type, n) {
  if (formKind === 'slime' && type === 'clay') n += 1;   // slime perk
  g.on = false; setI(g.mesh, g.idx, g.c[0], g.c[1], g.c[2], 0, 0, 0); g.mesh.instanceMatrix.needsUpdate = true;
  for (let i = 0; i < n; i++) spawnItem(type, g.c[0], g.c[1] + 0.4, g.c[2]); emoTrigger('proud', 2.2);
}
let tramCd = 0;
const HIT_SPEED = { slime: 3.2, wisp: 3.0, stone: 2.6 };      // impact speed needed (m/s) to shake a trunk
function emitImpact(t) { bumpTree(t); }
function checkImpacts(dt) {
  const F = world.flora; if (!F) return;
  const c = com(), v = vcom(), need = HIT_SPEED[formKind], reach = wisp ? 0.5 + wisp.radius : 0.95, cd = formKind === 'stone' ? 3 : 7;
  for (const t of F.trees) {
    if (t.cd > 0) t.cd -= dt;
    if (Math.abs(t.x - c[0]) > 2.6 || Math.abs(t.z - c[2]) > 2.6) continue;
    const dx = t.x - c[0], dz = t.z - c[2], d = Math.hypot(dx, dz);
    if (body && t.kind === 'mushroom' && tramCd <= 0 && t.cap) { // mushroom caps are trampolines (slime and stone)
      const top = t.cap.c[1] + t.cap.r;
      if (d < t.cap.r + 0.3 && c[1] > top + 0.15 && c[1] < top + 1.2 && v[1] < -2) {
        const up = Math.min(12, -v[1] * 1.1 + 2); for (let i = 0; i < body.n; i++) body.v[3*i+1] = up; tramCd = 0.3; chime([392, 523, 659], 0.04); emoTrigger('excited', 1);
      }
    }
    if (t.cd > 0) continue;
    if (wisp) { // gust-slam: several motes striking the trunk fast enough
      if (d > 3) continue; let hits = 0;
      for (let i = 0; i < wisp.n; i++) {
        const px = t.x - wisp.x[3*i], pz = t.z - wisp.x[3*i+2], py = wisp.x[3*i+1], pd = Math.hypot(px, pz);
        if (pd < t.col.r + 0.9 && py > t.y - 0.5 && py < t.y + t.col.h && (wisp.v[3*i] * px + wisp.v[3*i+2] * pz) / (pd || 1) >= need) hits++;
      }
      if (hits >= 2) { t.cdLen = cd; emitImpact(t); }
      continue;
    }
    if (d > t.col.r + reach) continue;
    if (c[1] > t.y + t.col.h + 0.3 || c[1] < t.y - 1) continue;
    if ((v[0] * dx + v[2] * dz) / (d || 1) < need) continue;
    t.cdLen = cd; emitImpact(t);
  }
  if (formKind === 'stone') { // a rolling stone cracks geodes and clay by hitting them hard
    const sp = Math.hypot(v[0], v[2]);
    if (sp > 5) {
      F.geodes.forEach(g => { if (g.on && Math.hypot(g.c[0] - c[0], g.c[2] - c[2]) < g.r + 1.0 && Math.abs(g.c[1] - c[1]) < 1.2) { breakBreakable(g, 'starstone', 2); chime([784, 988, 1175], 0.06); } });
      F.clays.forEach(g => { if (g.on && Math.hypot(g.c[0] - c[0], g.c[2] - c[2]) < g.r + 1.0 && Math.abs(g.c[1] - c[1]) < 1.2) { breakBreakable(g, 'clay', 2); chime([392, 494], 0.05); } });
    }
  }
}
function updateShake(dt) {
  for (let i = shaking.length - 1; i >= 0; i--) {
    const t = shaking[i]; t.shake -= dt; const k = Math.max(0, t.shake / 0.55), off = Math.sin(t.shake * 48) * 0.12 * k * t.s;
    t.parts.forEach(p => { setI(p.mesh, p.i, p.x + off, p.y, p.z, p.sx, p.sy, p.sz); p.mesh.instanceMatrix.needsUpdate = true; });
    if (t.shake <= 0) shaking.splice(i, 1);
  }
}
function onPound(e) {
  shakeAmp = 0.5; ringAt(e.x, e.z); chime([196, 147], 0.08);
  const F = world.flora; if (!F) return; const R = 3.8;
  F.geodes.forEach(g => { if (g.on && Math.hypot(g.c[0] - e.x, g.c[2] - e.z) < R && Math.abs(g.c[1] - e.y) < 2.5) { breakBreakable(g, 'starstone', 2 + ((Math.random() * 2) | 0)); chime([784, 988, 1175], 0.06); } });
  F.clays.forEach(g => { if (g.on && Math.hypot(g.c[0] - e.x, g.c[2] - e.z) < R && Math.abs(g.c[1] - e.y) < 2.5) { breakBreakable(g, 'clay', 2); chime([392, 494], 0.05); } });
  F.trees.forEach(t => { if (t.cd <= 0 && Math.hypot(t.x - e.x, t.z - e.z) < 2.6) bumpTree(t); });
}
function handleEvents() {
  const ev = events();
  while (ev.length) {
    const e = ev.shift();
    if (e.t === 'pound') onPound(e);
    else if (e.t === 'heart') { popHearts(e.x, e.y, e.z); chime([659, 784, 988, 1319], 0.05); emoTrigger('love', 2); }
    else if (e.t === 'dash') { chime([440, 660], 0.04); emoTrigger('excited', 0.8); }
  }
}
function absorbFlowers(dt) {
  const F = world.flora; if (!F) return;
  const c = com(), rad = wisp ? 2.75 : 1.1; let near = false;   // wisp perk: pulls motes in from further away
  for (const f of F.flowers) {
    if (!f.alive) { f.timer -= dt; if (f.timer <= 0) { f.alive = true; setI(f.mesh, f.idx, f.x, f.y + (f.type === 'spore' ? 0.3 : 0.16), f.z, f.size, f.size, f.size); f.mesh.instanceMatrix.needsUpdate = true; } continue; }
    const dx = f.x - c[0], dz = f.z - c[2], d2 = dx * dx + dz * dz;
    if (d2 < 9) near = true;
    if (d2 > rad * rad || Math.abs(f.y - c[1]) > (wisp ? 3 : 1.6)) continue;
    f.alive = false; f.timer = 30; setI(f.mesh, f.idx, f.x, f.y, f.z, 0, 0, 0); f.mesh.instanceMatrix.needsUpdate = true; spawnItem(f.type, f.x, f.y + 0.3, f.z, true);
  }
  if (near) emoTrigger('curious', 0.3);
}
function updateHut(dt) {
  const h = world.hut; if (!h || !hutParts.length) return; const c = com();
  const inside = Math.abs(c[0] - h.cx) < h.half && Math.abs(c[2] - h.cz) < h.half && c[1] < h.hy + 3.6;
  const cvx = Math.sin(az), cvz = Math.cos(az);
  hutParts.forEach(p => { let target = 1; if (inside) { if (p.kind === 'roof') target = 0.08; else if (p.n[0] * cvx + p.n[1] * cvz > 0.2) target = 0.1; } p.mat.opacity += (target - p.mat.opacity) * Math.min(1, dt * 8); p.mat.depthWrite = p.mat.opacity > 0.5; });
  if (inside && Math.hypot(c[0] - (h.cx + h.half - 0.9), c[2] - (h.cz - 1.5)) < 4) emoTrigger('cozy', 0.3);
}

/* ================= weather particles ================= */
const WXD = {
  rain: { name: 'Sun shower', tint: 0x6fd0ff, emi: 0x1a4a7a, ei: 0.5 }, sand: { name: 'Sand flurry', tint: 0xffc15a, emi: 0xff9a2a, ei: 1.1 },
  snow: { name: 'Snowfall', tint: 0xdff2ff, emi: 0x9fd8ff, ei: 0.7 }, spore: { name: 'Spore aurora', tint: 0xc2a8ff, emi: 0x7a4cff, ei: 0.9 }
};
const WN = coarse ? 350 : 650, RX = 18, YLO = -6, YHI = 11;
const wxBase = new Float32Array(WN * 3), wxVel = new Float32Array(WN * 3), wxGeo = new THREE.BufferGeometry(), wxPosArr = new Float32Array(WN * 3);
wxGeo.setAttribute('position', new THREE.BufferAttribute(wxPosArr, 3));
const wxMat = new THREE.PointsMaterial({ size: 4, sizeAttenuation: false, transparent: true, opacity: 0.9, depthWrite: false, color: 0xffffff });
const wxPoints = new THREE.Points(wxGeo, wxMat); wxPoints.frustumCulled = false; wxPoints.visible = false; scene.add(wxPoints);
const rainPos = new Float32Array(WN * 6), rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rainLines = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.55 })); rainLines.frustumCulled = false; rainLines.visible = false; scene.add(rainLines);
let wxCur = 'none', wxAmt = 0, curWx = { type: 'none', amt: 0 };
function seedWeather(type) {
  for (let i = 0; i < WN; i++) {
    wxBase[3*i] = tgt.x + (Math.random() * 2 - 1) * RX; wxBase[3*i+1] = tgt.y + YLO + Math.random() * (YHI - YLO); wxBase[3*i+2] = tgt.z + (Math.random() * 2 - 1) * RX;
    let vx = 0, vy = 0, vz = 0;
    if (type === 'rain') { vy = -24 - Math.random() * 4; } else if (type === 'sand') { vx = 2 + Math.random() * 2; vy = (Math.random() - 0.5) * 0.8; }
    else if (type === 'snow') { vx = (Math.random() - 0.5) * 0.8; vy = -1.4 - Math.random() * 0.8; vz = (Math.random() - 0.5) * 0.8; } else if (type === 'spore') { vx = (Math.random() - 0.5) * 0.7; vy = 0.7 + Math.random() * 0.8; vz = (Math.random() - 0.5) * 0.7; }
    wxVel[3*i] = vx; wxVel[3*i+1] = vy; wxVel[3*i+2] = vz;
  }
  wxMat.color.setHex(type === 'sand' ? 0xf3d58a : type === 'spore' ? 0xa5ffe6 : 0xffffff); wxMat.blending = type === 'spore' ? THREE.AdditiveBlending : THREE.NormalBlending; wxMat.needsUpdate = true; wxMat.size = type === 'snow' ? 5 : 4;
}
function setWeather(type) { wxCur = type; wxPoints.visible = type === 'sand' || type === 'snow' || type === 'spore'; rainLines.visible = type === 'rain'; if (type !== 'none') seedWeather(type); }
const WFAC = { rain: 0.3, sand: 1.0, snow: 0.6, spore: 0.5 };
function updateWeather(dt) {
  const want = curWx.type; if (want !== wxCur) setWeather(want);
  wxAmt += (curWx.amt - wxAmt) * Math.min(1, dt * 3);
  if (wxCur !== 'none') {
    const cx = tgt.x, cy = tgt.y, cz = tgt.z, d2 = RX * 2, wf = WFAC[wxCur], wd = inp.wind;
    const live = Math.max(1, Math.floor(WN * Math.min(1, wxAmt + 0.02)));
    for (let i = 0; i < WN; i++) {
      const k = 3 * i;
      wxBase[k] += (wxVel[k] + wd[0] * wf) * dt; wxBase[k+1] += (wxVel[k+1] + (wxCur === 'rain' ? 0 : wd[1] * 0.4)) * dt; wxBase[k+2] += (wxVel[k+2] + wd[2] * wf) * dt;
      if (wxCur === 'snow' || wxCur === 'spore') { wxBase[k] += Math.sin(wxBase[k+1] * 1.3 + i) * 0.4 * dt; wxBase[k+2] += Math.cos(wxBase[k+1] * 1.1 + i) * 0.4 * dt; }
      if (wxBase[k] < cx - RX) wxBase[k] += d2; else if (wxBase[k] > cx + RX) wxBase[k] -= d2;
      if (wxBase[k+2] < cz - RX) wxBase[k+2] += d2; else if (wxBase[k+2] > cz + RX) wxBase[k+2] -= d2;
      if (wxBase[k+1] < cy + YLO) wxBase[k+1] += (YHI - YLO); else if (wxBase[k+1] > cy + YHI) wxBase[k+1] -= (YHI - YLO);
      if (wxCur === 'rain') { const j = 6 * i; rainPos[j] = wxBase[k]; rainPos[j+1] = wxBase[k+1]; rainPos[j+2] = wxBase[k+2]; rainPos[j+3] = wxBase[k] - (wxVel[k] + wd[0] * wf) * 0.025; rainPos[j+4] = wxBase[k+1] - wxVel[k+1] * 0.025; rainPos[j+5] = wxBase[k+2] - (wxVel[k+2] + wd[2] * wf) * 0.025; }
      else { wxPosArr[k] = wxBase[k]; wxPosArr[k+1] = wxBase[k+1]; wxPosArr[k+2] = wxBase[k+2]; }
    }
    if (wxCur === 'rain') { rainGeo.attributes.position.needsUpdate = true; rainGeo.setDrawRange(0, 2 * live); } else { wxGeo.attributes.position.needsUpdate = true; wxGeo.setDrawRange(0, live); }
  }
  // creature tint from the weather (gameplay effects come from Env.sample)
  const d = WXD[wxCur];
  slimeMat.color.setRGB(1, 1, 1); slimeMat.emissive.copy(userEmis); slimeMat.emissiveIntensity = 0.55; stoneMat.color.setRGB(1, 1, 1);
  if (d) { tmpC2.setHex(d.tint); slimeMat.color.lerp(tmpC2, 0.35 * wxAmt); stoneMat.color.lerp(tmpC2, 0.25 * wxAmt); slimeMat.emissive.lerp(tmpC.setHex(d.emi), wxAmt); slimeMat.emissiveIntensity = lerp(0.55, d.ei, wxAmt); }
}
// NOTE: weather select listener lives in ui/panel.js (R1-012).

/* ================= wind debug arrows ================= */
const windArrows = []; let windArrowGroup = new THREE.Group(); scene.add(windArrowGroup);
function updateWindDebug() {
  windArrowGroup.visible = windDebug; if (!windDebug) return;
  if (!windArrows.length) for (let i = 0; i < 49; i++) { const a = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 2, 0x2fbf62, 0.5, 0.35); windArrowGroup.add(a); windArrows.push(a); }
  const c = com(), gx = Math.round(c[0] / 6) * 6, gz = Math.round(c[2] / 6) * 6; let n = 0;
  for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
    const x = gx + i * 6, z = gz + j * 6, y = Phys.groundHeight(world, x, z) + 1.5, s = Env.sample(env, x, y, z), w = s.wind, len = Math.hypot(w[0], w[1], w[2]);
    const a = windArrows[n++]; a.position.set(x, y, z); if (len > 0.05) a.setDirection(_d.set(w[0], w[1], w[2]).normalize()); a.setLength(Math.max(0.4, len * 0.9), 0.5, 0.35); a.setColor(Math.abs(w[1]) > 0.5 ? 0xff9a3c : 0x2fbf62);
  }
}

/* ================= HUD ================= */
const jtxt = $('jtxt'), jfill = $('jfill'); let lastLabel = '', lastWx = '';
const BIOMES = Terrain.BIOMES;
function updateHud(s) {
  if (wisp) {
    jfill.style.width = wisp.breath.toFixed(0) + '%';
    const br = ' (breath ' + wisp.breath.toFixed(0) + '%)';
    jtxt.textContent = (wisp.exhausted ? 'Out of breath: come down to recharge' : wisp.diving ? 'Down-gust!' : wisp.climbing ? 'Wall-hug climbing' : wisp.low ? 'On the ground: recharging' + br + '. Hold Space to rise' : wisp.floating ? 'Rising' + br : wisp.floatMode ? 'Floating, V to stop' + br : 'Sinking. V floats, hold Space rises' + br) + (inp.ride ? ' | Riding' : modeSel === 1 ? ' | condensed' : modeSel === -1 ? ' | diffuse' : '');
    const fm = !!wisp.floatMode; if ($('aFloat').dataset.s !== String(fm)) { $('aFloat').dataset.s = String(fm); $('aFloat').setAttribute('aria-pressed', fm); }
  } else if (body.charge > 0) { jfill.style.width = (body.charge * 100).toFixed(0) + '%'; jtxt.textContent = 'Jump power ' + Phys.jumpHeight(P, body.charge).height.toFixed(1) + ' m'; }
  else if (body.hovering) { jfill.style.width = '0%'; jtxt.textContent = 'Hovering'; }
  else if (body.gliding) { jfill.style.width = '0%'; jtxt.textContent = formKind === 'stone' ? 'Crystal sail' : 'Gliding'; }
  else if (body.pitHold) { jfill.style.width = '0%'; jtxt.textContent = 'Gripping the wall'; }
  else if (body.shrink > 0.5) { jfill.style.width = '0%'; jtxt.textContent = 'Pebble form: press M to grow back'; }
  else if (body.melt > 0.5) { jfill.style.width = '0%'; jtxt.textContent = 'Puddle form: press M to re-form'; }
  else if (body.jumpActive) { jfill.style.width = '0%'; jtxt.textContent = 'Rise ' + body.peak.toFixed(1) + ' m' + '. Hold Space to glide'; }
  else { jfill.style.width = '0%'; jtxt.textContent = (body.lastPeak > 0 ? 'Last jump ' + body.lastPeak.toFixed(1) + ' m. ' : '') + 'Taps hop ' + Phys.jumpHeight(P, 0).height.toFixed(1) + ' m, full hold ' + Phys.jumpHeight(P, 1).height.toFixed(1) + ' m'; }
  let name = world.label; if (world.biomeAt) name = BIOMES[s.biome];
  const wlabel = curWx.type === 'none' || curWx.amt < 0.1 ? 'Clear' : WXD[curWx.type].name + ' ' + Math.round(curWx.amt * 100) + '%';
  const label = profile.name + ' (' + formKind + ') in ' + name;
  if (label !== lastLabel) { lastLabel = label; $('biomeLbl').textContent = label; }
  const wtxt = wlabel + ' | Wind ' + s.strength.toFixed(1) + ' m/s' + (Math.abs(s.wind[1]) > 0.6 ? (s.wind[1] > 0 ? ' (updraft)' : ' (downdraft)') : '') + (inp.ride ? ' | riding' : (s.strength > 1.5 || Math.abs(s.wind[1]) > 0.6 ? ' | hold Shift to ride' : ''));
  if (wtxt !== lastWx) { lastWx = wtxt; $('wxLbl').textContent = wtxt; }
  const sa = Math.sin(az), ca = Math.cos(az), sx = s.wind[0] * ca - s.wind[2] * sa, sy = s.wind[0] * -sa + s.wind[2] * -ca;
  $('windArrow').style.transform = 'rotate(' + (-Math.atan2(sy, sx)) + 'rad)'; $('windArrow').style.opacity = String(Math.min(1, 0.25 + s.strength / 5));
}


/* ================= craft, build, save ================= */
let saveData = { v: 1, inv: {}, pieces: {} };

function loadSave() {
  const loaded = loadGame();
  if (loaded && loaded.inv) {
    saveData = { v: 1, inv: {}, pieces: loaded.pieces || {} };
    Object.keys(inv).forEach(k => {
      if (typeof loaded.inv[k] === 'number' && isFinite(loaded.inv[k])) {
        inv[k] = Math.max(0, Math.min(9999, loaded.inv[k] | 0));
      }
    });
  }
}

function saveSave() {
  saveData.inv = inv;
  if (bs && world) saveData.pieces[world.name] = Build.serialize(bs);
  saveGame(saveData);
}

function flushSave() {
  saveData.inv = inv;
  if (bs && world) saveData.pieces[world.name] = Build.serialize(bs);
  Profile.save(profile);
  flushGame(saveData);
}

// Register auto-flush handlers
registerAutoFlush(() => {
  saveData.inv = inv;
  if (bs && world) saveData.pieces[world.name] = Build.serialize(bs);
  return saveData;
});

loadSave(); renderInv();

let bs = null;                              // build state for the current terrain
const pieceGroup = new THREE.Group(); scene.add(pieceGroup);
const pieceObjs = new Map();                // piece id -> {obj, rec, fade:[materials], kind, flames}
const ghostMat = new THREE.MeshBasicMaterial({ color: 0x55ee88, transparent: true, opacity: 0.45, depthWrite: false });
const fireLights = []; for (let i = 0; i < 3; i++) { const l = new THREE.PointLight(0xffa24a, 0, 12, 1.6); scene.add(l); fireLights.push(l); }
const WOOD = 0xb98a5a, LOG = 0xd9b98a, THATCH = 0xc9a24a;
function mk(geo, color, x, y, z, o) { const mt = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.85 }, o || {})); const me = new THREE.Mesh(geo, mt); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; return me; }
function buildPieceObj(type, rec) {
  const g = new THREE.Group(), info = { obj: g, rec, fade: [], kind: null, flames: [], light: !!Build.LIGHTS[type] };
  const box = (w, h, d, color, x, y, z, o) => { const me = mk(new THREE.BoxGeometry(w, h, d), color, x, y, z, o); g.add(me); return me; };
  if (type === 'foundation') {
    box(4, 0.25, 4, WOOD, 0, 0, 0);
    const posts = rec && rec.posts ? rec.posts : [0, 0, 0, 0];
    [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]].forEach((o, i) => { const len = Math.max(0.2, rec ? (rec.y - 0.125) - posts[i] + 0.3 : 0.5); const p = mk(new THREE.CylinderGeometry(0.13, 0.15, len, 8), 0x7a5233, o[0], -0.125 - len / 2, o[1]); g.add(p); });
  } else if (type === 'wall') {
    const me = box(4, 3, 0.3, LOG, 0, 0, 0, { transparent: true }); info.fade.push(me.material); info.kind = 'wall';
    for (let i = -1; i <= 1; i++) { const s = mk(new THREE.BoxGeometry(4.04, 0.06, 0.34), 0x9a6a3a, 0, i * 0.9, 0, { transparent: true }); g.add(s); info.fade.push(s.material); }
  } else if (type === 'doorwall') {
    info.kind = 'wall'; const seg = (4 - 1.4) / 2;
    [-1, 1].forEach(sg => { const me = box(seg, 3, 0.3, LOG, sg * (0.7 + seg / 2), 0, 0, { transparent: true }); info.fade.push(me.material); });
    const l = box(1.4, 0.8, 0.3, LOG, 0, 1.1, 0, { transparent: true }); info.fade.push(l.material);
  } else if (type === 'roof') {
    info.kind = 'roof'; const a = box(4.6, 0.3, 4.6, THATCH, 0, 0, 0, { transparent: true }); info.fade.push(a.material);
    const b = mk(new THREE.ConeGeometry(3.2, 1.0, 4), 0xb5523b, 0, 0.65, 0, { transparent: true }); b.rotation.y = Math.PI / 4; g.add(b); info.fade.push(b.material);
  } else if (type === 'table') { box(1.8, 0.14, 1.1, 0x8a5a33, 0, 0.75, 0); [[-0.75, -0.4], [0.75, -0.4], [-0.75, 0.4], [0.75, 0.4]].forEach(o => box(0.12, 0.7, 0.12, 0x6e4526, o[0], 0.35, o[1])); }
  else if (type === 'bed') { box(1.8, 0.35, 2.4, 0x7a5233, 0, 0.18, 0); box(1.7, 0.25, 2.2, 0x6d8cc2, 0, 0.45, 0); box(1.3, 0.2, 0.5, 0xfff1d6, 0, 0.65, -0.85); }
  else if (type === 'workbench') { box(1.8, 0.2, 0.9, 0x9a6a3a, 0, 0.9, 0); [[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35]].forEach(o => box(0.14, 0.9, 0.14, 0x7a5233, o[0], 0.45, o[1])); box(0.5, 0.12, 0.2, 0xcfcfd6, 0.4, 1.06, 0); box(0.14, 0.14, 0.5, 0x8a8a92, -0.4, 1.07, 0); }
  else if (type === 'campfire') {
    for (let i = 0; i < 3; i++) { const lg = mk(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 6), 0x6e4526, 0, 0.1, 0); lg.rotation.z = Math.PI / 2; lg.rotation.y = i * Math.PI / 3; g.add(lg); }
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, st = mk(new THREE.SphereGeometry(0.1, 6, 5), 0x8c8a85, Math.cos(a) * 0.42, 0.06, Math.sin(a) * 0.42); g.add(st); }
    const f1 = mk(new THREE.ConeGeometry(0.22, 0.6, 8), 0xff7a1a, 0, 0.45, 0, { emissive: 0xff5a00, emissiveIntensity: 1.4 }), f2 = mk(new THREE.ConeGeometry(0.12, 0.4, 8), 0xffd24a, 0, 0.45, 0, { emissive: 0xffc000, emissiveIntensity: 1.6 });
    g.add(f1); g.add(f2); info.flames.push(f1, f2);
  } else if (type === 'torch') {
    const st = mk(new THREE.CylinderGeometry(0.04, 0.06, 1.4, 6), 0x6e4526, 0, 0.7, 0); g.add(st);
    const f = mk(new THREE.ConeGeometry(0.12, 0.35, 8), 0xff9a2a, 0, 1.55, 0, { emissive: 0xff7a00, emissiveIntensity: 1.5 }); g.add(f); info.flames.push(f);
  } else if (type === 'bowl') { const b = mk(new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 0xb98a6a, 0, 0.3, 0); b.material.side = THREE.DoubleSide; g.add(b); }
  return info;
}
function addPieceObj(rec) {
  const info = buildPieceObj(rec.type, rec); info.obj.position.set(rec.x, rec.y, rec.z); info.obj.rotation.y = rec.yaw * Math.PI / 180;
  if (info.kind === 'wall') { const N = [[0, -1], [0, 1], [-1, 0], [1, 0]]; info.n = N[rec.edge] || [0, 1]; }
  pieceGroup.add(info.obj); pieceObjs.set(rec.id, info);
}
function clearPieceObjs() { pieceObjs.forEach(i => pieceGroup.remove(i.obj)); pieceObjs.clear(); }
function initBuildState() {
  clearPieceObjs(); bs = Build.create(world);
  Build.load(bs, saveData.pieces[world.name]); bs.list.forEach(addPieceObj);
  setBs(bs);
}


let fadeT = 0, lightT = 0;
function updatePieces(dt, t) {
  if (!bs) return; const c = com();
  // structures: roof and camera-facing walls fade when the creature is inside a floor footprint
  let inside = 0; for (const f of Build.PLACEABLE.length ? bs.list : []) if (f.type === 'foundation' && Math.abs(c[0] - f.x) < 2 && Math.abs(c[2] - f.z) < 2 && c[1] < f.top + 3.6 && c[1] > f.top - 1) inside = f.id;
  const cvx = Math.sin(az), cvz = Math.cos(az);
  pieceObjs.forEach(i => {
    if (i.kind) { let target = 1; if (inside && i.rec.fId === inside) { if (i.kind === 'roof') target = 0.08; else if (i.n[0] * cvx + i.n[1] * cvz > 0.2) target = 0.1; } i.fade.forEach(mt => { mt.opacity += (target - mt.opacity) * Math.min(1, dt * 8); mt.depthWrite = mt.opacity > 0.5; }); }
    if (i.flames.length) { const k = 1 + 0.18 * Math.sin(t * 13 + i.rec.id) + 0.1 * Math.sin(t * 7.3); i.flames.forEach((f, n) => f.scale.set(1, k * (n ? 1.1 : 1), 1)); }
  });
  lightT -= dt;
  if (lightT <= 0) { // the three nearest fires get real lights
    lightT = 0.4; const fires = bs.list.filter(p => Build.LIGHTS[p.type]).map(p => ({ p, d: Math.hypot(p.x - c[0], p.z - c[2]) })).sort((a, b) => a.d - b.d);
    fireLights.forEach((l, k) => { const f = fires[k]; if (f && f.d < 30) { l.position.set(f.p.x, f.p.y + 1.2, f.p.z); l.userData.on = true; } else l.userData.on = false; });
    if (fires.length && fires[0].d < 4) emoTrigger('cozy', 0.6);
  }
  fireLights.forEach((l, k) => { const target = l.userData.on ? 1.2 + 0.25 * Math.sin(t * 11 + k * 2) : 0; l.intensity += (target - l.intensity) * Math.min(1, dt * 6); });
}

// crafting panel
const craftBtns = [];
function nearBench() { const c = com(); return bs ? Build.nearBench(bs, c[0], c[2], Craft.BENCH_RANGE) : false; }
const craftPanel = createCraftPanel({ $, inv, craftBtns, nearBench, chime, onCraft: () => { corePulse = 1; }, saveSave, renderInv });
const renderCraft = craftPanel.renderCraft;
const refreshCraft = craftPanel.refreshCraft;

// build panel
const buildPanel = createBuildPanel({ $, scene, ghostMat, com, facing, inv, formKind, pieceGroup, pieceObjs, chime, emoTrigger, saveSave, renderInv });
const toggleBuild = buildPanel.toggleBuild;
const cyclePiece = buildPanel.cyclePiece;
const rotateGhost = buildPanel.rotateGhost;
const updateGhost = buildPanel.updateGhost;
const placeGhost = () => { buildPanel.placeGhost(addPieceObj, renderInv, chime, emoTrigger, saveSave); corePulse = 1; };
const removeNear = () => buildPanel.removeNear(renderInv, chime, saveSave);
const setBs = buildPanel.setBs;

const bPiece = $('bPiece');
Build.PLACEABLE.forEach(id => { const o = document.createElement('option'); o.value = id; o.textContent = Craft.ITEMS[id]; bPiece.appendChild(o); });
bPiece.value = buildPanel.selPiece; bPiece.addEventListener('change', () => { /* handled by buildPanel */ bPiece.blur(); });
$('bMode').addEventListener('click', e => { toggleBuild(); e.currentTarget.blur(); });
$('bRot').addEventListener('click', e => { rotateGhost(); e.currentTarget.blur(); });
$('bPlace').addEventListener('click', e => { placeGhost(); e.currentTarget.blur(); });
$('bRemove').addEventListener('click', e => { removeNear(); e.currentTarget.blur(); });
$('giveRes').addEventListener('click', e => { Craft.RES.forEach(k => { inv[k] = Math.min(Craft.stackCap(formKind), inv[k] + 10); }); renderInv(); saveSave(); e.currentTarget.blur(); });
$('c').addEventListener('pointerdown', () => { if (buildPanel.buildMode && !coarse) placeGhost(); });
craftReady = true; renderInv();

/* ================= main loop ================= */
let lastSample = null, prevVy = 0, idleT = 0, gT = 0;
const activeP = (function () {
  const PA = {};
  return function () { return Phys.formParams(formKind, P, PA); };
})();

function fixedStep(dt) {
  readInput(); Env.update(env, dt);
  const c = com(), s = Env.sample(env, c[0], c[1], c[2]);
  lastSample = s; curWx.type = s.weather.type; curWx.amt = s.weather.amt; inp.wind[0] = winp.wind[0] = s.wind[0]; inp.wind[1] = winp.wind[1] = s.wind[1]; inp.wind[2] = winp.wind[2] = s.wind[2];
  checkImpacts(dt);
  if (wisp) {
    winp.wetAmt = s.weather.type === 'rain' ? s.weather.amt : 0; winp.time = env.t;
    winp.bw = world.biomeAt ? world.biomeAt(c[0], c[2]) : [1, 0, 0, 0];
    Wisp.step(wisp, world, { speedMul: sizeSpeed() }, winp, dt);
  } else {
    P.gripMul = s.mat.mu; P.speedMul = s.mat.speed * sizeSpeed(); P.gscale = s.mat.gravity; P.jboost = s.mat.jump * sizeJump();
    if (tramCd > 0) tramCd -= dt;
    Phys.stepBody(body, world, activeP(), inp, dt);
    const v = body.vcom;
    if (body.groundTimer > 0 && prevVy < -10 && !body.pounding) { emoTrigger('surprised', 0.9); shakeAmp = Math.max(shakeAmp, 0.12); }
    prevVy = v[1];
    if (v[1] < -13) emoTrigger('surprised', 0.5);
    if (body.gliding || (body.jumpActive && body.peak > 0.3)) emoTrigger('happy', 0.35);
    if (springOn) emoTrigger('excited', 0.3);
    if (body.melt > 0.5 && s.weather.type === 'rain' && s.weather.amt > 0.5) emoTrigger('sad', 0.3);
  }
  const mv = Math.hypot(vcom()[0], vcom()[2]);
  if (moveMag > 0.05 || inp.jumpHeld || mv > 0.6) idleT = 0; else idleT += dt;
  if (idleT > 20) emoTrigger('sleepy', 0.3);
  handleEvents();
  const cc = com(); if (!isFinite(cc[0]) || !isFinite(cc[1]) || cc[1] < world.hmin - 25) spawnForm(formKind, world.spawn);
}

function render(dt) {
  gT += dt;
  if (formCd > 0) formCd -= dt;
  absorbFlowers(dt); updateItems(dt); updateShake(dt); updateHut(dt); updateHearts(dt); updateWings(dt);
  if (ringT < 0.6) { ringT += dt; const k = ringT / 0.6; ring.scale.setScalar(0.5 + k * 4.5); ring.material.opacity = 0.7 * (1 - k); } else ring.visible = false;
  updateWeather(dt);
  if (wisp) writeWisp(); else writeBodyMesh();
  updatePieces(dt, gT); updateGhost(); fadeT -= dt; if (fadeT <= 0) { fadeT = 0.4; refreshCraft(); }
  updateFace(dt); updateCosmetics(dt, gT); updateCore(dt, gT); updateCamera(dt); updateWindDebug(); updateHud(lastSample || Env.sample(env, 0, 0, 0));
  if (groundCulling) groundCulling(cam);
  renderer.render(scene, cam);
}


// R1-014/015/016 module wiring (moved inside initGame: needs $, profile, scene)
// (governor + quality live near the top: the quality select wiring uses them.)
const customizePanel = createCustomizePanel({
  $, profile, scene, syncLookColors, buildCore, spawnForm, emoManual,
  buildCosmetics, updateCosmetics, topC, botC, wingGeo, anchors, cosm, trailHist, makePoints, updatePointSizes, tryGLB,
  saveSoon, updateLastLabel: () => { lastLabel = ''; }
});
const buildCustomizeUI = customizePanel.buildCustomizeUI;
const makeHead = customizePanel.makeHead;
const makeBack = customizePanel.makeBack;
const makeFace = customizePanel.makeFace;

const input = createInput();
const inp = input.state;
const keys = input.keys;
const joy = input.joy;
input.attach();

const touchControls = createTouchControls({
  $, joy,
  touchJump: inp.touchJump, setTouchJump: (v) => { inp.touchJump = v; },
  pendingFloat: inp.pendingFloat, setPendingFloat: (v) => { inp.pendingFloat = v; },
  pendingPound: inp.pendingPound, setPendingPound: (v) => { inp.pendingPound = v; },
  toggleMelt: () => { toggleMelt(); },
  touchRide: inp.touchRide, setTouchRide: (v) => { inp.touchRide = v; }
});

const slowToggle = { setSlow: null };

startLoop({
  fixedStepFn: fixedStep,
  renderFn: render,
  governor,
  slowToggle
});


/* ================= init ================= */
const tsel = $('terrain');
Terrain.list.forEach(t => { const o = document.createElement('option'); o.value = t.id; o.textContent = t.label; tsel.appendChild(o); });
tsel.value = 'aetheria';
tsel.addEventListener('change', () => { flushSave(); loadTerrain(tsel.value).then(() => { spawnForm(formKind, world.spawn); lastLabel = ''; tsel.blur(); }); });
resize(); syncLookColors(); applyTime(14); buildCustomizeUI();
await loadTerrain('aetheria'); initBuildState(); spawnForm(formKind, world.spawn); syncLookColors();
if (window.__SLIMELAB_DEBUG) window.__lab = { spawnAt: (x, z) => spawnForm(formKind, [x, Phys.groundHeight(world, x, z) + 1.5, z]), inv: inv, com: () => com(), world: () => world };   // test hook, only when the flag is set
// NOTE: the rAF loop lives in startLoop() (app/loop.js, R1-016); no second loop here.

}
