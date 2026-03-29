"use client";

import { useEffect, type ReactNode } from "react";
import { useThemeStore } from "@/store/theme-store";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AgeGate } from "@/components/layout/age-gate";

export function ClientProviders({ children }: { children: ReactNode }) {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <div className="min-h-screen flex flex-col">
      <AgeGate />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
