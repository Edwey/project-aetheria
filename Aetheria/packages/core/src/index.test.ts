/**
 * Core package tests
 */

import { describe, it, expect } from 'vitest';
import {
  createWorld,
  createEntity,
  destroyEntity,
  addComponent,
  removeComponent,
  getComponent,
  hasComponent,
  query,
  addResource,
  getResource,
  isEntityValid,
  NULL_ENTITY,
  Vec3,
  Quat,
  Mat4,
  MathUtils,
  EventBus,
} from './index.js';

describe('ECS', () => {
  describe('Entity lifecycle', () => {
    it('should create an entity', () => {
      const world = createWorld();
      const entity = createEntity(world);

      expect(entity).not.toBe(NULL_ENTITY);
      expect(isEntityValid(world, entity)).toBe(true);
    });

    it('should destroy an entity', () => {
      const world = createWorld();
      const entity = createEntity(world);

      destroyEntity(world, entity);

      expect(isEntityValid(world, entity)).toBe(false);
    });

    it('should increment entity IDs', () => {
      const world = createWorld();
      const entity1 = createEntity(world);
      const entity2 = createEntity(world);

      expect(entity2).toBeGreaterThan(entity1);
    });
  });

  describe('Components', () => {
    const Position = Symbol('Position');

    it('should add a component', () => {
      const world = createWorld();
      const entity = createEntity(world);

      addComponent(world, entity, Position, { x: 0, y: 0, z: 0 });

      expect(hasComponent(world, entity, Position)).toBe(true);
    });

    it('should get a component', () => {
      const world = createWorld();
      const entity = createEntity(world);
      const data = { x: 10, y: 5, z: 0 };

      addComponent(world, entity, Position, data);

      const component = getComponent(world, entity, Position);
      expect(component).toEqual(data);
    });

    it('should remove a component', () => {
      const world = createWorld();
      const entity = createEntity(world);

      addComponent(world, entity, Position, { x: 0, y: 0, z: 0 });
      removeComponent(world, entity, Position);

      expect(hasComponent(world, entity, Position)).toBe(false);
    });

    it('should return undefined for missing component', () => {
      const world = createWorld();
      const entity = createEntity(world);

      const component = getComponent(world, entity, Position);

      expect(component).toBeUndefined();
    });
  });

  describe('Queries', () => {
    const Position = Symbol('Position');
    const Velocity = Symbol('Velocity');
    const Health = Symbol('Health');

    it('should query entities with required components', () => {
      const world = createWorld();
      const entity1 = createEntity(world);
      const entity2 = createEntity(world);

      addComponent(world, entity1, Position, { x: 0, y: 0, z: 0 });
      addComponent(world, entity1, Velocity, { x: 1, y: 0, z: 0 });
      addComponent(world, entity2, Position, { x: 5, y: 0, z: 0 });

      const result = query(world, { with: [Position, Velocity], without: [] });

      expect(result.size).toBe(1);
      expect(result.has(entity1)).toBe(true);
      expect(result.has(entity2)).toBe(false);
    });

    it('should query entities without excluded components', () => {
      const world = createWorld();
      const entity1 = createEntity(world);
      const entity2 = createEntity(world);

      addComponent(world, entity1, Position, { x: 0, y: 0, z: 0 });
      addComponent(world, entity1, Health, { current: 100, max: 100 });
      addComponent(world, entity2, Position, { x: 5, y: 0, z: 0 });

      const result = query(world, { with: [Position], without: [Health] });

      expect(result.size).toBe(1);
      expect(result.has(entity1)).toBe(false);
      expect(result.has(entity2)).toBe(true);
    });
  });

  describe('Resources', () => {
    const Time = Symbol('Time');
    const Config = Symbol('Config');

    it('should add a resource', () => {
      const world = createWorld();

      addResource(world, Time, { elapsed: 0, delta: 0.016 });

      const resource = getResource(world, Time);
      expect(resource).toEqual({ elapsed: 0, delta: 0.016 });
    });

    it('should get a resource', () => {
      const world = createWorld();
      const config = { maxEntities: 1000 };

      addResource(world, Config, config);

      const resource = getResource(world, Config);
      expect(resource).toBe(config);
    });

    it('should return undefined for missing resource', () => {
      const world = createWorld();

      const resource = getResource(world, Config);

      expect(resource).toBeUndefined();
    });
  });
});

