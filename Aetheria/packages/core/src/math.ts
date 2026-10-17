/**
 * Math utilities - wrappers around Three.js math classes for type safety
 * Reusing Three.js math for efficiency and consistency
 */

import * as THREE from 'three';

/**
 * 3D vector wrapper around THREE.Vector3
 */
export class Vec3 {
  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.inner = new THREE.Vector3(x, y, z);
  }

  inner: THREE.Vector3;

  get x(): number { return this.inner.x; }
  set x(value: number) { this.inner.x = value; }

  get y(): number { return this.inner.y; }
  set y(value: number) { this.inner.y = value; }

  get z(): number { return this.inner.z; }
  set z(value: number) { this.inner.z = value; }

  set(x: number, y: number, z: number): this {
    this.inner.set(x, y, z);
    return this;
  }

  copy(v: Vec3): this {
    this.inner.copy(v.inner);
    return this;
  }

  clone(): Vec3 {
    return new Vec3(this.x, this.y, this.z);
  }

  add(v: Vec3): this {
    this.inner.add(v.inner);
    return this;
  }

  sub(v: Vec3): this {
    this.inner.sub(v.inner);
    return this;
  }

  multiplyScalar(s: number): this {
    this.inner.multiplyScalar(s);
    return this;
  }

  length(): number {
    return this.inner.length();
  }

  lengthSq(): number {
    return this.inner.lengthSq();
  }

  normalize(): this {
    this.inner.normalize();
    return this;
  }

  distanceTo(v: Vec3): number {
    return this.inner.distanceTo(v.inner);
  }

  distanceToSquared(v: Vec3): number {
    return this.inner.distanceToSquared(v.inner);
  }

  dot(v: Vec3): number {
    return this.inner.dot(v.inner);
  }

  cross(v: Vec3): Vec3 {
    const result = new Vec3();
    result.inner.crossVectors(this.inner, v.inner);
    return result;
  }

  lerp(v: Vec3, alpha: number): this {
    this.inner.lerp(v.inner, alpha);
    return this;
  }

  zero(): this {
    this.inner.set(0, 0, 0);
    return this;
  }
}

/**
 * Quaternion wrapper around THREE.Quaternion
 */
export class Quat {
  constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
    this.inner = new THREE.Quaternion(x, y, z, w);
  }

  inner: THREE.Quaternion;

  get x(): number { return this.inner.x; }
  set x(value: number) { this.inner.x = value; }

  get y(): number { return this.inner.y; }
  set y(value: number) { this.inner.y = value; }

  get z(): number { return this.inner.z; }
  set z(value: number) { this.inner.z = value; }

  get w(): number { return this.inner.w; }
  set w(value: number) { this.inner.w = value; }

  set(x: number, y: number, z: number, w: number): this {
    this.inner.set(x, y, z, w);
    return this;
  }

  copy(q: Quat): this {
    this.inner.copy(q.inner);
    return this;
  }

  clone(): Quat {
    return new Quat(this.x, this.y, this.z, this.w);
  }

  identity(): this {
    this.inner.identity();
    return this;
  }

  multiply(q: Quat): this {
    this.inner.multiply(q.inner);
    return this;
  }

  slerp(q: Quat, alpha: number): this {
    this.inner.slerp(q.inner, alpha);
    return this;
  }

  setFromAxisAngle(axis: Vec3, angle: number): this {
    this.inner.setFromAxisAngle(axis.inner, angle);
    return this;
  }
}

/**
 * 4x4 Matrix wrapper around THREE.Matrix4
 */
export class Mat4 {
  constructor() {
    this.inner = new THREE.Matrix4();
  }

  inner: THREE.Matrix4;

  identity(): this {
    this.inner.identity();
    return this;
  }

  copy(m: Mat4): this {
    this.inner.copy(m.inner);
    return this;
  }

  clone(): Mat4 {
    const result = new Mat4();
    result.inner.copy(this.inner);
    return result;
  }

  multiply(m: Mat4): this {
    this.inner.multiply(m.inner);
    return this;
  }

  setPosition(x: number, y: number, z: number): this {
    this.inner.setPosition(x, y, z);
    return this;
  }

  compose(position: Vec3, quaternion: Quat, scale: Vec3): this {
    this.inner.compose(position.inner, quaternion.inner, scale.inner);
    return this;
  }

  decompose(position: Vec3, quaternion: Quat, scale: Vec3): this {
    this.inner.decompose(position.inner, quaternion.inner, scale.inner);
    return this;
  }

  invert(): this {
    this.inner.invert();
    return this;
  }

  multiplyVector3(v: Vec3): Vec3 {
    const result = new Vec3();
    result.inner.copy(v.inner).applyMatrix4(this.inner);
    return result;
  }
}

/**
 * Utility functions
 */
export const MathUtils = {
  degToRad: (degrees: number): number => degrees * (Math.PI / 180),
  radToDeg: (radians: number): number => radians * (180 / Math.PI),
  clamp: (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value)),
  lerp: (a: number, b: number, t: number): number => a + (b - a) * t,
  smoothstep: (edge0: number, edge1: number, x: number): number => {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  },
};
