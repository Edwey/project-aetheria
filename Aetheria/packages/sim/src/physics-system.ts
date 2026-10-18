/**
 * Physics system - integrates Rapier WASM with ECS
 */

import {
  createWorld as createPhysicsWorld,
  stepWorld,
  createDynamicBodyDesc,
  createStaticBodyDesc,
  createSphereColliderDesc,
  createBoxColliderDesc,
  createHeightfieldColliderDesc,
  createBodyInWorld,
  createColliderInWorld,
  removeBodyFromWorld,
  removeColliderFromWorld,
  getBodyPosition,
  getBodyRotation,
  setBodyPosition,
  setBodyRotation,
  getBodyLinearVelocity,
  setBodyLinearVelocity,
  applyImpulse,
  queryGroundHeight,
  initPhysics,
} from './rapier-wrapper.js';
import type { PhysicsWorld, PhysicsBody } from './rapier-wrapper.js';
import {
  World,
  EntityId,
  addResource,
  getResource,
  query,
  addComponent,
  removeComponent,
  createEntity,
  destroyEntity,
  getComponent,
} from '@core';
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
 * Initialize physics world and register with ECS
 */
export async function initPhysicsSystem(
  world: World,
  gravity: { x: number; y: number; z: number } = { x: 0, y: -20, z: 0 }
): Promise<PhysicsWorld> {
  await initPhysics();
  const physicsWorld = createPhysicsWorld(gravity);
  addResource(world, PhysicsWorldResource, physicsWorld);
  return physicsWorld;
}

/**
 * Create a dynamic physics entity with rigid body and collider
 */
export function createPhysicsEntity(
  world: World,
  desc: {
    position: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number; w: number };
    mass: number;
    shape: 'sphere' | 'box';
    size: number | { x: number; y: number; z: number };
    isStatic?: boolean;
    isSensor?: boolean;
    friction?: number;
    restitution?: number;
  }
): EntityId {
  const entity = createEntity(world);

  const rot = desc.rotation || { x: 0, y: 0, z: 0, w: 1 };
  const transform: Transform = {
    position: { ...desc.position },
    rotation: { ...rot },
    scale: { x: 1, y: 1, z: 1 },
  };
  addComponent(world, entity, TransformComponent, transform);

  const massVal = desc.isStatic ? 0 : desc.mass;
  const mass: Mass = {
    value: massVal,
    inverseMass: massVal > 0 ? 1 / massVal : 0,
  };
  addComponent(world, entity, MassComponent, mass);

  const material: Material = {
    friction: desc.friction ?? 0.5,
    restitution: desc.restitution ?? 0.3,
    density: 1.0,
  };
  addComponent(world, entity, MaterialComponent, material);

  const physicsWorld = getResource(world, PhysicsWorldResource) as PhysicsWorld;
  if (!physicsWorld) {
    throw new Error('Physics world not initialized');
  }

  const bodyDesc = desc.isStatic
    ? createStaticBodyDesc(desc.position, rot)
    : createDynamicBodyDesc(desc.position, rot);

  let colliderDesc;
  if (desc.shape === 'sphere') {
    const radius = typeof desc.size === 'number' ? desc.size : desc.size.x;
    colliderDesc = createSphereColliderDesc(radius);
  } else {
    const halfExtents =
      typeof desc.size === 'number'
        ? { x: desc.size, y: desc.size, z: desc.size }
        : desc.size;
    colliderDesc = createBoxColliderDesc(halfExtents);
  }

  colliderDesc.setFriction(material.friction);
  colliderDesc.setRestitution(material.restitution);
  if (desc.isSensor) {
    colliderDesc.setSensor(true);
  }

  const rapierBody = createBodyInWorld(physicsWorld, bodyDesc);
  const rapierCollider = createColliderInWorld(physicsWorld, colliderDesc, rapierBody);

  const rigidBody: RigidBody = {
    handle: rapierBody.handle,
    linearVelocity: { x: 0, y: 0, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 0 },
  };
  addComponent(world, entity, RigidBodyComponent, rigidBody);

  const colliderComp: Collider = {
    handle: rapierCollider.handle,
    shape: desc.shape,
    isSensor: desc.isSensor || false,
  };
  addComponent(world, entity, ColliderComponent, colliderComp);

  return entity;
}

/**
 * Create a static heightfield terrain entity
 */
export function createHeightfieldTerrainEntity(
  world: World,
  desc: {
    nrows: number;
    ncols: number;
    heights: Float32Array;
    scale: { x: number; y: number; z: number };
    position?: { x: number; y: number; z: number };
    friction?: number;
    restitution?: number;
  }
): EntityId {
  const entity = createEntity(world);
  const pos = desc.position ?? { x: 0, y: 0, z: 0 };

  const transform: Transform = {
    position: { ...pos },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { ...desc.scale },
  };
  addComponent(world, entity, TransformComponent, transform);

  const mass: Mass = { value: 0, inverseMass: 0 };
  addComponent(world, entity, MassComponent, mass);

  const material: Material = {
    friction: desc.friction ?? 0.8,
    restitution: desc.restitution ?? 0.0,
    density: 1.0,
  };
  addComponent(world, entity, MaterialComponent, material);

  const physicsWorld = getResource(world, PhysicsWorldResource) as PhysicsWorld;
  if (!physicsWorld) {
    throw new Error('Physics world not initialized');
  }

  const bodyDesc = createStaticBodyDesc(pos);
  const colliderDesc = createHeightfieldColliderDesc(
    desc.nrows,
    desc.ncols,
    desc.heights,
    desc.scale
  );
  colliderDesc.setFriction(material.friction);
  colliderDesc.setRestitution(material.restitution);

  const rapierBody = createBodyInWorld(physicsWorld, bodyDesc);
  const rapierCollider = createColliderInWorld(physicsWorld, colliderDesc, rapierBody);

  const rigidBody: RigidBody = {
    handle: rapierBody.handle,
    linearVelocity: { x: 0, y: 0, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 0 },
  };
  addComponent(world, entity, RigidBodyComponent, rigidBody);

  const colliderComp: Collider = {
    handle: rapierCollider.handle,
    shape: 'heightfield',
    isSensor: false,
  };
  addComponent(world, entity, ColliderComponent, colliderComp);

  return entity;
}

