/**
 * Island Starter Environment & No-Text Onboarding
 * 
 * Aligned with Master Plan v4 (§10, §12, §16 Phase 1).
 * Features:
 * - Spawn location at Pebble Cove (60, 40)
 * - Natural landscape layout guiding player visually toward first bounce pad within 20 seconds
 * - No text walls: prompts appear only if player is stuck/idle for >6 seconds
 * - Horizon landmark (Central Hearth Ridge) visible immediately from spawn
 */

import type { Vector3Like } from './physics-spike.js';

export interface IslandPOI {
  id: string;
  name: string;
  position: Vector3Like;
  radius: number;
  type: 'spawn' | 'bounce_pad' | 'workbench' | 'horizon_goal' | 'tunnel';
}

export interface OnboardingState {
  hasMoved: boolean;
  hasBounced: boolean;
  hasSwitchedFamily: boolean;
  spawnTime: number;
  firstBounceTime: number | null; // Goal: < 20s
  idleTimer: number;
  subtleHint: string | null;
}

export class IslandStarterEnvironment {
  // Master plan starter spawn at Pebble Cove
  public static readonly SPAWN_POS: Vector3Like = { x: 60, y: 1.5, z: 40 };

  // Handcrafted landmarks in starter cove
  public readonly pois: IslandPOI[] = [
    {
      id: 'pebble_cove_spawn',
      name: 'Pebble Cove',
      position: { x: 60, y: 1.0, z: 40 },
      radius: 8.0,
      type: 'spawn',
    },
    {
      id: 'starter_bounce_mushroom',
      name: 'Springcap Mushroom',
      position: { x: 63, y: 1.2, z: 36 }, // 4.5m from spawn, directly visible
      radius: 2.0,
      type: 'bounce_pad',
    },
    {
      id: 'driftwood_pier_bench',
      name: 'Driftwood Pier Workbench',
      position: { x: 75, y: 0.8, z: 25 },
      radius: 3.0,
      type: 'workbench',
    },
    {
      id: 'hearth_ridge_peak',
      name: 'Hearth Ridge Lookout',
      position: { x: 0, y: 24.0, z: 0 }, // Central high peak on horizon
      radius: 12.0,
      type: 'horizon_goal',
    },
    {
      id: 'pebble_groove_tunnel',
      name: 'Sun Grotto Squeeze',
      position: { x: 50, y: 1.5, z: 35 },
      radius: 1.5,
      type: 'tunnel',
    },
  ];

  public onboarding: OnboardingState = {
    hasMoved: false,
    hasBounced: false,
    hasSwitchedFamily: false,
    spawnTime: Date.now(),
    firstBounceTime: null,
    idleTimer: 0,
    subtleHint: null,
  };

  /**
   * Evaluates terrain height around the island.
   * Returns smooth procedural terrain with ocean dropoff outside the ~280m island radius.
   */
  getTerrainHeight(x: number, z: number): number {
    const distFromCenter = Math.hypot(x, z);
    const islandRadius = 140.0;

    // Ocean beyond shoreline
    if (distFromCenter > islandRadius) {
      return -2.0;
    }

    // Radial island falloff
    const radialRatio = distFromCenter / islandRadius;
    const radialMask = Math.max(0, 1.0 - radialRatio * radialRatio);

    // Central peak (Y ~ 24m)
    const centralPeak = Math.max(0, 24.0 * (1.0 - distFromCenter / 70.0));

    // Gentle terrain rolling hills
    const hills =
      Math.sin(x * 0.05) * 2.0 +
      Math.cos(z * 0.05) * 2.0 +
      Math.sin((x + z) * 0.02) * 4.0;

    // Pebble Cove gentle hollow around (60, 40)
    const distToCove = Math.hypot(x - 60, z - 40);
    const coveFlatten = Math.exp(-distToCove * 0.05);

    const height = (centralPeak + hills * radialMask) * (1.0 - coveFlatten * 0.4) + 0.8;
    return Math.max(0.1, height);
  }

  /**
   * Updates non-intrusive onboarding state machine.
   * Prompts appear ONLY after sustained idle near interactive objects.
   */
  updateOnboarding(
    dt: number,
    playerPosition: Vector3Like,
    isJumping: boolean,
    isMoving: boolean
  ): void {
    if (isMoving) {
      this.onboarding.hasMoved = true;
      this.onboarding.idleTimer = 0;
      this.onboarding.subtleHint = null;
    } else {
      this.onboarding.idleTimer += dt;
    }

    if (isJumping && !this.onboarding.hasBounced) {
      this.onboarding.hasBounced = true;
      this.onboarding.firstBounceTime = (Date.now() - this.onboarding.spawnTime) / 1000;
      this.onboarding.subtleHint = null;
    }

    // Near bounce pad check
    const distToPad = Math.hypot(
      playerPosition.x - this.pois[1].position.x,
      playerPosition.z - this.pois[1].position.z
    );

    // Master plan rule: prompts only after player has been stuck for several seconds
    if (!this.onboarding.hasBounced && distToPad < 4.0 && this.onboarding.idleTimer > 6.0) {
      this.onboarding.subtleHint = 'Space to jump on springcap';
    } else if (!this.onboarding.hasMoved && this.onboarding.idleTimer > 8.0) {
      this.onboarding.subtleHint = 'W A S D to explore';
    }
  }

  checkBouncePadCollision(pos: Vector3Like, radius: number): { hit: boolean; launchVelocity?: number } {
    const pad = this.pois[1]; // starter_bounce_mushroom
    const dist = Math.hypot(pos.x - pad.position.x, pos.z - pad.position.z);
    if (dist <= pad.radius + radius && Math.abs(pos.y - pad.position.y) < 0.6) {
      // Mushroom bounce launch impulse (Master Plan restitution boost)
      return { hit: true, launchVelocity: 12.0 };
    }
    return { hit: false };
  }
}
