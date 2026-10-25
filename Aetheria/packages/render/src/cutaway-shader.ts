/**
 * Cutaway Shader Test (Phase 0) - Master Plan §10 & §12
 * 
 * Implements a circular dither cutaway on occluding geometry (cliffs, roofs, foliage)
 * so the creature is never obscured from the player's view.
 * 
 * Uses a 4x4 ordered Bayer dither pattern in screen-space or radial falloff in world-space.
 * Avoids depth-sorting artifacts and preserves full 60 FPS performance without a post-processing pass.
 */

import * as THREE from 'three';

export interface CutawayUniforms {
  avatarPosition: { value: THREE.Vector3 };
  cutawayRadius: { value: number };
  cutawayFeather: { value: number };
  screenSize: { value: THREE.Vector2 };
  enabled: { value: boolean };
}

export const CUTAWAY_SHADER_CHUNKS = {
  uniforms: `
    uniform vec3 uAvatarPosition;
    uniform float uCutawayRadius;
    uniform float uCutawayFeather;
    uniform vec2 uScreenSize;
    uniform bool uCutawayEnabled;
    varying vec3 vWorldPosition;
  `,

  vertexWorldPos: `
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  `,

  bayerDitherFragment: `
    // 4x4 Bayer dither threshold matrix
    float bayer4x4(vec2 p) {
      int x = int(mod(p.x, 4.0));
      int y = int(mod(p.y, 4.0));
      int index = x + y * 4;
      if (index == 0) return 0.0625;
      if (index == 1) return 0.5625;
      if (index == 2) return 0.1875;
      if (index == 3) return 0.6875;
      if (index == 4) return 0.8125;
      if (index == 5) return 0.3125;
      if (index == 6) return 0.9375;
      if (index == 7) return 0.4375;
      if (index == 8) return 0.2500;
      if (index == 9) return 0.7500;
      if (index == 10) return 0.1250;
      if (index == 11) return 0.6250;
      if (index == 12) return 1.0000;
      if (index == 13) return 0.5000;
      if (index == 14) return 0.8750;
      return 0.3750;
    }

    void applyCutawayDither(vec3 worldPos, vec3 avatarPos, float radius, float feather, bool enabled) {
      if (!enabled) return;
      
      // Calculate distance between camera line-of-sight and occluding geometry
      float distToAvatar = length(worldPos.xz - avatarPos.xz);
      
      // Only cut away if the occluding geometry is higher than avatar or blocking line of sight
      if (worldPos.y > avatarPos.y - 0.2 && distToAvatar < (radius + feather)) {
        float alpha = smoothstep(radius, radius + feather, distToAvatar);
        float threshold = bayer4x4(gl_FragCoord.xy);
        if (alpha < threshold) {
          discard;
        }
      }
    }
  `,
};

/**
 * Creates a MeshStandardMaterial with circular dither cutaway support.
 */
export function createCutawayStandardMaterial(
  parameters: THREE.MeshStandardMaterialParameters = {},
  radius = 1.8,
  feather = 0.8
): { material: THREE.MeshStandardMaterial; uniforms: CutawayUniforms } {
  const uniforms: CutawayUniforms = {
    avatarPosition: { value: new THREE.Vector3(0, 0, 0) },
    cutawayRadius: { value: radius },
    cutawayFeather: { value: feather },
    screenSize: {
      value: new THREE.Vector2(
        typeof window !== 'undefined' ? window.innerWidth : 1920,
        typeof window !== 'undefined' ? window.innerHeight : 1080
      ),
    },
    enabled: { value: true },
  };

  const material = new THREE.MeshStandardMaterial(parameters);

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uAvatarPosition = uniforms.avatarPosition;
    shader.uniforms.uCutawayRadius = uniforms.cutawayRadius;
    shader.uniforms.uCutawayFeather = uniforms.cutawayFeather;
    shader.uniforms.uScreenSize = uniforms.screenSize;
    shader.uniforms.uCutawayEnabled = uniforms.enabled;

    // Inject varying in vertex shader
    shader.vertexShader = `
      varying vec3 vWorldPosition;
      ${shader.vertexShader}
    `;

    // Calculate world position in vertex shader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `
      #include <worldpos_vertex>
      vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
      `
    );

    // Inject dither function and uniforms in fragment shader
    shader.fragmentShader = `
      ${CUTAWAY_SHADER_CHUNKS.uniforms}
      ${CUTAWAY_SHADER_CHUNKS.bayerDitherFragment}
      ${shader.fragmentShader}
    `;

    // Apply cutaway discard in fragment shader main()
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
      #include <dithering_fragment>
      applyCutawayDither(vWorldPosition, uAvatarPosition, uCutawayRadius, uCutawayFeather, uCutawayEnabled);
      `
    );
  };

  return { material, uniforms };
}

/**
 * CPU-side reference calculation for automated unit tests & validation.
 */
export function evaluateCutawayAlpha(
  worldPos: { x: number; y: number; z: number },
  avatarPos: { x: number; y: number; z: number },
  radius = 1.8,
  feather = 0.8
): number {
  const dx = worldPos.x - avatarPos.x;
  const dz = worldPos.z - avatarPos.z;
  const dist = Math.hypot(dx, dz);

  if (worldPos.y <= avatarPos.y - 0.2) {
    return 1.0; // Below ground level, no cutaway
  }

  if (dist >= radius + feather) {
    return 1.0; // Fully opaque outside cutaway zone
  }

  if (dist <= radius) {
    return 0.0; // Fully cut away (transparent)
  }

  // Smooth feather gradient
  const t = (dist - radius) / feather;
  return t * t * (3 - 2 * t);
}
