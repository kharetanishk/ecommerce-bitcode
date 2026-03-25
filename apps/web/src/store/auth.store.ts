import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@ecommerce/types";

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string | null) => void;
  clearAuth: () => void;
  setLoading: (value: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
      setLoading: (value) => set({ isLoading: value }),
    }),
    {
      name: "ecommerce-auth",
      partialize: (s) => ({ user: s.user, token: s.token }),
    },
  ),
);
