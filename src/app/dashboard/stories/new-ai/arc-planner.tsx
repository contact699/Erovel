"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Brief, ChapterSynopsis } from "@/lib/ai/schemas";

interface Props {
  brief: Brief;
  toneReferenceText: string | undefined;
  outline: ChapterSynopsis[];
  onOutlineChange: (outline: ChapterSynopsis[]) => void;
  onBack: () => void;
  onNext: () => void;
}

export function ArcPlanner({
  brief,
  toneReferenceText,
  outline,
  onOutlineChange,
  onBack,
  onNext,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Planning style C skips this step entirely — the wizard calls onNext.
  useEffect(() => {
    if (brief.planningStyle === "C") {
      onNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brief.planningStyle]);

  // Planning style A: creator writes synopses themselves. Seed empty rows.
  useEffect(() => {
    if (brief.planningStyle === "A" && outline.length !== brief.chapterCount) {
      onOutlineChange(
        Array.from({ length: brief.chapterCount }, (_, i) => ({
          title: outline[i]?.title ?? `Chapter ${i + 1}`,
          synopsis: outline[i]?.synopsis ?? "",
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brief.planningStyle, brief.chapterCount]);

  async function draftOutline() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/story/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, toneReferenceText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === "refusal" ? data.message : data.error || `HTTP ${res.status}`);
        return;
      }
      onOutlineChange(data.outline);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  if (brief.planningStyle === "C") {
    return null; // effect above advances
  }

  const canContinue =
    outline.length === brief.chapterCount &&
    outline.every((c) => c.title.trim() && c.synopsis.trim());

  function updateRow(idx: number, patch: Partial<ChapterSynopsis>) {
    onOutlineChange(
      outline.map((c, i) => (i === idx ? { ...c, ...patch } : c))
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Arc</h2>
        <p className="text-sm text-muted">
          {brief.planningStyle === "A"
            ? "Write one sentence per chapter."
            : "Let Gemini draft a chapter-by-chapter arc — then edit any row."}
        </p>
      </div>

      {brief.planningStyle === "B" && outline.length === 0 && (
        <Button onClick={draftOutline} disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          Draft outline with AI
        </Button>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {outline.length > 0 && (
        <div className="space-y-3">
          {outline.map((c, idx) => (
            <div key={idx} className="p-4 bg-surface border border-border rounded-lg space-y-2">
              <Input
                value={c.title}
                onChange={(e) => updateRow(idx, { title: e.target.value })}
                placeholder={`Chapter ${idx + 1} title`}
              />
              <Textarea
                value={c.synopsis}
                onChange={(e) => updateRow(idx, { synopsis: e.target.value })}
                placeholder="One-sentence synopsis"
                rows={2}
              />
            </div>
          ))}
        </div>
      )}

      {outline.length > 0 && brief.planningStyle === "B" && (
        <Button variant="ghost" size="sm" onClick={draftOutline} disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          Redraft
        </Button>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={!canContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
