/**
 * Aetheria - Crafting System
 * Phase 3: Loop Slice
 *
 * Implements pocket crafting (anywhere) and workbench crafting (within 5.0m)
 * with support for nearby storage supplies aligned with Master Plan §9.
 */

import type { ResourceType, Inventory } from './harvest-system.js';

export type RecipeCategory = 'pocket' | 'workbench';
export type OutputKind = 'item' | 'buildingPiece';

export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  category: RecipeCategory;
  inputs: Partial<Record<ResourceType, number>>;
  output: {
    kind: OutputKind;
    id: string;
    name: string;
    count: number;
  };
}

export const CRAFTING_RECIPES: Record<string, CraftingRecipe> = {
  // Pocket Recipes (Anywhere)
  twine: {
    id: 'twine',
    name: 'Woven Twine',
    description: 'Strong cord braided from wild reeds and cotton grass.',
    category: 'pocket',
    inputs: { fiber: 2 },
    output: { kind: 'item', id: 'twine', name: 'Twine', count: 1 },
  },
  torch: {
    id: 'torch',
    name: 'Camp Torch',
    description: 'A dried branch wrapped in resinous fiber to light dark groves.',
    category: 'pocket',
    inputs: { wood: 1, fiber: 1 },
    output: { kind: 'item', id: 'torch', name: 'Torch', count: 1 },
  },
  campfire: {
    id: 'campfire',
    name: 'Stone Hearth Campfire',
    description: 'A cozy campfire ringed with stones. Emits comforting warmth and light.',
    category: 'pocket',
    inputs: { wood: 2, stone: 2 },
    output: { kind: 'item', id: 'campfire', name: 'Campfire', count: 1 },
  },
  bowl: {
    id: 'bowl',
    name: 'Carved Stone Bowl',
    description: 'A smoothed pebble bowl useful for holding gathered blossoms or water.',
    category: 'pocket',
    inputs: { stone: 2 },
    output: { kind: 'item', id: 'bowl', name: 'Stone Bowl', count: 1 },
  },
  workbench: {
    id: 'workbench',
    name: 'Carpentry Workbench',
    description: 'A sturdy timber bench allowing fine structural building piece construction.',
    category: 'pocket',
    inputs: { wood: 4, stone: 2 },
    output: { kind: 'item', id: 'workbench', name: 'Workbench', count: 1 },
  },

  // Workbench Recipes (Within 5.0m of a Workbench)
  foundation_wood: {
    id: 'foundation_wood',
    name: 'Timber Foundation',
    description: 'Heavy timber foundation with adaptive stilts reaching up to 3m.',
    category: 'workbench',
    inputs: { wood: 4 },
    output: { kind: 'buildingPiece', id: 'foundation_wood', name: 'Timber Foundation', count: 1 },
  },
  floor_wood: {
    id: 'floor_wood',
    name: 'Wooden Floor Planks',
    description: 'Smooth wooden platform planks for living spaces and walkways.',
    category: 'workbench',
    inputs: { wood: 2 },
    output: { kind: 'buildingPiece', id: 'floor_wood', name: 'Wooden Floor', count: 1 },
  },
  wall_wood: {
    id: 'wall_wood',
    name: 'Timber Wall',
    description: 'Upright interlocking timber wall providing shelter.',
    category: 'workbench',
    inputs: { wood: 3 },
    output: { kind: 'buildingPiece', id: 'wall_wood', name: 'Timber Wall', count: 1 },
  },
  doorway_wood: {
    id: 'doorway_wood',
    name: 'Wooden Doorway Frame',
    description: 'Framed portal allowing easy creature transit in and out.',
    category: 'workbench',
    inputs: { wood: 3 },
    output: { kind: 'buildingPiece', id: 'doorway_wood', name: 'Wooden Doorway', count: 1 },
  },
  roof_wood: {
    id: 'roof_wood',
    name: 'Sloped Shingle Roof',
    description: 'Sloped roof piece designed to guide rain away.',
    category: 'workbench',
    inputs: { wood: 3 },
    output: { kind: 'buildingPiece', id: 'roof_wood', name: 'Sloped Roof', count: 1 },
  },
  stairs_wood: {
    id: 'stairs_wood',
    name: 'Wooden Stairs / Ramp',
    description: 'Gradual steps permitting smooth ascent for all creatures.',
    category: 'workbench',
    inputs: { wood: 3 },
    output: { kind: 'buildingPiece', id: 'stairs_wood', name: 'Wooden Stairs', count: 1 },
  },
  bridge_wood: {
    id: 'bridge_wood',
    name: 'Timber Trench Bridge',
    description: 'Span ditches and streams cleanly so heavy forms can cross.',
    category: 'workbench',
    inputs: { wood: 4 },
    output: { kind: 'buildingPiece', id: 'bridge_wood', name: 'Timber Bridge', count: 1 },
  },

  // Stone Structures
  foundation_stone: {
    id: 'foundation_stone',
    name: 'Carved Stone Foundation',
    description: 'Massive megalithic foundation block. Provides immense stability.',
    category: 'workbench',
    inputs: { stone: 4 },
    output: { kind: 'buildingPiece', id: 'foundation_stone', name: 'Stone Foundation', count: 1 },
  },
  wall_stone: {
    id: 'wall_stone',
    name: 'Hewn Stone Wall',
    description: 'Solid stone block wall impervious to wind.',
    category: 'workbench',
    inputs: { stone: 3 },
    output: { kind: 'buildingPiece', id: 'wall_stone', name: 'Stone Wall', count: 1 },
  },
  stairs_stone: {
    id: 'stairs_stone',
    name: 'Carved Stone Steps',
    description: 'Carved stone steps built to last centuries.',
    category: 'workbench',
    inputs: { stone: 3 },
    output: { kind: 'buildingPiece', id: 'stairs_stone', name: 'Stone Steps', count: 1 },
  },
};

