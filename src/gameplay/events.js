/**
 * Events module - Event bus interface for future multiplayer
 * Pure gameplay module - no THREE, no DOM, runs in Node
 */

'use strict';

/**
 * Event bus for game events
 * This interface is defined for future multiplayer (PartyKit, Supabase)
 * No server implementation in v1
 */

export function create() {
  return {
    listeners: new Map()
  };
}

export function on(bus, eventType, callback) {
  if (!bus.listeners.has(eventType)) {
    bus.listeners.set(eventType, []);
  }
  bus.listeners.get(eventType).push(callback);
}

export function emit(bus, eventType, data) {
  const callbacks = bus.listeners.get(eventType);
  if (callbacks) {
    for (const cb of callbacks) {
      cb(data);
    }
  }
}

export function off(bus, eventType, callback) {
  const callbacks = bus.listeners.get(eventType);
  if (callbacks) {
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }
}
