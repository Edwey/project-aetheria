/**
 * Wisp Creature Components and Presets (Phase 4)
 *
 * The Wisp is a gaseous creature that floats, rises on breath, and drifts
 * through the air. It has three base form variants:
 *
 *  - Cloud : dense protective cluster, steadier drift, more bulk
 *  - Motes : sparse agile particles, faster skimming, wider reach
 *  - Ring  : orbiting pattern, rhythmic resonance, focused harvesting
 */

import type { Component } from '@core';

export type WispVariant = 'cloud' | 'motes' | 'ring';

export interface WispPreset {
  name: string;
  /** Number of mote particles rendered */
  moteCount: number;
  /** Max tether radius from core (m) */
  tetherRadius: number;
  /** Speed multiplier for horizontal movement */
  driftSpeed: number;
  /** Breath consumed per second while rising (units/s) */
  breathRiseRate: number;
  /** Breath consumed per second while floating (units/s) */
  breathFloatRate: number;
  /** Horizontal speed multiplier when Condensed (C key) */
  condenseSpeedMult: number;
  /** Horizontal speed multiplier when Diffused (M key) */
  diffuseSpeedMult: number;
  /** Downward velocity when down-gust (F key) */
  downGustVelocity: number;
  /** Wall-hug drift climb speed (m/s) */
  climbSpeed: number;
  /** Pastel hex color */
  color: number;
}

export const WISP_PRESETS: Record<WispVariant, WispPreset> = {
  cloud: {
    name: 'Cloud',
    moteCount: 24,
    tetherRadius: 2.2,
    driftSpeed: 5.0,
    breathRiseRate: 20,
    breathFloatRate: 3,
    condenseSpeedMult: 1.4,
    diffuseSpeedMult: 0.6,
    downGustVelocity: -22,
    climbSpeed: 3.0,
    color: 0xd4eaff, // Soft sky blue
  },
  motes: {
    name: 'Motes',
    moteCount: 10,
    tetherRadius: 2.2,
    driftSpeed: 7.5,
    breathRiseRate: 20,
    breathFloatRate: 3,
    condenseSpeedMult: 1.4,
    diffuseSpeedMult: 0.6,
    downGustVelocity: -22,
    climbSpeed: 3.5,
    color: 0xffd4f5, // Pale lavender-pink
  },
  ring: {
    name: 'Ring',
    moteCount: 12,
    tetherRadius: 2.2,
    driftSpeed: 5.5,
    breathRiseRate: 20,
    breathFloatRate: 3,
    condenseSpeedMult: 1.4,
    diffuseSpeedMult: 0.6,
    downGustVelocity: -22,
    climbSpeed: 3.0,
    color: 0xc8f5d4, // Soft mint green
  },
};

/** Breath resource constants */
export const WISP_BREATH = {
  MAX: 100,
  RISE_BUDGET_SECS: 5,       // How long max breath lasts on pure rising
  FREE_HOP_VELOCITY: 6,      // Tap Space: instant +Y boost (m/s)
  SINK_VELOCITY: -2.5,        // Natural gentle sink when not rising/floating
  RISE_VELOCITY: 4.0,         // Upward velocity when rising (hold Space)
  FLOAT_HOLD_VY: 0.0,         // Near-zero Y velocity when V-floating
  DOWN_GUST_TIMEOUT: 2.0,    // Safety timeout to re-enable controls after down-gust (s)
  REFILL_RATE: 30,            // Breath refilled per second near ground/water
  GROUND_REFILL_HEIGHT: 2.0, // Height threshold for ground-proximity refill
};

export interface WispComponent extends Component {
  variant: WispVariant;
  preset: WispPreset;

  // Resource
  breath: number;       // 0..100
  maxBreath: number;    // 100

  // State flags
  isRising: boolean;      // Space held - consuming breath
  isFloating: boolean;    // V held - gentle hover, slow breath drain
  isCondensed: boolean;   // C held - speed boost
  isDiffused: boolean;    // M held - slow drift
  isDownGusting: boolean; // F pressed - dive mode
  isWallHugging: boolean; // Hugging a wall and climbing

  // Timers
  downGustTimer: number;  // Safety re-enable timer after down-gust

  // Mote simulation (each mote offset from core, for renderer)
  moteOffsets: Array<{ x: number; y: number; z: number }>;
  moteVelocities: Array<{ x: number; y: number; z: number }>;
}

export const WispComponentSymbol = Symbol('Wisp');
