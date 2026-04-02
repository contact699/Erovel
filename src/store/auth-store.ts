import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface AuthState {
  user: Profile | null;
  isAuthenticated: boolean;
  isAgeVerified: boolean;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string, displayName: string, role: "reader" | "creator") => Promise<void>;
  logout: () => Promise<void>;
  verifyAge: () => void;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isAgeVerified: false,
      hydrated: false,
      loading: false,
      error: null,

      clearError: () => set({ error: null }),

      login: async (email, password) => {
        set({ loading: true, error: null });
        const supabase = createClient();
        if (!supabase) {
          set({ loading: false, error: "Database not configured" });
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          set({ loading: false, error: error.message });
          return;
        }
        await get().refreshProfile();
        set({ loading: false });
      },

      signup: async (email, password, username, displayName, role) => {
        set({ loading: true, error: null });
        const supabase = createClient();
        if (!supabase) {
          set({ loading: false, error: "Database not configured" });
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, display_name: displayName, role },
          },
        });
        if (error) {
          set({ loading: false, error: error.message });
          return;
        }
        // Profile is auto-created by DB trigger
        await get().refreshProfile();
        set({ loading: false });
      },

      logout: async () => {
        const supabase = createClient();
        if (supabase) {
          await supabase.auth.signOut();
        }
        set({ user: null, isAuthenticated: false });
      },

      verifyAge: () => set({ isAgeVerified: true }),

      refreshProfile: async () => {
        const supabase = createClient();
        if (!supabase) return;
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          set({ user: null, isAuthenticated: false });
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();
        if (profile) {
          set({ user: profile as Profile, isAuthenticated: true });
        }
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAgeVerified: state.isAgeVerified,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);
