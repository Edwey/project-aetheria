import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  createCutawayStandardMaterial,
  evaluateCutawayAlpha,
} from './cutaway-shader.js';

describe('Phase 0 Cutaway Shader Test', () => {
  it('creates material with properly bound cutaway uniforms', () => {
    const { material, uniforms } = createCutawayStandardMaterial(
      { color: 0x55aa66 },
      2.0,
      1.0
    );

    expect(material).toBeInstanceOf(THREE.MeshStandardMaterial);
    expect(uniforms.cutawayRadius.value).toBe(2.0);
    expect(uniforms.cutawayFeather.value).toBe(1.0);
    expect(uniforms.enabled.value).toBe(true);
    expect(uniforms.avatarPosition.value).toBeInstanceOf(THREE.Vector3);
  });

  it('correctly evaluates cutaway transparency based on distance to avatar', () => {
    const avatar = { x: 0, y: 1, z: 0 };
    const radius = 2.0;
    const feather = 1.0;

    // Directly above / around avatar within radius -> fully transparent (alpha = 0)
    const insideHole = { x: 0.5, y: 2.0, z: 0.5 };
    expect(evaluateCutawayAlpha(insideHole, avatar, radius, feather)).toBe(0.0);

    // Beyond radius + feather -> fully opaque (alpha = 1)
    const farAway = { x: 4.0, y: 2.0, z: 4.0 };
    expect(evaluateCutawayAlpha(farAway, avatar, radius, feather)).toBe(1.0);

    // Below avatar -> no cutaway (alpha = 1)
    const ground = { x: 0, y: 0.5, z: 0 };
    expect(evaluateCutawayAlpha(ground, avatar, radius, feather)).toBe(1.0);

    // Inside feather transition zone -> smooth gradient (0 < alpha < 1)
    const edge = { x: 2.5, y: 2.0, z: 0 };
    const edgeAlpha = evaluateCutawayAlpha(edge, avatar, radius, feather);
    expect(edgeAlpha).toBeGreaterThan(0.0);
    expect(edgeAlpha).toBeLessThan(1.0);
  });
});
