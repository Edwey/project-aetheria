/**
 * Signature Abilities System (Phase 2)
 * 
 * Aligned with Master Plan v4 (§2, §12, §14, §16).
 * Implements J and K signature abilities for all nine forms across the three families.
 */

import { FORMS_TABLE, type FormId, type FormDefinition } from '@core/index.js';
import type { Vector3Like } from './physics-spike.js';

export interface AbilityState {
  formId: FormId;
  jHeld: boolean;
  kHeld: boolean;
  cooldowns: Record<string, number>; // remaining seconds

  // Oobleck
  isSqueezing: boolean;       // J: squeeze down to 0.22m to fit through 0.5m grates
  isPlaningWater: boolean;    // Passive: skim across water > 3.5 m/s

  // Dewdrop
  ballastAmount: number;      // 0.0 to 1.0 (water ballast soaked)
  isReleasingBallast: boolean;// J: dumping ballast
  isFiringWaterJet: boolean;  // K: rocket propulsion jet

  // Aether Bubble
  liftPulseActive: boolean;   // J: tap buoyant pulse

  // Mist
  isPhasing: boolean;         // J: phase through barred gates

  // Zephyr
  isGustDashing: boolean;     // K: forward wind dash + prop push impulse

  // Lantern
  isCondensed: boolean;       // J: hard-light condensation (mass 3.3kg, sinks in water)
  spectralStairsTimer: number;// K: temporary platforms

  // Aerolite
  isPorousFloater: boolean;   // Passive: pumice drift

  // Geode
  isRollBraking: boolean;     // J: digs facets into slope to stop immediately
  isBoostActive: boolean;     // K: high-speed rotational impulse

  // Obsidian
  isAnchored: boolean;        // J: immovable anchor against currents/slopes
  shockwaveEmitted: boolean;  // K: radial ground shockwave
}

export function createAbilityState(formId: FormId = 'oobleck'): AbilityState {
  return {
    formId,
    jHeld: false,
    kHeld: false,
    cooldowns: {},
    isSqueezing: false,
    isPlaningWater: false,
    ballastAmount: 0.0,
    isReleasingBallast: false,
    isFiringWaterJet: false,
    liftPulseActive: false,
    isPhasing: false,
    isGustDashing: false,
    isCondensed: false,
    spectralStairsTimer: 0,
    isPorousFloater: formId === 'aerolite',
    isRollBraking: false,
    isBoostActive: false,
    isAnchored: false,
    shockwaveEmitted: false,
  };
}

export interface AbilityStepContext {
  dt: number;
  jPressed: boolean;
  jHeld: boolean;
  kPressed: boolean;
  kHeld: boolean;
  stompPressed: boolean;
  isGrounded: boolean;
  isSubmerged: boolean;
  currentSpeed: number;
  velocity: Vector3Like;
  position: Vector3Like;
}

export interface AbilityStepOutput {
  velocityDelta: Vector3Like;
  effectiveRadius: number;
  effectiveMass: number;
  canBypassBarredGates: boolean;
  windImpulseRadius?: number;
  windImpulseOrigin?: Vector3Like;
  shockwaveRadius?: number;
  shockwaveOrigin?: Vector3Like;
  isAnchored: boolean;
}

