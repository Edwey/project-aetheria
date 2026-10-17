/**
 * Entity Component System core implementation
 */

import type { EntityId, Component, Resource, World, QueryResult, Query } from './types.js';
import { NULL_ENTITY } from './types.js';

/**
 * Create a new ECS world
 */
export function createWorld(): World {
  return {
    entities: new Map(),
    components: new Map(),
    resources: new Map(),
    nextEntityId: 1,
    entitySequence: 0,
  };
}

/**
 * Create a new entity
 */
export function createEntity(world: World): EntityId {
  const id = world.nextEntityId++ as EntityId;
  world.entities.set(id, new Set());
  return id;
}

/**
 * Destroy an entity and all its components
 */
export function destroyEntity(world: World, entity: EntityId): void {
  const components = world.entities.get(entity);
  if (!components) return;

  for (const componentId of components) {
    const componentMap = world.components.get(componentId);
    if (componentMap) {
      componentMap.delete(entity);
      if (componentMap.size === 0) {
        world.components.delete(componentId);
      }
    }
  }

  world.entities.delete(entity);
}

/**
 * Add a component to an entity
 */
export function addComponent<T extends Component>(
  world: World,
  entity: EntityId,
  componentId: symbol,
  component: T
): void {
  const entityComponents = world.entities.get(entity);
  if (!entityComponents) {
    entityComponents = new Set();
    world.entities.set(entity, entityComponents);
  }
  entityComponents.add(componentId);

  let componentMap = world.components.get(componentId);
  if (!componentMap) {
    componentMap = new Map();
    world.components.set(componentId, componentMap);
  }
  componentMap.set(entity, component);
}

/**
 * Remove a component from an entity
 */
export function removeComponent(world: World, entity: EntityId, componentId: symbol): void {
  const entityComponents = world.entities.get(entity);
  if (!entityComponents) return;

  entityComponents.delete(componentId);

  const componentMap = world.components.get(componentId);
  if (componentMap) {
    componentMap.delete(entity);
    if (componentMap.size === 0) {
      world.components.delete(componentId);
    }
  }
}

/**
 * Get a component from an entity
 */
export function getComponent<T extends Component>(
  world: World,
  entity: EntityId,
  componentId: symbol
): T | undefined {
  const componentMap = world.components.get(componentId);
  if (!componentMap) return undefined;
  return componentMap.get(entity) as T;
}

/**
 * Check if an entity has a component
 */
export function hasComponent(world: World, entity: EntityId, componentId: symbol): boolean {
  const entityComponents = world.entities.get(entity);
  if (!entityComponents) return false;
  return entityComponents.has(componentId);
}

/**
 * Query entities by component presence
 */
export function query(world: World, queryDef: Query): QueryResult {
  const result = new Set<EntityId>();

  for (const [entity, components] of world.entities.entries()) {
    let matches = true;

    // Check required components
    for (const required of queryDef.with) {
      if (!components.has(required)) {
        matches = false;
        break;
      }
    }

    if (!matches) continue;

    // Check excluded components
    for (const excluded of queryDef.without) {
      if (components.has(excluded)) {
        matches = false;
        break;
      }
    }

    if (matches) {
      result.add(entity);
    }
  }

  return result;
}

/**
 * Add a global resource
 */
export function addResource<T extends Resource>(
  world: World,
  resourceId: symbol,
  resource: T
): void {
  world.resources.set(resourceId, resource);
}

/**
 * Get a global resource
 */
export function getResource<T extends Resource>(
  world: World,
  resourceId: symbol
): T | undefined {
  return world.resources.get(resourceId) as T;
}

/**
 * Check if an entity is valid (not destroyed)
 */
export function isEntityValid(world: World, entity: EntityId): boolean {
  return entity !== NULL_ENTITY && world.entities.has(entity);
}
