/**
 * Aetheria - Harvest & Resource System
 * Phase 3: Loop Slice
 *
 * Implements peaceful harvesting, resource nodes, magnet drop attraction,
 * and player inventory management aligned with Master Plan §9 and §14.
 */

import type { InventorySlotSave } from '@core/save-system.js';

export type ResourceType = 'wood' | 'stone' | 'fiber' | 'petals';

export interface HarvestNode {
  id: string;
  type: ResourceType;
  name: string;
  position: { x: number; y: number; z: number };
  yieldAmount: number;
  respawnTime: number; // Seconds
  currentRespawnTimer: number;
  isDepleted: boolean;
}

export interface DroppedResource {
  id: string;
  type: ResourceType;
  amount: number;
  position: { x: number; y: number; z: number };
  magnetized: boolean;
}

export class Inventory {
  private resources: Record<ResourceType, number> = {
    wood: 0,
    stone: 0,
    fiber: 0,
    petals: 0,
  };

  constructor(initial?: Partial<Record<ResourceType, number>>) {
    if (initial) {
      for (const [k, v] of Object.entries(initial)) {
        if (v !== undefined && k in this.resources) {
          this.resources[k as ResourceType] = Math.max(0, v);
        }
      }
    }
  }

  get(type: ResourceType): number {
    return this.resources[type] || 0;
  }

  add(type: ResourceType, amount: number): void {
    if (amount <= 0) return;
    this.resources[type] = (this.resources[type] || 0) + amount;
  }

  has(type: ResourceType, amount: number): boolean {
    return (this.resources[type] || 0) >= amount;
  }

  consume(type: ResourceType, amount: number): boolean {
    if (!this.has(type, amount)) {
      return false;
    }
    this.resources[type] -= amount;
    return true;
  }

  consumeMultiple(requirements: Partial<Record<ResourceType, number>>): boolean {
    for (const [res, count] of Object.entries(requirements)) {
      if (count && !this.has(res as ResourceType, count)) {
        return false;
      }
    }
    for (const [res, count] of Object.entries(requirements)) {
      if (count) {
        this.consume(res as ResourceType, count);
      }
    }
    return true;
  }

  getAll(): Readonly<Record<ResourceType, number>> {
    return { ...this.resources };
  }

  serialize(): InventorySlotSave[] {
    return Object.entries(this.resources).map(([itemId, count]) => ({
      itemId,
      count,
    }));
  }

  deserialize(slots: InventorySlotSave[]): void {
    this.resources = { wood: 0, stone: 0, fiber: 0, petals: 0 };
    for (const slot of slots) {
      if (slot.itemId in this.resources) {
        this.resources[slot.itemId as ResourceType] = Math.max(0, slot.count);
      }
    }
  }
}

export interface HarvestEvent {
  nodeId: string;
  type: ResourceType;
  amount: number;
}

export interface PickupEvent {
  type: ResourceType;
  amount: number;
  position: { x: number; y: number; z: number };
}

export class HarvestSystem {
  readonly nodes = new Map<string, HarvestNode>();
  readonly droppedItems = new Map<string, DroppedResource>();

  readonly MAGNET_RADIUS = 2.5; // Meters
  readonly PICKUP_RADIUS = 0.5; // Meters
  readonly MAGNET_SPEED = 6.0;  // m/s

  private dropIdCounter = 0;
  onPickup?: (event: PickupEvent) => void;
  onHarvest?: (event: HarvestEvent) => void;

  registerNode(node: HarvestNode): void {
    this.nodes.set(node.id, {
      ...node,
      currentRespawnTimer: 0,
      isDepleted: false,
    });
  }

  spawnDrop(type: ResourceType, amount: number, pos: { x: number; y: number; z: number }): DroppedResource {
    const id = `drop_${++this.dropIdCounter}`;
    const drop: DroppedResource = {
      id,
      type,
      amount,
      position: { ...pos },
      magnetized: false,
    };
    this.droppedItems.set(id, drop);
    return drop;
  }

  /**
   * Interact with a node within 2.0 meters
   */
  harvestNode(nodeId: string, playerPos: { x: number; y: number; z: number }): boolean {
    const node = this.nodes.get(nodeId);
    if (!node || node.isDepleted) return false;

    const dist = Math.hypot(
      playerPos.x - node.position.x,
      playerPos.y - node.position.y,
      playerPos.z - node.position.z
    );

    if (dist > 2.0) return false;

    node.isDepleted = true;
    node.currentRespawnTimer = node.respawnTime;

    // Spawn floating drops at node location with slight vertical pop
    this.spawnDrop(node.type, node.yieldAmount, {
      x: node.position.x + (Math.random() - 0.5) * 0.3,
      y: node.position.y + 0.4,
      z: node.position.z + (Math.random() - 0.5) * 0.3,
    });

    this.onHarvest?.({
      nodeId: node.id,
      type: node.type,
      amount: node.yieldAmount,
    });

    return true;
  }

