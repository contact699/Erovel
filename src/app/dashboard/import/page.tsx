"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { StoryFormat } from "@/lib/types";
import { toast } from "@/components/ui/toast";
import { useAuthStore } from "@/store/auth-store";
import {
  createStory,
  createChapter,
  saveChapterContent,
  deleteStory,
  generateSlug,
} from "@/lib/supabase/queries";
import {
  Download,
  CheckCircle,
  ArrowRight,
  Upload,
  AlertCircle,
  X,
  Loader2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  ArrowDownUp,
  Trash2,
  FileText,
  Eye,
} from "lucide-react";

type ImportStep = "input" | "chapters" | "review";

interface ImportMedia {
  id: string;
  url: string;
  description: string | null;
  position: number;
  type: "image" | "video";
  selected: boolean;
}

interface ChapterImport {
  id: string;
  title: string;
  galleryId: string;
  images: ImportMedia[];
  expanded: boolean;
  loading: boolean;
  error: string;
}

type MediaItem = Omit<ImportMedia, "selected">;

export default function ImportPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [step, setStep] = useState<ImportStep>("input");
  const [urlsText, setUrlsText] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [storyDescription, setStoryDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [format, setFormat] = useState<StoryFormat>("gallery");
  const [isGated, setIsGated] = useState(false);
  const [storyPrice, setStoryPrice] = useState(0);

  const [chapters, setChapters] = useState<ChapterImport[]>([]);
  const [fetchingAll, setFetchingAll] = useState(false);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [rehostProgress, setRehostProgress] = useState({ current: 0, total: 0, failed: 0 });
  const [rehosting, setRehosting] = useState(false);

  // Drag state
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  async function rehostImage(url: string): Promise<string> {
    const res = await fetch("/api/rehost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (res.status === 403) {
      const data = await res.json();
      throw new Error(`blocked:${data.reason || "Content blocked by moderation"}`);
    }

    if (!res.ok) {
      throw new Error("rehost_failed");
    }

    const data = await res.json();
    return data.cdnUrl;
  }

  async function rehostAllImages(chaptersToRehost: ChapterImport[]): Promise<ChapterImport[]> {
    const updated = chaptersToRehost.map((ch) => ({
      ...ch,
      images: ch.images.map((img) => ({ ...img })),
    }));

    // Count total selected images
    let total = 0;
    for (const ch of updated) {
      for (const img of ch.images) {
        if (img.selected) total++;
      }
    }

    setRehostProgress({ current: 0, total, failed: 0 });
    setRehosting(true);

    let current = 0;
    let failed = 0;

    for (const ch of updated) {
      for (const img of ch.images) {
        if (!img.selected) continue;

        try {
          const cdnUrl = await rehostImage(img.url);
          img.url = cdnUrl;
        } catch (err: unknown) {
          const msg =
            err && typeof err === "object" && "message" in err
              ? String((err as { message: string }).message)
              : "";

          if (msg.startsWith("blocked:")) {
            img.selected = false;
            toast("error", `Image blocked: ${msg.slice(8)}`);
          } else {
            failed++;
            // Keep original URL as fallback
          }
        }

        current++;
        setRehostProgress({ current, total, failed });
      }
    }

    setRehosting(false);
    return updated;
  }

  const parseUrls = useCallback(() => {
    return urlsText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.match(/imgchest\.com\/p\//));
  }, [urlsText]);

  async function fetchGallery(
    url: string
  ): Promise<{ id: string; title: string; images: MediaItem[] } | null> {
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) return null;
    return res.json();
  }

  async function handleImportAll() {
    const urls = parseUrls();
    if (urls.length === 0) return;

    setFetchingAll(true);
    setError("");

    // Create placeholder chapters
    const placeholders: ChapterImport[] = urls.map((url, i) => ({
      id: `ch-${i}-${Date.now()}`,
      title: `Chapter ${i + 1}`,
      galleryId: "",
      images: [],
      expanded: false,
      loading: true,
      error: "",
    }));
    setChapters(placeholders);
    setStep("chapters");

    // Fetch all in parallel
    const results = await Promise.allSettled(urls.map((url) => fetchGallery(url)));

    const updated = placeholders.map((ch, i) => {
      const result = results[i];
      if (result.status === "fulfilled" && result.value) {
        const data = result.value;
        return {
          ...ch,
          title: data.title || `Chapter ${i + 1}`,
          galleryId: data.id,
          images: data.images.map((img: MediaItem) => ({ ...img, selected: true })),
          loading: false,
        };
      }
      return {
        ...ch,
        loading: false,
        error: "Failed to load gallery",
      };
    });

    setChapters(updated);

    // Auto-set story title from first chapter if not set
    if (!storyTitle) {
      const firstTitle = updated[0]?.title || "";
      // Try to extract series name (remove "Part X", "Ch. X", etc.)
      const seriesName = firstTitle.replace(/\s*[-–—]\s*(part|ch\.?|chapter)\s*\d+.*/i, "").trim();
      setStoryTitle(seriesName || firstTitle);
    }

    setFetchingAll(false);
  }

  function toggleChapterImage(chapterId: string, imageId: string) {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === chapterId
          ? {
              ...ch,
              images: ch.images.map((img) =>
                img.id === imageId ? { ...img, selected: !img.selected } : img
              ),
            }
          : ch
      )
    );
  }

  function toggleChapterExpanded(chapterId: string) {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === chapterId ? { ...ch, expanded: !ch.expanded } : ch
      )
    );
  }

  function removeChapter(chapterId: string) {
    setChapters((prev) => prev.filter((ch) => ch.id !== chapterId));
  }

  function renameChapter(chapterId: string, title: string) {
    setChapters((prev) =>
      prev.map((ch) => (ch.id === chapterId ? { ...ch, title } : ch))
    );
  }

  function reverseChapters() {
    setChapters((prev) => [...prev].reverse());
  }

  function handleDragStart(idx: number) {
    setDragIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setChapters((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIdx, 1);
      updated.splice(idx, 0, moved);
      return updated;
    });
    setDragIdx(idx);
  }

  function handleDragEnd() {
    setDragIdx(null);
  }

  function totalSelectedImages() {
    return chapters.reduce(
      (sum, ch) => sum + ch.images.filter((img) => img.selected).length,
      0
    );
  }

  function buildChapterContent(images: ImportMedia[]) {
    const selected = images.filter((img) => img.selected);

    if (format === "chat" || format === "gallery") {
      const characters = [
        { id: "char-1", name: "Character 1", color: "#3B82F6", alignment: "left" as const },
        { id: "char-2", name: "Character 2", color: "#10B981", alignment: "right" as const },
      ];
      const messages = selected.map((media, i) => ({
        id: `msg-${i}`,
        character_id: i % 2 === 0 ? "char-1" : "char-2",
        text: media.description || "",
        media_url: media.url,
        media_type: media.type,
      }));
      return { characters, messages };
    }

    const content: Array<Record<string, unknown>> = [];
    for (const media of selected) {
      if (media.type === "video") {
        content.push({
          type: "paragraph",
          content: [{ type: "text", text: `[Video: ${media.url}]` }],
        });
      } else {
        content.push({
          type: "image",
          attrs: { src: media.url, alt: media.description || "" },
        });
      }
      if (media.description) {
        content.push({
          type: "paragraph",
          content: [{ type: "text", text: media.description }],
        });
      }
    }
    return { type: "doc", content };
  }

  async function handlePublish(asDraft: boolean) {
    if (!user || chapters.length === 0) return;
    setPublishing(true);
    setError("");

    try {
      const { createClient: getClient } = await import("@/lib/supabase/client");
      const supabase = getClient();
      if (supabase) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setError("Session expired. Please log in again.");
          setPublishing(false);
          return;
        }
      }

      const validChapters = chapters.filter(
        (ch) => !ch.error && ch.images.some((img) => img.selected)
      );

      if (validChapters.length === 0) {
        setError("No chapters with selected images.");
        setPublishing(false);
        return;
      }

      // Re-host images to BunnyCDN
      const rehostedChapters = await rehostAllImages(validChapters);

      // Re-filter after rehosting (some images may have been deselected due to moderation)
      const finalChapters = rehostedChapters.filter(
        (ch) => !ch.error && ch.images.some((img) => img.selected)
      );

      if (finalChapters.length === 0) {
        setError("No chapters with selected images after moderation.");
        setPublishing(false);
        return;
      }

      const totalImages = finalChapters.reduce(
        (sum, ch) => sum + ch.images.filter((img) => img.selected).length,
        0
      );

      const firstImage = finalChapters[0]?.images.find((img) => img.selected && img.type === "image");

      const story = await createStory({
        creator_id: user.id,
        title: storyTitle || "Untitled Story",
        slug: generateSlug(storyTitle || "untitled-story"),
        description:
          storyDescription ||
          `Imported from imgchest (${finalChapters.length} chapters, ${totalImages} images)`,
        format,
        category_id: category,
        status: asDraft ? "draft" : "published",
        is_gated: isGated,
        price: isGated ? storyPrice : 0,
        cover_image_url: firstImage?.url,
      });

      if (!story) throw new Error("Failed to create story");

      // Create all chapters — rollback story on failure
      try {
        for (let i = 0; i < finalChapters.length; i++) {
          const ch = finalChapters[i];
          const chapter = await createChapter({
            story_id: story.id,
            chapter_number: i + 1,
            title: ch.title,
            status: asDraft ? "draft" : "published",
          });

          if (!chapter) throw new Error(`Failed to create chapter ${i + 1}`);

          const contentJson = buildChapterContent(ch.images);
          await saveChapterContent(chapter.id, contentJson);
        }
      } catch (chapterErr) {
        // Rollback: delete the orphaned story
        await deleteStory(story.id).catch(() => {});
        throw chapterErr;
      }

      setPublishing(false);
      setPublished(true);
      toast("success", `Story created with ${finalChapters.length} chapters!`);

      setTimeout(() => {
        router.push("/dashboard/stories");
      }, 1500);
    } catch (err: unknown) {
      setPublishing(false);
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to create story";
      setError(msg);
      toast("error", msg);
    }
  }

  function handleReset() {
    setStep("input");
    setUrlsText("");
    setStoryTitle("");
    setStoryDescription("");
    setIsGated(false);
    setStoryPrice(0);
    setChapters([]);
    setError("");
    setPublished(false);
  }

  const validUrls = parseUrls();

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Import from imgchest</h1>
        <p className="text-muted mt-1">
          Import one or multiple imgchest galleries as chapters of a story.
          Paste URLs (one per line), review and reorder chapters, then publish.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {(["input", "chapters", "review"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <ArrowRight size={14} className="text-muted" />}
            <button
              onClick={() => {
                if (s === "input") handleReset();
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                step === s
                  ? "bg-accent text-white"
                  : "bg-surface-hover text-muted"
              }`}
            >
              {i + 1}.{" "}
              {s === "input" ? "Setup" : s === "chapters" ? "Chapters" : "Review"}
            </button>
          </div>
        ))}
      </div>

      {/* Step 1: Input */}
      {step === "input" && (
        <div className="space-y-6">
          {/* Story details */}
          <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <FileText size={20} className="text-accent" />
              </div>
              <div>
                <h2 className="font-semibold">Story Details</h2>
                <p className="text-xs text-muted">
                  These can be changed later
                </p>
              </div>
            </div>

            <Input
              id="story-title"
              label="Title (optional — auto-detected from gallery)"
              placeholder="My Story Title"
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
            />

            <Input
              id="story-description"
              label="Description (optional)"
              placeholder="Brief description..."
              value={storyDescription}
              onChange={(e) => setStoryDescription(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Format"
                id="import-format"
                options={[
                  { value: "gallery", label: "Gallery \u2014 Images displayed vertically, no chat bubbles" },
                  { value: "chat", label: "Sext Story \u2014 Texting style with images" },
                  { value: "prose", label: "Illustrated Story \u2014 Story with images and GIFs" },
                ]}
                value={format}
                onChange={(e) => setFormat(e.target.value as StoryFormat)}
              />
              <Select
                label="Category"
                id="import-category"
                options={[
                  { value: "other", label: "Other" },
                  { value: "romance", label: "Romance" },
                  { value: "fantasy", label: "Fantasy" },
                  { value: "bdsm", label: "BDSM" },
                  { value: "lesbian", label: "Lesbian" },
                  { value: "gay", label: "Gay" },
                  { value: "group", label: "Group" },
                  { value: "mature", label: "Mature" },
                  { value: "taboo", label: "Taboo" },
                  { value: "fetish", label: "Fetish" },
                ]}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            {/* Gated toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Gated Content</p>
                <p className="text-xs text-muted">
                  Require a subscription or payment to read
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsGated(!isGated)}
                className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${
                  isGated ? "bg-accent" : "bg-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    isGated ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>

            {isGated && (
              <Input
                label="Unlock Price ($) — set to 0 for subscription-only"
                id="import_story_price"
                type="number"
                value={String(storyPrice)}
                onChange={(e) => setStoryPrice(Number(e.target.value))}
                placeholder="0.00"
              />
            )}
          </div>

          {/* URLs */}
          <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Download size={20} className="text-accent" />
              </div>
              <div>
                <h2 className="font-semibold">Chapter URLs</h2>
                <p className="text-xs text-muted">
                  Paste imgchest URLs, one per line. Each URL becomes a chapter.
                </p>
              </div>
            </div>

            <Textarea
              id="import-urls"
              placeholder={`https://imgchest.com/p/abc123\nhttps://imgchest.com/p/def456\nhttps://imgchest.com/p/ghi789`}
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
              rows={6}
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">
                {validUrls.length} valid URL{validUrls.length !== 1 ? "s" : ""}{" "}
                detected
              </span>
              <Button
                variant="primary"
                onClick={handleImportAll}
                loading={fetchingAll}
                disabled={validUrls.length === 0}
              >
                <Upload size={16} />
                Import {validUrls.length} Chapter{validUrls.length !== 1 ? "s" : ""}
              </Button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Chapters */}
      {step === "chapters" && (
        <div className="space-y-6">
          {/* Story title (editable) */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <Input
              id="story-title-edit"
              label="Story Title"
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
            />
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted">
              {chapters.filter((ch) => !ch.loading && !ch.error).length} chapters
              &middot; {totalSelectedImages()} images selected
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={reverseChapters}>
                <ArrowDownUp size={14} />
                Reverse Order
              </Button>
            </div>
          </div>

          {/* Chapter list */}
          <div className="space-y-3">
            {chapters.map((ch, idx) => (
              <div
                key={ch.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`bg-surface border rounded-xl overflow-hidden transition-all ${
                  dragIdx === idx
                    ? "border-accent ring-2 ring-accent/30"
                    : "border-border"
                }`}
              >
                {/* Chapter header */}
                <div className="flex items-center gap-3 p-4">
                  <div className="cursor-grab text-muted hover:text-foreground">
                    <GripVertical size={16} />
                  </div>

                  <span className="text-xs text-muted font-mono w-6 shrink-0">
                    {idx + 1}
                  </span>

                  {ch.loading ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Loader2 size={16} className="animate-spin text-accent" />
                      <span className="text-sm text-muted">Loading...</span>
                    </div>
                  ) : ch.error ? (
                    <div className="flex items-center gap-2 flex-1">
                      <AlertCircle size={16} className="text-danger" />
                      <span className="text-sm text-danger">{ch.error}</span>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={ch.title}
                        onChange={(e) => renameChapter(ch.id, e.target.value)}
                        className="flex-1 text-sm font-medium bg-transparent border-none outline-none focus:ring-0 min-w-0"
                      />
                      <span className="text-xs text-muted shrink-0">
                        {ch.images.filter((img) => img.selected).length}/
                        {ch.images.length} images
                      </span>
                    </>
                  )}

                  <div className="flex items-center gap-1 shrink-0">
                    {!ch.loading && !ch.error && (
                      <button
                        onClick={() => toggleChapterExpanded(ch.id)}
                        className="p-1 text-muted hover:text-foreground cursor-pointer"
                      >
                        {ch.expanded ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => removeChapter(ch.id)}
                      className="p-1 text-muted hover:text-danger cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded: image grid */}
                {ch.expanded && !ch.loading && !ch.error && (
                  <div className="border-t border-border p-4">
                    <p className="text-xs text-muted mb-2">
                      Click to deselect images from this chapter.
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {ch.images.map((media) => (
                        <button
                          key={media.id}
                          onClick={() => toggleChapterImage(ch.id, media.id)}
                          className={`relative aspect-square rounded-lg border overflow-hidden transition-all cursor-pointer ${
                            media.selected
                              ? "border-accent ring-1 ring-accent/30"
                              : "border-border opacity-30 grayscale"
                          }`}
                        >
                          {media.type === "video" ? (
                            <video
                              src={media.url}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                            />
                          ) : (
                            <img
                              src={media.url}
                              alt={media.description || ""}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          )}
                          {!media.selected && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <X size={20} className="text-white/70" />
                            </div>
                          )}
                          {media.type === "video" && (
                            <span className="absolute top-0.5 right-0.5 bg-black/60 text-white text-[8px] px-1 rounded">
                              VID
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={handleReset}>
              Back
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setStep("review")}
              disabled={
                chapters.filter(
                  (ch) => !ch.error && ch.images.some((img) => img.selected)
                ).length === 0
              }
            >
              Continue to Review
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === "review" && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Eye size={20} className="text-blue-500" />
              </div>
              <div>
                <h2 className="font-semibold">Review & Publish</h2>
                <p className="text-xs text-muted">
                  {storyTitle || "Untitled Story"} &middot;{" "}
                  {chapters.filter((ch) => !ch.error && ch.images.some((img) => img.selected)).length}{" "}
                  chapters &middot; {totalSelectedImages()} images &middot;{" "}
                  {format === "gallery" ? "Gallery" : format === "prose" ? "Illustrated Story" : "Sext Story"}
                </p>
              </div>
            </div>

            {published ? (
              <div className="text-center py-12 space-y-3">
                <CheckCircle size={40} className="text-success mx-auto" />
                <p className="font-semibold text-lg">Successfully Imported!</p>
                <p className="text-sm text-muted">
                  Your story has been created with{" "}
                  {chapters.filter((ch) => !ch.error).length} chapters and{" "}
                  {totalSelectedImages()} images.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleReset}
                  className="mt-4"
                >
                  Import Another
                </Button>
              </div>
            ) : (
              <>
                {/* Chapter summary list */}
                <div className="border border-border rounded-lg divide-y divide-border mb-6 max-h-[400px] overflow-y-auto">
                  {chapters
                    .filter(
                      (ch) =>
                        !ch.error && ch.images.some((img) => img.selected)
                    )
                    .map((ch, i) => (
                      <div
                        key={ch.id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <span className="text-xs text-muted font-mono w-6">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {ch.title}
                          </p>
                          <p className="text-xs text-muted">
                            {ch.images.filter((img) => img.selected).length}{" "}
                            images
                          </p>
                        </div>
                        {/* First image thumbnail */}
                        {ch.images.find((img) => img.selected) && (
                          <img
                            src={ch.images.find((img) => img.selected)!.url}
                            alt=""
                            className="w-10 h-10 rounded object-cover shrink-0"
                          />
                        )}
                      </div>
                    ))}
                </div>

                {(rehosting || (publishing && rehostProgress.total > 0)) && (
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted">
                      <span>
                        Uploading images to CDN... {rehostProgress.current}/{rehostProgress.total}
                        {rehostProgress.failed > 0 && ` (${rehostProgress.failed} failed)`}
                      </span>
                      <span>
                        {rehostProgress.total > 0
                          ? Math.round((rehostProgress.current / rehostProgress.total) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            rehostProgress.total > 0
                              ? (rehostProgress.current / rehostProgress.total) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-sm text-danger bg-danger/10 rounded-lg px-3 py-2 mb-4">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setStep("chapters")}
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handlePublish(false)}
                    loading={publishing}
                    disabled={!user || !user.is_verified}
                  >
                    <Upload size={14} />
                    Publish All
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePublish(true)}
                    loading={publishing}
                    disabled={!user}
                  >
                    <FileText size={14} />
                    Save as Draft
                  </Button>
                  {user && !user.is_verified && (
                    <p className="text-xs text-danger">You must verify your identity before publishing.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
