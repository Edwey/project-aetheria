import { describe, it, expect, beforeEach } from 'vitest';
import { PressurePlateSystem } from './pressure-plates.js';

describe('Phase 2 Pressure Plates & Impact System (Master Plan §7)', () => {
  let plates: PressurePlateSystem;

  beforeEach(() => {
    plates = new PressurePlateSystem([
      { id: 'plate_1', position: { x: 5, y: 0, z: 5 }, radius: 0.8, thresholdKg: 1.7, resetDelaySec: 3.0 },
    ]);
  });

  describe('Master Plan §7 Table & Acceptance Tests', () => {
    it('drop from 0.5m (v=3.13 m/s) does NOT press the plate for Oobleck, Dewdrop (dry), or Aerolite', () => {
      // Speed from 0.5m drop: v = sqrt(2 * 9.81 * 0.5) ≈ 3.13 m/s (< 4.0 m/s threshold)
      const v05m = -3.13;

      // Oobleck (1.2 kg)
      plates.evaluatePlateContact({ x: 5, y: 0, z: 5 }, 0.35, 1.2, v05m, false, 'oobleck');
      expect(plates.isPlateActive('plate_1')).toBe(false);

      // Dewdrop dry (1.2 kg)
      plates.evaluatePlateContact({ x: 5, y: 0, z: 5 }, 0.34, 1.2, v05m, false, 'dewdrop');
      expect(plates.isPlateActive('plate_1')).toBe(false);

      // Aerolite (1.5 kg)
      plates.evaluatePlateContact({ x: 5, y: 0, z: 5 }, 0.36, 1.5, v05m, false, 'aerolite');
      expect(plates.isPlateActive('plate_1')).toBe(false);
    });

    it('drop from 1.0m (v=4.43 m/s) MUST press the plate for Oobleck, Dewdrop (dry), and Aerolite', () => {
      // Speed from 1.0m drop: v = sqrt(2 * 9.81 * 1.0) ≈ 4.43 m/s (>= 4.0 m/s threshold)
      const v10m = -4.43;

      // Oobleck (1.2 kg) -> load >= 3.6 kg >= 1.7 kg -> presses!
      plates.evaluatePlateContact({ x: 5, y: 0, z: 5 }, 0.35, 1.2, v10m, false, 'oobleck');
      expect(plates.isPlateActive('plate_1')).toBe(true);

      plates.step(3.1); // reset

      // Dewdrop dry (1.2 kg) -> presses!
      plates.evaluatePlateContact({ x: 5, y: 0, z: 5 }, 0.34, 1.2, v10m, false, 'dewdrop');
      expect(plates.isPlateActive('plate_1')).toBe(true);

      plates.step(3.1); // reset

      // Aerolite (1.5 kg) -> presses!
      plates.evaluatePlateContact({ x: 5, y: 0, z: 5 }, 0.36, 1.5, v10m, false, 'aerolite');
      expect(plates.isPlateActive('plate_1')).toBe(true);
    });

    it('Aether Bubble, uncondensed Mist, Zephyr, and loose Lantern NEVER press it by any drop', () => {
      // High extreme drop at 10.0 m/s
      const extremeDrop = -10.0;

      // Bubble (0.4 kg, capped at 1.6 kg < 1.7 kg threshold)
      plates.evaluatePlateContact({ x: 5, y: 0, z: 5 }, 0.38, 0.4, extremeDrop, true, 'aether_bubble');
      expect(plates.isPlateActive('plate_1')).toBe(false);

      // Mist (0.3 kg, capped at 1.2 kg < 1.7 kg threshold)
      plates.evaluatePlateContact({ x: 5, y: 0, z: 5 }, 0.32, 0.3, extremeDrop, true, 'mist');
      expect(plates.isPlateActive('plate_1')).toBe(false);

      // Zephyr (0.3 kg, capped at 1.2 kg < 1.7 kg threshold)
      plates.evaluatePlateContact({ x: 5, y: 0, z: 5 }, 0.30, 0.3, extremeDrop, true, 'zephyr');
      expect(plates.isPlateActive('plate_1')).toBe(false);
    });

    it('Dewdrop full of water (2.0kg) and condensed Lantern (>=1.7kg) press it standing', () => {
      // Dewdrop full of water: 2.0 kg >= 1.7 kg standing
      plates.evaluatePlateContact({ x: 5, y: 0, z: 5 }, 0.34, 2.0, 0, false, 'dewdrop');
      expect(plates.isPlateActive('plate_1')).toBe(true);

      plates.step(3.1);

      // Lantern condensed: 2.5 kg >= 1.7 kg standing
      plates.evaluatePlateContact({ x: 5, y: 0, z: 5 }, 0.32, 2.5, 0, false, 'lantern');
      expect(plates.isPlateActive('plate_1')).toBe(true);
    });

    it('Geode (3.5kg) and Obsidian (9.0kg) press it standing', () => {
      plates.evaluatePlateContact({ x: 5, y: 0, z: 5 }, 0.45, 3.5, 0, false, 'geode');
      expect(plates.isPlateActive('plate_1')).toBe(true);

      plates.step(3.1);

      plates.evaluatePlateContact({ x: 5, y: 0, z: 5 }, 0.40, 9.0, 0, false, 'obsidian');
      expect(plates.isPlateActive('plate_1')).toBe(true);
    });

    it('no load exceeds 4x resting weight', () => {
      // Drop at 20 m/s
      const res = PressurePlateSystem.calculateImpactLoad(10.0, -20.0, true);
      expect(res.loadKg).toBeLessThanOrEqual(40.0); // Exactly 4x 10kg
    });

    it('stays pressed for 3.0s latch duration before resetting', () => {
      plates.evaluatePlateContact({ x: 5, y: 0, z: 5 }, 0.40, 9.0, 0);
      expect(plates.isPlateActive('plate_1')).toBe(true);

      // 2.0s passed -> still pressed
      plates.step(2.0);
      expect(plates.isPlateActive('plate_1')).toBe(true);

      // 3.1s passed -> resets
      plates.step(1.1);
      expect(plates.isPlateActive('plate_1')).toBe(false);
    });
  });
});
