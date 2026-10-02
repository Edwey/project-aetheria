import { create } from 'zustand';

export const useWorldStore = create((set) => ({
  cycleProgress: 0,
  isDay: true,
  dayMix: 1,
  bloomIntensity: 0.15,
  activeModal: null,
  notes: [],
  sparks: 0,
  targetSparks: 1000,
  setCycle: (cycleProgress, isDay, bloomIntensity, dayMix) =>
    set({ cycleProgress, isDay, bloomIntensity, dayMix }),
  openModal: (activeModal) => set({ activeModal }),
  closeModal: () => set({ activeModal: null }),
  setNotes: (notes) => set({ notes }),
  setSparks: (sparks, targetSparks) =>
    set({
      sparks,
      ...(typeof targetSparks === 'number' ? { targetSparks } : {}),
    }),
}));
