"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Sparkles, ArrowLeft } from "lucide-react";

export default function NewAiStoryPage() {
  const { user, hydrated } = useAuthStore();
  const [featureOn, setFeatureOn] = useState<boolean | null>(null);

  // Probe the plan endpoint once on mount to detect whether the server-side
  // feature flag is enabled. Any 503 for feature-off means we block the UI.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai/story/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ __probe: true }),
        });
        if (cancelled) return;
        // 400 (Invalid JSON/brief) means feature is on and we reached the handler.
        // 503 means feature off (or misconfigured).
        setFeatureOn(res.status !== 503);
      } catch {
        if (!cancelled) setFeatureOn(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!hydrated) return null;

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-muted">Sign in to use AI writing.</p>
      </div>
    );
  }

  if (user.role !== "creator") {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-muted">Only creators can write stories.</p>
      </div>
    );
  }

  if (!user.is_verified) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10">
          <ShieldCheck size={24} className="text-accent" />
        </div>
        <h1 className="text-2xl font-bold">Get verified to unlock AI writing</h1>
        <p className="text-sm text-muted">
          Identity verification keeps the platform safe and unlocks AI-assisted
          story creation.
        </p>
        <Link href="/dashboard">
          <Button>Go to dashboard</Button>
        </Link>
      </div>
    );
  }

  if (featureOn === null) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-muted text-sm">
        Loading…
      </div>
    );
  }

  if (featureOn === false) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">AI writing is currently off</h1>
        <p className="text-sm text-muted">
          The AI wizard is temporarily disabled. Check back shortly.
        </p>
        <Link href="/dashboard/stories/new">
          <Button variant="secondary">Start a blank story instead</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/dashboard/stories"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Back to my stories
      </Link>
      <div className="mt-6 flex items-center gap-3">
        <Sparkles size={24} className="text-accent" />
        <h1 className="text-2xl font-bold">Create with AI</h1>
      </div>
      <p className="text-sm text-muted mt-2">
        Four steps: brief, arc, chapter-by-chapter generation, review.
      </p>

      {/* Step content mounts here in Task 15. */}
      <div className="mt-8 p-6 bg-surface border border-border rounded-xl text-sm text-muted">
        Wizard steps will mount here.
      </div>
    </div>
  );
}
