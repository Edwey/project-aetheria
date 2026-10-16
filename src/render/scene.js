/**
 * Scene module - Three.js scene, renderer, camera, lights, resize, time-of-day.
 * Ported verbatim from game.js (R1-001).
 */

import * as THREE from 'three';

/**
 * @param {boolean} coarse - true for low-quality (touch devices)
 * @param {HTMLElement} canvas - the <canvas id="c"> element
 * @returns {object} { renderer, scene, cam, view, pxPerM, resize, applyTime, pointMats, updatePointSizes, sun, hemi, sunOff, hutLight, checker, softTex }
 */
export function createScene(coarse, canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !coarse });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcfe9f3);

  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 500);
  let view = 9;

  const pointMats = [];

  function pxPerM() { return window.innerHeight / (2 * view); }

  function updatePointSizes() {
    pointMats.forEach(p => { p[0].size = Math.max(2, p[1] * pxPerM()); });
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight, a = w / h;
    renderer.setSize(w, h, false);
    cam.left = -view * a; cam.right = view * a; cam.top = view; cam.bottom = -view;
    cam.updateProjectionMatrix();
    updatePointSizes();
  }
  window.addEventListener('resize', resize);

  // Lights
  const hemi = new THREE.HemisphereLight(0xe8f6ff, 0x7d8c6a, 0.95);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff3dc, 1.15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
  const sc = sun.shadow.camera;
  sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 120;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.04;
  scene.add(sun);
  scene.add(sun.target);

  // Time-of-day colors
  const SKY_DAY = new THREE.Color(0xcfe9f3);
  const SKY_DUSK = new THREE.Color(0xf2a56b);
  const SKY_NIGHT = new THREE.Color(0x0b1330);
  const SUN_C = new THREE.Color(0xfff3dc);
  const MOON_C = new THREE.Color(0x8da2ff);

  // Procedural textures
  const checker = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 2; const g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 2, 2); g.fillStyle = '#e3e8e0'; g.fillRect(1, 0, 1, 1); g.fillRect(0, 1, 1, 1);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter; t.encoding = THREE.sRGBEncoding; return t;
  })();

  const softTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
  })();

  // Smoothstep helper (copied from game.js)
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;

  // Time-of-day application
  const SKY_DAY_C = new THREE.Color(0xcfe9f3);
  const SKY_DUSK_C = new THREE.Color(0xf2a56b);
  const SKY_NIGHT_C = new THREE.Color(0x0b1330);
  const SUN_C_C = new THREE.Color(0xfff3dc);
  const MOON_C_C = new THREE.Color(0x8da2ff);

  // sun position offset for time-of-day
  const sunOffVec = new THREE.Vector3(14, 26, 9);
  let hutLight = null;

  function applyTime(t) {
    const ang = (t - 6) / 12 * Math.PI, sh = Math.sin(ang), day = sm(-0.05, 0.25, sh);
    sun.intensity = lerp(0.4, 1.15, day);
    sun.color.copy(MOON_C_C).lerp(SUN_C_C, day);
    hemi.intensity = lerp(0.35, 0.95, day);
    sunOffVec.set(-Math.cos(ang) * 20, 8 + 22 * Math.abs(sh), 9);
    const c = scene.background;
    if (sh > 0) c.copy(SKY_DUSK_C).lerp(SKY_DAY_C, sm(0.0, 0.45, sh));
    else c.copy(SKY_DUSK_C).lerp(SKY_NIGHT_C, sm(0.0, -0.3, sh));
    if (hutLight) hutLight.intensity = lerp(1.3, 0.7, day);
    // time display is handled in game.js
  }

  // Initial resize
  const w = window.innerWidth, h = window.innerHeight, a = w / h;
  renderer.setSize(w, h, false);
  cam.left = -view * a; cam.right = view * a; cam.top = view; cam.bottom = -view;
  cam.updateProjectionMatrix();

  return {
    renderer,
    scene,
    cam,
    view,
    pxPerM,
    resize,
    applyTime,
    pointMats,
    updatePointSizes: () => pointMats.forEach(p => { p[0].size = Math.max(2, p[1] * pxPerM()); }),
    sun,
    hemi,
    sunOffVec,
    hutLightRef: hutLight,
    checker,
    softTex,
    SKY_DAY: SKY_DAY_C,
    SKY_DUSK: SKY_DUSK_C,
    SKY_NIGHT: SKY_NIGHT_C,
    SUN_C: SUN_C_C,
    MOON_C: MOON_C_C,
    sm,
    lerp,
  };
}