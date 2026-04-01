"use client";

import { useEffect, type ReactNode } from "react";
import { useThemeStore } from "@/store/theme-store";
import { useAuthStore } from "@/store/auth-store";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AgeGate } from "@/components/layout/age-gate";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ToastContainer } from "@/components/ui/toast";

export function ClientProviders({ children }: { children: ReactNode }) {
  const { theme } = useThemeStore();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <AgeGate />
      <Header />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
      <MobileNav />
      <ToastContainer />
    </div>
  );
}
