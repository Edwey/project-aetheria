/**
 * Pressure Plate & Impact System
 * 
 * Aligned with Master Plan v4 (§7, §12).
 * 
 * Master Plan §7 Specification:
 * - Standard plate requires 1.7 kg load and stays pressed for 3.0s after load ends.
 * - Minimum impact velocity gate: landing speed >= 4.0 m/s (~0.8m drop).
 * - Drop from 0.5m must NOT press the plate for Oobleck, Dewdrop (dry) or Aerolite.
 * - Drop from 1.0m MUST press it.
 * - Bubble (capped at 1.6kg) and loose Mist/Zephyr/Lantern (capped at 1.2kg) NEVER press it by any drop.
 * - Stomp (F) gives a flat 3x pulse; plate uses max(impact, stomp).
 * - Maximum load is capped at 4x resting weight.
 * - Light forms can trigger plates by pushing movable props of mass >= 2.0 kg.
 */

import type { Vector3Like } from './physics-spike.js';

export interface PressurePlateConfig {
  id: string;
  position: Vector3Like;
  radius: number;           // Activation radius (default ~0.8m)
  thresholdKg?: number;     // Master plan default: 1.7 kg
  resetDelaySec?: number;   // Master plan default: 3.0 s latch
  requiredMassMax?: number; // Optional overload ceiling (e.g. 15kg for delicate light puzzle plates)
}

export interface PressurePlateState {
  config: PressurePlateConfig;
  isPressed: boolean;
  isOverloaded: boolean;
  pressedTimer: number;     // 3.0s latch timer
  lastLoadKg: number;
}

export class PressurePlateSystem {
  public static readonly DEFAULT_THRESHOLD_KG = 1.7;
  public static readonly DEFAULT_LATCH_SEC = 3.0;

  public plates: Map<string, PressurePlateState> = new Map();

  constructor(initialPlates: PressurePlateConfig[] = []) {
    for (const cfg of initialPlates) {
      this.registerPlate(cfg);
    }
  }

  registerPlate(config: PressurePlateConfig): PressurePlateState {
    const state: PressurePlateState = {
      config: {
        thresholdKg: PressurePlateSystem.DEFAULT_THRESHOLD_KG,
        resetDelaySec: PressurePlateSystem.DEFAULT_LATCH_SEC,
        ...config,
      },
      isPressed: false,
      isOverloaded: false,
      pressedTimer: 0,
      lastLoadKg: 0,
    };
    this.plates.set(config.id, state);
    return state;
  }

  /**
   * Computes impact load strictly following Master Plan §7:
   * - Standing load = mass
   * - Impact only counts when landing speed >= 4.0 m/s (~0.8m drop)
   * - Impact load = mass * (1 + min(3, v / (g * stop_time))), capped at 4x resting mass
   * - Stomp (F) gives flat 3x pulse: mass * 3.0
   * - Uses max(impactLoad, stompLoad)
   * - Caps: Bubble max 1.6kg, Mist/Zephyr max 1.2kg (can never press 1.7kg plate on their own)
   */
  static calculateImpactLoad(
    massKg: number,
    landingSpeedY: number,
    isStomp: boolean = false,
    formId?: string
  ): { loadKg: number; isDynamicImpact: boolean } {
    const absVy = Math.abs(landingSpeedY);
    let dynamicLoad = massKg;
    let isDynamicImpact = false;

    // Minimum impact velocity gate: v >= 4.0 m/s (~0.8m drop)
    if (absVy >= 4.0) {
      isDynamicImpact = true;
      const g = 9.81;
      const stopTime = 0.05;
      const multiplier = 1.0 + Math.min(3.0, absVy / (g * stopTime));
      // No load exceeds 4x resting weight
      const clampedMult = Math.min(4.0, multiplier);
      dynamicLoad = massKg * clampedMult;
    }

    if (isStomp) {
      isDynamicImpact = true;
      const stompLoad = Math.min(massKg * 4.0, massKg * 3.0);
      dynamicLoad = Math.max(dynamicLoad, stompLoad);
    }

    // Form-specific Master Plan §7 caps
    if (formId === 'aether_bubble') {
      dynamicLoad = Math.min(1.6, dynamicLoad); // Bubble capped at 1.6kg -> never presses 1.7kg
    } else if (formId === 'mist' || formId === 'zephyr') {
      dynamicLoad = Math.min(1.2, dynamicLoad); // Loose wisps capped at 1.2kg -> never presses 1.7kg
    }

    return { loadKg: dynamicLoad, isDynamicImpact };
  }

  /**
   * Evaluates collision and updates plate state.
   */
  evaluatePlateContact(
    actorPos: Vector3Like,
    actorRadius: number,
    massKg: number,
    impactSpeedY: number,
    isStomp: boolean = false,
    formId?: string
  ): string[] {
    const triggered: string[] = [];
    const { loadKg } = PressurePlateSystem.calculateImpactLoad(
      massKg,
      impactSpeedY,
      isStomp,
      formId
    );

    for (const [id, plate] of this.plates.entries()) {
      const dist = Math.hypot(
        actorPos.x - plate.config.position.x,
        actorPos.z - plate.config.position.z
      );

      // Check radius overlap and height proximity
      if (dist <= plate.config.radius + actorRadius && Math.abs(actorPos.y - plate.config.position.y) < 0.6) {
        plate.lastLoadKg = loadKg;
        const threshold = plate.config.thresholdKg ?? PressurePlateSystem.DEFAULT_THRESHOLD_KG;

        // Check overload ceiling if specified
        if (plate.config.requiredMassMax !== undefined && loadKg > plate.config.requiredMassMax) {
          plate.isOverloaded = true;
          plate.isPressed = false;
          continue;
        }

        if (loadKg >= threshold) {
          plate.isPressed = true;
          plate.isOverloaded = false;
          plate.pressedTimer = plate.config.resetDelaySec ?? PressurePlateSystem.DEFAULT_LATCH_SEC;
          triggered.push(id);
        }
      }
    }

    return triggered;
  }

  step(dt: number): void {
    for (const plate of this.plates.values()) {
      if (plate.isPressed) {
        plate.pressedTimer = Math.max(0, plate.pressedTimer - dt);
        if (plate.pressedTimer <= 0) {
          plate.isPressed = false;
          plate.isOverloaded = false;
        }
      }
    }
  }

  isPlateActive(id: string): boolean {
    return this.plates.get(id)?.isPressed ?? false;
  }
}
