/**
 * Rapier WASM physics wrapper
 */

import RAPIER from '@dimforge/rapier3d-compat';
import type { Resource } from '@core';

export interface PhysicsWorld extends Resource {
  world: RAPIER.World;
  gravity: { x: number; y: number; z: number };
}

export interface PhysicsBody {
  handle: RAPIER.RigidBody;
}

export interface PhysicsCollider {
  handle: RAPIER.Collider;
}

export interface RayHit {
  toi: number;
  point: { x: number; y: number; z: number };
  normal?: { x: number; y: number; z: number };
}

let rapierInitialized = false;

/**
 * Initialize Rapier physics
 */
export async function initPhysics(): Promise<void> {
  if (!rapierInitialized) {
    await RAPIER.init();
    rapierInitialized = true;
  }
}

/**
 * Check if Rapier is initialized
 */
export function isPhysicsInitialized(): boolean {
  return rapierInitialized;
}

/**
 * Create a physics world
 */
export function createWorld(gravity: { x: number; y: number; z: number } = { x: 0, y: -20, z: 0 }): PhysicsWorld {
  const world = new RAPIER.World(gravity);
  return {
    world,
    gravity,
  };
}

/**
 * Step the physics simulation
 */
export function stepWorld(physicsWorld: PhysicsWorld, dt: number): void {
  physicsWorld.world.timestep = dt;
  physicsWorld.world.step();
}

/**
 * Create a dynamic rigid body description
 */
export function createDynamicBodyDesc(
  position: { x: number; y: number; z: number },
  rotation: { x: number; y: number; z: number; w: number } = { x: 0, y: 0, z: 0, w: 1 }
): RAPIER.RigidBodyDesc {
  return RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(position.x, position.y, position.z)
    .setRotation({ x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w });
}

/**
 * Create a static rigid body description
 */
export function createStaticBodyDesc(
  position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
  rotation: { x: number; y: number; z: number; w: number } = { x: 0, y: 0, z: 0, w: 1 }
): RAPIER.RigidBodyDesc {
  return RAPIER.RigidBodyDesc.fixed()
    .setTranslation(position.x, position.y, position.z)
    .setRotation({ x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w });
}

/**
 * Backward compatibility alias for createDynamicBodyDesc
 */
export const createDynamicBody = createDynamicBodyDesc;

/**
 * Backward compatibility alias for createStaticBodyDesc
 */
export const createStaticBody = createStaticBodyDesc;

/**
 * Create a sphere collider description
 */
export function createSphereColliderDesc(radius: number): RAPIER.ColliderDesc {
  return RAPIER.ColliderDesc.ball(radius);
}

/**
 * Create a box collider description
 */
export function createBoxColliderDesc(halfExtents: { x: number; y: number; z: number }): RAPIER.ColliderDesc {
  return RAPIER.ColliderDesc.cuboid(halfExtents.x, halfExtents.y, halfExtents.z);
}

/**
 * Create a heightfield collider description
 * In Rapier 3D:
 * - nrows: number of subdivision cells along X/Z
 * - ncols: number of subdivision cells along Z/X
 * - heights: Float32Array containing (nrows + 1) * (ncols + 1) height values
 * - scale: { x, y, z } bounding dimension
 */
export function createHeightfieldColliderDesc(
  nrows: number,
  ncols: number,
  heights: Float32Array,
  scale: { x: number; y: number; z: number }
): RAPIER.ColliderDesc {
  const expectedLen = (nrows + 1) * (ncols + 1);
  if (heights.length !== expectedLen) {
    throw new Error(
      `Heightfield heights length (${heights.length}) does not match expected (nrows + 1) * (ncols + 1) = ${expectedLen}`
    );
  }
  return RAPIER.ColliderDesc.heightfield(nrows, ncols, heights, scale);
}

/**
 * Create rigid body in world
 */
export function createBodyInWorld(physicsWorld: PhysicsWorld, bodyDesc: RAPIER.RigidBodyDesc): PhysicsBody {
  const handle = physicsWorld.world.createRigidBody(bodyDesc);
  return { handle };
}

