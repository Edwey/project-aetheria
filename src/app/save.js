/**
 * Save module - localStorage for profile, inventory, and build pieces.
 * Corrupt data falls back to defaults; never throws.
 */

'use strict';

// Storage resolution: browser localStorage first, then a Node-test mock on
// globalThis.localStorage, then an in-memory fallback. Never throws.
const fallback = {
  _data: {},
  setItem(key, value) { this._data[key] = String(value); },
  getItem(key) { return Object.hasOwn(this._data, key) ? this._data[key] : null; },
  removeItem(key) { delete this._data[key]; },
};

function store() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch { /* blocked storage */ }
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) return globalThis.localStorage;
  } catch { /* ignore */ }
  return fallback;
}

const SAVE_KEY = 'aetheria.save.v1';
let saveTimer = null;

/**
 * Debounced save: writes {inv, pieces} to localStorage after 500ms delay.
 * @param {object} data - {inv: {}, pieces: {}, profile: {}}
 */
export function saveGame(data) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      store().setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      // Storage quota or disabled - ignore
    }
  }, 500);
}

/**
 * Immediate flush (e.g., beforeunload/pagehide).
 * @param {object} data - {inv: {}, pieces: {}, profile: {}}
 */
export function flushGame(data) {
  clearTimeout(saveTimer);
  try {
    store().setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    // Storage quota or disabled - ignore
  }
}

/**
 * Load saved data from localStorage.
 * @returns {object|null} Parsed data or null if missing/corrupt
 */
export function loadGame() {
  try {
    const raw = store().getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Validate basic structure: v, inv, pieces, profile are objects
    if (parsed && typeof parsed === 'object' && parsed.v) {
      return parsed;
    }
    return null;
  } catch (e) {
    // Corrupt data - ignore
    return null;
  }
}

/**
 * Register beforeunload/pagehide handlers for automatic flush.
 * @param {function} getDataFn - Function returning current game data
 */
export function registerAutoFlush(getDataFn) {
  if (typeof window === 'undefined') return () => {};
  const flush = () => flushGame(getDataFn());
  window.addEventListener('beforeunload', flush);
  window.addEventListener('pagehide', flush);
  return () => {
    window.removeEventListener('beforeunload', flush);
    window.removeEventListener('pagehide', flush);
  };
}


