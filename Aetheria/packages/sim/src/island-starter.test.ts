import { describe, it, expect, beforeEach } from 'vitest';
import { IslandStarterEnvironment } from './island-starter.js';

describe('Phase 1 Foundation - Island Starter & No-Text Onboarding', () => {
  let env: IslandStarterEnvironment;

  beforeEach(() => {
    env = new IslandStarterEnvironment();
  });

  it('spawns player at Pebble Cove with gentle grounded elevation', () => {
    const spawn = IslandStarterEnvironment.SPAWN_POS;
    expect(spawn.x).toBe(60);
    expect(spawn.z).toBe(40);

    const height = env.getTerrainHeight(spawn.x, spawn.z);
    expect(height).toBeGreaterThan(0.5); // Safely above sea level
    expect(height).toBeLessThan(3.0);   // Gentle starter bowl
  });

  it('positions Springcap Mushroom bounce pad within 5 meters of spawn', () => {
    const spawn = IslandStarterEnvironment.SPAWN_POS;
    const mushroom = env.pois.find(p => p.id === 'starter_bounce_mushroom')!;
    expect(mushroom).toBeDefined();

    const dist = Math.hypot(spawn.x - mushroom.position.x, spawn.z - mushroom.position.z);
    expect(dist).toBeLessThanOrEqual(5.0); // Immediately visible and reachable within 5m
  });

  it('provides visible high peak on horizon at Hearth Ridge', () => {
    const ridge = env.pois.find(p => p.id === 'hearth_ridge_peak')!;
    expect(ridge).toBeDefined();
    expect(ridge.position.y).toBe(24.0); // 24 meters high, visible across the island
  });

  it('triggers mushroom bounce launch impulse upon collision', () => {
    const mushroom = env.pois.find(p => p.id === 'starter_bounce_mushroom')!;
    const res = env.checkBouncePadCollision(mushroom.position, 0.35);

    expect(res.hit).toBe(true);
    expect(res.launchVelocity).toBe(12.0); // High launch for satisfying first bounce
  });

  it('maintains no-text policy during active play and shows subtle hints only after sustained idle', () => {
    const spawn = IslandStarterEnvironment.SPAWN_POS;

    // Player moves around -> no hints
    env.updateOnboarding(1.0, spawn, false, true);
    expect(env.onboarding.subtleHint).toBeNull();
    expect(env.onboarding.hasMoved).toBe(true);

    // Player is idle for 3 seconds -> still no hint (no text walls!)
    env.updateOnboarding(3.0, spawn, false, false);
    expect(env.onboarding.subtleHint).toBeNull();

    // Player stays idle near the mushroom for >6 seconds -> gentle non-blocking prompt
    const nearMushroom = { x: 63, y: 1.2, z: 36 };
    env.updateOnboarding(7.0, nearMushroom, false, false);
    expect(env.onboarding.subtleHint).toBe('Space to jump on springcap');

    // Player jumps -> hint clears and first bounce time is captured
    env.updateOnboarding(0.1, nearMushroom, true, false);
    expect(env.onboarding.hasBounced).toBe(true);
    expect(env.onboarding.subtleHint).toBeNull();
  });
});
