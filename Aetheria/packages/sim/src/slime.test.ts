/**
 * Slime Creature Mechanics & Forms Unit Tests (Phase 3)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createWorld as createECSWorld, getComponent } from '@core';
import {
  initPhysics,
  initPhysicsSystem,
  physicsSystem,
  createPhysicsEntity,
  TransformComponent,
  RigidBodyComponent,
  getBodyPosition,
  getBodyLinearVelocity,
  setBodyLinearVelocity,
  setEntityPosition,
  createSlimeEntity,
  setSlimeVariant,
  updateSlime,
  SLIME_PRESETS,
  SLIME_CONSTANTS,
  SlimeComponentSymbol,
  type Transform,
  type SlimeComponent,
  type PhysicsBody,
  type RigidBody,
} from './index.js';

describe('Slime Creature Mechanics (Phase 3)', () => {
  beforeAll(async () => {
    await initPhysics();
  });

  describe('Three Base Form Variants & Presets', () => {
    it('should spawn Slime with default Jelly Ball variant', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world);

      const slimeEntity = createSlimeEntity(world, {
        position: { x: 0, y: 5, z: 0 },
        variant: 'jelly_ball',
      });

      const slimeComp = getComponent<SlimeComponent>(world, slimeEntity, SlimeComponentSymbol);
      expect(slimeComp).toBeDefined();
      expect(slimeComp!.variant).toBe('jelly_ball');
      expect(slimeComp!.preset.stiff).toBe(0.40);
      expect(slimeComp!.preset.restitution).toBe(0.65);
      expect(slimeComp!.preset.shape).toBe('sphere');
    });

    it('should spawn Slime with Goo variant (soft, sticky, high grip)', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world);

      const slimeEntity = createSlimeEntity(world, {
        position: { x: 0, y: 5, z: 0 },
        variant: 'goo',
      });

      const slimeComp = getComponent<SlimeComponent>(world, slimeEntity, SlimeComponentSymbol);
      expect(slimeComp).toBeDefined();
      expect(slimeComp!.variant).toBe('goo');
      expect(slimeComp!.preset.stiff).toBe(0.10);
      expect(slimeComp!.preset.sticky).toBe(0.80);
      expect(slimeComp!.preset.grip).toBe(0.80);
      expect(slimeComp!.preset.climbSpeed).toBe(3.5);
    });

    it('should spawn Slime with Jelly Cube variant (firm, stable, box)', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world);

      const slimeEntity = createSlimeEntity(world, {
        position: { x: 0, y: 5, z: 0 },
        variant: 'jelly_cube',
      });

      const slimeComp = getComponent<SlimeComponent>(world, slimeEntity, SlimeComponentSymbol);
      expect(slimeComp).toBeDefined();
      expect(slimeComp!.variant).toBe('jelly_cube');
      expect(slimeComp!.preset.stiff).toBe(0.45);
      expect(slimeComp!.preset.shape).toBe('box');
    });

    it('should dynamically switch variant via setSlimeVariant', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world);

      const slimeEntity = createSlimeEntity(world, { variant: 'jelly_ball' });
      setSlimeVariant(world, slimeEntity, 'goo');

      const slimeComp = getComponent<SlimeComponent>(world, slimeEntity, SlimeComponentSymbol);
      expect(slimeComp!.variant).toBe('goo');
      expect(slimeComp!.preset).toEqual(SLIME_PRESETS.goo);
    });
  });

  describe('Slime Movement & Idle Brake', () => {
    it('should accelerate horizontally with directional input', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world, { x: 0, y: 0, z: 0 }); // zero gravity

      const slimeEntity = createSlimeEntity(world, { position: { x: 0, y: 1, z: 0 } });
      const slimeComp = getComponent<SlimeComponent>(world, slimeEntity, SlimeComponentSymbol)!;
      slimeComp.isGrounded = true;

      // Apply forward move input (+Z) for 15 frames
      const dt = 1 / 60;
      for (let i = 0; i < 15; i++) {
        updateSlime(world, slimeEntity, { moveX: 0, moveZ: 1, jumpHold: false }, dt);
        physicsSystem(world, dt);
      }

      const rb = getComponent<RigidBody>(world, slimeEntity, RigidBodyComponent)!;
      const vel = getBodyLinearVelocity(rb as unknown as PhysicsBody);
      expect(vel.z).toBeGreaterThan(1.0);
      expect(vel.z).toBeLessThanOrEqual(SLIME_CONSTANTS.MAX_SPEED);
    });

    it('should clamp horizontal velocity to MAX_SPEED (6 m/s)', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world, { x: 0, y: 0, z: 0 });

      const slimeEntity = createSlimeEntity(world, { position: { x: 0, y: 1, z: 0 } });
      const slimeComp = getComponent<SlimeComponent>(world, slimeEntity, SlimeComponentSymbol)!;
      slimeComp.isGrounded = true;

      // Run 60 frames of acceleration
      const dt = 1 / 60;
      for (let i = 0; i < 60; i++) {
        updateSlime(world, slimeEntity, { moveX: 1, moveZ: 0, jumpHold: false }, dt);
        physicsSystem(world, dt);
      }

      const rb = getComponent<RigidBody>(world, slimeEntity, RigidBodyComponent)!;
      const vel = getBodyLinearVelocity(rb as unknown as PhysicsBody);
      expect(vel.x).toBeCloseTo(SLIME_CONSTANTS.MAX_SPEED, 1);
    });

    it('should apply idle brake when grounded without movement input', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world, { x: 0, y: 0, z: 0 });

      createPhysicsEntity(world, {
        position: { x: 0, y: -0.5, z: 0 },
        mass: 0,
        shape: 'box',
        size: { x: 20, y: 0.5, z: 20 },
        isStatic: true,
      });

      const slimeEntity = createSlimeEntity(world, { position: { x: 0, y: 0.5, z: 0 } });
      const rb = getComponent<RigidBody>(world, slimeEntity, RigidBodyComponent)!;
      setBodyLinearVelocity(rb as unknown as PhysicsBody, { x: 5, y: 0, z: 0 });

      // Run idle update for 10 frames
      const dt = 1 / 60;
      for (let i = 0; i < 10; i++) {
        updateSlime(world, slimeEntity, { moveX: 0, moveZ: 0, jumpHold: false }, dt);
        physicsSystem(world, dt);
      }

      const velAfter = getBodyLinearVelocity(rb as unknown as PhysicsBody);
      expect(velAfter.x).toBeLessThan(1.0);
    });
  });

  describe('Slime Charge Jump System', () => {
    it('should execute tap jump (JMIN ~4.5 impulse, rise ~0.5m)', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world, { x: 0, y: -20, z: 0 });

      // Static ground at y = -0.5 (surface at y = 0)
      createPhysicsEntity(world, {
        position: { x: 0, y: -0.5, z: 0 },
        mass: 0,
        shape: 'box',
        size: { x: 20, y: 0.5, z: 20 },
        isStatic: true,
      });

      // Spawn slime right on ground (y = 0.5, radius = 0.5)
      const slimeEntity = createSlimeEntity(world, { position: { x: 0, y: 0.5, z: 0 } });
      const dt = 1 / 60;

      // Settle on ground
      for (let i = 0; i < 10; i++) {
        updateSlime(world, slimeEntity, { moveX: 0, moveZ: 0, jumpHold: false }, dt);
        physicsSystem(world, dt);
      }

      const slimeComp = getComponent<SlimeComponent>(world, slimeEntity, SlimeComponentSymbol)!;
      expect(slimeComp.isGrounded).toBe(true);

      // Tap Space: hold 1 frame, then release
      updateSlime(world, slimeEntity, { moveX: 0, moveZ: 0, jumpHold: true }, dt);
      updateSlime(world, slimeEntity, { moveX: 0, moveZ: 0, jumpHold: false }, dt);

      // Track peak height reached
      let maxHeight = 0.5;
      for (let i = 0; i < 60; i++) {
        physicsSystem(world, dt);
        updateSlime(world, slimeEntity, { moveX: 0, moveZ: 0, jumpHold: false }, dt);
        const transform = getComponent<Transform>(world, slimeEntity, TransformComponent)!;
        if (transform.position.y > maxHeight) {
          maxHeight = transform.position.y;
        }
      }

      // Height rise above initial 0.5m: ~0.5m rise (reaches ~1.0m total height)
      const rise = maxHeight - 0.5;
      expect(rise).toBeGreaterThanOrEqual(0.40);
      expect(rise).toBeLessThanOrEqual(0.65);
    });

    it('should execute full charge jump (~5.3m rise)', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world, { x: 0, y: -20, z: 0 });

      createPhysicsEntity(world, {
        position: { x: 0, y: -0.5, z: 0 },
        mass: 0,
        shape: 'box',
        size: { x: 20, y: 0.5, z: 20 },
        isStatic: true,
      });

      const slimeEntity = createSlimeEntity(world, { position: { x: 0, y: 0.5, z: 0 } });
      const dt = 1 / 60;

      // Settle
      for (let i = 0; i < 10; i++) {
        updateSlime(world, slimeEntity, { moveX: 0, moveZ: 0, jumpHold: false }, dt);
        physicsSystem(world, dt);
      }

      // Charge jump for full 0.85s (51 frames at 60fps)
      for (let i = 0; i < 55; i++) {
        updateSlime(world, slimeEntity, { moveX: 0, moveZ: 0, jumpHold: true }, dt);
        physicsSystem(world, dt);
      }

      // Release jump
      updateSlime(world, slimeEntity, { moveX: 0, moveZ: 0, jumpHold: false }, dt);

      // Track apex
      let maxHeight = 0.5;
      for (let i = 0; i < 90; i++) {
        physicsSystem(world, dt);
        updateSlime(world, slimeEntity, { moveX: 0, moveZ: 0, jumpHold: false }, dt);
        const transform = getComponent<Transform>(world, slimeEntity, TransformComponent)!;
        if (transform.position.y > maxHeight) {
          maxHeight = transform.position.y;
        }
      }

      const rise = maxHeight - 0.5;
      expect(rise).toBeGreaterThanOrEqual(4.8);
      expect(rise).toBeLessThanOrEqual(6.0);
    });

    it('should multiply jump power by 1.35x when spring boost is active', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world, { x: 0, y: 0, z: 0 });

      createPhysicsEntity(world, {
        position: { x: 0, y: -0.5, z: 0 },
        mass: 0,
        shape: 'box',
        size: { x: 20, y: 0.5, z: 20 },
        isStatic: true,
      });

      const slimeEntity = createSlimeEntity(world, { position: { x: 0, y: 0.5, z: 0 } });
      const slimeComp = getComponent<SlimeComponent>(world, slimeEntity, SlimeComponentSymbol)!;

      const dt = 1 / 60;
      // Settle on ground
      for (let i = 0; i < 5; i++) {
        updateSlime(world, slimeEntity, { moveX: 0, moveZ: 0, jumpHold: false }, dt);
        physicsSystem(world, dt);
      }

      // Activate spring (C key)
      updateSlime(world, slimeEntity, { moveX: 0, moveZ: 0, jumpHold: false, spring: true }, dt);
      expect(slimeComp.isSpringReady).toBe(true);

      // Tap jump
      updateSlime(world, slimeEntity, { moveX: 0, moveZ: 0, jumpHold: true }, dt);
      updateSlime(world, slimeEntity, { moveX: 0, moveZ: 0, jumpHold: false }, dt);

      const rb = getComponent<RigidBody>(world, slimeEntity, RigidBodyComponent)!;
      const vel = getBodyLinearVelocity(rb as unknown as PhysicsBody);
      // Base jump with 1 frame charge (~4.7) * 1.35x spring boost is ~6.35 m/s
      expect(vel.y).toBeGreaterThan(6.0);
      expect(vel.y).toBeCloseTo(6.35, 1);
    });
  });

  describe('Slime Melting & Squeezing (M Key)', () => {
    it('should compress height below 0.6m and recover above 0.85m on release', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world);

      const slimeEntity = createSlimeEntity(world, { position: { x: 0, y: 2, z: 0 } });
      const dt = 1 / 60;

      // Hold melt for 30 frames
      for (let i = 0; i < 30; i++) {
        updateSlime(world, slimeEntity, { moveX: 0, moveZ: 0, jumpHold: false, melt: true }, dt);
      }

      const slimeComp = getComponent<SlimeComponent>(world, slimeEntity, SlimeComponentSymbol)!;
      const meltedHeight = slimeComp.scale.y * 1.0;
      expect(meltedHeight).toBeLessThan(0.60);
      expect(slimeComp.scale.x).toBeGreaterThan(1.2); // Expands horizontally

      // Release melt for 30 frames
      for (let i = 0; i < 30; i++) {
        updateSlime(world, slimeEntity, { moveX: 0, moveZ: 0, jumpHold: false, melt: false }, dt);
      }

      const recoveredHeight = slimeComp.scale.y * 1.0;
      expect(recoveredHeight).toBeGreaterThan(0.85);
    });
  });

  describe('Slime Gliding & Ground Pound', () => {
    it('should cap downward velocity to -2.2 m/s when gliding in air', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world, { x: 0, y: -20, z: 0 });

      const slimeEntity = createSlimeEntity(world, { position: { x: 0, y: 50, z: 0 } });
      const rb = getComponent<RigidBody>(world, slimeEntity, RigidBodyComponent)!;

      // Give entity high downward velocity (-15 m/s)
      setBodyLinearVelocity(rb as unknown as PhysicsBody, { x: 0, y: -15, z: 0 });

      const dt = 1 / 60;
      // Hold jump in air to glide
      for (let i = 0; i < 10; i++) {
        updateSlime(world, slimeEntity, { moveX: 0, moveZ: 0, jumpHold: true }, dt);
      }

      const vel = getBodyLinearVelocity(rb as unknown as PhysicsBody);
      expect(vel.y).toBeCloseTo(SLIME_CONSTANTS.GLIDE_FALL_CAP, 1);
    });

    it('should drive downward at -22 m/s on ground pound (F key)', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world, { x: 0, y: -20, z: 0 });

      const slimeEntity = createSlimeEntity(world, { position: { x: 0, y: 50, z: 0 } });
      const dt = 1 / 60;

      updateSlime(world, slimeEntity, { moveX: 0, moveZ: 0, jumpHold: false, groundPound: true }, dt);

      const rb = getComponent<RigidBody>(world, slimeEntity, RigidBodyComponent)!;
      const vel = getBodyLinearVelocity(rb as unknown as PhysicsBody);
      expect(vel.y).toBeCloseTo(-22.0, 1);
    });
  });

  describe('Sticky Wall Climbing', () => {
    it('should climb steep walls at climbSpeed when moving forward into them', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world, { x: 0, y: -20, z: 0 });

      // Create vertical wall at x = 1.0 (from y = 0 to y = 10, thickness 1 in X)
      createPhysicsEntity(world, {
        position: { x: 1.0, y: 5, z: 0 },
        mass: 0,
        shape: 'box',
        size: { x: 0.5, y: 5, z: 10 },
        isStatic: true,
      });

      // Place Goo slime right next to wall (x = 0.45)
      const slimeEntity = createSlimeEntity(world, {
        position: { x: 0.45, y: 2, z: 0 },
        variant: 'goo',
      });

      const dt = 1 / 60;
      // Push into wall (+X)
      for (let i = 0; i < 20; i++) {
        updateSlime(world, slimeEntity, { moveX: 1, moveZ: 0, jumpHold: false }, dt);
        physicsSystem(world, dt);
      }

      const slimeComp = getComponent<SlimeComponent>(world, slimeEntity, SlimeComponentSymbol)!;
      const rb = getComponent<RigidBody>(world, slimeEntity, RigidBodyComponent)!;
      const vel = getBodyLinearVelocity(rb as unknown as PhysicsBody);

      expect(slimeComp.isClimbing).toBe(true);
      expect(vel.y).toBeGreaterThan(1.0); // Climbing upward
    });
  });
});
