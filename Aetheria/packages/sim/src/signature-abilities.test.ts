import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAbilityState,
  SignatureAbilitySystem,
  type AbilityState,
} from './signature-abilities.js';

describe('Phase 2 Signature Abilities', () => {
  describe('Slime Family (Oobleck, Dewdrop, Aether Bubble)', () => {
    it('Oobleck: compresses to 0.22m to fit through 0.5m grates when J is held', () => {
      const state = createAbilityState('oobleck');
      const out = SignatureAbilitySystem.step(state, {
        dt: 1 / 60,
        jPressed: false,
        jHeld: true,
        kPressed: false,
        kHeld: false,
        stompPressed: false,
        isGrounded: true,
        isSubmerged: false,
        currentSpeed: 1.0,
        velocity: { x: 1, y: 0, z: 0 },
        position: { x: 0, y: 0, z: 0 },
      });

      expect(state.isSqueezing).toBe(true);
      expect(out.effectiveRadius).toBeLessThanOrEqual(0.25);
    });

    it('Dewdrop: absorbs water ballast, dumps with J, and fires water jet with K', () => {
      const state = createAbilityState('dewdrop');

      // 1. Submerged soaks water
      SignatureAbilitySystem.step(state, {
        dt: 1.0,
        jPressed: false,
        jHeld: false,
        kPressed: false,
        kHeld: false,
        stompPressed: false,
        isGrounded: false,
        isSubmerged: true,
        currentSpeed: 0,
        velocity: { x: 0, y: 0, z: 0 },
        position: { x: 0, y: 0, z: 0 },
      });
      expect(state.ballastAmount).toBeGreaterThan(0.4);

      // 2. K fires water jet rocket propulsion
      const outJet = SignatureAbilitySystem.step(state, {
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
      expect(state.isFiringWaterJet).toBe(true);
      expect(outJet.velocityDelta.y).toBeGreaterThan(0);

      // 3. J dumps ballast
      SignatureAbilitySystem.step(state, {
        dt: 1.0,
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
      expect(state.ballastAmount).toBeLessThan(0.3);
    });

    it('Aether Bubble: tap J triggers buoyant lift pulse with cooldown', () => {
      const state = createAbilityState('aether_bubble');
      const out = SignatureAbilitySystem.step(state, {
        dt: 1 / 60,
        jPressed: true,
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

      expect(out.velocityDelta.y).toBeGreaterThanOrEqual(6.0);
      expect(state.cooldowns['bubble_lift']).toBeGreaterThan(0);
    });
  });

  describe('Wisp Family (Mist, Zephyr, Lantern)', () => {
    it('Mist: J held enables phasing through barred gates', () => {
      const state = createAbilityState('mist');
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

      expect(state.isPhasing).toBe(true);
      expect(out.canBypassBarredGates).toBe(true);
    });

    it('Zephyr: K fires gust dash and creates wind impulse to push props', () => {
      const state = createAbilityState('zephyr');
      const out = SignatureAbilitySystem.step(state, {
        dt: 1 / 60,
        jPressed: false,
        jHeld: false,
        kPressed: true,
        kHeld: true,
        stompPressed: false,
        isGrounded: false,
        isSubmerged: false,
        currentSpeed: 2.0,
        velocity: { x: 2, y: 0, z: 0 },
        position: { x: 5, y: 1, z: 5 },
      });

      expect(out.velocityDelta.x).toBeGreaterThan(5.0);
      expect(out.windImpulseRadius).toBeGreaterThan(4.0);
      expect(out.windImpulseOrigin).toEqual({ x: 5, y: 1, z: 5 });
    });

    it('Lantern: J condenses light into 3.3kg hard-light mass', () => {
      const state = createAbilityState('lantern');
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

      expect(state.isCondensed).toBe(true);
      expect(out.effectiveMass).toBe(3.3);
    });
  });

  describe('Stone Family (Aerolite, Geode, Obsidian)', () => {
    it('Geode: J activates roll brake on slopes and K triggers boost', () => {
      const state = createAbilityState('geode');

      // J held applies braking friction
      const outBrake = SignatureAbilitySystem.step(state, {
        dt: 1 / 60,
        jPressed: false,
        jHeld: true,
        kPressed: false,
        kHeld: false,
        stompPressed: false,
        isGrounded: true,
        isSubmerged: false,
        currentSpeed: 5.0,
        velocity: { x: 5, y: 0, z: 0 },
        position: { x: 0, y: 0, z: 0 },
      });
      expect(outBrake.velocityDelta.x).toBeLessThan(0);

      // K fires rotational boost
      const outBoost = SignatureAbilitySystem.step(state, {
        dt: 1 / 60,
        jPressed: false,
        jHeld: false,
        kPressed: true,
        kHeld: true,
        stompPressed: false,
        isGrounded: true,
        isSubmerged: false,
        currentSpeed: 1.0,
        velocity: { x: 1, y: 0, z: 0 },
        position: { x: 0, y: 0, z: 0 },
      });
      expect(outBoost.velocityDelta.x).toBeGreaterThan(5.0);
    });

    it('Obsidian: J locks immovably into ground and K emits shockwave', () => {
      const state = createAbilityState('obsidian');

      // J Anchor
      const outAnchor = SignatureAbilitySystem.step(state, {
        dt: 1 / 60,
        jPressed: false,
        jHeld: true,
        kPressed: false,
        kHeld: false,
        stompPressed: false,
        isGrounded: true,
        isSubmerged: false,
        currentSpeed: 3.0,
        velocity: { x: 3, y: 0, z: 0 },
        position: { x: 0, y: 0, z: 0 },
      });
      expect(outAnchor.isAnchored).toBe(true);
      expect(outAnchor.velocityDelta.x).toBe(-3.0);

      // K Shockwave
      const outWave = SignatureAbilitySystem.step(state, {
        dt: 1 / 60,
        jPressed: false,
        jHeld: false,
        kPressed: true,
        kHeld: true,
        stompPressed: false,
        isGrounded: true,
        isSubmerged: false,
        currentSpeed: 0,
        velocity: { x: 0, y: 0, z: 0 },
        position: { x: 12, y: 0, z: 8 },
      });
      expect(outWave.shockwaveRadius).toBeGreaterThan(5.0);
      expect(outWave.shockwaveOrigin).toEqual({ x: 12, y: 0, z: 8 });
    });
  });
});
