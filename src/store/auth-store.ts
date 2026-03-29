import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "@/lib/types";
import { mockCreator, mockReader } from "@/lib/mock-data";

interface AuthState {
  user: Profile | null;
  isAuthenticated: boolean;
  isAgeVerified: boolean;
  login: (role: "reader" | "creator") => void;
  logout: () => void;
  verifyAge: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isAgeVerified: false,
      login: (role) =>
        set({
          user: role === "creator" ? mockCreator : mockReader,
          isAuthenticated: true,
        }),
      logout: () => set({ user: null, isAuthenticated: false }),
      verifyAge: () => set({ isAgeVerified: true }),
    }),
    {
      name: "auth-store",
      partialize: (state) => ({ isAgeVerified: state.isAgeVerified }),
    }
  )
);
