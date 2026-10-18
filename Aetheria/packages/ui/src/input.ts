/**
 * Universal Input handling for all creature forms (Slime, Wisp, Stone)
 */

import type { SlimeInput, WispInput, StoneInput } from '@sim/index.js';

export interface UniversalInput {
  moveX: number;
  moveZ: number;
  jumpHold: boolean;
  meltOrPebbleOrDiffuse: boolean;
  springOrCondense: boolean;
  poundOrDownGust: boolean;
  floatHold: boolean;
  rideWind: boolean;
}

export interface InputManager {
  getUniversalInput(): UniversalInput;
  getSlimeInput(): SlimeInput;
  getWispInput(): WispInput;
  getStoneInput(): StoneInput;

  getRequestedVariantIndex(): number | null;
  resetVariantSelection(): void;

  consumeCreatureCycle(): boolean;

  // Programmatic triggers for on-screen touch/mouse buttons
  setVirtualButton(button: 'jump' | 'melt' | 'spring' | 'pound' | 'float', pressed: boolean): void;

  dispose(): void;
}

export function createInputManager(): InputManager {
  const keys: Record<string, boolean> = {};
  let requestedVariantIndex: number | null = null;
  let creatureCycleRequested = false;

  const virtualButtons: Record<string, boolean> = {
    jump: false,
    melt: false,
    spring: false,
    pound: false,
    float: false,
  };

  const onKeyDown = (e: KeyboardEvent) => {
    // Avoid intercepting browser developer keys or refresh
    if (e.key === 'F12' || (e.ctrlKey && e.key === 'r')) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      creatureCycleRequested = true;
      return;
    }

    if (e.code === 'Space') {
      e.preventDefault();
    }

    keys[e.code] = true;
    keys[e.key.toLowerCase()] = true;

    // Quick variant selection via keys 1, 2, 3
    if (e.key === '1') {
      requestedVariantIndex = 0;
    } else if (e.key === '2') {
      requestedVariantIndex = 1;
    } else if (e.key === '3') {
      requestedVariantIndex = 2;
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    keys[e.code] = false;
    keys[e.key.toLowerCase()] = false;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  function getBaseInput(): UniversalInput {
    let moveX = 0;
    let moveZ = 0;

    // Horizontal inputs: A/D or ArrowLeft/ArrowRight
    if (keys['KeyA'] || keys['ArrowLeft'] || keys['a']) moveX -= 1;
    if (keys['KeyD'] || keys['ArrowRight'] || keys['d']) moveX += 1;

    // Depth inputs: W/S or ArrowUp/ArrowDown (W = forward = -Z, S = backward = +Z in 3D camera view)
    if (keys['KeyW'] || keys['ArrowUp'] || keys['w']) moveZ -= 1;
    if (keys['KeyS'] || keys['ArrowDown'] || keys['s']) moveZ += 1;

    const jumpHold = !!(keys['Space'] || keys[' '] || virtualButtons.jump);
    const rideWind = !!(keys['ShiftLeft'] || keys['ShiftRight'] || keys['shift']);
    const meltOrPebbleOrDiffuse = !!(keys['KeyM'] || keys['m'] || virtualButtons.melt);
    const springOrCondense = !!(keys['KeyC'] || keys['c'] || virtualButtons.spring);
    const poundOrDownGust = !!(keys['KeyF'] || keys['f'] || virtualButtons.pound);
    const floatHold = !!(keys['KeyV'] || keys['v'] || virtualButtons.float);

    return {
      moveX,
      moveZ,
      jumpHold,
      meltOrPebbleOrDiffuse,
      springOrCondense,
      poundOrDownGust,
      floatHold,
      rideWind,
    };
  }

  return {
    getUniversalInput(): UniversalInput {
      return getBaseInput();
    },

    getSlimeInput(): SlimeInput {
      const u = getBaseInput();
      return {
        moveX: u.moveX,
        moveZ: u.moveZ,
        jumpHold: u.jumpHold,
        rideWind: u.rideWind,
        melt: u.meltOrPebbleOrDiffuse,
        spring: u.springOrCondense,
        groundPound: u.poundOrDownGust,
      };
    },

    getWispInput(): WispInput {
      const u = getBaseInput();
      return {
        moveX: u.moveX,
        moveZ: u.moveZ,
        riseHold: u.jumpHold,
        floatHold: u.floatHold,
        condense: u.springOrCondense,
        diffuse: u.meltOrPebbleOrDiffuse,
        downGust: u.poundOrDownGust,
      };
    },

    getStoneInput(): StoneInput {
      const u = getBaseInput();
      return {
        moveX: u.moveX,
        moveZ: u.moveZ,
        jumpHold: u.jumpHold,
        pebbleShrink: u.meltOrPebbleOrDiffuse,
        groundPound: u.poundOrDownGust,
      };
    },

    getRequestedVariantIndex(): number | null {
      return requestedVariantIndex;
    },

    resetVariantSelection(): void {
      requestedVariantIndex = null;
    },

    consumeCreatureCycle(): boolean {
      if (creatureCycleRequested) {
        creatureCycleRequested = false;
        return true;
      }
      return false;
    },

    setVirtualButton(button: 'jump' | 'melt' | 'spring' | 'pound' | 'float', pressed: boolean): void {
      virtualButtons[button] = pressed;
    },

    dispose(): void {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    },
  };
}
