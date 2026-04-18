"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MediaUpload } from "@/components/editor/media-upload";
import { ProseReader } from "@/components/story/prose-reader";
import { ChatReader } from "@/components/story/chat-reader";
import { saveStoryWithChapters } from "@/lib/story-publish";
import { useAuthStore } from "@/store/auth-store";
import type { WizardState } from "./state";
import { toast } from "@/components/ui/toast";

interface Props {
  state: WizardState;
  onBack: () => void;
  onSavedStoryId: (id: string) => void;
  onClearDraft: () => void;
}

export function ReviewStep({ state, onBack, onSavedStoryId, onClearDraft }: Props) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(asDraft: boolean) {
    if (!user) return;
    setSaving(true);
    try {
      const chapters = Array.from({ length: state.brief.chapterCount }).map((_, i) => {
        const out = state.chapters[i]?.output;
        const dbId = state.chapterDbIds[i];
        if (!out) throw new Error(`Chapter ${i + 1} has no generated content`);
        return {
          title: state.outline[i]?.title ?? `Chapter ${i + 1}`,
          chapterNumber: i + 1,
          proseContent: out.kind === "prose" ? out.content : undefined,
          chatContent:
            out.kind === "chat"
              ? { characters: out.characters!, messages: out.messages! }
              : undefined,
          dbId,
        };
      });

      const { storyId } = await saveStoryWithChapters({
        existingStoryId: state.storyId,
        meta: {
          title: state.brief.title,
          description: state.brief.description,
          categoryId: state.brief.categoryId,
          format: state.brief.format,
          tags: state.brief.themes,
          isGated: false,
          storyPrice: 0,
          visibility: "public",
          passwordHash: null,
          coverImageUrl: coverUrl,
          aiContext: {
            brief: state.brief,
            outline: state.outline,
            toneReferenceText: state.toneReferenceText ?? null,
            chapterMedia: Object.fromEntries(
              Object.entries(state.chapters).map(([idx, d]) => [idx, d.media])
            ),
          },
          aiGenerated: true,
        },
        chapters,
        status: asDraft ? "draft" : "published",
        creatorId: user.id,
      });

      onSavedStoryId(storyId);
      onClearDraft();
      toast("success", asDraft ? "Draft saved" : "Story published!");
      router.push(asDraft ? `/dashboard/stories` : `/dashboard/stories`);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Review</h2>
        <p className="text-sm text-muted">
          Add a cover and publish. You can still edit chapters manually after publishing.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Cover image</label>
        <MediaUpload onUpload={(url) => setCoverUrl(url)} />
        {coverUrl && (
          <img src={coverUrl} alt="Cover" className="w-40 rounded-lg" />
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <Input value={state.brief.title} readOnly />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea value={state.brief.description} readOnly rows={3} />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">
          {state.brief.chapterCount} chapters
        </p>
        {Array.from({ length: state.brief.chapterCount }).map((_, i) => {
          const out = state.chapters[i]?.output;
          return (
            <details key={i} className="border border-border rounded-lg">
              <summary className="px-4 py-3 cursor-pointer text-sm">
                {state.outline[i]?.title ?? `Chapter ${i + 1}`}
                {out ? "" : " — not generated"}
              </summary>
              {out && (
                <div className="px-4 pb-4">
                  {out.kind === "prose" && out.content && (
                    <ProseReader content={out.content as Record<string, unknown>} />
                  )}
                  {out.kind === "chat" && (
                    <ChatReader
                      content={{ characters: out.characters!, messages: out.messages! }}
                    />
                  )}
                </div>
              )}
            </details>
          );
        })}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => save(true)} disabled={saving}>
            Save draft
          </Button>
          <Button onClick={() => save(false)} disabled={saving}>
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}