export class SignatureAbilitySystem {
  /**
   * Updates signature form abilities for the current tick.
   */
  static step(
    state: AbilityState,
    context: AbilityStepContext
  ): AbilityStepOutput {
    const { dt, jPressed, jHeld, kPressed, kHeld, isGrounded, isSubmerged, currentSpeed, velocity, position } = context;
    const formDef: FormDefinition = FORMS_TABLE[state.formId];

    state.jHeld = jHeld;
    state.kHeld = kHeld;

    // Decay cooldowns
    for (const key of Object.keys(state.cooldowns)) {
      if (state.cooldowns[key] > 0) {
        state.cooldowns[key] = Math.max(0, state.cooldowns[key] - dt);
      }
    }

    const output: AbilityStepOutput = {
      velocityDelta: { x: 0, y: 0, z: 0 },
      effectiveRadius: formDef.baseRadius,
      effectiveMass: formDef.mass,
      canBypassBarredGates: false,
      isAnchored: false,
    };

    // =========================================================================
    // 1. SLIME FAMILY
    // =========================================================================

    if (state.formId === 'oobleck') {
      // J: Squeeze (Hold) -> compresses radius down to 0.22m to fit through 0.5m grates
      state.isSqueezing = jHeld;
      if (state.isSqueezing) {
        output.effectiveRadius = 0.22;
      }
      // Planing: when moving horizontally > 3.5 m/s across water, solidifies
      state.isPlaningWater = isSubmerged && currentSpeed >= 3.5;
      if (state.isPlaningWater && velocity.y < 0) {
        // Planing lift negates downward sink
        output.velocityDelta.y += Math.abs(velocity.y) * 0.9;
      }
    } else if (state.formId === 'dewdrop') {
      // Water Ballast: soaks water when submerged
      if (isSubmerged && !jHeld) {
        state.ballastAmount = Math.min(1.0, state.ballastAmount + 0.50 * dt);
      }
      // J: Release Ballast (Hold) -> drains stored water
      state.isReleasingBallast = jHeld && state.ballastAmount > 0;
      if (state.isReleasingBallast) {
        state.ballastAmount = Math.max(0, state.ballastAmount - 0.70 * dt);
      }
      // Mass scales from base 1.2 kg up to 2.0 kg with ballast
      output.effectiveMass = formDef.mass + state.ballastAmount * 0.8;

      // K: Water Jet (Hold) -> expels stored ballast for rocket propulsion
      state.isFiringWaterJet = kHeld && state.ballastAmount > 0.05;
      if (state.isFiringWaterJet) {
        state.ballastAmount = Math.max(0, state.ballastAmount - 0.40 * dt);
        // Rocket thrust: forward if moving, else straight upward
        const thrust = 14.0 * dt;
        if (currentSpeed > 0.5) {
          const horizMag = Math.hypot(velocity.x, velocity.z) || 1;
          output.velocityDelta.x += (velocity.x / horizMag) * thrust;
          output.velocityDelta.z += (velocity.z / horizMag) * thrust;
          output.velocityDelta.y += thrust * 0.4;
        } else {
          output.velocityDelta.y += thrust;
        }
      }
    } else if (state.formId === 'aether_bubble') {
      // J: Lift Pulse (Tap, 800ms cooldown) -> buoyant upward leap
      const cooldownKey = 'bubble_lift';
      if (jPressed && (!state.cooldowns[cooldownKey] || state.cooldowns[cooldownKey] <= 0)) {
        state.cooldowns[cooldownKey] = 0.8;
        output.velocityDelta.y += 7.0; // Buoyant upward pop
        state.liftPulseActive = true;
      } else {
        state.liftPulseActive = false;
      }
    }

    // =========================================================================
    // 2. WISP FAMILY
    // =========================================================================

    else if (state.formId === 'mist') {
      // J: Phase (Hold) -> Disperses cloud to pass through barred gates
      state.isPhasing = jHeld;
      output.canBypassBarredGates = state.isPhasing;
      if (state.isPhasing) {
        output.effectiveRadius = 0.15; // Vapor dispersion
      }
    } else if (state.formId === 'zephyr') {
      // K: Gust Dash (Hold, 1000ms cooldown) -> propels forward and pushes objects
      const cooldownKey = 'zephyr_gust';
      if (kPressed && (!state.cooldowns[cooldownKey] || state.cooldowns[cooldownKey] <= 0)) {
        state.cooldowns[cooldownKey] = 1.0;
        state.isGustDashing = true;
        const horizMag = Math.hypot(velocity.x, velocity.z) || 1;
        const dirX = currentSpeed > 0.2 ? velocity.x / horizMag : 1;
        const dirZ = currentSpeed > 0.2 ? velocity.z / horizMag : 0;

        output.velocityDelta.x += dirX * 12.0;
        output.velocityDelta.z += dirZ * 12.0;
        output.velocityDelta.y += 2.0;

        // Emit wind impulse field to push nearby movable crates
        output.windImpulseRadius = 4.5;
        output.windImpulseOrigin = { ...position };
      } else {
        state.isGustDashing = false;
      }
    } else if (state.formId === 'lantern') {
      // J: Condense (Hold) -> hard-light condensation (increases mass to 3.3kg, sinks in water)
      state.isCondensed = jHeld;
      if (state.isCondensed) {
        output.effectiveMass = 3.3; // Heavy hard-light for pressure plates
      }
      // K: Spectral Stairs (Hold)
      if (kHeld) {
        state.spectralStairsTimer += dt;
        if (state.spectralStairsTimer > 0.1 && velocity.y < 0) {
          // Supports character on spectral steps
          output.velocityDelta.y += Math.abs(velocity.y) * 0.95 + 1.5 * dt;
        }
      } else {
        state.spectralStairsTimer = 0;
      }
    }

    // =========================================================================
    // 3. STONE FAMILY
    // =========================================================================

    else if (state.formId === 'aerolite') {
      // Passive pumice stone
      state.isPorousFloater = true;
      output.effectiveMass = formDef.mass;
    } else if (state.formId === 'geode') {
      // J: Roll Brake (Hold) -> instant high braking friction on steep slopes
      state.isRollBraking = jHeld && isGrounded;
      if (state.isRollBraking) {
        output.velocityDelta.x -= velocity.x * Math.min(1.0, 15.0 * dt);
        output.velocityDelta.z -= velocity.z * Math.min(1.0, 15.0 * dt);
      }

      // K: Boost (Hold, 1500ms cooldown) -> high rotational acceleration burst
      const cooldownKey = 'geode_boost';
      if (kPressed && (!state.cooldowns[cooldownKey] || state.cooldowns[cooldownKey] <= 0)) {
        state.cooldowns[cooldownKey] = 1.5;
        state.isBoostActive = true;
        const horizMag = Math.hypot(velocity.x, velocity.z) || 1;
        const dirX = currentSpeed > 0.2 ? velocity.x / horizMag : 1;
        const dirZ = currentSpeed > 0.2 ? velocity.z / horizMag : 0;
        output.velocityDelta.x += dirX * 10.0;
        output.velocityDelta.z += dirZ * 10.0;
      } else {
        state.isBoostActive = false;
      }
    } else if (state.formId === 'obsidian') {
      // J: Anchor (Hold) -> Locks immovably to ground/bed
      state.isAnchored = jHeld && isGrounded;
      output.isAnchored = state.isAnchored;
      if (state.isAnchored) {
        output.velocityDelta.x = -velocity.x;
        output.velocityDelta.z = -velocity.z;
        output.velocityDelta.y = Math.min(0, -velocity.y);
      }

      // K: Ground Shockwave (Tap, 2000ms cooldown) -> triggers impact plates & rattles items
      const cooldownKey = 'obsidian_shockwave';
      if (kPressed && (!state.cooldowns[cooldownKey] || state.cooldowns[cooldownKey] <= 0)) {
        state.cooldowns[cooldownKey] = 2.0;
        state.shockwaveEmitted = true;
        output.shockwaveRadius = 6.0;
        output.shockwaveOrigin = { ...position };
      } else {
        state.shockwaveEmitted = false;
      }
    }

    return output;
  }
}
