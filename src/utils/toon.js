import * as THREE from 'three';

let ramp;

export function getToonRamp() {
  if (ramp) return ramp;
  const canvas = document.createElement('canvas');
  canvas.width = 5;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  const stops = ['#2a2a32', '#5c5348', '#8f8678', '#c9c0b0', '#f4efe4'];
  stops.forEach((hex, i) => {
    ctx.fillStyle = hex;
    ctx.fillRect(i, 0, 1, 1);
  });
  ramp = new THREE.CanvasTexture(canvas);
  ramp.minFilter = THREE.NearestFilter;
  ramp.magFilter = THREE.NearestFilter;
  ramp.needsUpdate = true;
  return ramp;
}

export function applyToon(root, { glow = 0.28, emissive = '#5eead4' } = {}) {
  const gradientMap = getToonRamp();
  const emissiveColor = new THREE.Color(emissive);

  root.traverse((child) => {
    if (!child.isMesh) return;
    const src = Array.isArray(child.material) ? child.material[0] : child.material;
    const color = src?.color ? src.color.clone() : new THREE.Color('#9aa78c');
    const map = src?.map ?? null;
    const vertexColors = Boolean(child.geometry?.attributes?.color);

    const mat = new THREE.MeshToonMaterial({
      color,
      map,
      gradientMap,
      vertexColors,
      emissive: emissiveColor.clone(),
      emissiveIntensity: 0,
    });
    mat.userData.glow = glow;
    child.material = mat;
    child.castShadow = true;
    child.receiveShadow = true;
  });
}
