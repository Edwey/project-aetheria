import { describe, it, expect } from 'vitest';
import {
  WaterPhysicsSystem,
  SimpleRiverCurrentField,
} from './water-physics.js';

describe('Phase 2 Water Physics & Hydrodynamics', () => {
  it('disables gliding and enables swimming when submerged fraction >= 8%', () => {
    // 5% submerged -> glide still allowed
    const dryRes = WaterPhysicsSystem.step({
      dt: 1 / 60,
      formId: 'oobleck',
      position: { x: 0, y: 0.33, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      waterSurfaceY: 0,
      bedY: -3,
      radius: 0.35,
      isRidingCurrent: false,
      isStrokeUp: false,
      moveInputX: 0,
      moveInputZ: 0,
    });
    expect(dryRes.isSwimming).toBe(false);
    expect(dryRes.glideAllowed).toBe(true);

    // Deep submerged -> glide disabled, swimming engaged
    const wetRes = WaterPhysicsSystem.step({
      dt: 1 / 60,
      formId: 'oobleck',
      position: { x: 0, y: -1.0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      waterSurfaceY: 0,
      bedY: -3,
      radius: 0.35,
      isRidingCurrent: false,
      isStrokeUp: false,
      moveInputX: 1.0,
      moveInputZ: 0,
    });
    expect(wetRes.isSwimming).toBe(true);
    expect(wetRes.glideAllowed).toBe(false);
  });

  it('drives swimming with form-specific acceleration forces', () => {
    // Standard slime: 9 m/s^2
    const slimeRes = WaterPhysicsSystem.step({
      dt: 1.0,
      formId: 'oobleck',
      position: { x: 0, y: -1, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      waterSurfaceY: 0,
      bedY: -3,
      radius: 0.35,
      isRidingCurrent: false,
      isStrokeUp: false,
      moveInputX: 1.0,
      moveInputZ: 0,
    });

    // Obsidian: 5 m/s^2
    const obsidianRes = WaterPhysicsSystem.step({
      dt: 1.0,
      formId: 'obsidian',
      position: { x: 0, y: -1, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      waterSurfaceY: 0,
      bedY: -3,
      radius: 0.40,
      isRidingCurrent: false,
      isStrokeUp: false,
      moveInputX: 1.0,
      moveInputZ: 0,
    });

    expect(slimeRes.velocity.x).toBeGreaterThan(obsidianRes.velocity.x);
  });

  it('strokes upward with Space up to 3.0 m/s cap (disabled for Obsidian)', () => {
    const dewdropRes = WaterPhysicsSystem.step({
      dt: 0.5,
      formId: 'dewdrop',
      position: { x: 0, y: -1.5, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      waterSurfaceY: 0,
      bedY: -3,
      radius: 0.34,
      isRidingCurrent: false,
      isStrokeUp: true,
      moveInputX: 0,
      moveInputZ: 0,
    });
    expect(dewdropRes.velocity.y).toBeGreaterThan(0);
    expect(dewdropRes.velocity.y).toBeLessThanOrEqual(3.0);

    const obsidianRes = WaterPhysicsSystem.step({
      dt: 0.5,
      formId: 'obsidian',
      position: { x: 0, y: -1.5, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      waterSurfaceY: 0,
      bedY: -3,
      radius: 0.40,
      isRidingCurrent: false,
      isStrokeUp: true,
      moveInputX: 0,
      moveInputZ: 0,
    });
    expect(obsidianRes.velocity.y).toBeLessThanOrEqual(0); // Cannot stroke upward
  });

  it('Oobleck and Aerolite plane across water when moving > 3.5 m/s', () => {
    const fastRes = WaterPhysicsSystem.step({
      dt: 1 / 60,
      formId: 'oobleck',
      position: { x: 0, y: -0.1, z: 0 },
      velocity: { x: 5.0, y: -0.5, z: 0 },
      waterSurfaceY: 0,
      bedY: -3,
      radius: 0.35,
      isRidingCurrent: false,
      isStrokeUp: false,
      moveInputX: 1.0,
      moveInputZ: 0,
    });

    expect(fastRes.isPlaning).toBe(true);
  });

  it('Rule 4: steady currents never move you unless Riding (Shift) is held', () => {
    const river = new SimpleRiverCurrentField({ x: 3.0, y: 0, z: 0 });

    // Not riding -> unaffected by current
    const idleRes = WaterPhysicsSystem.step({
      dt: 1 / 60,
      formId: 'oobleck',
      position: { x: 0, y: -0.5, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      waterSurfaceY: 0,
      bedY: -3,
      radius: 0.35,
      isRidingCurrent: false,
      isStrokeUp: false,
      moveInputX: 0,
      moveInputZ: 0,
      currentField: river,
    });
    expect(idleRes.velocity.x).toBe(0);

    // Riding downstream -> boosted up to +40%
    const rideRes = WaterPhysicsSystem.step({
      dt: 1 / 60,
      formId: 'oobleck',
      position: { x: 0, y: -0.5, z: 0 },
      velocity: { x: 2.0, y: 0, z: 0 },
      waterSurfaceY: 0,
      bedY: -3,
      radius: 0.35,
      isRidingCurrent: true,
      isStrokeUp: false,
      moveInputX: 1.0,
      moveInputZ: 0,
      currentField: river,
    });
    expect(rideRes.velocity.x).toBeGreaterThan(2.0);

    // Swimming upstream against current -> NEVER slowed down
    const upstreamRes = WaterPhysicsSystem.step({
      dt: 1 / 60,
      formId: 'oobleck',
      position: { x: 0, y: -0.5, z: 0 },
      velocity: { x: -2.0, y: 0, z: 0 },
      waterSurfaceY: 0,
      bedY: -3,
      radius: 0.35,
      isRidingCurrent: true,
      isStrokeUp: false,
      moveInputX: -1.0,
      moveInputZ: 0,
      currentField: river,
    });
    expect(upstreamRes.velocity.x).toBeLessThanOrEqual(-2.0);
  });
});
