/**
 * Physics component definitions
 */

import type { Component } from '@core';

/**
 * Transform component - position and rotation
 */
export interface Transform extends Component {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  scale: { x: number; y: number; z: number };
}

/**
 * RigidBody component - Rapier rigid body reference
 */
export interface RigidBody extends Component {
  handle: unknown; // Rapier rigid body handle
  linearVelocity: { x: number; y: number; z: number };
  angularVelocity: { x: number; y: number; z: number };
}

/**
 * Collider component - Rapier collider reference
 */
export interface Collider extends Component {
  handle: unknown; // Rapier collider handle
  shape: 'box' | 'sphere' | 'capsule' | 'heightfield';
  isSensor: boolean;
}

/**
 * Mass component - for physics calculations
 */
export interface Mass extends Component {
  value: number;
  inverseMass: number;
}

/**
 * Material component - physics material properties
 */
export interface Material extends Component {
  friction: number;
  restitution: number;
  density: number;
}

/**
 * Force component - accumulated force per frame
 */
export interface Force extends Component {
  x: number;
  y: number;
  z: number;
}

/**
 * Velocity component - explicit velocity override
 */
export interface Velocity extends Component {
  x: number;
  y: number;
  z: number;
}

/**
 * Component symbols for ECS
 */
export const TransformComponent = Symbol('Transform');
export const RigidBodyComponent = Symbol('RigidBody');
export const ColliderComponent = Symbol('Collider');
export const MassComponent = Symbol('Mass');
export const MaterialComponent = Symbol('Material');
export const ForceComponent = Symbol('Force');
export const VelocityComponent = Symbol('Velocity');
