"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaUpload } from "@/components/editor/media-upload";
import { ChatReader } from "@/components/story/chat-reader";
import { ProseReader } from "@/components/story/prose-reader";
import { Sparkles, Loader2, X } from "lucide-react";
import type {
  WizardState,
  ChapterDraft,
  ChapterOutput,
  MediaAttachment,
} from "./state";

const HINT_CHIPS: { value: string; label: string }[] = [
  { value: "more_explicit", label: "More explicit" },
  { value: "more_dialogue", label: "More dialogue" },
  { value: "slower_pacing", label: "Slower pacing" },
  { value: "shorter", label: "Shorter" },
  { value: "longer", label: "Longer" },
];

interface Props {
  state: WizardState;
  onSetMedia: (index: number, media: MediaAttachment[]) => void;
  onSetHints: (index: number, hints: string[]) => void;
  onSetOutput: (index: number, output: ChapterOutput) => void;
  onSetCurrent: (index: number) => void;
  onBack: () => void;
  onFinish: () => void;
}

/** Derive the MediaAttachment mediaType from a File object. */
function fileToMediaType(file: File): "image" | "gif" | "video" {
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "image/gif") return "gif";
  return "image";
}

export function ChapterGenerator({
  state,
  onSetMedia,
  onSetHints,
  onSetOutput,
  onSetCurrent,
  onBack,
  onFinish,
}: Props) {
  const { brief, outline, currentChapterIndex, chapters } = state;
  const draft: ChapterDraft =
    chapters[currentChapterIndex] ?? { output: null, media: [], regenHints: [] };

  const [streaming, setStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function generate(isRegeneration: boolean) {
    setStreaming(true);
    setStreamedText("");
    setError(null);

    const priorSummaries = Array.from({ length: currentChapterIndex })
      .map((_, i) => chapters[i]?.output?.summary ?? "")
      .filter(Boolean);

    const mediaCaptions = draft.media.map((m) => ({ url: m.url, caption: m.caption }));

    const body = {
      brief,
      outline,
      chapterNumber: currentChapterIndex + 1,
      priorChapterSummaries: priorSummaries,
      mediaCaptions,
      regenHints: draft.regenHints,
      toneReferenceText: state.toneReferenceText,
      isRegeneration,
      storyId: state.storyId ?? undefined,
      chapterId: state.chapterDbIds[currentChapterIndex],
    };

    try {
      const res = await fetch("/api/ai/story/chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok || !res.body) {
        const text = await res.text();
        setError(`HTTP ${res.status}: ${text.slice(0, 200)}`);
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let sep: number;
        while ((sep = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          const line = frame.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const payload = line.slice(6);
          try {
            const ev = JSON.parse(payload);
            if (ev.type === "delta") {
              setStreamedText((t) => t + ev.text);
            } else if (ev.type === "final") {
              const output: ChapterOutput =
                brief.format === "prose"
                  ? { kind: "prose", content: ev.output.content, summary: ev.output.summary }
                  : {
                      kind: "chat",
                      characters: ev.output.characters,
                      messages: ev.output.messages,
                      summary: ev.output.summary,
                    };
              onSetOutput(currentChapterIndex, output);
            } else if (ev.type === "error") {
              setError(ev.message || ev.code || "Generation failed");
            }
          } catch {
            // skip malformed event frame
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setStreaming(false);
    }
  }

  function toggleHint(value: string) {
    const current = draft.regenHints;
    const next = current.includes(value)
      ? current.filter((h) => h !== value)
      : [...current, value];
    onSetHints(currentChapterIndex, next);
  }

  /**
   * MediaUpload calls onUpload(url, file) — the second argument is the File
   * object, not a mediaType string. We derive mediaType from file.type here.
   */
  function addMedia(url: string, file: File) {
    const item: MediaAttachment = {
      id: crypto.randomUUID(),
      url,
      caption: "",
      mediaType: fileToMediaType(file),
    };
    onSetMedia(currentChapterIndex, [...draft.media, item]);
  }

  function updateCaption(id: string, caption: string) {
    onSetMedia(
      currentChapterIndex,
      draft.media.map((m) => (m.id === id ? { ...m, caption } : m))
    );
  }

  function removeMedia(id: string) {
    onSetMedia(currentChapterIndex, draft.media.filter((m) => m.id !== id));
  }

  const canGenerate = draft.media.every((m) => m.caption.trim().length > 0);
  const hasOutput = !!draft.output;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
      {/* Chapter list sidebar */}
      <aside className="space-y-1">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider">
          Chapters
        </p>
        {Array.from({ length: brief.chapterCount }).map((_, i) => {
          const done = !!chapters[i]?.output;
          const isCurrent = i === currentChapterIndex;
          return (
            <button
              key={i}
              onClick={() => onSetCurrent(i)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                isCurrent
                  ? "bg-accent/10 text-foreground"
                  : "text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              <span className="font-mono text-xs mr-2">{i + 1}.</span>
              {outline[i]?.title ?? `Chapter ${i + 1}`}
              {done && <span className="ml-2 text-success text-xs">✓</span>}
            </button>
          );
        })}
      </aside>

      {/* Main panel */}
      <div className="space-y-5 min-w-0">
        <div>
          <h2 className="text-lg font-semibold">
            Chapter {currentChapterIndex + 1} of {brief.chapterCount}
          </h2>
          {outline[currentChapterIndex]?.synopsis && (
            <p className="text-sm text-muted mt-1">
              {outline[currentChapterIndex].synopsis}
            </p>
          )}
        </div>

        {/* Media upload + captions */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Media for this chapter (optional)</p>
          <MediaUpload onUpload={addMedia} />
          {draft.media.length > 0 && (
            <div className="space-y-2">
              {draft.media.map((m) => (
                <div key={m.id} className="flex gap-2 items-start p-2 bg-surface border border-border rounded-lg">
                  <span className="text-xs text-muted mt-2 w-14 shrink-0">
                    {m.mediaType}
                  </span>
                  <Input
                    value={m.caption}
                    onChange={(e) => updateCaption(m.id, e.target.value)}
                    placeholder="Caption (required) — what's happening in this media?"
                    className="flex-1"
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeMedia(m.id)}>
                    <X size={14} />
                  </Button>
                </div>
              ))}
              {!canGenerate && (
                <p className="text-xs text-danger">
                  Every uploaded media needs a caption before generating.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Regen hint chips */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Tuning for regeneration</p>
          <div className="flex flex-wrap gap-2">
            {HINT_CHIPS.map((h) => {
              const active = draft.regenHints.includes(h.value);
              return (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => toggleHint(h.value)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                    active
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border text-muted hover:bg-surface-hover"
                  }`}
                >
                  {h.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => generate(hasOutput)}
            disabled={streaming || !canGenerate}
          >
            {streaming ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {hasOutput ? "Regenerate chapter" : "Generate chapter"}
          </Button>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        {/* Live preview */}
        {(streaming || hasOutput) && (
          <div className="border border-border rounded-xl p-4 bg-surface">
            {streaming && !hasOutput && (
              <pre className="text-sm whitespace-pre-wrap text-muted">
                {streamedText}
              </pre>
            )}
            {hasOutput && draft.output!.kind === "prose" && draft.output!.content && (
              <ProseReader content={draft.output!.content as Record<string, unknown>} />
            )}
            {hasOutput && draft.output!.kind === "chat" && (
              <ChatReader
                content={{
                  characters: draft.output!.characters!,
                  messages: draft.output!.messages!,
                }}
              />
            )}
          </div>
        )}

        <div className="flex justify-between pt-2">
          <Button variant="secondary" onClick={onBack}>Back</Button>
          {currentChapterIndex + 1 < brief.chapterCount ? (
            <Button
              onClick={() => onSetCurrent(currentChapterIndex + 1)}
              disabled={!hasOutput}
            >
              Next chapter
            </Button>
          ) : (
            <Button onClick={onFinish} disabled={!hasOutput}>
              Review &amp; publish
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
