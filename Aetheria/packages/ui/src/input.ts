/**
 * Input handling for creature controls (Phase 3)
 */

import type { SlimeInput, SlimeVariant } from '@sim/index.js';

export interface InputManager {
  getInput(): SlimeInput;
  getSelectedVariant(): SlimeVariant | null;
  resetVariantSelection(): void;
  dispose(): void;
}

/**
 * Initialize keyboard & window input listeners
 */
export function createInputManager(): InputManager {
  const keys: Record<string, boolean> = {};
  let requestedVariant: SlimeVariant | null = null;

  const onKeyDown = (e: KeyboardEvent) => {
    // Avoid intercepting browser developer keys or refresh
    if (e.key === 'F12' || (e.ctrlKey && e.key === 'r')) return;

    keys[e.code] = true;
    keys[e.key.toLowerCase()] = true;

    // Quick variant selection via keys 1, 2, 3
    if (e.key === '1') {
      requestedVariant = 'goo';
    } else if (e.key === '2') {
      requestedVariant = 'jelly_ball';
    } else if (e.key === '3') {
      requestedVariant = 'jelly_cube';
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    keys[e.code] = false;
    keys[e.key.toLowerCase()] = false;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  return {
    getInput(): SlimeInput {
      let moveX = 0;
      let moveZ = 0;

      // Horizontal inputs: A/D or ArrowLeft/ArrowRight
      if (keys['KeyA'] || keys['ArrowLeft'] || keys['a']) moveX -= 1;
      if (keys['KeyD'] || keys['ArrowRight'] || keys['d']) moveX += 1;

      // Depth inputs: W/S or ArrowUp/ArrowDown (W = forward = -Z, S = backward = +Z in 3D camera view)
      if (keys['KeyW'] || keys['ArrowUp'] || keys['w']) moveZ -= 1;
      if (keys['KeyS'] || keys['ArrowDown'] || keys['s']) moveZ += 1;

      const jumpHold = !!(keys['Space'] || keys[' ']);
      const rideWind = !!(keys['ShiftLeft'] || keys['ShiftRight'] || keys['shift']);
      const melt = !!(keys['KeyM'] || keys['m']);
      const spring = !!(keys['KeyC'] || keys['c']);
      const groundPound = !!(keys['KeyF'] || keys['f']);

      return {
        moveX,
        moveZ,
        jumpHold,
        rideWind,
        melt,
        spring,
        groundPound,
      };
    },

    getSelectedVariant(): SlimeVariant | null {
      return requestedVariant;
    },

    resetVariantSelection(): void {
      requestedVariant = null;
    },

    dispose(): void {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    },
  };
}
