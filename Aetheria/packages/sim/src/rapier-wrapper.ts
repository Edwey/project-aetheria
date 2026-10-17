/**
 * Rapier WASM physics wrapper
 */

import RAPIER from '@dimforge/rapier3d-compat';
import type { Resource } from '@core';

export interface PhysicsWorld extends Resource {
  world: unknown; // Rapier world
  gravity: { x: number; y: number; z: number };
}

export interface PhysicsBody {
  handle: unknown; // Rapier rigid body handle
}

export interface PhysicsCollider {
  handle: unknown; // Rapier collider handle
}

/**
 * Initialize Rapier physics
 */
export async function initPhysics(): Promise<void> {
  await RAPIER.init();
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
  physicsWorld.world.step(dt);
}

/**
 * Create a rigid body
 */
export function createRigidBody(
  desc: {
    translation: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number; w: number };
    enabled: boolean;
  }
): PhysicsBody {
  const body = RAPIER.RigidBodyCreateInfo(desc);
  const handle = new RAPIER.RigidBody(body);
  return { handle };
}

/**
 * Create a sphere collider
 */
export function createSphereCollider(radius: number): PhysicsCollider {
  const shape = new RAPIER.Ball(radius);
  const handle = new RAPIER.Collider(shape);
  return { handle };
}

/**
 * Create a box collider
 */
export function createBoxCollider(halfExtents: { x: number; y: number; z: number }): PhysicsCollider {
  const shape = new RAPIER.Cuboid(halfExtents);
  const handle = new RAPIER.Collider(shape);
  return { handle };
}

/**
 * Create a heightfield collider
 */
export function createHeightfieldCollider(
  heights: Float32Array,
  scale: { x: number; y: number; z: number }
): PhysicsCollider {
  const shape = new RAPIER.Heightfield(scale, heights);
  const handle = new RAPIER.Collider(shape);
  return { handle };
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
  body.handle.setTranslation(pos);
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
  body.handle.setRotation(rot);
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
  body.handle.setLinvel(vel);
}

/**
 * Add collider to body
 */
export function addColliderToBody(body: PhysicsBody, collider: PhysicsCollider): void {
  body.handle.addCollider(collider.handle, 1);
}

/**
 * Add body to world
 */
export function addBodyToWorld(physicsWorld: PhysicsWorld, body: PhysicsBody): void {
  physicsWorld.world.createRigidBody(body.handle);
}

/**
 * Remove body from world
 */
export function removeBodyFromWorld(physicsWorld: PhysicsWorld, body: PhysicsBody): void {
  physicsWorld.world.removeRigidBody(body.handle);
}