export interface WorkbenchEntity {
  id: string;
  position: { x: number; y: number; z: number };
}

export interface StorageContainer {
  id: string;
  position: { x: number; y: number; z: number };
  inventory: Inventory;
}

export interface CraftResult {
  success: boolean;
  reason?: string;
  recipe?: CraftingRecipe;
  output?: {
    kind: OutputKind;
    id: string;
    count: number;
  };
}

export class CraftingSystem {
  readonly workbenches = new Map<string, WorkbenchEntity>();
  readonly storageContainers = new Map<string, StorageContainer>();

  readonly WORKBENCH_RADIUS = 5.0; // Meters
  readonly STORAGE_SUPPLY_RADIUS = 5.0; // Meters

  onCraft?: (recipe: CraftingRecipe) => void;

  registerWorkbench(bench: WorkbenchEntity): void {
    this.workbenches.set(bench.id, bench);
  }

  unregisterWorkbench(benchId: string): void {
    this.workbenches.delete(benchId);
  }

  registerStorage(storage: StorageContainer): void {
    this.storageContainers.set(storage.id, storage);
  }

  isNearWorkbench(playerPos: { x: number; y: number; z: number }): boolean {
    for (const bench of this.workbenches.values()) {
      const dist = Math.hypot(
        playerPos.x - bench.position.x,
        playerPos.y - bench.position.y,
        playerPos.z - bench.position.z
      );
      if (dist <= this.WORKBENCH_RADIUS) {
        return true;
      }
    }
    return false;
  }

  getNearbyStorages(playerPos: { x: number; y: number; z: number }): StorageContainer[] {
    const list: StorageContainer[] = [];
    for (const storage of this.storageContainers.values()) {
      const dist = Math.hypot(
        playerPos.x - storage.position.x,
        playerPos.y - storage.position.y,
        playerPos.z - storage.position.z
      );
      if (dist <= this.STORAGE_SUPPLY_RADIUS) {
        list.push(storage);
      }
    }
    return list;
  }

  /**
   * Total available resource count considering player inventory + nearby storage containers
   */
  getAvailableResourceCount(
    resource: ResourceType,
    playerInventory: Inventory,
    playerPos: { x: number; y: number; z: number }
  ): number {
    let total = playerInventory.get(resource);
    const storages = this.getNearbyStorages(playerPos);
    for (const s of storages) {
      total += s.inventory.get(resource);
    }
    return total;
  }

  canCraft(
    recipeId: string,
    playerInventory: Inventory,
    playerPos: { x: number; y: number; z: number }
  ): { canCraft: boolean; reason?: string } {
    const recipe = CRAFTING_RECIPES[recipeId];
    if (!recipe) {
      return { canCraft: false, reason: `Unknown recipe: ${recipeId}` };
    }

    if (recipe.category === 'workbench' && !this.isNearWorkbench(playerPos)) {
      return { canCraft: false, reason: 'Workbench required within 5 meters' };
    }

    for (const [res, count] of Object.entries(recipe.inputs)) {
      if (count) {
        const available = this.getAvailableResourceCount(res as ResourceType, playerInventory, playerPos);
        if (available < count) {
          return {
            canCraft: false,
            reason: `Missing ${count - available} ${res}`,
          };
        }
      }
    }

    return { canCraft: true };
  }

  craft(
    recipeId: string,
    playerInventory: Inventory,
    playerPos: { x: number; y: number; z: number }
  ): CraftResult {
    const check = this.canCraft(recipeId, playerInventory, playerPos);
    if (!check.canCraft) {
      return { success: false, reason: check.reason };
    }

    const recipe = CRAFTING_RECIPES[recipeId]!;
    const storages = this.getNearbyStorages(playerPos);

    // Deduct resources: first from player inventory, then from nearby storages
    for (const [res, neededTotal] of Object.entries(recipe.inputs)) {
      if (!neededTotal) continue;
      let needed = neededTotal;
      const type = res as ResourceType;

      // Deduct from player
      const fromPlayer = Math.min(playerInventory.get(type), needed);
      if (fromPlayer > 0) {
        playerInventory.consume(type, fromPlayer);
        needed -= fromPlayer;
      }

      // Deduct remainder from nearby storages
      if (needed > 0) {
        for (const s of storages) {
          if (needed <= 0) break;
          const fromStorage = Math.min(s.inventory.get(type), needed);
          if (fromStorage > 0) {
            s.inventory.consume(type, fromStorage);
            needed -= fromStorage;
          }
        }
      }
    }

    this.onCraft?.(recipe);

    return {
      success: true,
      recipe,
      output: {
        kind: recipe.output.kind,
        id: recipe.output.id,
        count: recipe.output.count,
      },
    };
  }
}
