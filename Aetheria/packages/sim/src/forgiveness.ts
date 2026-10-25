/**
 * Forgiveness Toolkit
 * 
 * Aligned with Master Plan v4 (§10, §12).
 * Implements:
 * - 0.1m Tangential corner nudge that never adds vertical lift
 * - Bounce chain (re-jump within 0.3s for +10% power per link, up to 5 links)
 * - Safe ground position tracker & 0.5s respawn fade with zero inventory loss
 */

import type { Vector3Like } from './physics-spike.js';

export interface CornerNudgeBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  topY: number;
}

export interface BounceChainState {
  chainCount: number;       // 0 to 5
  timeSinceLanded: number;  // seconds since last ground contact
  justLanded: boolean;
  powerMultiplier: number;  // 1.0 to 1.5 (+10% per link)
}

export interface RespawnState {
  lastSafeGroundPos: Vector3Like;
  isFadingRespawn: boolean;
  respawnFadeTimer: number; // 0.5s fade
}

export class ForgivenessToolkit {
  public bounceChain: BounceChainState = {
    chainCount: 0,
    timeSinceLanded: 99.0,
    justLanded: false,
    powerMultiplier: 1.0,
  };

  public respawn: RespawnState;

  constructor(initialSafePos: Vector3Like = { x: 60, y: 1.5, z: 40 }) {
    this.respawn = {
      lastSafeGroundPos: { ...initialSafePos },
      isFadingRespawn: false,
      respawnFadeTimer: 0,
    };
  }

  /**
   * 0.1m Tangential Corner Nudge.
   * If a jumping actor clips a ledge corner within 0.1m, nudges them horizontally
   * around the obstacle without adding vertical lift.
   */
  static applyCornerNudge(
    pos: Vector3Like,
    vel: Vector3Like,
    radius: number,
    obstacle: CornerNudgeBox,
    nudgeMargin: number = 0.10
  ): { pos: Vector3Like; nudged: boolean } {
    // Only applies if moving upward or horizontally near the obstacle's top lip
    if (Math.abs(pos.y - obstacle.topY) > 0.4) {
      return { pos: { ...pos }, nudged: false };
    }

    const newPos = { ...pos };
    let nudged = false;

    // Check near minX corner
    const distMinX = Math.abs((pos.x + radius) - obstacle.minX);
    if (distMinX < nudgeMargin && pos.x < obstacle.minX && vel.x > 0) {
      newPos.x = obstacle.minX - radius - 0.01;
      nudged = true;
    }

    // Check near maxX corner
    const distMaxX = Math.abs((pos.x - radius) - obstacle.maxX);
    if (distMaxX < nudgeMargin && pos.x > obstacle.maxX && vel.x < 0) {
      newPos.x = obstacle.maxX + radius + 0.01;
      nudged = true;
    }

    // Check near minZ corner
    const distMinZ = Math.abs((pos.z + radius) - obstacle.minZ);
    if (distMinZ < nudgeMargin && pos.z < obstacle.minZ && vel.z > 0) {
      newPos.z = obstacle.minZ - radius - 0.01;
      nudged = true;
    }

    // Check near maxZ corner
    const distMaxZ = Math.abs((pos.z - radius) - obstacle.maxZ);
    if (distMaxZ < nudgeMargin && pos.z > obstacle.maxZ && vel.z < 0) {
      newPos.z = obstacle.maxZ + radius + 0.01;
      nudged = true;
    }

    // Never adds vertical lift (preserves pos.y and vel.y)
    return { pos: newPos, nudged };
  }

  /**
   * Advances the bounce chain state machine.
   * Re-jumping within 0.3s of landing increases chain count by 1 (up to 5) with +10% boost.
   */
  updateBounceChain(dt: number, isGrounded: boolean, wasGrounded: boolean, jumpExecuted: boolean): number {
    // Landed this frame
    if (isGrounded && !wasGrounded) {
      this.bounceChain.justLanded = true;
      this.bounceChain.timeSinceLanded = 0;
    } else if (isGrounded) {
      this.bounceChain.timeSinceLanded += dt;
      // If grounded for > 0.3s without jumping, chain resets
      if (this.bounceChain.timeSinceLanded > 0.30) {
        this.bounceChain.chainCount = 0;
        this.bounceChain.powerMultiplier = 1.0;
      }
    } else {
      this.bounceChain.timeSinceLanded += dt;
    }

    // Player jumped
    if (jumpExecuted) {
      if (this.bounceChain.timeSinceLanded <= 0.30 && isGrounded) {
        // Consecutive bounce chain link!
        this.bounceChain.chainCount = Math.min(5, this.bounceChain.chainCount + 1);
        this.bounceChain.powerMultiplier = 1.0 + this.bounceChain.chainCount * 0.10;
      } else {
        // Normal single jump
        this.bounceChain.chainCount = 0;
        this.bounceChain.powerMultiplier = 1.0;
      }
      this.bounceChain.timeSinceLanded = 99.0; // Reset landing timer while in air
    }

    return this.bounceChain.powerMultiplier;
  }

  /**
   * Tracks safe grounded points and triggers 0.5s fade respawn if actor falls out of bounds.
   */
  updateSafeRespawn(
    dt: number,
    currentPos: Vector3Like,
    isGrounded: boolean,
    outOfBoundsY: number = -8.0
  ): { shouldRespawn: boolean; targetPos: Vector3Like } {
    // Record safe ground when settled
    if (isGrounded && currentPos.y > 0.0) {
      this.respawn.lastSafeGroundPos = { ...currentPos };
    }

    // Fell below world bounds
    if (currentPos.y < outOfBoundsY && !this.respawn.isFadingRespawn) {
      this.respawn.isFadingRespawn = true;
      this.respawn.respawnFadeTimer = 0.5; // 0.5s fade
    }

    if (this.respawn.isFadingRespawn) {
      this.respawn.respawnFadeTimer -= dt;
      if (this.respawn.respawnFadeTimer <= 0) {
        this.respawn.isFadingRespawn = false;
        return {
          shouldRespawn: true,
          targetPos: { ...this.respawn.lastSafeGroundPos },
        };
      }
    }

    return {
      shouldRespawn: false,
      targetPos: { ...this.respawn.lastSafeGroundPos },
    };
  }
}
