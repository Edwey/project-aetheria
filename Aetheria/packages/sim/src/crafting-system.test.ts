import { describe, it, expect, vi } from 'vitest';
import { Inventory } from './harvest-system.js';
import { CraftingSystem, CRAFTING_RECIPES } from './crafting-system.js';

describe('CraftingSystem', () => {
  it('allows crafting pocket items anywhere if resources are present', () => {
    const sys = new CraftingSystem();
    const inv = new Inventory({ fiber: 4 });
    const playerPos = { x: 100, y: 0, z: 100 }; // Far away from any workbench

    const check = sys.canCraft('twine', inv, playerPos);
    expect(check.canCraft).toBe(true);

    const result = sys.craft('twine', inv, playerPos);
    expect(result.success).toBe(true);
    expect(result.output?.id).toBe('twine');
    expect(inv.get('fiber')).toBe(2); // 4 - 2 = 2
  });

  it('rejects workbench recipes when no workbench is within 5.0m', () => {
    const sys = new CraftingSystem();
    sys.registerWorkbench({
      id: 'cove_bench',
      position: { x: 60, y: 1, z: 40 },
    });

    const inv = new Inventory({ wood: 10 });
    // Player is 10m away
    const farPos = { x: 70, y: 1, z: 40 };

    const check = sys.canCraft('wall_wood', inv, farPos);
    expect(check.canCraft).toBe(false);
    expect(check.reason).toContain('Workbench required');

    const result = sys.craft('wall_wood', inv, farPos);
    expect(result.success).toBe(false);
    expect(inv.get('wood')).toBe(10); // Not consumed
  });

  it('allows workbench recipes when player is within 5.0m of workbench', () => {
    const sys = new CraftingSystem();
    sys.registerWorkbench({
      id: 'cove_bench',
      position: { x: 60, y: 1, z: 40 },
    });

    const inv = new Inventory({ wood: 10 });
    // Player is 2m away
    const closePos = { x: 62, y: 1, z: 40 };

    const check = sys.canCraft('wall_wood', inv, closePos);
    expect(check.canCraft).toBe(true);

    const result = sys.craft('wall_wood', inv, closePos);
    expect(result.success).toBe(true);
    expect(result.output?.id).toBe('wall_wood');
    expect(inv.get('wood')).toBe(7); // 10 - 3 = 7
  });

  it('supplies crafting materials from nearby storage within 5.0m', () => {
    const sys = new CraftingSystem();
    sys.registerWorkbench({
      id: 'bench',
      position: { x: 0, y: 0, z: 0 },
    });

    // Player has 1 wood, chest at (1, 0, 0) has 3 wood
    const playerInv = new Inventory({ wood: 1 });
    const chestInv = new Inventory({ wood: 3 });

    sys.registerStorage({
      id: 'chest_1',
      position: { x: 1, y: 0, z: 0 },
      inventory: chestInv,
    });

    const playerPos = { x: 0, y: 0, z: 0 };
    // 'foundation_wood' requires 4 wood
    const check = sys.canCraft('foundation_wood', playerInv, playerPos);
    expect(check.canCraft).toBe(true);

    const result = sys.craft('foundation_wood', playerInv, playerPos);
    expect(result.success).toBe(true);
    expect(playerInv.get('wood')).toBe(0); // 1 consumed from player
    expect(chestInv.get('wood')).toBe(0);   // 3 consumed from chest
  });

  it('triggers onCraft callback with recipe details', () => {
    const sys = new CraftingSystem();
    const craftCallback = vi.fn();
    sys.onCraft = craftCallback;

    const inv = new Inventory({ stone: 4 });
    sys.craft('bowl', inv, { x: 0, y: 0, z: 0 });

    expect(craftCallback).toHaveBeenCalledWith(CRAFTING_RECIPES['bowl']);
  });
});
