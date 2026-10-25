import { describe, it, expect } from 'vitest';
import { ForgivenessToolkit } from './forgiveness.js';

describe('Phase 2 Forgiveness Toolkit', () => {
  describe('0.1m Tangential Corner Nudge', () => {
    it('nudges actor horizontally around obstacle corner without adding vertical lift', () => {
      const obstacle = {
        minX: 0,
        maxX: 4,
        minZ: 0,
        maxZ: 4,
        topY: 2.0,
      };

      // Actor jumping near the top lip (y=2.1), clipping minX within 0.05m
      const actorPos = { x: -0.32, y: 2.1, z: 2.0 };
      const actorVel = { x: 2.0, y: 1.5, z: 0 };
      const radius = 0.35; // actor edge is at -0.32 + 0.35 = +0.03 (inside minX)

      const res = ForgivenessToolkit.applyCornerNudge(actorPos, actorVel, radius, obstacle, 0.10);

      expect(res.nudged).toBe(true);
      // Nudged horizontally outside the corner
      expect(res.pos.x + radius).toBeLessThanOrEqual(obstacle.minX);
      // Vertical position preserved exactly (never adds lift)
      expect(res.pos.y).toBe(actorPos.y);
    });
  });

  describe('Bounce Chain (Consecutive Jump Bonus)', () => {
    it('chains consecutive jumps within 0.3s up to +50% power (5 links)', () => {
      const toolkit = new ForgivenessToolkit();

      // Land on ground
      toolkit.updateBounceChain(0.016, true, false, false);
      expect(toolkit.bounceChain.chainCount).toBe(0);

      // Link 1: Re-jump after 0.1s (< 0.3s)
      let mult1 = toolkit.updateBounceChain(0.10, true, true, true);
      expect(mult1).toBeCloseTo(1.10); // +10%

      // Airborne 0.4s then land
      toolkit.updateBounceChain(0.4, false, true, false);
      toolkit.updateBounceChain(0.016, true, false, false);

      // Link 2: Re-jump after 0.15s
      let mult2 = toolkit.updateBounceChain(0.15, true, true, true);
      expect(mult2).toBeCloseTo(1.20); // +20%

      // Fast forward links 3, 4, 5
      for (let i = 3; i <= 5; i++) {
        toolkit.updateBounceChain(0.4, false, true, false);
        toolkit.updateBounceChain(0.016, true, false, false);
        toolkit.updateBounceChain(0.1, true, true, true);
      }
      expect(toolkit.bounceChain.powerMultiplier).toBeCloseTo(1.50); // Capped at +50%
    });

    it('resets bounce chain if grounded for > 0.3s without jumping', () => {
      const toolkit = new ForgivenessToolkit();
      toolkit.updateBounceChain(0.016, true, false, false);
      toolkit.updateBounceChain(0.10, true, true, true); // Link 1 (+10%)

      // Land and wait for 0.4s (> 0.3s)
      toolkit.updateBounceChain(0.4, false, true, false);
      toolkit.updateBounceChain(0.016, true, false, false);
      toolkit.updateBounceChain(0.40, true, true, false); // Idle on ground

      expect(toolkit.bounceChain.chainCount).toBe(0);
      expect(toolkit.bounceChain.powerMultiplier).toBe(1.0);
    });
  });

  describe('Safe Ground Tracking & 0.5s Respawn Fade', () => {
    it('records safe ground points and initiates 0.5s fade when falling below world', () => {
      const safePos = { x: 60, y: 1.5, z: 40 };
      const toolkit = new ForgivenessToolkit(safePos);

      // Settle on new safe ground (x=70, y=2.0, z=45)
      toolkit.updateSafeRespawn(1.0, { x: 70, y: 2.0, z: 45 }, true);
      expect(toolkit.respawn.lastSafeGroundPos).toEqual({ x: 70, y: 2.0, z: 45 });

      // Fall off island into abyss (y = -12m)
      const res1 = toolkit.updateSafeRespawn(0.2, { x: 70, y: -12.0, z: 45 }, false);
      expect(res1.shouldRespawn).toBe(false);
      expect(toolkit.respawn.isFadingRespawn).toBe(true);

      // After remaining 0.35s fade finishes
      const res2 = toolkit.updateSafeRespawn(0.35, { x: 70, y: -12.0, z: 45 }, false);
      expect(res2.shouldRespawn).toBe(true);
      expect(res2.targetPos).toEqual({ x: 70, y: 2.0, z: 45 });
    });
  });
});