  update(
    dt: number,
    playerPos: { x: number; y: number; z: number },
    inventory: Inventory
  ): void {
    // 1. Update node respawn timers
    for (const node of this.nodes.values()) {
      if (node.isDepleted) {
        node.currentRespawnTimer -= dt;
        if (node.currentRespawnTimer <= 0) {
          node.isDepleted = false;
          node.currentRespawnTimer = 0;
        }
      }
    }

    // 2. Update dropped items magnet & collection
    for (const [id, drop] of this.droppedItems.entries()) {
      let dx = playerPos.x - drop.position.x;
      let dy = playerPos.y - drop.position.y;
      let dz = playerPos.z - drop.position.z;
      let dist = Math.hypot(dx, dy, dz);

      if (dist <= this.MAGNET_RADIUS) {
        drop.magnetized = true;
        const step = this.MAGNET_SPEED * dt;
        const ratio = Math.min(1.0, step / Math.max(0.01, dist));
        drop.position.x += dx * ratio;
        drop.position.y += dy * ratio;
        drop.position.z += dz * ratio;

        // Recalculate distance after movement
        dx = playerPos.x - drop.position.x;
        dy = playerPos.y - drop.position.y;
        dz = playerPos.z - drop.position.z;
        dist = Math.hypot(dx, dy, dz);
      }

      if (dist <= this.PICKUP_RADIUS) {
        // Collect into inventory
        inventory.add(drop.type, drop.amount);
        this.onPickup?.({
          type: drop.type,
          amount: drop.amount,
          position: { ...drop.position },
        });
        this.droppedItems.delete(id);
      }
    }
  }

  /**
   * Seed Pebble Cove starter area with initial harvestable props
   */
  initStarterNodes(): void {
    const starterNodes: HarvestNode[] = [
      // Driftwood along the cove shoreline
      { id: 'driftwood_1', type: 'wood', name: 'Shoreline Driftwood', position: { x: 57, y: 1.0, z: 38 }, yieldAmount: 2, respawnTime: 20, currentRespawnTimer: 0, isDepleted: false },
      { id: 'driftwood_2', type: 'wood', name: 'Weathered Branch', position: { x: 62, y: 1.0, z: 34 }, yieldAmount: 2, respawnTime: 20, currentRespawnTimer: 0, isDepleted: false },
      { id: 'driftwood_3', type: 'wood', name: 'Old Log', position: { x: 66, y: 1.0, z: 42 }, yieldAmount: 3, respawnTime: 25, currentRespawnTimer: 0, isDepleted: false },

      // Pebbles and stone outcrops
      { id: 'pebbles_1', type: 'stone', name: 'Smooth River Pebbles', position: { x: 59, y: 1.0, z: 44 }, yieldAmount: 2, respawnTime: 20, currentRespawnTimer: 0, isDepleted: false },
      { id: 'pebbles_2', type: 'stone', name: 'Granite Outcrop', position: { x: 65, y: 1.0, z: 35 }, yieldAmount: 3, respawnTime: 25, currentRespawnTimer: 0, isDepleted: false },
      { id: 'pebbles_3', type: 'stone', name: 'Slate Shards', position: { x: 54, y: 1.0, z: 41 }, yieldAmount: 2, respawnTime: 20, currentRespawnTimer: 0, isDepleted: false },

      // Fiber reeds by the water
      { id: 'reeds_1', type: 'fiber', name: 'Cove Reeds', position: { x: 58, y: 1.0, z: 46 }, yieldAmount: 2, respawnTime: 15, currentRespawnTimer: 0, isDepleted: false },
      { id: 'reeds_2', type: 'fiber', name: 'Cotton Grass', position: { x: 63, y: 1.0, z: 45 }, yieldAmount: 2, respawnTime: 15, currentRespawnTimer: 0, isDepleted: false },

      // Coastal blossom petals
      { id: 'blossoms_1', type: 'petals', name: 'Cove Sea-Blossom', position: { x: 64, y: 1.0, z: 38 }, yieldAmount: 1, respawnTime: 15, currentRespawnTimer: 0, isDepleted: false },
      { id: 'blossoms_2', type: 'petals', name: 'Wild Lavender', position: { x: 56, y: 1.0, z: 36 }, yieldAmount: 1, respawnTime: 15, currentRespawnTimer: 0, isDepleted: false },
    ];

    starterNodes.forEach((node) => this.registerNode(node));
  }
}
