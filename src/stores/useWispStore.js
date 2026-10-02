import { create } from 'zustand';

export const useWispStore = create((set) => ({
  color: '#6ee7b7',
  hatIndex: 0,
  position: [0, 1.2, 0],
  locomotion: 'ground',
  setColor: (color) => set({ color }),
  setHatIndex: (hatIndex) => set({ hatIndex }),
  setPosition: (position) => set({ position }),
  setLocomotion: (locomotion) => set({ locomotion }),
}));
