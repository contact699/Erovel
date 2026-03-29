"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { PLATFORM_NAME } from "@/lib/constants";
import { BookOpen } from "lucide-react";

export function AgeGate() {
  const { isAgeVerified, verifyAge } = useAuthStore();
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState("");

  if (isAgeVerified) return null;

  function handleVerify() {
    const m = parseInt(month);
    const d = parseInt(day);
    const y = parseInt(year);

    if (!m || !d || !y || m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2020) {
      setError("Please enter a valid date of birth.");
      return;
    }

    const birthDate = new Date(y, m - 1, d);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      setError("You must be 18 or older to access this platform.");
      return;
    }

    verifyAge();
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BookOpen size={32} className="text-accent" />
          <span className="text-3xl font-bold tracking-tight">{PLATFORM_NAME}</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Age Verification Required</h1>
          <p className="text-sm text-muted">
            This website contains adult content. You must be 18 years or older to enter.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <p className="text-sm font-medium">Enter your date of birth</p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="MM"
              maxLength={2}
              value={month}
              onChange={(e) => setMonth(e.target.value.replace(/\D/g, ""))}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
            <input
              type="text"
              placeholder="DD"
              maxLength={2}
              value={day}
              onChange={(e) => setDay(e.target.value.replace(/\D/g, ""))}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
            <input
              type="text"
              placeholder="YYYY"
              maxLength={4}
              value={year}
              onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <Button onClick={handleVerify} className="w-full" size="lg">
            Enter
          </Button>
        </div>

        <p className="text-xs text-muted">
          By entering, you confirm you are 18+ and agree to our{" "}
          <a href="/terms" className="underline hover:text-foreground">Terms of Service</a>.
        </p>
      </div>
    </div>
  );
}
