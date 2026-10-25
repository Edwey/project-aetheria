import { describe, it, expect } from 'vitest';
import { Inventory } from './harvest-system.js';
import { BuildingSystem } from './building-system.js';

describe('BuildingSystem', () => {
  it('snaps positions to grid (0.5m and 1.0m)', () => {
    const sys = new BuildingSystem();
    sys.gridSnapSize = 0.5;

    const snapped05 = sys.snapPosition({ x: 1.23, y: 0.88, z: -0.42 });
    expect(snapped05).toEqual({ x: 1.0, y: 1.0, z: -0.5 });

    sys.gridSnapSize = 1.0;
    const snapped10 = sys.snapPosition({ x: 1.23, y: 0.88, z: -0.42 });
    expect(snapped10).toEqual({ x: 1.0, y: 1.0, z: -0.0 });
  });

  it('supports foundation on ground with adaptive stilts up to 3.0m', () => {
    const sys = new BuildingSystem();
    const inv = new Inventory({ wood: 10 });
    const groundY = 0.0;

    // Foundation at y = 1.5m -> stiltsHeight = 1.5m (<= 3.0m)
    const check1 = sys.validatePlacement('foundation_wood', { x: 10, y: 1.5, z: 10 }, 0, inv, groundY);
    expect(check1.valid).toBe(true);
    expect(check1.stiltsHeight).toBe(1.5);

    // Foundation at y = 3.5m -> exceeds 3.0m max stilts
    const check2 = sys.validatePlacement('foundation_wood', { x: 10, y: 3.5, z: 10 }, 0, inv, groundY);
    expect(check2.valid).toBe(false);
    expect(check2.reason).toContain('3.0m stilt limit');
  });

  it('rejects floating wall without support', () => {
    const sys = new BuildingSystem();
    const inv = new Inventory({ wood: 10 });
    const groundY = 0.0;

    // Floating wall at y = 3.0m in thin air
    const check = sys.validatePlacement('wall_wood', { x: 10, y: 3.0, z: 10 }, 0, inv, groundY);
    expect(check.valid).toBe(false);
    expect(check.reason).toContain('requires structural support');
  });

  it('places piece, consumes exact cost, and allows 100% full-cost undo and redo', () => {
    const sys = new BuildingSystem();
    const inv = new Inventory({ wood: 10 });
    const groundY = 0.0;

    // Foundation costs 4 wood
    const placeRes = sys.placePiece('foundation_wood', { x: 4, y: 0, z: 4 }, 0, inv, groundY);
    expect(placeRes.success).toBe(true);
    expect(sys.structures.size).toBe(1);
    expect(inv.get('wood')).toBe(6); // 10 - 4 = 6

    // Undo restores 100% of the cost
    expect(sys.canUndo).toBe(true);
    const undoRes = sys.undo(inv);
    expect(undoRes).toBe(true);
    expect(sys.structures.size).toBe(0);
    expect(inv.get('wood')).toBe(10); // Restored to 10

    // Redo re-places piece and deducts cost
    expect(sys.canRedo).toBe(true);
    const redoRes = sys.redo(inv);
    expect(redoRes).toBe(true);
    expect(sys.structures.size).toBe(1);
    expect(inv.get('wood')).toBe(6);
  });

  it('dismantling returns predictable 75% material refund', () => {
    const sys = new BuildingSystem();
    const inv = new Inventory({ wood: 10 });
    const groundY = 0.0;

    // Foundation placed (cost 4 wood)
    const placeRes = sys.placePiece('foundation_wood', { x: 0, y: 0, z: 0 }, 0, inv, groundY);
    expect(placeRes.piece).toBeDefined();
    expect(inv.get('wood')).toBe(6);

    // Dismantle: 4 * 0.75 = 3 wood refund
    const pieceId = placeRes.piece!.id;
    const disRes = sys.dismantlePiece(pieceId, inv);
    expect(disRes.success).toBe(true);
    expect(disRes.refund).toEqual({ wood: 3 });
    expect(inv.get('wood')).toBe(9); // 6 + 3 = 9
    expect(sys.structures.size).toBe(0);
  });

  it('serializes and deserializes placed structures correctly', () => {
    const sys = new BuildingSystem();
    const inv = new Inventory({ wood: 20 });

    sys.placePiece('foundation_wood', { x: 2, y: 0, z: 2 }, 0, inv, 0);
    sys.placePiece('wall_wood', { x: 2, y: 0.5, z: 2 }, Math.PI / 2, inv, 0);

    const saved = sys.serialize();
    expect(saved.length).toBe(2);

    const sys2 = new BuildingSystem();
    sys2.deserialize(saved);
    expect(sys2.structures.size).toBe(2);
    expect(sys2.structures.get(saved[0].id)?.pieceKey).toBe('foundation_wood');
    expect(sys2.structures.get(saved[1].id)?.pieceKey).toBe('wall_wood');
  });
});
