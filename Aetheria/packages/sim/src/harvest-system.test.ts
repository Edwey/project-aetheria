import { describe, it, expect, vi } from 'vitest';
import { Inventory, HarvestSystem } from './harvest-system.js';

describe('Inventory', () => {
  it('initializes with default zero counts or partial values', () => {
    const inv = new Inventory({ wood: 5, stone: 2 });
    expect(inv.get('wood')).toBe(5);
    expect(inv.get('stone')).toBe(2);
    expect(inv.get('fiber')).toBe(0);
    expect(inv.get('petals')).toBe(0);
  });

  it('handles add and consume correctly', () => {
    const inv = new Inventory();
    inv.add('wood', 10);
    expect(inv.get('wood')).toBe(10);
    expect(inv.has('wood', 5)).toBe(true);
    expect(inv.has('wood', 15)).toBe(false);

    const success = inv.consume('wood', 4);
    expect(success).toBe(true);
    expect(inv.get('wood')).toBe(6);

    const fail = inv.consume('wood', 10);
    expect(fail).toBe(false);
    expect(inv.get('wood')).toBe(6); // unchanged on failure
  });

  it('consumes multiple requirements atomically', () => {
    const inv = new Inventory({ wood: 4, stone: 2 });
    const success = inv.consumeMultiple({ wood: 3, stone: 2 });
    expect(success).toBe(true);
    expect(inv.get('wood')).toBe(1);
    expect(inv.get('stone')).toBe(0);

    // Fail if missing one requirement
    const fail = inv.consumeMultiple({ wood: 2, stone: 1 });
    expect(fail).toBe(false);
    expect(inv.get('wood')).toBe(1); // unchanged
  });

  it('serializes and deserializes accurately', () => {
    const inv = new Inventory({ wood: 8, fiber: 12, petals: 3 });
    const serialized = inv.serialize();

    const inv2 = new Inventory();
    inv2.deserialize(serialized);
    expect(inv2.get('wood')).toBe(8);
    expect(inv2.get('fiber')).toBe(12);
    expect(inv2.get('petals')).toBe(3);
    expect(inv2.get('stone')).toBe(0);
  });
});

describe('HarvestSystem', () => {
  it('registers nodes and allows harvesting when player is in range', () => {
    const sys = new HarvestSystem();
    const harvestCallback = vi.fn();
    sys.onHarvest = harvestCallback;

    sys.registerNode({
      id: 'test_wood',
      type: 'wood',
      name: 'Test Tree',
      position: { x: 10, y: 1, z: 10 },
      yieldAmount: 3,
      respawnTime: 10,
      currentRespawnTimer: 0,
      isDepleted: false,
    });

    // Too far (10m away) -> returns false
    const farResult = sys.harvestNode('test_wood', { x: 0, y: 1, z: 0 });
    expect(farResult).toBe(false);
    expect(sys.droppedItems.size).toBe(0);

    // Close (1m away) -> returns true, marks depleted, spawns drop
    const closeResult = sys.harvestNode('test_wood', { x: 10, y: 1, z: 9.2 });
    expect(closeResult).toBe(true);
    expect(harvestCallback).toHaveBeenCalledWith({
      nodeId: 'test_wood',
      type: 'wood',
      amount: 3,
    });
    expect(sys.nodes.get('test_wood')?.isDepleted).toBe(true);
    expect(sys.droppedItems.size).toBe(1);

    // Second harvest while depleted fails
    expect(sys.harvestNode('test_wood', { x: 10, y: 1, z: 9.2 })).toBe(false);
  });

  it('respawns nodes after timer expires', () => {
    const sys = new HarvestSystem();
    sys.registerNode({
      id: 'quick_node',
      type: 'fiber',
      name: 'Quick Reeds',
      position: { x: 0, y: 0, z: 0 },
      yieldAmount: 2,
      respawnTime: 2.0,
      currentRespawnTimer: 0,
      isDepleted: false,
    });

    sys.harvestNode('quick_node', { x: 0, y: 0, z: 0 });
    expect(sys.nodes.get('quick_node')?.isDepleted).toBe(true);

    const inv = new Inventory();
    sys.update(1.0, { x: 100, y: 0, z: 100 }, inv);
    expect(sys.nodes.get('quick_node')?.isDepleted).toBe(true);

    sys.update(1.1, { x: 100, y: 0, z: 100 }, inv);
    expect(sys.nodes.get('quick_node')?.isDepleted).toBe(false);
  });

  it('attracts drops via magnet and collects into inventory', () => {
    const sys = new HarvestSystem();
    const pickupCallback = vi.fn();
    sys.onPickup = pickupCallback;

    const inv = new Inventory();
    // Drop at (2, 0, 0)
    const drop = sys.spawnDrop('petals', 2, { x: 2.0, y: 0, z: 0 });
    expect(drop.magnetized).toBe(false);

    // Player at (0, 0, 0): dist = 2.0m (within MAGNET_RADIUS 2.5m)
    sys.update(0.1, { x: 0, y: 0, z: 0 }, inv);
    expect(drop.magnetized).toBe(true);
    // Moved closer
    expect(drop.position.x).toBeLessThan(2.0);
    expect(inv.get('petals')).toBe(0);

    // Step enough time to reach PICKUP_RADIUS <= 0.5m
    sys.update(0.3, { x: 0, y: 0, z: 0 }, inv);
    expect(inv.get('petals')).toBe(2);
    expect(sys.droppedItems.size).toBe(0);
    expect(pickupCallback).toHaveBeenCalledWith({
      type: 'petals',
      amount: 2,
      position: expect.any(Object),
    });
  });

  it('initializes starter nodes with all 4 resource types', () => {
    const sys = new HarvestSystem();
    sys.initStarterNodes();
    expect(sys.nodes.size).toBeGreaterThanOrEqual(8);
    const types = new Set(Array.from(sys.nodes.values()).map(n => n.type));
    expect(types.has('wood')).toBe(true);
    expect(types.has('stone')).toBe(true);
    expect(types.has('fiber')).toBe(true);
    expect(types.has('petals')).toBe(true);
  });
});
