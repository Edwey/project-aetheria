/**
 * Quality module - Light / Full auto-pick with FPS governor (lowers only).
 */

'use strict';

export const QUALITIES = {
  light: {
    name: 'light',
    slimeParticles: 162,
    wispMotes: 48,
    pixelRatioMax: 1.25,
    shadowMap: 1024,
    weatherParticles: 350,
    outlineBlur: false,
    caustics: false,
  },
  full: {
    name: 'full',
    slimeParticles: 642,
    wispMotes: 96,
    pixelRatioMax: 2,
    shadowMap: 2048,
    weatherParticles: 800,
    outlineBlur: true,
    caustics: true,
  },
};

export function pickInitialQuality() {
  try {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return 'light';
  } catch {
    // ignore
  }
  return 'full';
}

export function createGovernor(initial = pickInitialQuality()) {
  let quality = initial;
  let slowFrames = 0;
  return {
    get quality() {
      return quality;
    },
    get config() {
      return QUALITIES[quality];
    },
    /**
     * Call per frame with dt (seconds). Drops full->light if slow,
     * never raises mid-session per spec.
     */
    tick(dt) {
      if (quality !== 'full') return quality;
      const fps = dt > 0 ? 1 / dt : 60;
      if (fps < 28) {
        slowFrames += 1;
        if (slowFrames >= 120) quality = 'light';
      } else {
        slowFrames = 0;
      }
      return quality;
    },
  };
}
