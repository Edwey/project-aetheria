import { describe, it, expect } from 'vitest';
import {
  RigidProxySimulator,
  SoftBodySimulator,
  FlatHeightfieldWithTrench,
  runPhase0SpikeComparison,
  collideStaticBodies,
  createStaticAABB,
} from './physics-spike.js';

describe('Phase 0 Physics Spike', () => {
  describe('Test 1: Bounce Test (restitution 0.85)', () => {
    it('achieves at least 5 clearly visible bounces with rigid proxy from 4m drop', () => {
      const dt = 1 / 60;
      const world = new FlatHeightfieldWithTrench(0, 0, 0);
      const simulator = new RigidProxySimulator(
        { restitution: 0.85, mass: 1.2, radius: 0.35 },
        { x: 0, y: 4, z: 0 }
      );

      // Run 300 steps (5.0s simulation)
      for (let i = 0; i < 300; i++) {
        simulator.step(dt, world);
      }

      // Exit criterion: >= 5 clearly visible bounces
      expect(simulator.bounceCount).toBeGreaterThanOrEqual(5);
      // Settles on or near resting radius
      expect(simulator.pos.y).toBeLessThan(0.6);
      expect(simulator.pos.y).toBeGreaterThanOrEqual(0.35);
    });

    it('soft body absorbs rebound energy without artificial boost', () => {
      const dt = 1 / 60;
      const world = new FlatHeightfieldWithTrench(0, 0, 0);
      const softBody = new SoftBodySimulator(2, 0.35, { x: 0, y: 4, z: 0 }, 0.85);

      for (let i = 0; i < 180; i++) {
        softBody.step(dt, world);
      }

      // Soft body settles rapidly due to internal strain damping
      expect(softBody.com.y).toBeLessThan(1.5);
    });
  });

  describe('Test 2: Tight Spaces Test (0.5m Grate / Gap)', () => {
    it('rigid proxy passes 100 times through 0.5m grate without tunneling', () => {
      const dt = 1 / 60;
      const world = new FlatHeightfieldWithTrench(0, 0, 0);
      const ceilingY = 0.5;
      let passes = 0;
      let tunnels = 0;

      for (let p = 0; p < 100; p++) {
        const rp = new RigidProxySimulator({ radius: 0.22 }, { x: -2, y: 0.25, z: 0 });

        let ok = false;
        for (let s = 0; s < 60; s++) {
          rp.step(dt, world, ceilingY, 4.0);
          if (rp.pos.y + rp.config.radius > ceilingY + 0.05 || rp.pos.y - rp.config.radius < -0.05) {
            tunnels++;
          }
          if (rp.pos.x > 1.5) {
            ok = true;
            break;
          }
        }
        if (ok) passes++;
      }

      expect(passes).toBe(100);
      expect(tunnels).toBe(0);
    });
  });

  describe('Test 3: Ditch / Trench Test', () => {
    it('allows Geode (diameter 0.9m) to roll smoothly across a 0.4m trench', () => {
      const dt = 1 / 60;
      const trenchWorld = new FlatHeightfieldWithTrench(0.4, 0.3, 0);
      const geode = new RigidProxySimulator(
        { radius: 0.45, mass: 3.5, restitution: 0.4, friction: 0.05 },
        { x: -1.5, y: 0.45, z: 0 }
      );

      let crossed = false;
      for (let s = 0; s < 100; s++) {
        geode.step(dt, trenchWorld, undefined, 3.0);
        // Geode stays elevated on rims
        expect(geode.pos.y).toBeGreaterThan(0.25);
        if (geode.pos.x > 1.0) {
          crossed = true;
          break;
        }
      }

      expect(crossed).toBe(true);
    });

    it('allows walking avatar to drop in and walk through the trench', () => {
      const dt = 1 / 60;
      const trenchWorld = new FlatHeightfieldWithTrench(0.4, 0.3, 0);
      const avatar = new RigidProxySimulator(
        { radius: 0.18, mass: 1.2, maxStepHeight: 0.35 },
        { x: -1.0, y: 0.18, z: 0 }
      );

      let reachedTrenchBottom = false;
      let exitedTrench = false;

      for (let s = 0; s < 120; s++) {
        avatar.step(dt, trenchWorld, undefined, 1.5);
        if (avatar.pos.y < 0.0) {
          reachedTrenchBottom = true;
        }
        if (reachedTrenchBottom && avatar.pos.x > 0.5) {
          exitedTrench = true;
          break;
        }
      }

      expect(reachedTrenchBottom).toBe(true);
      expect(exitedTrench).toBe(true);
    });
  });

  describe('Master Plan Exit Gate Benchmark', () => {
    it('executes full Phase 0 comparison harness and reports performance metrics', () => {
      const results = runPhase0SpikeComparison();

      expect(results.bounceTest.gatePassed).toBe(true);
      expect(results.tightSpacesTest.gatePassed).toBe(true);
      expect(results.ditchTest.gatePassed).toBe(true);
      expect(results.benchmark.rigidProxyMsPerStep).toBeLessThan(0.1);
      expect(results.benchmark.speedupFactor).toBeGreaterThan(1.2);
    });
  });
});

