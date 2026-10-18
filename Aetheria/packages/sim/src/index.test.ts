import { describe, it, expect, beforeAll } from 'vitest';
import { createWorld as createECSWorld, getComponent } from '@core';
import {
  initPhysics,
  initPhysicsSystem,
  physicsSystem,
  createPhysicsEntity,
  createHeightfieldTerrainEntity,
  destroyPhysicsEntity,
  applyForce,
  setVelocity,
  setEntityPosition,
  getGroundHeight,
  queryGroundHeight,
  castRay,
  createWorld as createRapierWorld,
  stepWorld,
  createDynamicBodyDesc,
  createStaticBodyDesc,
  createSphereColliderDesc,
  createBoxColliderDesc,
  createBodyInWorld,
  createColliderInWorld,
  getBodyPosition,
  TransformComponent,
  RigidBodyComponent,
  PhysicsWorldResource,
} from './index.js';
import type { Transform, RigidBody } from './index.js';

describe('Physics Integration (Phase 2)', () => {
  beforeAll(async () => {
    await initPhysics();
  });

  describe('Rapier WASM Wrapper', () => {
    it('should create world with gravity and step deterministically', () => {
      const gravity = { x: 0, y: -20, z: 0 };
      const worldA = createRapierWorld(gravity);
      const worldB = createRapierWorld(gravity);

      const bodyDescA = createDynamicBodyDesc({ x: 0, y: 10, z: 0 });
      const bodyDescB = createDynamicBodyDesc({ x: 0, y: 10, z: 0 });

      const bodyA = createBodyInWorld(worldA, bodyDescA);
      const bodyB = createBodyInWorld(worldB, bodyDescB);

      const colliderDescA = createSphereColliderDesc(0.5);
      const colliderDescB = createSphereColliderDesc(0.5);

      createColliderInWorld(worldA, colliderDescA, bodyA);
      createColliderInWorld(worldB, colliderDescB, bodyB);

      const dt = 1 / 60;
      for (let i = 0; i < 30; i++) {
        stepWorld(worldA, dt);
        stepWorld(worldB, dt);
      }

      const posA = getBodyPosition(bodyA);
      const posB = getBodyPosition(bodyB);

      expect(posA.y).toBeLessThan(10);
      expect(posA.y).toBeCloseTo(posB.y, 5);
      expect(posA.x).toBeCloseTo(posB.x, 5);
      expect(posA.z).toBeCloseTo(posB.z, 5);
    });

    it('should support raycasting against colliders', () => {
      const world = createRapierWorld({ x: 0, y: 0, z: 0 });
      const groundDesc = createStaticBodyDesc({ x: 0, y: 0, z: 0 });
      const groundBody = createBodyInWorld(world, groundDesc);
      const boxCollider = createBoxColliderDesc({ x: 10, y: 1, z: 10 });
      createColliderInWorld(world, boxCollider, groundBody);

      // Box has half-extents (10, 1, 10) centered at (0, 0, 0), so top surface is at y = 1
      const hit = castRay(world, { x: 0, y: 10, z: 0 }, { x: 0, y: -1, z: 0 }, 100);
      expect(hit).not.toBeNull();
      expect(hit!.point.y).toBeCloseTo(1, 2);
      expect(hit!.toi).toBeCloseTo(9, 2);
    });
  });

  describe('ECS Physics System', () => {
    it('should initialize physics world in ECS resources', async () => {
      const ecsWorld = createECSWorld();
      const physicsWorld = await initPhysicsSystem(ecsWorld);

      expect(physicsWorld).toBeDefined();
      expect(ecsWorld.resources.get(PhysicsWorldResource)).toBe(physicsWorld);
    });

    it('should sync falling sphere position from Rapier to ECS Transform', async () => {
      const ecsWorld = createECSWorld();
      await initPhysicsSystem(ecsWorld, { x: 0, y: -20, z: 0 });

      const sphereEntity = createPhysicsEntity(ecsWorld, {
        position: { x: 0, y: 10, z: 0 },
        mass: 1.0,
        shape: 'sphere',
        size: 0.5,
      });

      const transformBefore = getComponent<Transform>(ecsWorld, sphereEntity, TransformComponent);
      expect(transformBefore!.position.y).toBe(10);

      // Step physics system for 0.5s (30 frames at 60fps)
      const dt = 1 / 60;
      for (let i = 0; i < 30; i++) {
        physicsSystem(ecsWorld, dt);
      }

      const transformAfter = getComponent<Transform>(ecsWorld, sphereEntity, TransformComponent);
      expect(transformAfter!.position.y).toBeLessThan(10);
      expect(transformAfter!.position.y).toBeGreaterThan(0);
    });

    it('should collide dynamic sphere with static ground', async () => {
      const ecsWorld = createECSWorld();
      await initPhysicsSystem(ecsWorld, { x: 0, y: -20, z: 0 });

      // Create static ground box at y = -1 with half-height 1 (top surface at y = 0)
      createPhysicsEntity(ecsWorld, {
        position: { x: 0, y: -1, z: 0 },
        mass: 0,
        shape: 'box',
        size: { x: 50, y: 1, z: 50 },
        isStatic: true,
      });

      // Sphere with radius 0.5 dropped from y = 5
      const sphereEntity = createPhysicsEntity(ecsWorld, {
        position: { x: 0, y: 5, z: 0 },
        mass: 1.0,
        shape: 'sphere',
        size: 0.5,
        restitution: 0.0,
      });

      // Simulate 120 frames (2 seconds) for sphere to hit and settle on ground
      const dt = 1 / 60;
      for (let i = 0; i < 120; i++) {
        physicsSystem(ecsWorld, dt);
      }

      const transform = getComponent<Transform>(ecsWorld, sphereEntity, TransformComponent);
      // Sphere center should settle at ground top (y = 0) + radius (0.5) = y ~ 0.5
      expect(transform!.position.y).toBeCloseTo(0.5, 1);
    });

    it('should apply impulse force and set velocity', async () => {
      const ecsWorld = createECSWorld();
      await initPhysicsSystem(ecsWorld, { x: 0, y: 0, z: 0 }); // zero gravity

      const entity = createPhysicsEntity(ecsWorld, {
        position: { x: 0, y: 0, z: 0 },
        mass: 1.0,
        shape: 'sphere',
        size: 0.5,
      });

      // Apply force in X direction
      applyForce(ecsWorld, entity, { x: 10, y: 0, z: 0 });
      physicsSystem(ecsWorld, 1 / 60);

      const rigidBody = getComponent<RigidBody>(ecsWorld, entity, RigidBodyComponent);
      expect(rigidBody!.linearVelocity.x).toBeGreaterThan(0);

      // Directly set velocity
      setVelocity(ecsWorld, entity, { x: 0, y: 5, z: 0 });
      const updatedBody = getComponent<RigidBody>(ecsWorld, entity, RigidBodyComponent);
      expect(updatedBody!.linearVelocity.y).toBeCloseTo(5, 4);

      // Set entity position
      setEntityPosition(ecsWorld, entity, { x: 2, y: 3, z: 4 });
      const transform = getComponent<Transform>(ecsWorld, entity, TransformComponent);
      expect(transform!.position.x).toBe(2);
      expect(transform!.position.y).toBe(3);
      expect(transform!.position.z).toBe(4);
    });

    it('should cleanly destroy physics entity', async () => {
      const ecsWorld = createECSWorld();
      await initPhysicsSystem(ecsWorld);

      const entity = createPhysicsEntity(ecsWorld, {
        position: { x: 0, y: 5, z: 0 },
        mass: 1.0,
        shape: 'sphere',
        size: 0.5,
      });

      expect(() => destroyPhysicsEntity(ecsWorld, entity)).not.toThrow();
      expect(getComponent(ecsWorld, entity, RigidBodyComponent)).toBeUndefined();
    });
  });

  describe('Heightfield Terrain & Ground Height Queries', () => {
    it('should create heightfield terrain and query ground height', async () => {
      const ecsWorld = createECSWorld();
      const physicsWorld = await initPhysicsSystem(ecsWorld);

      // Create a 4x4 cell (5x5 vertex) heightfield terrain with fixed heights
      const nrows = 4;
      const ncols = 4;
      const numVertices = (nrows + 1) * (ncols + 1);
      const heights = new Float32Array(numVertices);
      for (let r = 0; r <= nrows; r++) {
        for (let c = 0; c <= ncols; c++) {
          heights[c * (nrows + 1) + r] = r * 0.5;
        }
      }

      const terrainScale = { x: 20, y: 1, z: 20 };
      const terrainEntity = createHeightfieldTerrainEntity(ecsWorld, {
        nrows,
        ncols,
        heights,
        scale: terrainScale,
        position: { x: 0, y: 0, z: 0 },
      });

      expect(terrainEntity).toBeDefined();

      // Query ground height at center
      const groundAtCenter = getGroundHeight(ecsWorld, 0, 0);
      expect(typeof groundAtCenter).toBe('number');

      // Direct ground query through physics wrapper
      const queryResult = queryGroundHeight(physicsWorld, 0, 0);
      expect(queryResult).not.toBeNull();
    });
  });
});
