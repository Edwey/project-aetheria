/**
 * Stone Creature Components and Presets (Phase 5)
 *
 * The Stone is a solid, heavy creature with rigid physics, high impact, and
 * terrain-shattering abilities. Three base form variants:
 *
 *  - Boulder : high momentum rolling, geode cracking on impact, high durability
 *  - Pillar  : tall & sturdy, high reach, stable against wind, extended piton reach
 *  - Shard   : crystalline facets, sharp edges, efficient piton wedging, Crystal Sail glide
 */

import type { Component } from '@core';

export type StoneVariant = 'boulder' | 'pillar' | 'shard';

export interface StonePreset {
  name: string;
  /** Physical mass (kg) */
  mass: number;
  /** Ground traction (low = slippy) */
  grip: number;
  /** Wind resistance coefficient */
  windResistance: number;
  /** Maximum jump charge power */
  maxJumpPower: number;
  /** Duration of apex hover after jump (s) */
  apexHoverDuration: number;
  /** Fall speed cap while Crystal Sail gliding (m/s, negative) */
  sailFallCap: number;
  /** Piton wall climb speed (m/s) */
  pitonClimbSpeed: number;
  /** Minimum speed to trigger geode/crack impact effect (m/s) */
  crackSpeedThreshold: number;
  /** Shockwave radius on ground pound landing (m) */
  shockwaveRadius: number;
  /** Collider shape */
  shape: 'sphere' | 'box';
  /** Collider size (radius for sphere, half-extents for box) */
  size: number | { x: number; y: number; z: number };
  /** Pastel hex color */
  color: number;
}

export const STONE_PRESETS: Record<StoneVariant, StonePreset> = {
  boulder: {
    name: 'Round Boulder',
    mass: 8.0,
    grip: 0.35,
    windResistance: 0.5,
    maxJumpPower: 12.75,
    apexHoverDuration: 0.5,
    sailFallCap: -3.0,
    pitonClimbSpeed: 2.0,
    crackSpeedThreshold: 5.0,
    shockwaveRadius: 3.5,
    shape: 'sphere',
    size: 0.55,
    color: 0xc8b4a0, // Warm sandy stone
  },
  pillar: {
    name: 'Tall Pillar',
    mass: 10.0,
    grip: 0.45,
    windResistance: 0.7,
    maxJumpPower: 10.0,
    apexHoverDuration: 0.5,
    sailFallCap: -3.5,
    pitonClimbSpeed: 2.5,
    crackSpeedThreshold: 5.0,
    shockwaveRadius: 3.0,
    shape: 'box',
    size: { x: 0.3, y: 0.75, z: 0.3 },
    color: 0xb4c8c0, // Cool grey-green slate
  },
  shard: {
    name: 'Sharp Shard',
    mass: 5.0,
    grip: 0.30,
    windResistance: 0.4,
    maxJumpPower: 14.0,
    apexHoverDuration: 0.5,
    sailFallCap: -2.8,
    pitonClimbSpeed: 3.0,
    crackSpeedThreshold: 4.0,
    shockwaveRadius: 2.5,
    shape: 'box',
    size: { x: 0.25, y: 0.6, z: 0.25 },
    color: 0xc8c0f0, // Pale violet crystal
  },
};

/** Stone physics constants */
export const STONE_CONSTANTS = {
  GRAVITY: -20,
  JMIN: 4.5,             // Tap jump impulse
  CHARGE_T: 0.9,         // Full charge time (s)
  IDLE_BRAKE: 8.0,       // Ground braking (lower than slime — heavier)
  MAX_SPEED: 5.5,        // Top horizontal speed (m/s)
  DRIVE_FORCE: 10.0,     // Ground acceleration force
  AIR_CONTROL: 0.4,      // Air movement control ratio (heavier = less control)
  MELT_SCALE: 0.65,      // Pebble shrink scale (M key)
  PEBBLE_RECOVER_SCALE: 0.90, // When to consider recovery complete
};

export interface StoneComponent extends Component {
  variant: StoneVariant;
  preset: StonePreset;

  // State flags
  isGrounded: boolean;
  isPitonClimbing: boolean;    // Wall piton cling
  isSailGliding: boolean;      // Crystal Sail glide (hold Space while falling)
  isPebbleShrunk: boolean;     // M key: shrink into pebble
  isGroundPounding: boolean;   // F key: ground pound
  isHovering: boolean;         // Apex hover after jump
  isRolling: boolean;          // Moving fast enough for rolling impact

  // Timers
  jumpChargeTimer: number;
  isChargingJump: boolean;
  hoverTimer: number;

  // Pebble scale state
  scale: { x: number; y: number; z: number };
  targetScale: { x: number; y: number; z: number };

  // Last landing velocity for shockwave
  lastLandingSpeed: number;
}

export const StoneComponentSymbol = Symbol('Stone');