describe('Sphere-vs-AABB Collision (collideStaticBodies)', () => {
  it('pushes sphere out of a static box and reflects velocity', () => {
    const sim = new RigidProxySimulator(
      { radius: 0.35 },
      { x: 0.7, y: 0.5, z: 0 }  // sphere edge at 0.35, box edge at 0.5 → overlap!
    );
    // Move sphere toward the box
    sim.vel.x = -5;

    const box = createStaticAABB(0, 0.5, 0, 1.0, 1.0, 1.0, 0.5, 0.0);

    const contacts = collideStaticBodies(sim, [box]);
    expect(contacts).toBe(1);

    // Sphere should have been pushed outside the box
    const distToBoxEdge = sim.pos.x - (box.cx + box.hx);
    expect(distToBoxEdge).toBeGreaterThanOrEqual(sim.config.radius - 0.01);

    // Velocity should have been reflected (was negative, now positive)
    expect(sim.vel.x).toBeGreaterThan(0);
  });

  it('does not trigger collision when sphere is far from box', () => {
    const sim = new RigidProxySimulator(
      { radius: 0.35 },
      { x: 10, y: 0.5, z: 0 }
    );
    sim.vel.x = -1;

    const box = createStaticAABB(0, 0.5, 0, 1.0, 1.0, 1.0);

    const contacts = collideStaticBodies(sim, [box]);
    expect(contacts).toBe(0);
    // Position unchanged
    expect(sim.pos.x).toBe(10);
  });

  it('resolves collisions with multiple boxes independently', () => {
    // Sphere between two boxes
    const sim = new RigidProxySimulator(
      { radius: 0.35 },
      { x: 0, y: 0.5, z: 0 }
    );
    sim.vel.x = 0;

    // Two boxes close together creating a corridor
    const boxLeft = createStaticAABB(-0.5, 0.5, 0, 0.6, 1.0, 1.0);
    const boxRight = createStaticAABB(0.5, 0.5, 0, 0.6, 1.0, 1.0);

    const contacts = collideStaticBodies(sim, [boxLeft, boxRight]);
    // Should resolve against at least one box (sphere may be squeezed)
    expect(contacts).toBeGreaterThanOrEqual(1);
  });

  it('applies restitution correctly — high restitution = faster bounce', () => {
    const sim1 = new RigidProxySimulator({ radius: 0.35 }, { x: 0.7, y: 0.5, z: 0 });
    sim1.vel.x = -5;
    const boxBouncy = createStaticAABB(0, 0.5, 0, 1.0, 1.0, 1.0, 0.9, 0.0);
    collideStaticBodies(sim1, [boxBouncy]);
    const bouncyVx = sim1.vel.x;

    const sim2 = new RigidProxySimulator({ radius: 0.35 }, { x: 0.7, y: 0.5, z: 0 });
    sim2.vel.x = -5;
    const boxDead = createStaticAABB(0, 0.5, 0, 1.0, 1.0, 1.0, 0.0, 0.0);
    collideStaticBodies(sim2, [boxDead]);
    const deadVx = sim2.vel.x;

    // Bouncy restitution should produce faster rebound than dead
    expect(bouncyVx).toBeGreaterThan(deadVx);
  });
});
