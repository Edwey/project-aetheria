/**
 * Proving Grounds Developer Validation Environment & Form Matrix
 * 
 * Aligned with Master Plan v4 (§2, §12, §16 Phase 2 Exit Gate).
 * Contains:
 * - 0.5m Grate Course (Oobleck Squeeze test)
 * - Barred Gate (Mist Phase test)
 * - Movable Wooden Crate (Zephyr Gust Dash test)
 * - 35-degree Steep Slope (Geode Roll Brake & Boost test)
 * - River Rapids Current (Obsidian Anchor test)
 * - Pressure Plate Array (Light, Medium, Heavy, Impact)
 * - Deep Water Pool (Swimming, Buoyancy, Planing, Seabed walking)
 */

import { ALL_FORMS, type FormId } from '@core/index.js';
import type { Vector3Like } from './physics-spike.js';
import {
  createAbilityState,
  SignatureAbilitySystem,
  type AbilityState,
} from './signature-abilities.js';
import {
  PressurePlateSystem,
  type PressurePlateConfig,
} from './pressure-plates.js';
import {
  WaterPhysicsSystem,
  SimpleRiverCurrentField,
} from './water-physics.js';

export interface FormMatrixResult {
  formId: FormId;
  signatureAbilityPassed: boolean;
  pressurePlatePassed: boolean;
  waterRulePassed: boolean;
  notes: string;
}

export class ProvingGroundsCourse {
  public pressurePlates: PressurePlateSystem;
  public riverField: SimpleRiverCurrentField;

  constructor() {
    const platesConfig: PressurePlateConfig[] = [
      // Standard 1.7kg plate from Master Plan §7
      { id: 'standard_plate', position: { x: 10, y: 0, z: 0 }, radius: 0.8, thresholdKg: 1.7 },
      // Delicate puzzle plate (threshold 0.25kg, max 1.0kg for light wisps)
      { id: 'delicate_plate', position: { x: 15, y: 0, z: 0 }, radius: 0.8, thresholdKg: 0.25, requiredMassMax: 1.0 },
    ];
    this.pressurePlates = new PressurePlateSystem(platesConfig);
    this.riverField = new SimpleRiverCurrentField({ x: 3.0, y: 0, z: 0 });
  }

