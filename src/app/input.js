/**
 * Input module - keyboard / touch state, fixed-step friendly.
 * Render/DOM side only (not pure). Stage B minimal stub; Stage C wires to prototype.
 */

'use strict';

export function createInput() {
  const keys = new Set();
  const state = {
    moveX: 0,
    moveZ: 0,
    jumpHeld: false,
    jumpPressed: false,
    rideHeld: false,
    actionF: false,
    actionM: false,
    actionC: false,
    actionH: false,
    actionV: false,
  };

  function recompute() {
    const l = keys.has('KeyA') || keys.has('ArrowLeft');
    const r = keys.has('KeyD') || keys.has('ArrowRight');
    const u = keys.has('KeyW') || keys.has('ArrowUp');
    const d = keys.has('KeyS') || keys.has('ArrowDown');
    state.moveX = (r ? 1 : 0) - (l ? 1 : 0);
    state.moveZ = (d ? 1 : 0) - (u ? 1 : 0);
    state.jumpHeld = keys.has('Space');
    state.rideHeld = keys.has('ShiftLeft') || keys.has('ShiftRight');
  }

  function onKeyDown(e) {
    if (e.code === 'Space') state.jumpPressed = true;
    keys.add(e.code);
    if (e.code === 'KeyF') state.actionF = true;
    if (e.code === 'KeyM') state.actionM = true;
    if (e.code === 'KeyC') state.actionC = true;
    if (e.code === 'KeyH') state.actionH = true;
    if (e.code === 'KeyV') state.actionV = true;
    recompute();
  }

  function onKeyUp(e) {
    keys.delete(e.code);
    recompute();
  }

  function attach() {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  }

  function detach() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  }

  function endFrame() {
    state.jumpPressed = false;
    state.actionF = false;
    state.actionM = false;
    state.actionC = false;
    state.actionH = false;
    state.actionV = false;
  }

  return { state, keys, attach, detach, endFrame };
}
