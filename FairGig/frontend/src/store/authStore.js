import { create } from "zustand";

const saved = JSON.parse(localStorage.getItem("fairgig_auth") || "null");

export const useAuthStore = create((set) => ({
  user: saved?.user || null,
  token: saved?.token || null,
  isAuthenticated: !!saved?.user,
  login: (user, token) => {
    localStorage.setItem("fairgig_auth", JSON.stringify({ user, token }));
    if (token) localStorage.setItem("fairgig_token", token);
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem("fairgig_auth");
    localStorage.removeItem("fairgig_token");
    set({ user: null, token: null, isAuthenticated: false });
  },
  updateUser: (updates) =>
    set((state) => {
      const user = { ...state.user, ...updates };
      localStorage.setItem("fairgig_auth", JSON.stringify({ user, token: state.token }));
      return { user };
    }),
}));
