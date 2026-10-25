import { describe, it, expect } from 'vitest';
import { TerrainGridTrenchMap } from './trench-experiment.js';

describe('Phase 0 Trench Experiment', () => {
  it('lowers height by 0.3m per dig up to 3 units (0.9m)', () => {
    const map = new TerrainGridTrenchMap(16, 16, 1.0, -8, -8);
    const baseHeight = 5.0;

    expect(map.getEffectiveHeight(baseHeight, 0, 0)).toBe(5.0);

    // Dig 1: 0.3m
    expect(map.dig(0, 0)).toBe(true);
    expect(map.getEffectiveHeight(baseHeight, 0, 0)).toBeCloseTo(4.7);

    // Dig 2: 0.6m
    expect(map.dig(0, 0)).toBe(true);
    expect(map.getEffectiveHeight(baseHeight, 0, 0)).toBeCloseTo(4.4);

    // Dig 3: 0.9m
    expect(map.dig(0, 0)).toBe(true);
    expect(map.getEffectiveHeight(baseHeight, 0, 0)).toBeCloseTo(4.1);

    // Dig 4: capped at max 3 steps
    expect(map.dig(0, 0)).toBe(false);
    expect(map.getEffectiveHeight(baseHeight, 0, 0)).toBeCloseTo(4.1);
  });

  it('moistens soil in surrounding trench cells when dug', () => {
    const map = new TerrainGridTrenchMap(16, 16, 1.0, -8, -8);
    const cell = map.getCell(0, 0);
    expect(cell?.soilMoisture).toBe(20);

    map.dig(0, 0);
    expect(cell?.soilMoisture).toBe(35);
  });

  it('simulates water dispersion along contiguous trench cells', () => {
    const map = new TerrainGridTrenchMap(10, 10, 1.0, 0, 0);

    // Create a 3-cell trench line from (1, 1) to (3, 1)
    map.dig(1.5, 1.5);
    map.dig(2.5, 1.5);
    map.dig(3.5, 1.5);

    // Add water to source cell
    const sourceCell = map.getCell(1.5, 1.5)!;
    sourceCell.waterLevel = 1.0;

    const midCell = map.getCell(2.5, 1.5)!;
    const endCell = map.getCell(3.5, 1.5)!;

    expect(midCell.waterLevel).toBe(0);
    expect(endCell.waterLevel).toBe(0);

    // Step water simulation over 2 seconds
    for (let i = 0; i < 120; i++) {
      map.stepWaterFlow(1 / 60);
    }

    // Water must propagate from source to adjacent cells
    expect(midCell.waterLevel).toBeGreaterThan(0.1);
    expect(endCell.waterLevel).toBeGreaterThan(0.01);
  });
});
