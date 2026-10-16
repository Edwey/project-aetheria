/**
 * Save module tests (R1-017): roundtrip, corrupt-input, debounce, auto-flush.
 * Uses a globalThis.localStorage mock (see src/app/save.js store()).
 */
import assert from 'node:assert/strict';

function mockStorage() {
  const m = {
    _data: {},
    setItem(key, value) { this._data[key] = String(value); },
    getItem(key) { return Object.hasOwn(this._data, key) ? this._data[key] : null; },
    removeItem(key) { delete this._data[key]; },
    clear() { this._data = {}; },
  };
  globalThis.localStorage = m;
  return m;
}

function unmockStorage() {
  delete globalThis.localStorage;
}

const { saveGame, flushGame, loadGame, registerAutoFlush } = await import('../../src/app/save.js');

const TEST_KEY = 'aetheria.save.v1';

export const tests = {
  'saveGame + flushGame roundtrip': () => {
    const mock = mockStorage();
    try {
      const data = { v: 1, inv: { timber: 5, sap: 3 }, pieces: { aetheria: [] } };
      saveGame(data);
      flushGame(data);
      const loaded = loadGame();
      assert.ok(loaded);
      assert.equal(loaded.v, 1);
      assert.equal(loaded.inv.timber, 5);
      assert.equal(loaded.inv.sap, 3);
      assert.ok(Array.isArray(loaded.pieces.aetheria));
    } finally {
      unmockStorage();
      mock.clear();
    }
  },

  'corrupt input ignored (bad JSON)': () => {
    mockStorage();
    try {
      globalThis.localStorage.setItem(TEST_KEY, '{invalid json');
      assert.equal(loadGame(), null);
    } finally {
      unmockStorage();
    }
  },

  'corrupt input ignored (wrong shape)': () => {
    mockStorage();
    try {
      globalThis.localStorage.setItem(TEST_KEY, JSON.stringify({ nope: true }));
      assert.equal(loadGame(), null);
      globalThis.localStorage.setItem(TEST_KEY, JSON.stringify([1, 2, 3]));
      assert.equal(loadGame(), null);
    } finally {
      unmockStorage();
    }
  },

  'missing key loads null': () => {
    mockStorage();
    try {
      assert.equal(loadGame(), null);
    } finally {
      unmockStorage();
    }
  },

  'debounced saveGame writes within 600ms': async () => {
    mockStorage();
    try {
      const data = { v: 1, inv: { fiber: 2 }, pieces: {} };
      saveGame(data);
      await new Promise((r) => setTimeout(r, 600));
      const loaded = loadGame();
      assert.ok(loaded);
      assert.equal(loaded.inv.fiber, 2);
    } finally {
      unmockStorage();
    }
  },

  'registerAutoFlush is a no-op in Node (no window)': () => {
    const off = registerAutoFlush(() => ({}));
    assert.equal(typeof off, 'function');
    off();
  },
};
