"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Sparkles, ArrowLeft } from "lucide-react";
import { reducer, initialState, LOCAL_STORAGE_KEY } from "./state";
import { BriefForm } from "./brief-form";
import { ToneReferencePicker } from "./tone-reference-picker";
import { ArcPlanner } from "./arc-planner";
import { ChapterGenerator } from "./chapter-generator";
import { ReviewStep } from "./review-step";

export default function NewAiStoryPage() {
  const { user, hydrated } = useAuthStore();
  const [featureOn, setFeatureOn] = useState<boolean | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [rehydrated, setRehydrated] = useState(false);

  // Restore draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        dispatch({ type: "LOAD_STATE", state: saved });
      }
    } catch {
      /* ignore */
    }
    setRehydrated(true);
  }, []);

  // Persist draft on every change
  useEffect(() => {
    if (!rehydrated) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, rehydrated]);

  // Feature-flag probe (unchanged from skeleton)
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
  if (!user) return <Centered text="Sign in to use AI writing." />;
  if (user.role !== "creator") return <Centered text="Only creators can write stories." />;
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
  if (featureOn === null) return <Centered text="Loading…" />;
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

  const steps: { key: string; label: string }[] = [
    { key: "brief", label: "Brief" },
    { key: "arc", label: "Arc" },
    { key: "chapters", label: "Chapters" },
    { key: "review", label: "Review" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <Link
          href="/dashboard/stories"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Back to my stories
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <Sparkles size={24} className="text-accent" />
          <h1 className="text-2xl font-bold">Create with AI</h1>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        {steps.map((s, i) => {
          const active = state.step === s.key;
          const done = steps.findIndex((x) => x.key === state.step) > i;
          return (
            <div key={s.key} className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  active
                    ? "bg-accent text-background"
                    : done
                      ? "bg-success/20 text-success"
                      : "bg-surface-hover text-muted"
                }`}
              >
                {i + 1}
              </span>
              <span className={active ? "text-foreground" : "text-muted"}>
                {s.label}
              </span>
              {i < steps.length - 1 && <span className="text-muted">→</span>}
            </div>
          );
        })}
      </div>

      {state.step === "brief" && (
        <>
          <BriefForm
            brief={state.brief}
            onChange={(patch) => dispatch({ type: "SET_BRIEF", patch })}
            onNext={() =>
              dispatch({
                type: "GO_TO",
                step: state.brief.planningStyle === "C" ? "chapters" : "arc",
              })
            }
          />
          <div className="border-t border-border pt-6">
            <p className="text-sm font-medium mb-2">
              Tone reference (optional)
            </p>
            <ToneReferencePicker
              toneReferenceText={state.toneReferenceText}
              onChange={(text) => dispatch({ type: "SET_TONE_REFERENCE", text })}
            />
          </div>
        </>
      )}

      {state.step === "arc" && (
        <ArcPlanner
          brief={state.brief}
          toneReferenceText={state.toneReferenceText}
          outline={state.outline}
          onOutlineChange={(outline) => dispatch({ type: "SET_OUTLINE", outline })}
          onBack={() => dispatch({ type: "GO_TO", step: "brief" })}
          onNext={() => dispatch({ type: "GO_TO", step: "chapters" })}
        />
      )}

      {state.step === "chapters" && (
        <ChapterGenerator
          state={state}
          onSetMedia={(index, media) =>
            dispatch({ type: "SET_CHAPTER_MEDIA", index, media })
          }
          onSetHints={(index, hints) =>
            dispatch({ type: "SET_REGEN_HINTS", index, hints })
          }
          onSetOutput={(index, output) =>
            dispatch({ type: "SET_CHAPTER_OUTPUT", index, output })
          }
          onSetCurrent={(index) =>
            dispatch({ type: "SET_CURRENT_CHAPTER", index })
          }
          onBack={() =>
            dispatch({
              type: "GO_TO",
              step: state.brief.planningStyle === "C" ? "brief" : "arc",
            })
          }
          onFinish={() => dispatch({ type: "GO_TO", step: "review" })}
        />
      )}

      {state.step === "review" && (
        <ReviewStep
          state={state}
          onBack={() => dispatch({ type: "GO_TO", step: "chapters" })}
          onSavedStoryId={(id) => dispatch({ type: "SET_STORY_ID", id })}
          onClearDraft={() => {
            try {
              localStorage.removeItem(LOCAL_STORAGE_KEY);
            } catch {
              /* ignore */
            }
          }}
        />
      )}
    </div>
  );
}

function Centered({ text }: { text: string }) {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <p className="text-muted">{text}</p>
    </div>
  );
}
