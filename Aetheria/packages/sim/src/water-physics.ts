/**
 * Water Physics & Hydrodynamics System
 * 
 * Aligned with Master Plan v4 (§2, §6, §12) and WATER.md.
 * Implements:
 * - 8% submerged fraction gate (disables glide, enables swimming)
 * - Directional paddle drive (9 m/s^2 standard; 7 m/s^2 Geode/Lantern; 5 m/s^2 Obsidian)
 * - Upward stroke (up to 3.0 m/s cap, disabled for Obsidian)
 * - Planing lift for Oobleck and Aerolite at speeds > 3.5 m/s
 * - Lakebed/seabed walking for dense sinking forms (Geode, Obsidian)
 * - Rule 4 steady currents (no movement unless Riding with Shift, +40% max boost, 0 headwind penalty)
 */

import { FORMS_TABLE, type FormId } from '@core/index.js';
import type { Vector3Like } from './physics-spike.js';

export interface WaterCurrentField {
  sampleCurrent(x: number, z: number): Vector3Like;
}

export class SimpleRiverCurrentField implements WaterCurrentField {
  public flowVelocity: Vector3Like;

  constructor(flowVelocity: Vector3Like = { x: 2.0, y: 0, z: 0 }) {
    this.flowVelocity = flowVelocity;
  }

  sampleCurrent(_x: number, _z: number): Vector3Like {
    return { ...this.flowVelocity };
  }
}

export interface WaterSimContext {
  dt: number;
  formId: FormId;
  position: Vector3Like;
  velocity: Vector3Like;
  waterSurfaceY: number;
  bedY: number;
  radius: number;
  isRidingCurrent: boolean; // Shift key
  isStrokeUp: boolean;      // Space key
  moveInputX: number;       // WASD input
  moveInputZ: number;
  currentField?: WaterCurrentField;
}

export interface WaterSimOutput {
  velocity: Vector3Like;
  submergedFraction: number; // 0.0 to 1.0
  isSwimming: boolean;
  isOnBed: boolean;
  isPlaning: boolean;
  glideAllowed: boolean;
}

export class WaterPhysicsSystem {
  /**
   * Computes submerged fraction of a sphere in water.
   */
  static computeSubmergedFraction(posY: number, radius: number, waterSurfaceY: number): number {
    const bottom = posY - radius;
    const top = posY + radius;

    if (bottom >= waterSurfaceY) return 0.0; // Completely above water
    if (top <= waterSurfaceY) return 1.0;    // Completely submerged

    const submergedDepth = waterSurfaceY - bottom;
    return Math.min(1.0, Math.max(0.0, submergedDepth / (2 * radius)));
  }

  /**
   * Steps hydrodynamic forces on a creature.
   */
  static step(ctx: WaterSimContext): WaterSimOutput {
    const { dt, formId, position, velocity, waterSurfaceY, bedY, radius, isRidingCurrent, isStrokeUp, moveInputX, moveInputZ, currentField } = ctx;
    const formDef = FORMS_TABLE[formId];

    const submergedFrac = WaterPhysicsSystem.computeSubmergedFraction(position.y, radius, waterSurfaceY);
    const isSubmerged = submergedFrac >= 0.08; // 8% submerged gate
    const glideAllowed = !isSubmerged;

    const vel = { ...velocity };
    let isPlaning = false;
    let isOnBed = false;

    if (!isSubmerged) {
      return {
        velocity: vel,
        submergedFraction: submergedFrac,
        isSwimming: false,
        isOnBed: false,
        isPlaning: false,
        glideAllowed: true,
      };
    }

    // 1. Buoyancy & Sinking
    // relativeDensity < 1.0 floats; > 1.0 sinks
    const gravity = -20 * formDef.gravityMultiplier;
    const density = formDef.relativeDensity;
    const buoyancyFactor = (1.0 - density) * 18.0 * submergedFrac;

    vel.y += buoyancyFactor * dt;

    // 2. Lakebed Contact (Dense forms: Geode, Obsidian)
    const bottomY = position.y - radius;
    if (bottomY <= bedY + 0.05) {
      isOnBed = true;
      if (vel.y < 0) vel.y = 0;
    }

    // 3. Planing Hydrodynamic Lift (Oobleck, Aerolite)
    const horizSpeed = Math.hypot(vel.x, vel.z);
    if ((formId === 'oobleck' || formId === 'aerolite') && horizSpeed >= 3.5 && submergedFrac < 0.7) {
      isPlaning = true;
      if (vel.y < 0) vel.y *= 0.2; // Planing stops sinking
      vel.y += 2.5 * dt;          // Glides on top of water
    }

    // 4. Directional Swim / Paddle Drive
    // Drive acceleration: 9 m/s^2 standard; 7 m/s^2 Geode/Lantern; 5 m/s^2 Obsidian
    let driveAccel = 9.0;
    if (formId === 'geode' || formId === 'lantern') driveAccel = 7.0;
    if (formId === 'obsidian') driveAccel = 5.0;

    if (moveInputX !== 0 || moveInputZ !== 0) {
      const mag = Math.hypot(moveInputX, moveInputZ) || 1;
      vel.x += (moveInputX / mag) * driveAccel * dt;
      vel.z += (moveInputZ / mag) * driveAccel * dt;
    }

    // 5. Upward Stroke (Space) up to 3.0 m/s cap (disabled for Obsidian)
    if (isStrokeUp && formId !== 'obsidian') {
      if (isOnBed) {
        vel.y = 6.0; // Jump impulse off bed
      } else if (vel.y < 3.0) {
        vel.y = Math.min(3.0, vel.y + 12.0 * dt);
      }
    }

    // 6. Quadratic Water Drag (unconditionally stable exponential decay)
    const dragCoeff = 2.5 * submergedFrac;
    const dragFactor = Math.exp(-dragCoeff * dt);
    vel.x *= dragFactor;
    vel.z *= dragFactor;
    vel.y *= Math.exp(-dragCoeff * 0.5 * dt);

    // 7. Rule 4: Steady Currents
    // Steady by default (no effect unless Riding with Shift)
    if (currentField && isRidingCurrent) {
      const current = currentField.sampleCurrent(position.x, position.z);
      const dotProd = vel.x * current.x + vel.z * current.z;

      // Downstream alignment yields speed boost up to +40%
      if (dotProd > 0) {
        const boost = Math.min(0.40, (dotProd / 4.0) * 0.40);
        vel.x += current.x * boost;
        vel.z += current.z * boost;
      }
      // Headwinds/upcurrents NEVER subtract speed!
    }

    return {
      velocity: vel,
      submergedFraction: submergedFrac,
      isSwimming: true,
      isOnBed,
      isPlaning,
      glideAllowed: false,
    };
  }
}