/**
 * Remove a physics entity and release its Rapier body and collider
 */
export function destroyPhysicsEntity(world: World, entity: EntityId): void {
  const physicsWorld = getResource(world, PhysicsWorldResource) as PhysicsWorld;
  const rigidBody = getComponent<RigidBody>(world, entity, RigidBodyComponent);
  const collider = getComponent<Collider>(world, entity, ColliderComponent);

  if (physicsWorld) {
    if (collider && collider.handle) {
      removeColliderFromWorld(physicsWorld, { handle: collider.handle as any });
    }
    if (rigidBody && rigidBody.handle) {
      removeBodyFromWorld(physicsWorld, { handle: rigidBody.handle as any });
    }
  }

  removeComponent(world, entity, RigidBodyComponent);
  removeComponent(world, entity, ColliderComponent);
  destroyEntity(world, entity);
}

/**
 * Physics system - step simulation and sync Rapier transforms with ECS
 */
export function physicsSystem(world: World, dt: number): void {
  const physicsWorld = getResource(world, PhysicsWorldResource) as PhysicsWorld;
  if (!physicsWorld) return;

  stepWorld(physicsWorld, dt);

  const queryResult = query(world, {
    with: [RigidBodyComponent, TransformComponent],
    without: [],
  });

  for (const entity of queryResult) {
    const rigidBody = getComponent<RigidBody>(world, entity, RigidBodyComponent);
    const transform = getComponent<Transform>(world, entity, TransformComponent);

    if (rigidBody && transform) {
      const pos = getBodyPosition(rigidBody as unknown as PhysicsBody);
      const rot = getBodyRotation(rigidBody as unknown as PhysicsBody);
      const vel = getBodyLinearVelocity(rigidBody as unknown as PhysicsBody);

      transform.position.x = pos.x;
      transform.position.y = pos.y;
      transform.position.z = pos.z;

      transform.rotation.x = rot.x;
      transform.rotation.y = rot.y;
      transform.rotation.z = rot.z;
      transform.rotation.w = rot.w;

      rigidBody.linearVelocity.x = vel.x;
      rigidBody.linearVelocity.y = vel.y;
      rigidBody.linearVelocity.z = vel.z;
    }
  }
}

/**
 * Apply impulse force to a physics body
 */
export function applyForce(world: World, entity: EntityId, force: { x: number; y: number; z: number }): void {
  const rigidBody = getComponent<RigidBody>(world, entity, RigidBodyComponent);
  if (!rigidBody) return;

  applyImpulse(rigidBody as unknown as PhysicsBody, force);
}

/**
 * Set velocity of a physics body
 */
export function setVelocity(world: World, entity: EntityId, velocity: { x: number; y: number; z: number }): void {
  const rigidBody = getComponent<RigidBody>(world, entity, RigidBodyComponent);
  if (!rigidBody) return;

  setBodyLinearVelocity(rigidBody as unknown as PhysicsBody, velocity);
  rigidBody.linearVelocity = { ...velocity };
}

/**
 * Set position of a physics body
 */
export function setEntityPosition(world: World, entity: EntityId, position: { x: number; y: number; z: number }): void {
  const rigidBody = getComponent<RigidBody>(world, entity, RigidBodyComponent);
  const transform = getComponent<Transform>(world, entity, TransformComponent);

  if (rigidBody) {
    setBodyPosition(rigidBody as unknown as PhysicsBody, position);
  }
  if (transform) {
    transform.position = { ...position };
  }
}

/**
 * Set rotation of a physics body
 */
export function setEntityRotation(
  world: World,
  entity: EntityId,
  rotation: { x: number; y: number; z: number; w: number }
): void {
  const rigidBody = getComponent<RigidBody>(world, entity, RigidBodyComponent);
  const transform = getComponent<Transform>(world, entity, TransformComponent);

  if (rigidBody) {
    setBodyRotation(rigidBody as unknown as PhysicsBody, rotation);
  }
  if (transform) {
    transform.rotation = { ...rotation };
  }
}

/**
 * Get ground height at (x, z) using raycasting down from sky
 */
export function getGroundHeight(world: World, x: number, z: number, startY = 1000): number {
  const physicsWorld = getResource(world, PhysicsWorldResource) as PhysicsWorld;
  if (!physicsWorld) return 0;

  const height = queryGroundHeight(physicsWorld, x, z, startY);
  return height !== null ? height : 0;
}
