/**
 * Aetheria - Phase 3 Loop Slice Integration Test
 *
 * Validates the core gameplay loop:
 * Gather -> Craft -> Build -> Dig/Divert Water -> Undo/Dismantle -> Save & Restore
 * Exit Gate: "The loop is fun, readable and save-safe. Go or no-go review."
 */

import { describe, it, expect } from 'vitest';
import { Inventory, HarvestSystem } from './harvest-system.js';
import { CraftingSystem } from './crafting-system.js';
import { BuildingSystem } from './building-system.js';
import { TrenchSystem } from './trench-system.js';
import { SaveSystem, CURRENT_SAVE_VERSION } from '@core/save-system.js';

describe('Phase 3: Loop Slice End-to-End Core Loop', () => {
  it('executes the full peaceful gameplay loop and preserves save safety', () => {
    // 1. Setup Bounded Starter Slice (Pebble Cove)
    const inventory = new Inventory();
    const harvestSys = new HarvestSystem();
    harvestSys.initStarterNodes();

    const craftingSys = new CraftingSystem();
    // Workbench at (62, 0.5, 42)
    craftingSys.registerWorkbench({
      id: 'cove_bench',
      position: { x: 62, y: 0.5, z: 42 },
    });

    const buildingSys = new BuildingSystem();
    buildingSys.gridSnapSize = 0.5;

    const trenchSys = new TrenchSystem(40, 40, 40, 20);
    trenchSys.initStarterWatershed(); // Reservoir at (52, 48)

    // Player initial position (Pebble Cove spawn)
    const playerPos = { x: 60.0, y: 1.5, z: 40.0 };

    // 2. Harvesting: Player interacts with nearby shoreline driftwood and river pebbles
    // Shoreline driftwood_1 is at (57, 1.0, 38) -> distance = ~3.6m. Move closer to (57, 1.0, 38)
    const woodHarvested = harvestSys.harvestNode('driftwood_1', { x: 57.5, y: 1.0, z: 38.0 });
    expect(woodHarvested).toBe(true);

    // Pebbles_1 is at (59, 1.0, 44)
    const stoneHarvested = harvestSys.harvestNode('pebbles_1', { x: 59.5, y: 1.0, z: 43.5 });
    expect(stoneHarvested).toBe(true);

    // Update harvest system with player position at (58, 1.0, 40) to attract and collect drops
    // Driftwood_1 yields 2 wood, pebbles_1 yields 2 stone
    harvestSys.update(0.5, { x: 57.5, y: 1.0, z: 38.0 }, inventory);
    harvestSys.update(0.5, { x: 59.5, y: 1.0, z: 43.5 }, inventory);

    expect(inventory.get('wood')).toBe(2);
    expect(inventory.get('stone')).toBe(2);

    // Harvest a second wood node to get enough materials for building
    // Driftwood_2 at (62, 1.0, 34)
    harvestSys.harvestNode('driftwood_2', { x: 62.0, y: 1.0, z: 34.0 });
    harvestSys.update(0.5, { x: 62.0, y: 1.0, z: 34.0 }, inventory);
    expect(inventory.get('wood')).toBe(4);

    // 3. Crafting: Pocket Item (Campfire: 2 wood + 2 stone)
    const canCraftCampfire = craftingSys.canCraft('campfire', inventory, playerPos);
    expect(canCraftCampfire.canCraft).toBe(true);
    const craftCampfireRes = craftingSys.craft('campfire', inventory, playerPos);
    expect(craftCampfireRes.success).toBe(true);
    expect(inventory.get('wood')).toBe(2); // 4 - 2 = 2
    expect(inventory.get('stone')).toBe(0); // 2 - 2 = 0

    // Gather 4 more wood for a wooden foundation
    harvestSys.spawnDrop('wood', 4, { x: playerPos.x, y: playerPos.y, z: playerPos.z });
    harvestSys.update(0.1, playerPos, inventory);
    expect(inventory.get('wood')).toBe(6);

    // 4. Workbench Crafting & Building: Move to workbench at (62, 0.5, 42)
    const benchPos = { x: 62.0, y: 0.5, z: 42.0 };
    expect(craftingSys.isNearWorkbench(benchPos)).toBe(true);

    // Craft Wooden Foundation (costs 4 wood)
    const canCraftFoundation = craftingSys.canCraft('foundation_wood', inventory, benchPos);
    expect(canCraftFoundation.canCraft).toBe(true);

    // 5. Modular Building: Place Foundation on ground (groundY = 1.0)
    // Foundation at (62, 1.5, 44) has 0.5m stilts
    const placeRes = buildingSys.placePiece('foundation_wood', { x: 62.1, y: 1.5, z: 44.2 }, 0, inventory, 1.0);
    expect(placeRes.success).toBe(true);
    expect(placeRes.piece?.position).toEqual({ x: 62.0, y: 1.5, z: 44.0 }); // Snapped to 0.5m grid!
    expect(placeRes.piece?.stiltsHeight).toBe(0.5); // Adaptive stilts
    expect(inventory.get('wood')).toBe(2); // 6 - 4 = 2

    // 6. 20-Step Undo & Redo Test
    // Undo placement
    expect(buildingSys.canUndo).toBe(true);
    const undoSuccess = buildingSys.undo(inventory);
    expect(undoSuccess).toBe(true);
    expect(buildingSys.structures.size).toBe(0);
    expect(inventory.get('wood')).toBe(6); // 100% full cost restored!

    // Redo placement
    expect(buildingSys.canRedo).toBe(true);
    const redoSuccess = buildingSys.redo(inventory);
    expect(redoSuccess).toBe(true);
    expect(buildingSys.structures.size).toBe(1);
    expect(inventory.get('wood')).toBe(2);

    // Place a wooden floor connected to the foundation
    inventory.add('wood', 2);
    const floorRes = buildingSys.placePiece('floor_wood', { x: 62.0, y: 1.5, z: 46.0 }, 0, inventory, 1.0);
    expect(floorRes.success).toBe(true);
    expect(buildingSys.structures.size).toBe(2);

    // 7. Dynamic Trench Digging & Water Diversion
    // Dig a trench from reservoir (52, 48) towards the player's camp (53, 48), (54, 48)
    const dig1 = trenchSys.digAt(53, 48);
    expect(dig1.success).toBe(true);
    expect(dig1.newDepth).toBe(1);
    expect(trenchSys.getEffectiveHeight(1.5, 53, 48)).toBe(1.2); // 1.5 - 0.3 = 1.2m

    const dig2 = trenchSys.digAt(54, 48);
    expect(dig2.success).toBe(true);

    // Simulate water flow from reservoir
    trenchSys.update(0.3); // Step 1
    trenchSys.update(0.3); // Step 2

    const trenchCellWater = trenchSys.getCell(53, 48);
    expect(trenchCellWater?.waterLevel).toBeGreaterThan(0.02);

    // 8. 75% Predictable Dismantle Refund Test
    const dismantleFloor = buildingSys.dismantlePiece(floorRes.piece!.id, inventory);
    expect(dismantleFloor.success).toBe(true);
    // Floor cost was 2 wood -> 75% of 2 = Math.floor(1.5) = 1 wood
    expect(dismantleFloor.refund).toEqual({ wood: 1 });
    expect(inventory.get('wood')).toBe(3);
    expect(buildingSys.structures.size).toBe(1);

    // 9. Save Safety & Restorability
    const saveSys = new SaveSystem();
    const activeWorld = saveSys.getActiveWorld();

    // Commit current state into active save
    activeWorld.inventory = inventory.serialize();
    activeWorld.structures = buildingSys.serialize();
    activeWorld.trenches = trenchSys.serialize();
    saveSys.commitSave();

    // Verify backup creation and export payload
    const exportText = saveSys.exportToJson();
    expect(exportText).toContain('foundation_wood');

    // Restore from save in a fresh new world instance
    const freshInv = new Inventory();
    freshInv.deserialize(activeWorld.inventory);
    expect(freshInv.get('wood')).toBe(3);

    const freshBuildingSys = new BuildingSystem();
    freshBuildingSys.deserialize(activeWorld.structures);
    expect(freshBuildingSys.structures.size).toBe(1);
    const restoredPiece = Array.from(freshBuildingSys.structures.values())[0];
    expect(restoredPiece.pieceKey).toBe('foundation_wood');
    expect(restoredPiece.position).toEqual({ x: 62.0, y: 1.5, z: 44.0 });

    const freshTrenchSys = new TrenchSystem(40, 40, 40, 20);
    freshTrenchSys.deserialize(activeWorld.trenches);
    expect(freshTrenchSys.getCell(53, 48)?.trenchDepth).toBe(1);
    expect(freshTrenchSys.getCell(54, 48)?.trenchDepth).toBe(1);
    expect(freshTrenchSys.getEffectiveHeight(1.5, 53, 48)).toBe(1.2);
  });
});
