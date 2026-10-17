/**
 * Core type definitions for ECS and game systems
 */

/**
 * Branded type for entity IDs to prevent mixing with numbers
 */
export type EntityId = number & { readonly __brand: unique symbol };

/**
 * Create a new entity ID
 */
export function createEntityId(id: number): EntityId {
  return id as EntityId;
}

/**
 * Null entity constant
 */
export const NULL_ENTITY: EntityId = 0 as EntityId;

/**
 * Component marker - indicates a type is a component
 */
export type Component = object;

/**
 * Resource marker - indicates a type is a global resource
 */
export type Resource = object;

/**
 * System signature - function type for systems
 */
export type SystemFn = (world: World) => void;

/**
 * World - the main ECS container
 */
export interface World {
  entities: Map<EntityId, Set<symbol>>;
  components: Map<symbol, Map<EntityId, Component>>;
  resources: Map<symbol, Resource>;
  nextEntityId: number;
  entitySequence: number;
}

/**
 * Query result - set of entities matching query criteria
 */
export type QueryResult = Set<EntityId>;

/**
 * Query definition - filter entities by component presence
 */
export interface Query {
  with: symbol[];
  without: symbol[];
}
