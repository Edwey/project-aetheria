/**
 * Textures and shader utilities for Aetheria creatures
 */

import * as THREE from 'three';

/**
 * Generate a soft circular glow texture dynamically via HTML Canvas.
 * Matches the softTex used in Aetheria.html for motes, dust, and particle glows.
 */
let cachedSoftTex: THREE.CanvasTexture | null = null;

export function getSoftCircleTexture(): THREE.CanvasTexture {
  if (cachedSoftTex) return cachedSoftTex;

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.85)');
    gradient.addColorStop(0.65, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cachedSoftTex = texture;
  return texture;
}

/**
 * Inverted Hull Outline Shader Material.
 * Pushes vertices along their normals and renders backfaces to create a crisp cartoon outline.
 */
export function createOutlineMaterial(color = 0x1c4a2a, thickness = 0.035): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      outlineColor: { value: new THREE.Color(color) },
      thickness: { value: thickness },
    },
    vertexShader: `
      uniform float thickness;
      void main() {
        vec3 normalDir = normalize(normal);
        vec3 displacedPos = position + normalDir * thickness;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 outlineColor;
      void main() {
        gl_FragColor = vec4(outlineColor, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: true,
  });
}
