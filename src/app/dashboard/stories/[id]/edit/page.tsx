"use client";

import { useState, useCallback, useEffect } from "react";
import {
  BookOpen,
  MessageCircle,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Eye,
  Save,
  Send,
  Calendar,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { cn, generateId } from "@/lib/utils";
import { CATEGORIES, RELEASE_CADENCES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MediaUpload } from "@/components/editor/media-upload";
import { ProseEditor } from "@/components/editor/prose-editor";
import { ChatEditor } from "@/components/editor/chat-editor";
import { useAuthStore } from "@/store/auth-store";
import {
  getChapters,
  getChapterWithContent,
  updateStory,
  updateChapter as updateChapterDb,
  saveChapterContent,
  createChapter,
} from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/client";
import type { StoryFormat, ChatContent, Story, Chapter } from "@/lib/types";
import type { JSONContent } from "@tiptap/react";
import { toast } from "@/components/ui/toast";

interface ChapterDraft {
  id: string;
  title: string;
  chapterNumber: number;
  status: string;
  isNew?: boolean; // true for chapters added locally that don't exist in DB yet
  proseContent?: JSONContent;
  chatContent?: ChatContent;
}

export default function EditStoryPage() {
  const params = useParams();
  const storyId = params.id as string;
  const router = useRouter();
  useAuthStore(); // ensure auth state is hydrated

  const [loading, setLoading] = useState(true);
  const [storyData, setStoryData] = useState<Story | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Step management
  const [step, setStep] = useState<1 | 2>(2);
  const [showPreview, setShowPreview] = useState(false);

  // Story details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [format, setFormat] = useState<StoryFormat>("prose");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isGated, setIsGated] = useState(false);
  const [storyPrice, setStoryPrice] = useState(0);
  const [, setCoverImageUrl] = useState<string | null>(null);

  // Chapters
  const [chapters, setChapters] = useState<ChapterDraft[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string>("");

  // Schedule
  const [releaseCadence, setReleaseCadence] = useState("3");
  const [startDate, setStartDate] = useState("2026-04-01");

  // Fetch story and chapters from Supabase
  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      // Fetch story
      const { data: story } = await supabase
        .from("stories")
        .select("*, category:categories(*), creator:profiles!creator_id(id, username, display_name, avatar_url)")
        .eq("id", storyId)
        .single();

      if (!story) {
        setLoading(false);
        return;
      }

      setStoryData(story as Story);
      setTitle(story.title);
      setDescription(story.description);
      setCategoryId(story.category_id);
      setFormat(story.format as StoryFormat);
      setIsGated(story.is_gated);
      setStoryPrice(story.price || 0);
      setCoverImageUrl(story.cover_image_url);

      // Fetch tags for this story
      const { data: storyTags } = await supabase
        .from("story_tags")
        .select("tag:tags(name)")
        .eq("story_id", storyId);
      if (storyTags) {
        const tagNames = storyTags
          .map((st: Record<string, unknown>) => {
            const tag = st.tag as { name: string } | null;
            return tag?.name;
          })
          .filter(Boolean) as string[];
        setTags(tagNames);
      }

      // Fetch chapters
      const chaptersData = await getChapters(storyId);

      // Load content for each chapter
      const chapterDrafts: ChapterDraft[] = await Promise.all(
        (chaptersData as Chapter[]).map(async (ch) => {
          const withContent = await getChapterWithContent(storyId, ch.chapter_number);
          const contentJson = (withContent as Record<string, unknown>)?.content
            ? ((withContent as Record<string, unknown>).content as { content_json: unknown })?.content_json
            : undefined;

          const draft: ChapterDraft = {
            id: ch.id,
            title: ch.title,
            chapterNumber: ch.chapter_number,
            status: ch.status,
          };

          if (story.format === "prose" && contentJson) {
            draft.proseContent = contentJson as JSONContent;
          } else if (story.format === "chat" && contentJson) {
            draft.chatContent = contentJson as ChatContent;
          }

          return draft;
        })
      );

      setChapters(chapterDrafts);
      if (chapterDrafts.length > 0) {
        setActiveChapterId(chapterDrafts[0].id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load story data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId]);

  // ---- Tag handling ----

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // ---- Chapter management ----

  const addChapter = () => {
    const newChapter: ChapterDraft = {
      id: generateId(),
      title: `Chapter ${chapters.length + 1}`,
      chapterNumber: chapters.length + 1,
      status: "draft",
      isNew: true,
    };
    setChapters([...chapters, newChapter]);
    setActiveChapterId(newChapter.id);
  };

  const removeChapter = (id: string) => {
    if (chapters.length <= 1) return;
    const updated = chapters
      .filter((c) => c.id !== id)
      .map((c, i) => ({ ...c, chapterNumber: i + 1 }));
    setChapters(updated);
    if (activeChapterId === id) {
      setActiveChapterId(updated[0].id);
    }
  };

  const moveChapter = (id: string, direction: "up" | "down") => {
    const idx = chapters.findIndex((c) => c.id === id);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === chapters.length - 1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const updated = [...chapters];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    setChapters(updated.map((c, i) => ({ ...c, chapterNumber: i + 1 })));
  };

  const updateChapterTitle = (id: string, newTitle: string) => {
    setChapters(
      chapters.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  const activeChapter = chapters.find((c) => c.id === activeChapterId);

  const handleProseChange = useCallback(
    (content: JSONContent) => {
      setChapters((prev) =>
        prev.map((c) =>
          c.id === activeChapterId ? { ...c, proseContent: content } : c
        )
      );
    },
    [activeChapterId]
  );

  const handleChatChange = useCallback(
    (content: ChatContent) => {
      setChapters((prev) =>
        prev.map((c) =>
          c.id === activeChapterId ? { ...c, chatContent: content } : c
        )
      );
    },
    [activeChapterId]
  );

  // ---- Schedule helpers ----

  const computeScheduleDates = (): Map<string, string> => {
    const dates = new Map<string, string>();
    if (!startDate || !releaseCadence) return dates;

    const cadenceDays = parseInt(releaseCadence, 10);
    if (isNaN(cadenceDays) || cadenceDays <= 0) return dates;

    const baseDate = new Date(startDate + "T00:00:00");
    if (isNaN(baseDate.getTime())) return dates;

    for (const ch of chapters) {
      const offset = (ch.chapterNumber - 1) * cadenceDays;
      const publishDate = new Date(baseDate);
      publishDate.setDate(publishDate.getDate() + offset);
      dates.set(ch.id, publishDate.toISOString());
    }
    return dates;
  };

  // ---- Save / Publish handlers ----

  const handleSave = async () => {
    if (!storyId) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      // Update story metadata
      await updateStory(storyId, {
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId || null,
        format,
        is_gated: isGated,
        price: isGated ? storyPrice : 0,
        status: storyData?.status || "draft",
      });

      const scheduleDates = computeScheduleDates();

      // Update each chapter
      for (const ch of chapters) {
        // If this is a newly added chapter without a real DB id, create it
        let chDbId = ch.id;

        if (ch.isNew) {
          try {
            const created = await createChapter({
              story_id: storyId,
              chapter_number: ch.chapterNumber,
              title: ch.title,
              status: "draft",
            });
            if (created) {
              chDbId = created.id;
              // Update the local chapter with the real DB id and clear isNew
              setChapters((prev) =>
                prev.map((c) => (c.id === ch.id ? { ...c, id: created.id, isNew: false } : c))
              );
            }
          } catch {
            // Skip chapter if creation fails
            continue;
          }
        }

        // Update chapter metadata – save schedule dates but keep status as-is
        // (status is only promoted to "scheduled"/"published" via handlePublish)
        const publishAt = scheduleDates.get(ch.id);
        const chapterUpdates: Record<string, unknown> = {
          title: ch.title,
          chapter_number: ch.chapterNumber,
        };
        if (publishAt) {
          chapterUpdates.publish_at = publishAt;
        }

        await updateChapterDb(chDbId, chapterUpdates);

        // Save content
        const content = format === "prose" ? ch.proseContent : ch.chatContent;
        if (content) {
          await saveChapterContent(chDbId, content);
        }
      }

      setSaveSuccess(true);
      toast("success", "Changes saved");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save changes";
      setSaveError(message);
      toast("error", message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!storyId) return;
    setPublishing(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const scheduleDates = computeScheduleDates();
      const now = new Date();

      // Save and schedule/publish each chapter
      for (const ch of chapters) {
        let chDbId = ch.id;

        if (ch.isNew) {
          try {
            const created = await createChapter({
              story_id: storyId,
              chapter_number: ch.chapterNumber,
              title: ch.title,
              status: "draft",
            });
            if (created) {
              chDbId = created.id;
              setChapters((prev) =>
                prev.map((c) => (c.id === ch.id ? { ...c, id: created.id, isNew: false } : c))
              );
            }
          } catch {
            continue;
          }
        }

        // Save content first
        const content = format === "prose" ? ch.proseContent : ch.chatContent;
        if (content) {
          await saveChapterContent(chDbId, content);
        }

        // Update chapter with publish/schedule status
        const publishAt = scheduleDates.get(ch.id);
        if (publishAt && new Date(publishAt) > now) {
          await updateChapterDb(chDbId, {
            title: ch.title,
            chapter_number: ch.chapterNumber,
            status: "scheduled",
            publish_at: publishAt,
          });
        } else {
          await updateChapterDb(chDbId, {
            title: ch.title,
            chapter_number: ch.chapterNumber,
            status: "published",
          });
        }
      }

      // Update story to published
      await updateStory(storyId, {
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId || null,
        format,
        is_gated: isGated,
        price: isGated ? storyPrice : 0,
        status: "published",
      });

      toast("success", "Story published!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to publish";
      setSaveError(message);
      toast("error", message);
    } finally {
      setPublishing(false);
    }
  };

  // ---- Options ----

  const categoryOptions = [
    { value: "", label: "Select a category..." },
    ...CATEGORIES.map((c) => ({ value: c.id, label: c.name })),
  ];

  const cadenceOptions = RELEASE_CADENCES.map((r) => ({
    value: String(r.value),
    label: r.label,
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-danger">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchData();
            }}
            className="text-accent hover:underline cursor-pointer"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!storyData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Story not found</h1>
          <p className="text-muted">
            The story you are trying to edit does not exist.
          </p>
          <Link href="/dashboard">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Edit Story</h1>
              <p className="text-sm text-muted">{title}</p>
            </div>
            {step === 2 && activeChapter && (
              <Badge variant="accent">
                Editing: {activeChapter.title}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {step === 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4" />
                {showPreview ? "Edit" : "Preview"}
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSave}
              disabled={saving || publishing}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
            </Button>
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={saving || publishing}
            >
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {publishing ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>
      </div>

      {/* Save feedback */}
      {saveError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger flex items-center justify-between">
            <span>{saveError}</span>
            <button onClick={() => setSaveError(null)} className="text-danger hover:text-danger/80 cursor-pointer">&times;</button>
          </div>
        </div>
      )}

      {/* Step indicator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setStep(1)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
              step === 1
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground border border-border"
            )}
          >
            <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
              1
            </span>
            Story Details
          </button>
          <div className="h-px w-8 bg-border" />
          <button
            onClick={() => setStep(2)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
              step === 2
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground border border-border"
            )}
          >
            <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
              2
            </span>
            Write Content
          </button>
        </div>

        {/* Step 1: Story Details */}
        {step === 1 && (
          <div className="max-w-2xl space-y-6">
            <Input
              label="Title"
              id="title"
              placeholder="Enter your story title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <Textarea
              label="Description"
              id="description"
              placeholder="Write a captivating description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />

            <Select
              label="Category"
              id="category"
              options={categoryOptions}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            />

            {/* Format (read-only for existing stories) */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Story Format
              </label>
              <div className="flex gap-3">
                <div
                  className={cn(
                    "flex-1 flex items-center gap-3 rounded-lg border-2 p-4",
                    format === "prose"
                      ? "border-accent bg-accent/5"
                      : "border-border opacity-50"
                  )}
                >
                  <BookOpen
                    className={cn(
                      "h-6 w-6",
                      format === "prose" ? "text-accent" : "text-muted"
                    )}
                  />
                  <div className="text-left">
                    <p className="text-sm font-medium">Illustrated Story</p>
                    <p className="text-xs text-muted">
                      Story with images and GIFs
                    </p>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex-1 flex items-center gap-3 rounded-lg border-2 p-4",
                    format === "chat"
                      ? "border-accent bg-accent/5"
                      : "border-border opacity-50"
                  )}
                >
                  <MessageCircle
                    className={cn(
                      "h-6 w-6",
                      format === "chat" ? "text-accent" : "text-muted"
                    )}
                  />
                  <div className="text-left">
                    <p className="text-sm font-medium">Sext Story</p>
                    <p className="text-xs text-muted">
                      Texting/messaging style with images
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted">
                Format cannot be changed after creation
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Tags
              </label>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add a tag and press Enter..."
                  className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                />
                <Button
                  variant="secondary"
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                >
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1.5 text-muted hover:text-foreground cursor-pointer"
                      >
                        <span className="sr-only">Remove {tag}</span>
                        &times;
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted">{tags.length}/10 tags</p>
            </div>

            {/* Gated toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-medium">Gated Content</p>
                  <p className="text-xs text-muted">
                    Require a subscription to read this story
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGated(!isGated)}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors cursor-pointer",
                    isGated ? "bg-accent" : "bg-border"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                      isGated && "translate-x-5"
                    )}
                  />
                </button>
              </div>

              {isGated && (
                <div>
                  <Input
                    id="story-price"
                    label="Unlock Price ($)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={String(storyPrice)}
                    onChange={(e) => setStoryPrice(parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted mt-1">Readers pay this to unlock all chapters. Set to 0 for free.</p>
                </div>
              )}
            </div>

            {/* Cover image */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Cover Image
              </label>
              <MediaUpload
                accept="image/*"
                maxSize={10 * 1024 * 1024}
                onUpload={(url) => setCoverImageUrl(url)}
              />
            </div>

            <Button
              onClick={() => setStep(2)}
              className="w-full"
              size="lg"
            >
              Continue to Editor
            </Button>
          </div>
        )}

        {/* Step 2: Editor */}
        {step === 2 && (
          <div className="flex gap-6">
            {/* Chapter sidebar */}
            <div className="w-64 shrink-0">
              <div className="sticky top-4 space-y-4">
                {/* Chapter list */}
                <div className="rounded-lg border border-border bg-surface p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Chapters</h3>
                    <Button size="sm" variant="ghost" onClick={addChapter}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1 max-h-[500px] overflow-y-auto">
                    {chapters.map((ch, idx) => (
                      <div
                        key={ch.id}
                        className={cn(
                          "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer",
                          activeChapterId === ch.id
                            ? "bg-accent/10 text-accent font-medium"
                            : "text-foreground hover:bg-surface-hover"
                        )}
                        onClick={() => setActiveChapterId(ch.id)}
                      >
                        <GripVertical className="h-3.5 w-3.5 text-muted shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="block truncate">
                            {ch.chapterNumber}. {ch.title}
                          </span>
                          <span
                            className={cn(
                              "text-[10px]",
                              ch.status === "published"
                                ? "text-success"
                                : ch.status === "scheduled"
                                ? "text-accent"
                                : "text-muted"
                            )}
                          >
                            {ch.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveChapter(ch.id, "up");
                            }}
                            disabled={idx === 0}
                            className="text-muted hover:text-foreground disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveChapter(ch.id, "down");
                            }}
                            disabled={idx === chapters.length - 1}
                            className="text-muted hover:text-foreground disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeChapter(ch.id);
                            }}
                            disabled={chapters.length <= 1}
                            className="text-muted hover:text-danger disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Schedule settings */}
                <div className="rounded-lg border border-border bg-surface p-3 space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule
                  </h3>
                  <Select
                    label="Release Cadence"
                    id="cadence"
                    options={cadenceOptions}
                    value={releaseCadence}
                    onChange={(e) => setReleaseCadence(e.target.value)}
                  />
                  <Input
                    label="Start Date"
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  {startDate && releaseCadence && (
                    <div className="space-y-1 pt-1">
                      <p className="text-xs font-medium text-muted">Preview</p>
                      {chapters.map((ch) => {
                        const cadenceDays = parseInt(releaseCadence, 10);
                        const offset = (ch.chapterNumber - 1) * cadenceDays;
                        const d = new Date(startDate + "T00:00:00");
                        d.setDate(d.getDate() + offset);
                        return (
                          <p key={ch.id} className="text-xs text-muted truncate">
                            Ch {ch.chapterNumber}: {d.toLocaleDateString()}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main editor area */}
            <div className="flex-1 min-w-0">
              {activeChapter && (
                <div className="space-y-4">
                  {/* Chapter title */}
                  <Input
                    placeholder="Chapter title..."
                    value={activeChapter.title}
                    onChange={(e) =>
                      updateChapterTitle(activeChapter.id, e.target.value)
                    }
                    className="text-lg font-semibold"
                  />

                  {/* Editor or Preview */}
                  {showPreview ? (
                    <div className="rounded-lg border border-border bg-surface p-8">
                      <h2 className="text-2xl font-bold mb-6">
                        {activeChapter.title}
                      </h2>
                      {format === "prose" ? (
                        <div className="story-prose">
                          {activeChapter.proseContent ? (
                            <ProsePreview content={activeChapter.proseContent} />
                          ) : (
                            <p className="text-muted italic">
                              No content yet. Switch to edit mode to start
                              writing.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 max-w-lg mx-auto">
                          {activeChapter.chatContent?.messages.map((msg) => {
                            const char =
                              activeChapter.chatContent?.characters.find(
                                (c) => c.id === msg.character_id
                              );
                            const isRight = char?.alignment === "right";
                            return (
                              <div
                                key={msg.id}
                                className={cn(
                                  "flex flex-col max-w-[80%]",
                                  isRight ? "ml-auto items-end" : "items-start"
                                )}
                              >
                                <span className="text-xs text-muted mb-1 px-1">
                                  {char?.name}
                                </span>
                                <div
                                  className={cn(
                                    "px-4 py-2.5 rounded-2xl text-sm leading-relaxed text-white",
                                    isRight
                                      ? "rounded-br-md"
                                      : "rounded-bl-md"
                                  )}
                                  style={{
                                    backgroundColor: char?.color || "#666",
                                  }}
                                >
                                  {msg.text}
                                </div>
                              </div>
                            );
                          })}
                          {(!activeChapter.chatContent ||
                            activeChapter.chatContent.messages.length ===
                              0) && (
                            <p className="text-muted italic text-center py-8">
                              No messages yet. Switch to edit mode to add
                              content.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : format === "prose" ? (
                    <ProseEditor
                      key={activeChapter.id}
                      initialContent={activeChapter.proseContent}
                      onChange={handleProseChange}
                    />
                  ) : (
                    <ChatEditor
                      key={activeChapter.id}
                      initialContent={activeChapter.chatContent}
                      onChange={handleChatChange}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Simple prose preview that renders TipTap JSON to HTML-like elements */
function ProsePreview({ content }: { content: JSONContent }) {
  const renderNode = (node: JSONContent, idx: number): React.ReactNode => {
    if (node.type === "doc") {
      return (
        <div key={idx}>
          {node.content?.map((child, i) => renderNode(child, i))}
        </div>
      );
    }

    if (node.type === "paragraph") {
      return (
        <p key={idx}>
          {node.content?.map((child, i) => renderNode(child, i)) || <br />}
        </p>
      );
    }

    if (node.type === "heading") {
      const level = (node.attrs?.level as number) || 2;
      const children = node.content?.map((child, i) => renderNode(child, i));
      const cls = level === 2 ? "text-2xl font-bold mt-8 mb-3" : "text-xl font-semibold mt-6 mb-2";
      if (level === 3) {
        return <h3 key={idx} className={cls}>{children}</h3>;
      }
      return <h2 key={idx} className={cls}>{children}</h2>;
    }

    if (node.type === "horizontalRule") {
      return <hr key={idx} />;
    }

    if (node.type === "image") {
      return (
        <img
          key={idx}
          src={node.attrs?.src as string}
          alt={(node.attrs?.alt as string) || ""}
          className="max-w-full rounded-lg my-4"
        />
      );
    }

    if (node.type === "text") {
      let element: React.ReactNode = node.text || "";
      if (node.marks) {
        for (const mark of node.marks) {
          if (mark.type === "bold") {
            element = <strong key={idx}>{element}</strong>;
          }
          if (mark.type === "italic") {
            element = <em key={idx}>{element}</em>;
          }
        }
      }
      return element;
    }

    return null;
  };

  return <>{renderNode(content, 0)}</>;
}
