import { describe, it, expect, vi } from 'vitest';
import { TrenchSystem } from './trench-system.js';

describe('TrenchSystem', () => {
  it('digs trench cells and lowers effective collision height by 0.3m', () => {
    const sys = new TrenchSystem(20, 20, 0, 0);
    const digCallback = vi.fn();
    sys.onTrenchDug = digCallback;

    const baseHeight = 2.0;
    expect(sys.getEffectiveHeight(baseHeight, 5, 5)).toBe(2.0);

    const res = sys.digAt(5, 5);
    expect(res.success).toBe(true);
    expect(res.newDepth).toBe(1);
    expect(digCallback).toHaveBeenCalledWith(5, 5, 1);
    expect(sys.getEffectiveHeight(baseHeight, 5, 5)).toBe(1.7); // 2.0 - 0.3 = 1.7
  });

  it('propagates water from a reservoir along dug trench cells', () => {
    const sys = new TrenchSystem(10, 10, 0, 0);

    // Reservoir at (2, 2)
    sys.addReservoir({ id: 'spring', x: 2, z: 2, waterLevel: 0.8 });

    // Dig a path from (2, 2) -> (3, 2) -> (4, 2)
    sys.digAt(3, 2);
    sys.digAt(4, 2);

    expect(sys.getCell(3, 2)?.waterLevel).toBe(0);

    // Step water updates
    sys.update(0.3); // 1 step
    sys.update(0.3); // 2nd step
    sys.update(0.3); // 3rd step

    // Water has flowed into (3, 2)
    const cell3 = sys.getCell(3, 2);
    expect(cell3?.waterLevel).toBeGreaterThan(0.05);
  });

  it('diffuses moisture to neighboring cells within 2-3 cells', () => {
    const sys = new TrenchSystem(10, 10, 0, 0);
    sys.addReservoir({ id: 'spring', x: 5, z: 5, waterLevel: 0.8 });

    const initialNeighborMoisture = sys.getCell(5, 6)?.soilMoisture || 20;

    // Run water steps
    sys.update(1.0);

    const updatedNeighborMoisture = sys.getCell(5, 6)?.soilMoisture || 20;
    expect(updatedNeighborMoisture).toBeGreaterThan(initialNeighborMoisture);
  });

  it('computes submerged info using Master Plan 8% submerged gate', () => {
    const sys = new TrenchSystem(10, 10, 0, 0);
    sys.addReservoir({ id: 'spring', x: 2, z: 2, waterLevel: 0.6 });

    const baseHeight = 1.0;
    // Avatar sphere with radius 0.5 at y=1.2 (partially in water surface ~1.3)
    const info1 = sys.getSubmergedInfo(2, 1.2, 2, baseHeight, 0.5);
    expect(info1.isSubmerged).toBe(true);
    expect(info1.submergedRatio).toBeGreaterThan(0.08);

    // Avatar way above water at y=5.0
    const info2 = sys.getSubmergedInfo(2, 5.0, 2, baseHeight, 0.5);
    expect(info2.isSubmerged).toBe(false);
    expect(info2.submergedRatio).toBe(0);
  });

  it('serializes and deserializes trench depth accurately', () => {
    const sys = new TrenchSystem(10, 10, 0, 0);
    sys.digAt(2, 3);
    sys.digAt(2, 3); // depth 2
    sys.digAt(4, 5); // depth 1

    const saved = sys.serialize();
    expect(saved.length).toBe(2);

    const sys2 = new TrenchSystem(10, 10, 0, 0);
    sys2.deserialize(saved);

    expect(sys2.getCell(2, 3)?.trenchDepth).toBe(2);
    expect(sys2.getCell(4, 5)?.trenchDepth).toBe(1);
  });
});
