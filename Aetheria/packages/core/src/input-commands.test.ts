import { describe, it, expect, beforeEach } from 'vitest';
import { InputCommandBuffer } from './input-commands.js';

describe('Phase 1 Foundation - Input Command Abstraction', () => {
  let input: InputCommandBuffer;

  beforeEach(() => {
    input = new InputCommandBuffer();
  });

  it('translates WASD into normalized directional movement', () => {
    input.handleKeyDown('KeyW');
    let cmd = input.pollCommands(1 / 60, true);
    expect(cmd.moveZ).toBe(-1.0);
    expect(cmd.moveX).toBe(0);

    input.handleKeyDown('KeyD');
    cmd = input.pollCommands(1 / 60, true);
    expect(cmd.moveZ).toBeCloseTo(-Math.SQRT1_2);
    expect(cmd.moveX).toBeCloseTo(Math.SQRT1_2);
  });

  it('implements 100ms coyote time allowing jump after walking off a ledge', () => {
    const dt = 0.033; // 33 ms per frame

    // Frame 1: Grounded, no jump
    let cmd = input.pollCommands(dt, true);
    expect(cmd.jumpPressed).toBe(false);

    // Frame 2: Airborne (walked off cliff, 33ms elapsed < 100ms coyote)
    input.handleKeyDown('Space');
    cmd = input.pollCommands(dt, false);
    // Coyote time should trigger jump!
    expect(cmd.jumpPressed).toBe(true);

    // Frame 3: Airborne, jump consumed
    cmd = input.pollCommands(dt, false);
    expect(cmd.jumpPressed).toBe(false);
  });

  it('rejects coyote jump after 100ms expiration', () => {
    const dt = 0.060; // 60 ms

    // Airborne for 60ms
    input.pollCommands(dt, false);
    // Airborne for another 60ms (total 120ms > 100ms coyote time)
    input.handleKeyDown('Space');
    const cmd = input.pollCommands(dt, false);
    expect(cmd.jumpPressed).toBe(false);
  });

  it('implements 100ms jump buffering (press before landing)', () => {
    const dt = 0.030; // 30 ms

    // Frame 1: In mid-air, player presses Space 60ms before landing
    input.handleKeyDown('Space');
    let cmd = input.pollCommands(dt, false);
    expect(cmd.jumpPressed).toBe(false); // Can't jump yet, in air

    // Frame 2: Still in air (30ms elapsed)
    cmd = input.pollCommands(dt, false);
    expect(cmd.jumpPressed).toBe(false);

    // Frame 3: Lands on ground (60ms elapsed < 100ms buffer window)
    cmd = input.pollCommands(dt, true);
    // Buffered jump fires immediately upon landing!
    expect(cmd.jumpPressed).toBe(true);
  });

  it('charges jump over 0.85s', () => {
    input.handleKeyDown('Space');

    // After 0.425s -> ~50% charge
    let cmd = input.pollCommands(0.425, true);
    expect(cmd.jumpChargeProgress).toBeCloseTo(0.5, 1);

    // After 0.85s -> 100% charge
    cmd = input.pollCommands(0.425, true);
    expect(cmd.jumpChargeProgress).toBeCloseTo(1.0, 1);
  });

  it('detects key conflict when remapping actions', () => {
    // Attempt to remap jump to KeyW (already used by moveForward)
    const res = input.remapAction('jump', ['KeyW']);
    expect(res.success).toBe(false);
    expect(res.conflict).toBe('moveForward');

    // Valid remapping to unused key
    const valid = input.remapAction('jump', ['KeyJ']);
    expect(valid.success).toBe(false); // KeyJ is abilityJ!
    expect(valid.conflict).toBe('abilityJ');

    const clean = input.remapAction('jump', ['KeyZ']);
    expect(clean.success).toBe(true);
  });
});
