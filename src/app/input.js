/**
 * Input module - keyboard / touch state, fixed-step friendly.
 * Render/DOM side only (not pure). R1-015 wires game.js input here.
 */

'use strict';

export function createInput() {
  const keys = new Set();
  const joy = { x: 0, y: 0 };
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
    // Game-specific flags
    meltOn: false,
    springOn: false,
    pendingPound: false,
    pendingHeart: false,
    pendingFloat: false,
    touchRide: false,
    touchJump: false,
    modeSel: 0,
    // Physics-facing fields written by game.js readInput()/fixedStep.
    // `wind` must exist before fixedStep assigns inp.wind[0..2].
    mx: 0,
    mz: 0,
    wind: [0, 0, 0],
    ride: false,
    melt: false,
    pound: false,
    heart: false,
  };

  function typing(e) {
    const t = e.target && e.target.tagName;
    return t === 'INPUT' || t === 'SELECT' || t === 'TEXTAREA';
  }

  function recompute() {
    const l = keys.has('KeyA') || keys.has('ArrowLeft');
    const r = keys.has('KeyD') || keys.has('ArrowRight');
    const u = keys.has('KeyW') || keys.has('ArrowUp');
    const d = keys.has('KeyS') || keys.has('ArrowDown');
    state.moveX = (r ? 1 : 0) - (l ? 1 : 0) + joy.x;
    state.moveZ = (d ? 1 : 0) - (u ? 1 : 0) + joy.y;
    state.jumpHeld = keys.has('Space');
    state.rideHeld = keys.has('ShiftLeft') || keys.has('ShiftRight');
  }

  function onKeyDown(e) {
    if (typing(e)) return;
    const k = e.key.toLowerCase();
    if (e.code === 'Space') { e.preventDefault(); state.jumpPressed = true; }
    if (k.startsWith('arrow') || k === 'tab') e.preventDefault();
    if (e.repeat) return;
    keys.add(e.code);
    if (e.code === 'KeyF') state.actionF = true;
    if (e.code === 'KeyM') state.actionM = true;
    if (e.code === 'KeyC') state.actionC = true;
    if (e.code === 'KeyH') state.actionH = true;
    if (e.code === 'KeyV') state.actionV = true;
    if (k === 'f') state.pendingPound = true;
    if (k === 'v') state.pendingFloat = true;
    if (k === 'h') state.pendingHeart = true;
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

  return { state, keys, joy, attach, detach, endFrame };
}