/**
 * Create collider in world
 */
export function createColliderInWorld(
  physicsWorld: PhysicsWorld,
  colliderDesc: RAPIER.ColliderDesc,
  parentBody?: PhysicsBody
): PhysicsCollider {
  const handle = physicsWorld.world.createCollider(colliderDesc, parentBody?.handle);
  return { handle };
}

/**
 * Remove body from world
 */
export function removeBodyFromWorld(physicsWorld: PhysicsWorld, body: PhysicsBody): void {
  physicsWorld.world.removeRigidBody(body.handle);
}

/**
 * Remove collider from world
 */
export function removeColliderFromWorld(physicsWorld: PhysicsWorld, collider: PhysicsCollider, wakeUp = true): void {
  physicsWorld.world.removeCollider(collider.handle, wakeUp);
}

/**
 * Get body position
 */
export function getBodyPosition(body: PhysicsBody): { x: number; y: number; z: number } {
  const pos = body.handle.translation();
  return { x: pos.x, y: pos.y, z: pos.z };
}

/**
 * Set body position
 */
export function setBodyPosition(body: PhysicsBody, pos: { x: number; y: number; z: number }): void {
  body.handle.setTranslation({ x: pos.x, y: pos.y, z: pos.z }, true);
}

/**
 * Get body rotation
 */
export function getBodyRotation(body: PhysicsBody): { x: number; y: number; z: number; w: number } {
  const rot = body.handle.rotation();
  return { x: rot.x, y: rot.y, z: rot.z, w: rot.w };
}

/**
 * Set body rotation
 */
export function setBodyRotation(body: PhysicsBody, rot: { x: number; y: number; z: number; w: number }): void {
  body.handle.setRotation({ x: rot.x, y: rot.y, z: rot.z, w: rot.w }, true);
}

/**
 * Get body linear velocity
 */
export function getBodyLinearVelocity(body: PhysicsBody): { x: number; y: number; z: number } {
  const vel = body.handle.linvel();
  return { x: vel.x, y: vel.y, z: vel.z };
}

/**
 * Set body linear velocity
 */
export function setBodyLinearVelocity(body: PhysicsBody, vel: { x: number; y: number; z: number }): void {
  body.handle.setLinvel({ x: vel.x, y: vel.y, z: vel.z }, true);
}

/**
 * Apply impulse to body
 */
export function applyImpulse(body: PhysicsBody, impulse: { x: number; y: number; z: number }): void {
  body.handle.applyImpulse({ x: impulse.x, y: impulse.y, z: impulse.z }, true);
}

/**
 * Cast a ray into the physics world
 */
export function castRay(
  physicsWorld: PhysicsWorld,
  origin: { x: number; y: number; z: number },
  direction: { x: number; y: number; z: number },
  maxToi = 1000,
  solid = true,
  excludeRigidBody?: PhysicsBody
): RayHit | null {
  physicsWorld.world.updateSceneQueries();
  const ray = new RAPIER.Ray(origin, direction);
  const hit = physicsWorld.world.castRayAndGetNormal(
    ray,
    maxToi,
    solid,
    undefined,
    undefined,
    undefined,
    excludeRigidBody?.handle
  );
  if (!hit) return null;

  const point = ray.pointAt(hit.toi);
  return {
    toi: hit.toi,
    point: { x: point.x, y: point.y, z: point.z },
    normal: hit.normal ? { x: hit.normal.x, y: hit.normal.y, z: hit.normal.z } : undefined,
  };
}

/**
 * Query ground height at a given (x, z) coordinate
 */
export function queryGroundHeight(
  physicsWorld: PhysicsWorld,
  x: number,
  z: number,
  startY = 1000,
  maxDist = 2000
): number | null {
  const hit = castRay(
    physicsWorld,
    { x, y: startY, z },
    { x: 0, y: -1, z: 0 },
    maxDist,
    true
  );
  return hit ? hit.point.y : null;
}
