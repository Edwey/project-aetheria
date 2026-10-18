/**
 * Slime Creature Components and Presets (Phase 3)
 */

import type { Component } from '@core';

export type SlimeVariant = 'goo' | 'jelly_ball' | 'jelly_cube';

export interface SlimePreset {
  name: string;
  stiff: number;       // Stiffness: goo 0.10, ball 0.40, cube 0.45
  pressure: number;    // Internal pressure (1.0)
  skin: number;        // Surface tension / skin retention: goo 0.45, ball 0.90, cube 0.90
  grip: number;        // Traction on ground: goo 0.80, ball 0.50, cube 0.50
  sticky: number;      // Wall stickiness: goo 0.80, ball 0.30, cube 0.30
  restitution: number; // Elasticity: goo 0.20, ball 0.65, cube 0.35
  climbSpeed: number;  // Wall climbing speed (m/s)
  shape: 'sphere' | 'box';
  color: number;       // Pastel hex color
}

export const SLIME_PRESETS: Record<SlimeVariant, SlimePreset> = {
  goo: {
    name: 'Goo',
    stiff: 0.10,
    pressure: 1.0,
    skin: 0.45,
    grip: 0.80,
    sticky: 0.80,
    restitution: 0.20,
    climbSpeed: 3.5,
    shape: 'sphere',
    color: 0x60c5ba, // Soft mint / aqua
  },
  jelly_ball: {
    name: 'Jelly Ball',
    stiff: 0.40,
    pressure: 1.0,
    skin: 0.90,
    grip: 0.50,
    sticky: 0.30,
    restitution: 0.65,
    climbSpeed: 2.8,
    shape: 'sphere',
    color: 0xff6fa5, // Cozy pink
  },
  jelly_cube: {
    name: 'Jelly Cube',
    stiff: 0.45,
    pressure: 1.0,
    skin: 0.90,
    grip: 0.50,
    sticky: 0.30,
    restitution: 0.35,
    climbSpeed: 2.0,
    shape: 'box',
    color: 0x7eb6ff, // Pastel periwinkle blue
  },
};

export interface SlimeComponent extends Component {
  variant: SlimeVariant;
  preset: SlimePreset;

  // State flags
  isGrounded: boolean;
  isClimbing: boolean;
  isMelting: boolean;
  isGliding: boolean;
  isHovering: boolean;
  isGroundPounding: boolean;
  isSpringReady: boolean;

  // Timers and meters
  jumpChargeTimer: number; // 0 to 0.85s
  isChargingJump: boolean;
  hoverTimer: number;      // 0.8s max at jump peak
  clingBudget: number;     // 1.5s max budget on overhangs

  // Deformation factors (for squash/stretch and squeeze)
  scale: { x: number; y: number; z: number };
  targetScale: { x: number; y: number; z: number };
}

export const SlimeComponentSymbol = Symbol('Slime');
