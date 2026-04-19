import { create } from "zustand";

export const useDemoStore = create((set, get) => ({
  isDemoMode: false,
  demoStep: 0, // 0=off, 1=earnings logged, 2=anomaly detected, 3=grievance filed, 4=verified, 5=certificate
  demoTimer: null,

  enableDemo: () => {
    set({ isDemoMode: true, demoStep: 0 });
  },

  disableDemo: () => {
    const timer = get().demoTimer;
    if (timer) clearTimeout(timer);
    set({ isDemoMode: false, demoStep: 0, demoTimer: null });
  },

  advanceDemoStep: () => {
    set((s) => ({ demoStep: Math.min(s.demoStep + 1, 5) }));
  },

  setDemoStep: (step) => {
    set({ demoStep: step });
  },

  startDemoFlow: () => {
    set({ isDemoMode: true, demoStep: 0 });
    const timer1 = setTimeout(() => set({ demoStep: 1 }), 1500);
    const timer2 = setTimeout(() => set({ demoStep: 2 }), 4000);
    const timer3 = setTimeout(() => set({ demoStep: 3 }), 7000);
    const timer4 = setTimeout(() => set({ demoStep: 4 }), 10000);
    const timer5 = setTimeout(() => set({ demoStep: 5 }), 13000);
    set({ demoTimer: timer5 });
  },
}));
