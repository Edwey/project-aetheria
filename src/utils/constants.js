export const CYCLE_DURATION_MS = 720_000;

export const NOTE_LIMITS = {
  sign: 100,
  bottle: 100,
  wish: 140,
  rune: 256,
};

export const WORLD_NOTE_CAP = 150;

export const PENTATONIC = ['c4', 'd4', 'e4', 'g4', 'a4'];
export const CHIME_BPM = 120;
export const CHIME_DEBOUNCE_MS = 300;

export const ISO_CAMERA = {
  position: [42, 32, 42],
  lookAt: [1.5, 0.5, 0.5],
  zoom: 17.5,
  near: -120,
  far: 320,
};

export const ISLANDS = {
  plaza: { position: [0, 0, 0], radius: 7.6 },
  zen: { position: [23, 1.2, -14], radius: 6.4 },
  well: { position: [-21, 1.6, 16], radius: 6.2 },
};

export const TRAVERSAL = {
  bridge: {
    from: [6.8, 0.2, -4.2],
    to: [17.2, 1.1, -10.6],
  },
  catapult: { position: [4.5, 0.15, 5.6] },
  updraft: { position: [-9.5, 0.2, 7.8] },
};

export const PALETTE = {
  daySun: '#fff8e7',
  nightSun: '#b4c6fc',
  daySky: '#82bfe6',
  nightSky: '#090d1c',
  dayFog: '#bde0f5',
  nightFog: '#0f1428',
  dayAmbient: '#fff0d9',
  nightAmbient: '#242050',
  moss: '#759a70',
  mossDark: '#4a6747',
  sand: '#e8cfa8',
  stone: '#928b80',
  water: '#4ecdc4',
  neon: '#5eead4',
  lantern: '#ffb347',
  abyss: '#1d2738',
};
