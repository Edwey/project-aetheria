/**
 * Physics system - integrates Rapier WASM with ECS
 */

import { createWorld as createPhysicsWorld, stepWorld, createRigidBody, createSphereCollider, addColliderToBody, addBodyToWorld, removeBodyFromWorld, getBodyPosition, setBodyPosition, getBodyLinearVelocity, setBodyLinearVelocity, initPhysics } from './rapier-wrapper.ts';
import { World, addResource, query, addComponent, createEntity, destroyEntity } from '@core';
import type { PhysicsWorld } from './rapier-wrapper.js';
import {
  TransformComponent,
  RigidBodyComponent,
  ColliderComponent,
  MassComponent,
  MaterialComponent,
  Transform,
  RigidBody,
  Collider,
  Mass,
  Material,
} from './physics-components.js';

/**
 * Physics system resource symbol
 */
export const PhysicsWorldResource = Symbol('PhysicsWorld');

/**
 * Initialize physics world and add to ECS
 */
export async function initPhysicsSystem(world: World): Promise<void> {
  await initPhysics();

  const physicsWorld = createPhysicsWorld({ x: 0, y: -20, z: 0 });
  addResource(world, PhysicsWorldResource, physicsWorld);
}

/**
 * Create a physics entity with rigid body and collider
 */
export function createPhysicsEntity(
  world: World,
  desc: {
    position: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number; w: number };
    mass: number;
    shape: 'sphere' | 'box';
    size: number;
    isSensor?: boolean;
  }
): number {
  const entity = createEntity(world);

  // Add transform component
  const transform: Transform = {
    position: desc.position,
    rotation: desc.rotation || { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  addComponent(world, entity, TransformComponent, transform);

  // Add mass component
  const mass: Mass = {
    value: desc.mass,
    inverseMass: desc.mass > 0 ? 1 / desc.mass : 0,
  };
  addComponent(world, entity, MassComponent, mass);

  // Add material component
  const material: Material = {
    friction: 0.5,
    restitution: 0.3,
    density: 1.0,
  };
  addComponent(world, entity, MaterialComponent, material);

  // Create Rapier rigid body
  const rapierBody = createRigidBody({
    translation: desc.position,
    rotation: desc.rotation || { x: 0, y: 0, z: 0, w: 1 },
    enabled: true,
  });

  // Create collider
  let collider;
  if (desc.shape === 'sphere') {
    collider = createSphereCollider(desc.size);
  } else {
    collider = createBoxCollider({ x: desc.size, y: desc.size, z: desc.size });
  }

  addColliderToBody(rapierBody, collider);

  // Add components
  const rigidBody: RigidBody = {
    handle: rapierBody.handle,
    linearVelocity: { x: 0, y: 0, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 0 },
  };
  addComponent(world, entity, RigidBodyComponent, rigidBody);

  const colliderComp: Collider = {
    handle: collider.handle,
    shape: desc.shape,
    isSensor: desc.isSensor || false,
  };
  addComponent(world, entity, ColliderComponent, colliderComp);

  // Add to physics world
  const physicsWorld = getResource(world, PhysicsWorldResource) as PhysicsWorld;
  if (physicsWorld) {
    addBodyToWorld(physicsWorld, rapierBody);
  }

  return entity;
}

/**
 * Physics system - sync ECS transforms with Rapier bodies
 */
export function physicsSystem(world: World, dt: number): void {
  const physicsWorld = getResource(world, PhysicsWorldResource) as PhysicsWorld;
  if (!physicsWorld) return;

  // Step physics
  stepWorld(physicsWorld, dt);

  // Sync Rapier positions to ECS
  const queryResult = query(world, {
    with: [RigidBodyComponent, TransformComponent],
    without: [],
  });

  for (const entity of queryResult) {
    const rigidBody = getComponent<RigidBody>(world, entity, RigidBodyComponent);
    const transform = getComponent<Transform>(world, entity, TransformComponent);

    if (rigidBody && transform) {
      const pos = getBodyPosition(rigidBody);
      transform.position = pos;
    }
  }
}

/**
 * Apply force to a physics body
 */
export function applyForce(world: World, entity: number, force: { x: number; y: number; z: number }): void {
  const rigidBody = getComponent<RigidBody>(world, entity, RigidBodyComponent);
  if (!rigidBody) return;

  rigidBody.handle.applyImpulse(force, true);
}

/**
 * Set velocity of a physics body
 */
export function setVelocity(world: World, entity: number, velocity: { x: number; y: number; z: number }): void {
  const rigidBody = getComponent<RigidBody>(world, entity, RigidBodyComponent);
  if (!rigidBody) return;

  setBodyLinearVelocity(rigidBody, velocity);
  rigidBody.linearVelocity = velocity;
}

/**
 * Get ground height at position (placeholder for heightfield)
 */
export function getGroundHeight(x: number, z: number): number {
  // Placeholder - will be implemented with heightfield in terrain system
  return 0;
}
