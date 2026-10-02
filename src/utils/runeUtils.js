import * as THREE from 'three';

export function createRuneTexture(bitString, glowColor = '#38bdf8') {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = glowColor;

  const bits = String(bitString ?? '').padEnd(256, '0').slice(0, 256);

  for (let i = 0; i < 256; i++) {
    if (bits[i] === '1') {
      const x = (i % 16) * 4;
      const y = Math.floor(i / 16) * 4;
      ctx.fillRect(x, y, 4, 4);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  return texture;
}
