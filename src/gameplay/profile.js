/**
 * Profile module - Creature customization and save data
 * Pure gameplay module - no THREE, no DOM, runs in Node
 */

'use strict';

const KEY = 'aetheria.profile.v1';

const DEFAULT = {
  v: 1,
  name: 'Slimey',
  form: 'slime',
  look: {
    top: '#7cf0a0',
    bottom: '#2fbf62',
    translucency: 0.86,
    gloss: 1,
    size: 1,
    eyeStyle: 'oval',
    eyeColor: '#16301f',
    mouth: 'smile',
    core: 'crystal'
  },
  body: {
    preset: 'blob',
    stiff: 0.22,
    pressure: 1,
    skin: 0.9,
    grip: 0.55,
    sticky: 0.5,
    jmax: 15
  },
  cosmetics: {
    head: 'none',
    face: 'none',
    back: 'none',
    aura: 'none',
    trail: 'none'
  }
};

export { DEFAULT };