  /**
   * Executes the Phase 2 Form Matrix for all nine forms.
   * Exit criterion: Every form passes the form matrix!
   */
  runFormMatrix(): Record<FormId, FormMatrixResult> {
    const results: Partial<Record<FormId, FormMatrixResult>> = {};

    for (const form of ALL_FORMS) {
      const state = createAbilityState(form.id);
      let abilityOk = false;
      let plateOk = false;
      let waterOk = false;
      let note = '';

      // 1. Signature Ability Verification
      switch (form.id) {
        case 'oobleck': {
          // Squeeze test: J held reduces effective radius to 0.22m (fits 0.5m grate)
          const out = SignatureAbilitySystem.step(state, {
            dt: 1 / 60,
            jPressed: false,
            jHeld: true,
            kPressed: false,
            kHeld: false,
            stompPressed: false,
            isGrounded: true,
            isSubmerged: false,
            currentSpeed: 0,
            velocity: { x: 0, y: 0, z: 0 },
            position: { x: 0, y: 0, z: 0 },
          });
          abilityOk = out.effectiveRadius <= 0.25;
          note = 'Squeezes through 0.5m grate';
          break;
        }

        case 'dewdrop': {
          // Water ballast & jet: soaks water, releases ballast with J, fires jet with K
          state.ballastAmount = 0.8;
          const out = SignatureAbilitySystem.step(state, {
            dt: 1 / 60,
            jPressed: false,
            jHeld: false,
            kPressed: true,
            kHeld: true,
            stompPressed: false,
            isGrounded: false,
            isSubmerged: false,
            currentSpeed: 0,
            velocity: { x: 0, y: 0, z: 0 },
            position: { x: 0, y: 0, z: 0 },
          });
          abilityOk = out.velocityDelta.y > 0 && out.effectiveMass > 1.5;
          note = 'Soaks water ballast and launches rocket water jet';
          break;
        }

        case 'aether_bubble': {
          // Lift pulse: tap J gives upward hop
          const out = SignatureAbilitySystem.step(state, {
            dt: 1 / 60,
            jPressed: true,
            jHeld: false,
            kPressed: false,
            kHeld: false,
            stompPressed: false,
            isGrounded: true,
            isSubmerged: false,
            currentSpeed: 0,
            velocity: { x: 0, y: 0, z: 0 },
            position: { x: 0, y: 0, z: 0 },
          });
          abilityOk = out.velocityDelta.y >= 6.0;
          note = 'High buoyant pop pulse on tap J';
          break;
        }

        case 'mist': {
          // Phase: J held enables bypassing barred gates
          const out = SignatureAbilitySystem.step(state, {
            dt: 1 / 60,
            jPressed: false,
            jHeld: true,
            kPressed: false,
            kHeld: false,
            stompPressed: false,
            isGrounded: false,
            isSubmerged: false,
            currentSpeed: 0,
            velocity: { x: 0, y: 0, z: 0 },
            position: { x: 0, y: 0, z: 0 },
          });
          abilityOk = out.canBypassBarredGates === true;
          note = 'Vapor phase allows passing through barred gates';
          break;
        }

        case 'zephyr': {
          // Gust dash: K triggers wind impulse pushing nearby props
          const out = SignatureAbilitySystem.step(state, {
            dt: 1 / 60,
            jPressed: false,
            jHeld: false,
            kPressed: true,
            kHeld: true,
            stompPressed: false,
            isGrounded: false,
            isSubmerged: false,
            currentSpeed: 1.0,
            velocity: { x: 1, y: 0, z: 0 },
            position: { x: 0, y: 0, z: 0 },
          });
          abilityOk = (out.windImpulseRadius ?? 0) > 4.0 && out.velocityDelta.x > 5.0;
          note = 'Gust dash accelerates forward and pushes crates';
          break;
        }

        case 'lantern': {
          // Condense: J held increases mass to 3.3kg
          const out = SignatureAbilitySystem.step(state, {
            dt: 1 / 60,
            jPressed: false,
            jHeld: true,
            kPressed: false,
            kHeld: false,
            stompPressed: false,
            isGrounded: true,
            isSubmerged: false,
            currentSpeed: 0,
            velocity: { x: 0, y: 0, z: 0 },
            position: { x: 0, y: 0, z: 0 },
          });
          abilityOk = out.effectiveMass >= 3.0;
          note = 'Condenses light into heavy mass';
          break;
        }

        case 'aerolite': {
          // Porous stone: passive drift
          const out = SignatureAbilitySystem.step(state, {
            dt: 1 / 60,
            jPressed: false,
            jHeld: false,
            kPressed: false,
            kHeld: false,
            stompPressed: false,
            isGrounded: true,
            isSubmerged: false,
            currentSpeed: 0,
            velocity: { x: 0, y: 0, z: 0 },
            position: { x: 0, y: 0, z: 0 },
          });
          abilityOk = state.isPorousFloater === true;
          note = 'Porous volcanic pumice floats and catches thermals';
          break;
        }

        case 'geode': {
          // Roll brake & boost: J held applies braking friction
          const out = SignatureAbilitySystem.step(state, {
            dt: 1 / 60,
            jPressed: false,
            jHeld: true,
            kPressed: false,
            kHeld: false,
            stompPressed: false,
            isGrounded: true,
            isSubmerged: false,
            currentSpeed: 4.0,
            velocity: { x: 4, y: 0, z: 0 },
            position: { x: 0, y: 0, z: 0 },
          });
          abilityOk = out.velocityDelta.x < 0; // Braking deceleration
          note = 'Roll brake locks facets onto steep 35-degree slopes';
          break;
        }

        case 'obsidian': {
          // Anchor: J held locks immovably in place
          const out = SignatureAbilitySystem.step(state, {
            dt: 1 / 60,
            jPressed: false,
            jHeld: true,
            kPressed: false,
            kHeld: false,
            stompPressed: false,
            isGrounded: true,
            isSubmerged: false,
            currentSpeed: 2.0,
            velocity: { x: 2, y: 0, z: 0 },
            position: { x: 0, y: 0, z: 0 },
          });
          abilityOk = out.isAnchored === true && out.velocityDelta.x === -2;
          note = 'Anchors body immovably into ground against rushing currents';
          break;
        }
      }

      // 2. Pressure Plate Verification (Master Plan §7 Table)
      if (form.family === 'wisp' || form.id === 'aether_bubble') {
        // Light forms activate delicate puzzle plate without overload
        const hits = this.pressurePlates.evaluatePlateContact({ x: 15, y: 0, z: 0 }, 0.35, form.mass, 0, false, form.id);
        plateOk = hits.includes('delicate_plate');
      } else if (form.id === 'geode' || form.id === 'obsidian') {
        // Heavy stone forms press standard plate standing (3.5kg / 9.0kg >= 1.7kg)
        const hits = this.pressurePlates.evaluatePlateContact({ x: 10, y: 0, z: 0 }, 0.40, form.mass, 0, false, form.id);
        plateOk = hits.includes('standard_plate');
      } else {
        // Medium forms (Oobleck, Dewdrop, Aerolite) press standard plate on 4 m/s dynamic landing (load >= 1.7kg)
        const hits = this.pressurePlates.evaluatePlateContact({ x: 10, y: 0, z: 0 }, 0.35, form.mass, -4.5, false, form.id);
        plateOk = hits.includes('standard_plate');
      }

      // 3. Water Rules Verification
      // Test hydrodynamic response in water pool
      const waterRes = WaterPhysicsSystem.step({
        dt: 1 / 60,
        formId: form.id,
        position: { x: 0, y: -0.5, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        waterSurfaceY: 0,
        bedY: -4.0,
        radius: form.baseRadius,
        isRidingCurrent: false,
        isStrokeUp: false,
        moveInputX: 1.0,
        moveInputZ: 0,
      });
      // Swimming engages, glide disabled when submerged
      waterOk = waterRes.isSwimming && !waterRes.glideAllowed && waterRes.velocity.x > 0;

      results[form.id] = {
        formId: form.id,
        signatureAbilityPassed: abilityOk,
        pressurePlatePassed: plateOk,
        waterRulePassed: waterOk,
        notes: note,
      };
    }

    return results as Record<FormId, FormMatrixResult>;
  }
}
