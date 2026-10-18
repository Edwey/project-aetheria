/**
 * Wisp Creature Mechanics & Forms Unit Tests (Phase 4)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createWorld as createECSWorld, getComponent } from '@core';
import {
  initPhysics,
  initPhysicsSystem,
  physicsSystem,
  createPhysicsEntity,
  RigidBodyComponent,
  getBodyLinearVelocity,
  setBodyLinearVelocity,
  type RigidBody,
  type PhysicsBody,
} from './index.js';
import {
  createWispEntity,
  setWispVariant,
  updateWisp,
  wispSystem,
  type WispInput,
} from './wisp-system.js';
import {
  WispComponentSymbol,
  WISP_PRESETS,
  WISP_BREATH,
  type WispComponent,
} from './wisp-components.js';

// ---- Helpers ----

function noInput(): WispInput {
  return {
    moveX: 0,
    moveZ: 0,
    riseHold: false,
    floatHold: false,
    condense: false,
    diffuse: false,
    downGust: false,
  };
}

// ---- Tests ----

describe('Wisp Creature Mechanics (Phase 4)', () => {
  beforeAll(async () => {
    await initPhysics();
  });

  // =========================================================================
  describe('Three Base Form Variants & Presets', () => {
    it('should spawn Wisp with default Cloud variant', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world);

      const entity = createWispEntity(world, {
        position: { x: 0, y: 5, z: 0 },
        variant: 'cloud',
      });

      const wisp = getComponent<WispComponent>(world, entity, WispComponentSymbol);
      expect(wisp).toBeDefined();
      expect(wisp!.variant).toBe('cloud');
      expect(wisp!.preset.moteCount).toBe(24);
      expect(wisp!.preset.driftSpeed).toBe(5.0);
    });

    it('should spawn Wisp with Motes variant (agile, sparse)', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world);

      const entity = createWispEntity(world, {
        position: { x: 0, y: 5, z: 0 },
        variant: 'motes',
      });

      const wisp = getComponent<WispComponent>(world, entity, WispComponentSymbol);
      expect(wisp).toBeDefined();
      expect(wisp!.variant).toBe('motes');
      expect(wisp!.preset.moteCount).toBe(10);
      expect(wisp!.preset.driftSpeed).toBe(7.5);  // Fastest variant
      expect(wisp!.preset.climbSpeed).toBe(3.5);
    });

    it('should spawn Wisp with Ring variant (orbiting pattern)', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world);

      const entity = createWispEntity(world, {
        position: { x: 0, y: 5, z: 0 },
        variant: 'ring',
      });

      const wisp = getComponent<WispComponent>(world, entity, WispComponentSymbol);
      expect(wisp).toBeDefined();
      expect(wisp!.variant).toBe('ring');
      expect(wisp!.preset.moteCount).toBe(12);
      expect(wisp!.preset.driftSpeed).toBe(5.5);
    });

    it('should dynamically switch Wisp variant via setWispVariant', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world);

      const entity = createWispEntity(world, { variant: 'cloud' });
      setWispVariant(world, entity, 'motes');

      const wisp = getComponent<WispComponent>(world, entity, WispComponentSymbol);
      expect(wisp!.variant).toBe('motes');
      expect(wisp!.preset).toEqual(WISP_PRESETS.motes);
      // Mote array should be rebuilt to new count
      expect(wisp!.moteOffsets.length).toBe(WISP_PRESETS.motes.moteCount);
    });

    it('should rebuild mote offsets on variant switch (Ring has orbiting formation)', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world);

      const entity = createWispEntity(world, { variant: 'cloud' });
      setWispVariant(world, entity, 'ring');

      const wisp = getComponent<WispComponent>(world, entity, WispComponentSymbol);
      expect(wisp!.moteOffsets.length).toBe(WISP_PRESETS.ring.moteCount);
      // Ring motes should all be roughly at y=0, spread in XZ plane
      for (const off of wisp!.moteOffsets) {
        expect(Math.abs(off.y)).toBeLessThan(0.1);
        const xzDist = Math.hypot(off.x, off.z);
        expect(xzDist).toBeGreaterThan(0.5);
      }
    });
  });

  // =========================================================================
  describe('Breath Resource Management', () => {
    it('should start with full breath (100)', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world);

      const entity = createWispEntity(world);
      const wisp = getComponent<WispComponent>(world, entity, WispComponentSymbol);
      expect(wisp!.breath).toBe(WISP_BREATH.MAX);
    });

    it('should deplete breath while rising (20 units/s)', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world);

      const entity = createWispEntity(world, { position: { x: 0, y: 20, z: 0 } });
      const dt = 1 / 60;

      // Rise for 1 second (60 frames)
      for (let i = 0; i < 60; i++) {
        updateWisp(world, entity, { ...noInput(), riseHold: true }, dt);
        physicsSystem(world, dt);
      }

      const wisp = getComponent<WispComponent>(world, entity, WispComponentSymbol);
      // Should have consumed ~20 breath units
      expect(wisp!.breath).toBeLessThan(82);
      expect(wisp!.breath).toBeGreaterThan(75);
    });

    it('should deplete breath more slowly while floating (3 units/s)', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world);

      const entity = createWispEntity(world, { position: { x: 0, y: 20, z: 0 } });
      const dt = 1 / 60;

      // Float for 1 second
      for (let i = 0; i < 60; i++) {
        updateWisp(world, entity, { ...noInput(), floatHold: true }, dt);
        physicsSystem(world, dt);
      }

      const wisp = getComponent<WispComponent>(world, entity, WispComponentSymbol);
      // Should have consumed ~3 breath units
      expect(wisp!.breath).toBeLessThan(98);
      expect(wisp!.breath).toBeGreaterThan(95);
    });

    it('should not deplete breath beyond 0', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world);

      const entity = createWispEntity(world, { position: { x: 0, y: 20, z: 0 } });
      const wisp = getComponent<WispComponent>(world, entity, WispComponentSymbol);
      wisp!.breath = 0;
      const dt = 1 / 60;

      // Try to rise with 0 breath
      for (let i = 0; i < 30; i++) {
        updateWisp(world, entity, { ...noInput(), riseHold: true }, dt);
      }

      expect(wisp!.breath).toBe(0);
    });

    it('should refill breath when near ground (< 2m height)', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world);

      // Create a ground plane
      createPhysicsEntity(world, {
        position: { x: 0, y: -0.5, z: 0 },
        mass: 0,
        shape: 'box',
        size: { x: 30, y: 0.5, z: 30 },
        isStatic: true,
      });

      // Spawn wisp close to ground
      const entity = createWispEntity(world, { position: { x: 0, y: 1.0, z: 0 } });
      const wisp = getComponent<WispComponent>(world, entity, WispComponentSymbol);
      wisp!.breath = 50; // Partially depleted

      const dt = 1 / 60;
      for (let i = 0; i < 60; i++) {
        updateWisp(world, entity, noInput(), dt);
        physicsSystem(world, dt);
      }

      // Should have refilled breath
      expect(wisp!.breath).toBeGreaterThan(50);
    });

    it('should NOT refill breath when far above ground', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world);

      // Create a ground plane far below
      createPhysicsEntity(world, {
        position: { x: 0, y: -100, z: 0 },
        mass: 0,
        shape: 'box',
        size: { x: 30, y: 0.5, z: 30 },
        isStatic: true,
      });

      // High up wisp
      const entity = createWispEntity(world, { position: { x: 0, y: 50, z: 0 } });
      const wisp = getComponent<WispComponent>(world, entity, WispComponentSymbol);
      wisp!.breath = 50;

      const dt = 1 / 60;
      for (let i = 0; i < 30; i++) {
        updateWisp(world, entity, noInput(), dt);
        physicsSystem(world, dt);
      }

      // Should NOT refill
      expect(wisp!.breath).toBe(50);
    });
  });

  // =========================================================================
  describe('Vertical Locomotion', () => {
    it('should rise upward when Space held (isRising=true)', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world, { x: 0, y: 0, z: 0 }); // zero gravity

      const entity = createWispEntity(world, { position: { x: 0, y: 5, z: 0 } });
      const rb = getComponent<RigidBody>(world, entity, RigidBodyComponent)!;
      const dt = 1 / 60;

      for (let i = 0; i < 10; i++) {
        updateWisp(world, entity, { ...noInput(), riseHold: true }, dt);
        physicsSystem(world, dt);
      }

      const vel = getBodyLinearVelocity(rb as unknown as PhysicsBody);
      expect(vel.y).toBeCloseTo(WISP_BREATH.RISE_VELOCITY, 0);
    });

    it('should float near-stationary vertically when floatHold (V key)', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world, { x: 0, y: 0, z: 0 });

      const entity = createWispEntity(world, { position: { x: 0, y: 5, z: 0 } });
      const rb = getComponent<RigidBody>(world, entity, RigidBodyComponent)!;

      // Give some initial downward velocity
      setBodyLinearVelocity(rb as unknown as PhysicsBody, { x: 0, y: -10, z: 0 });
      const dt = 1 / 60;

      for (let i = 0; i < 5; i++) {
        updateWisp(world, entity, { ...noInput(), floatHold: true }, dt);
        physicsSystem(world, dt);
      }

      const vel = getBodyLinearVelocity(rb as unknown as PhysicsBody);
      expect(Math.abs(vel.y)).toBeLessThan(0.5);
    });

    it('should gently sink when no control input', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world, { x: 0, y: 0, z: 0 }); // zero gravity

      const entity = createWispEntity(world, { position: { x: 0, y: 20, z: 0 } });
      const rb = getComponent<RigidBody>(world, entity, RigidBodyComponent)!;
      setBodyLinearVelocity(rb as unknown as PhysicsBody, { x: 0, y: 0, z: 0 });

      const dt = 1 / 60;
      // Run for 2 seconds with no input
      for (let i = 0; i < 120; i++) {
        updateWisp(world, entity, noInput(), dt);
        physicsSystem(world, dt);
      }

      const vel = getBodyLinearVelocity(rb as unknown as PhysicsBody);
      expect(vel.y).toBeCloseTo(WISP_BREATH.SINK_VELOCITY, 1);
    });

    it('should stop rising if breath is exhausted mid-rise', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world, { x: 0, y: 0, z: 0 });

      const entity = createWispEntity(world, { position: { x: 0, y: 10, z: 0 } });
      const wisp = getComponent<WispComponent>(world, entity, WispComponentSymbol);
      wisp!.breath = 3; // Almost empty (~0.15s of rise at 20/s)
      const dt = 1 / 60;

      // Drain breath to 0
      for (let i = 0; i < 20; i++) {
        updateWisp(world, entity, { ...noInput(), riseHold: true }, dt);
      }

      // Now breath == 0; next frame with riseHold should NOT set isRising
      expect(wisp!.breath).toBe(0);
      updateWisp(world, entity, { ...noInput(), riseHold: true }, dt);
      expect(wisp!.isRising).toBe(false);
    });
  });

  // =========================================================================
  describe('Down-Gust (F Key)', () => {
    it('should drive downward at -22 m/s on down-gust', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world, { x: 0, y: -9.8, z: 0 });

      const entity = createWispEntity(world, { position: { x: 0, y: 20, z: 0 } });
      const rb = getComponent<RigidBody>(world, entity, RigidBodyComponent)!;
      const dt = 1 / 60;

      updateWisp(world, entity, { ...noInput(), downGust: true }, dt);

      const vel = getBodyLinearVelocity(rb as unknown as PhysicsBody);
      expect(vel.y).toBeCloseTo(WISP_PRESETS.cloud.downGustVelocity, 0);
    });

    it('should disable controls during down-gust timeout (2s)', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world, { x: 0, y: 0, z: 0 });

      const entity = createWispEntity(world, { position: { x: 0, y: 30, z: 0 } });
      const wisp = getComponent<WispComponent>(world, entity, WispComponentSymbol);
      const rb = getComponent<RigidBody>(world, entity, RigidBodyComponent)!;
      const dt = 1 / 60;

      // Trigger down-gust
      updateWisp(world, entity, { ...noInput(), downGust: true }, dt);
      expect(wisp!.isDownGusting).toBe(true);

      // Immediately try to rise
      setBodyLinearVelocity(rb as unknown as PhysicsBody, { x: 0, y: -22, z: 0 });
      for (let i = 0; i < 5; i++) {
        updateWisp(world, entity, { ...noInput(), riseHold: true }, dt);
      }

      // Velocity should still be downward (rise blocked during gust)
      const vel = getBodyLinearVelocity(rb as unknown as PhysicsBody);
      expect(vel.y).toBeLessThan(0);
    });

    it('should re-enable controls after 2s down-gust timeout', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world, { x: 0, y: 0, z: 0 });

      const entity = createWispEntity(world, { position: { x: 0, y: 30, z: 0 } });
      const wisp = getComponent<WispComponent>(world, entity, WispComponentSymbol);
      const dt = 1 / 60;

      // Trigger down-gust
      updateWisp(world, entity, { ...noInput(), downGust: true }, dt);

      // Fast-forward 2.1 seconds
      for (let i = 0; i < 126; i++) {
        updateWisp(world, entity, noInput(), dt);
        physicsSystem(world, dt);
      }

      expect(wisp!.isDownGusting).toBe(false);
    });
  });

  // =========================================================================
  describe('Speed Modes: Condense & Diffuse', () => {
    it('should achieve 1.4x speed boost when condensed (C held)', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world, { x: 0, y: 0, z: 0 });

      const entityNormal = createWispEntity(world, { position: { x: 0, y: 5, z: 0 } });
      const entityCondensed = createWispEntity(world, { position: { x: 0, y: 5, z: 0 } });
      const dt = 1 / 60;

      // Run 30 frames both
      for (let i = 0; i < 30; i++) {
        updateWisp(world, entityNormal, { ...noInput(), moveZ: 1 }, dt);
        updateWisp(world, entityCondensed, { ...noInput(), moveZ: 1, condense: true }, dt);
        physicsSystem(world, dt);
      }

      const rbNorm = getComponent<RigidBody>(world, entityNormal, RigidBodyComponent)!;
      const rbCond = getComponent<RigidBody>(world, entityCondensed, RigidBodyComponent)!;
      const velNorm = getBodyLinearVelocity(rbNorm as unknown as PhysicsBody);
      const velCond = getBodyLinearVelocity(rbCond as unknown as PhysicsBody);

      expect(velCond.z).toBeGreaterThan(velNorm.z);
      // Condensed should approach 1.4x speed
      expect(velCond.z / velNorm.z).toBeGreaterThan(1.3);
    });

    it('should achieve 0.6x slow drift when diffused (M held)', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world, { x: 0, y: 0, z: 0 });

      const entityNormal = createWispEntity(world, { position: { x: 0, y: 5, z: 0 } });
      const entityDiffused = createWispEntity(world, { position: { x: 0, y: 5, z: 0 } });
      const dt = 1 / 60;

      for (let i = 0; i < 30; i++) {
        updateWisp(world, entityNormal, { ...noInput(), moveZ: 1 }, dt);
        updateWisp(world, entityDiffused, { ...noInput(), moveZ: 1, diffuse: true }, dt);
        physicsSystem(world, dt);
      }

      const rbNorm = getComponent<RigidBody>(world, entityNormal, RigidBodyComponent)!;
      const rbDiff = getComponent<RigidBody>(world, entityDiffused, RigidBodyComponent)!;
      const velNorm = getBodyLinearVelocity(rbNorm as unknown as PhysicsBody);
      const velDiff = getBodyLinearVelocity(rbDiff as unknown as PhysicsBody);

      expect(velDiff.z).toBeLessThan(velNorm.z);
      // Diffused should be ~0.6x speed
      expect(velDiff.z / velNorm.z).toBeLessThan(0.7);
    });
  });

  // =========================================================================
  describe('Mote Cluster Simulation', () => {
    it('should initialize mote offsets matching variant count', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world);

      for (const variant of ['cloud', 'motes', 'ring'] as const) {
        const entity = createWispEntity(world, { variant });
        const wisp = getComponent<WispComponent>(world, entity, WispComponentSymbol);
        expect(wisp!.moteOffsets.length).toBe(WISP_PRESETS[variant].moteCount);
        expect(wisp!.moteVelocities.length).toBe(WISP_PRESETS[variant].moteCount);
      }
    });

    it('should keep all motes within 2.2m tether after 120 update frames', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world);

      const entity = createWispEntity(world, { variant: 'motes' });
      const wisp = getComponent<WispComponent>(world, entity, WispComponentSymbol);
      const dt = 1 / 60;

      for (let i = 0; i < 120; i++) {
        updateWisp(world, entity, noInput(), dt);
        physicsSystem(world, dt);
      }

      const { tetherRadius } = WISP_PRESETS.motes;
      for (const off of wisp!.moteOffsets) {
        const dist = Math.sqrt(off.x * off.x + off.y * off.y + off.z * off.z);
        expect(dist).toBeLessThanOrEqual(tetherRadius + 0.001);
      }
    });

    it('all variants should keep motes within 2.2m tether', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world);
      const dt = 1 / 60;

      for (const variant of ['cloud', 'motes', 'ring'] as const) {
        const entity = createWispEntity(world, { variant });
        const wisp = getComponent<WispComponent>(world, entity, WispComponentSymbol);

        for (let i = 0; i < 60; i++) {
          updateWisp(world, entity, noInput(), dt);
        }

        const { tetherRadius } = WISP_PRESETS[variant];
        for (const off of wisp!.moteOffsets) {
          const dist = Math.sqrt(off.x * off.x + off.y * off.y + off.z * off.z);
          expect(dist).toBeLessThanOrEqual(tetherRadius + 0.001);
        }
      }
    });
  });

  // =========================================================================
  describe('Wisp System (multi-entity)', () => {
    it('should update multiple Wisp entities via wispSystem', async () => {
      const world = createECSWorld();
      await initPhysicsSystem(world, { x: 0, y: 0, z: 0 });

      const e1 = createWispEntity(world, { variant: 'cloud' });
      const e2 = createWispEntity(world, { variant: 'motes' });
      const dt = 1 / 60;

      const inputs = new Map<number, WispInput>([
        [e1, { ...noInput(), riseHold: true }],
        [e2, { ...noInput(), moveZ: 1 }],
      ]);

      for (let i = 0; i < 10; i++) {
        wispSystem(world, inputs, dt);
        physicsSystem(world, dt);
      }

      const rb1 = getComponent<RigidBody>(world, e1, RigidBodyComponent)!;
      const rb2 = getComponent<RigidBody>(world, e2, RigidBodyComponent)!;
      const vel1 = getBodyLinearVelocity(rb1 as unknown as PhysicsBody);
      const vel2 = getBodyLinearVelocity(rb2 as unknown as PhysicsBody);

      // e1 should be moving up
      expect(vel1.y).toBeGreaterThan(0);
      // e2 should be moving forward
      expect(vel2.z).toBeGreaterThan(0);
    });
  });
});