describe('Math', () => {
  describe('Vec3', () => {
    it('should create a vector', () => {
      const v = new Vec3(1, 2, 3);

      expect(v.x).toBe(1);
      expect(v.y).toBe(2);
      expect(v.z).toBe(3);
    });

    it('should add vectors', () => {
      const v1 = new Vec3(1, 2, 3);
      const v2 = new Vec3(4, 5, 6);

      v1.add(v2);

      expect(v1.x).toBe(5);
      expect(v1.y).toBe(7);
      expect(v1.z).toBe(9);
    });

    it('should calculate length', () => {
      const v = new Vec3(3, 4, 0);

      expect(v.length()).toBe(5);
    });

    it('should normalize a vector', () => {
      const v = new Vec3(3, 4, 0);

      v.normalize();

      expect(Math.abs(v.length() - 1)).toBeLessThan(0.0001);
    });

    it('should calculate distance', () => {
      const v1 = new Vec3(0, 0, 0);
      const v2 = new Vec3(3, 4, 0);

      expect(v1.distanceTo(v2)).toBe(5);
    });
  });

  describe('Quat', () => {
    it('should create identity quaternion', () => {
      const q = new Quat();

      q.identity();

      expect(q.x).toBe(0);
      expect(q.y).toBe(0);
      expect(q.z).toBe(0);
      expect(q.w).toBe(1);
    });
  });

  describe('Mat4', () => {
    it('should create identity matrix', () => {
      const m = new Mat4();

      m.identity();

      const elements = m.inner.elements;
      expect(elements[0]).toBe(1);
      expect(elements[5]).toBe(1);
      expect(elements[10]).toBe(1);
      expect(elements[15]).toBe(1);
    });
  });

  describe('MathUtils', () => {
    it('should clamp values', () => {
      expect(MathUtils.clamp(5, 0, 10)).toBe(5);
      expect(MathUtils.clamp(-5, 0, 10)).toBe(0);
      expect(MathUtils.clamp(15, 0, 10)).toBe(10);
    });

    it('should lerp values', () => {
      expect(MathUtils.lerp(0, 10, 0.5)).toBe(5);
      expect(MathUtils.lerp(0, 10, 0)).toBe(0);
      expect(MathUtils.lerp(0, 10, 1)).toBe(10);
    });

    it('should convert degrees to radians', () => {
      expect(MathUtils.degToRad(180)).toBeCloseTo(Math.PI, 0.0001);
    });

    it('should convert radians to degrees', () => {
      expect(MathUtils.radToDeg(Math.PI)).toBeCloseTo(180, 0.0001);
    });
  });
});

describe('EventBus', () => {
  it('should subscribe and emit events', () => {
    type Events = {
      test: { value: number };
    };

    const bus = new EventBus<Events>();
    let received = 0;

    bus.on('test', (data) => {
      received = data.value;
    });

    bus.emit('test', { value: 42 });

    expect(received).toBe(42);
  });

  it('should unsubscribe from events', () => {
    type Events = {
      test: { value: number };
    };

    const bus = new EventBus<Events>();
    let received = 0;

    const unsubscribe = bus.on('test', (data) => {
      received = data.value;
    });

    bus.emit('test', { value: 1 });
    expect(received).toBe(1);

    unsubscribe();
    bus.emit('test', { value: 2 });
    expect(received).toBe(1); // Should not update
  });

  it('should handle once listeners', () => {
    type Events = {
      test: { value: number };
    };

    const bus = new EventBus<Events>();
    let received = 0;

    bus.once('test', (data) => {
      received = data.value;
    });

    bus.emit('test', { value: 1 });
    expect(received).toBe(1);

    bus.emit('test', { value: 2 });
    expect(received).toBe(1); // Should not update
  });
});
