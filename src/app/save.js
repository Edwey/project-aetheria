/**
 * Save module - localStorage (+ IndexedDB later). Stage B minimal.
 */

'use strict';

const PREFIX = 'aetheria.save.v1.';

export function saveGame(slot, data) {
  try {
    localStorage.setItem(PREFIX + slot, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(slot) {
  try {
    const raw = localStorage.getItem(PREFIX + slot);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearGame(slot) {
  try {
    localStorage.removeItem(PREFIX + slot);
    return true;
  } catch {
    return false;
  }
}
