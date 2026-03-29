import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "@/lib/types";
import { mockCreator, mockReader } from "@/lib/mock-data";

interface AuthState {
  user: Profile | null;
  isAuthenticated: boolean;
  isAgeVerified: boolean;
  login: (role: "reader" | "creator" | "admin") => void;
  logout: () => void;
  verifyAge: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isAgeVerified: false,
      login: (role) => {
        let user;
        if (role === "admin") {
          user = { ...mockCreator, id: "admin-1", username: "admin", display_name: "Admin", role: "admin" as const };
        } else if (role === "creator") {
          user = mockCreator;
        } else {
          user = mockReader;
        }
        set({ user, isAuthenticated: true });
      },
      logout: () => set({ user: null, isAuthenticated: false }),
      verifyAge: () => set({ isAgeVerified: true }),
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAgeVerified: state.isAgeVerified,
      }),
    }
  )
);
