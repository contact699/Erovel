"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  createStory,
  createChapter,
  saveChapterContent,
  updateStory,
  updateChapter,
  deleteStory,
  generateSlug,
} from "@/lib/supabase/queries";
import type { StoryFormat, ChatContent } from "@/lib/types";
import type { JSONContent } from "@tiptap/react";
import { toast } from "@/components/ui/toast";

interface ChapterDraft {
  id: string;
  dbId?: string; // Supabase chapter ID once persisted
  title: string;
  chapterNumber: number;
  proseContent?: JSONContent;
  chatContent?: ChatContent;
  publishAt?: string; // ISO timestamp for scheduled publish
}

export default function NewStoryPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Step management
  const [step, setStep] = useState<1 | 2>(1);
  const [showPreview, setShowPreview] = useState(false);

  // Story details (Step 1)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [format, setFormat] = useState<StoryFormat>("prose");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isGated, setIsGated] = useState(false);
  const [storyPrice, setStoryPrice] = useState(0);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  // DB-persisted story ID (set after first save)
  const [storyId, setStoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Chapters (Step 2)
  const [chapters, setChapters] = useState<ChapterDraft[]>([
    { id: generateId(), title: "Chapter 1", chapterNumber: 1 },
  ]);
  const [activeChapterId, setActiveChapterId] = useState<string>(
    chapters[0]?.id || ""
  );

  // Schedule
  const [releaseCadence, setReleaseCadence] = useState("7");
  const [startDate, setStartDate] = useState("");

  // ── Tag handling ──

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

  // ── Chapter management ──

  const addChapter = async () => {
    const newChapter: ChapterDraft = {
      id: generateId(),
      title: `Chapter ${chapters.length + 1}`,
      chapterNumber: chapters.length + 1,
    };

    // If story is already saved, create chapter in DB
    if (storyId) {
      try {
        const created = await createChapter({
          story_id: storyId,
          chapter_number: newChapter.chapterNumber,
          title: newChapter.title,
          status: "draft",
        });
        if (created) {
          newChapter.dbId = created.id;
        }
      } catch {
        // Chapter still added locally; will be persisted on next save
      }
    }

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

  // ── Save / Publish handlers ──

  const handleCreateStoryAndProceed = async () => {
    if (!user || !title.trim()) return;
    setSaving(true);
    try {
      const story = await createStory({
        creator_id: user.id,
        title: title.trim(),
        slug: generateSlug(title.trim()),
        description: description.trim(),
        format,
        category_id: categoryId || null!,
        status: "draft",
        is_gated: isGated,
        price: isGated ? storyPrice : 0,
        cover_image_url: coverImageUrl || undefined,
      });
      if (!story) throw new Error("Failed to create story");

      // Create the first chapter in DB
      const ch = await createChapter({
        story_id: story.id,
        chapter_number: 1,
        title: chapters[0].title,
        status: "draft",
      });
      if (!ch) {
        // Rollback: delete the orphaned story
        await deleteStory(story.id);
        throw new Error("Failed to create chapter");
      }

      setStoryId(story.id);
      setChapters((prev) =>
        prev.map((c, i) => (i === 0 ? { ...c, dbId: ch.id } : c))
      );

      setStep(2);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create story";
      toast("error", message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!storyId) return;
    setSaving(true);
    try {
      // Ensure all chapters exist in DB and save their content
      for (const ch of chapters) {
        let dbId = ch.dbId;

        // Create chapter in DB if it doesn't have a dbId yet
        if (!dbId) {
          const created = await createChapter({
            story_id: storyId,
            chapter_number: ch.chapterNumber,
            title: ch.title,
            status: "draft",
          });
          if (created) {
            dbId = created.id;
            setChapters((prev) =>
              prev.map((c) => (c.id === ch.id ? { ...c, dbId: created.id } : c))
            );
          }
        }

        if (dbId) {
          // Update chapter title / number, keeping status as draft
          await updateChapter(dbId, {
            title: ch.title,
            chapter_number: ch.chapterNumber,
            status: "draft",
          });

          // Save content
          const content = format === "prose" ? ch.proseContent : ch.chatContent;
          if (content) {
            await saveChapterContent(dbId, content);
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save draft";
      toast("error", message);
    } finally {
      setSaving(false);
    }
  };

  const computeScheduleDates = (): Map<string, string> => {
    const dates = new Map<string, string>();
    if (!startDate || !releaseCadence) return dates;

    const cadenceDays = parseInt(releaseCadence, 10);
    if (isNaN(cadenceDays) || cadenceDays <= 0) return dates;

    const baseDate = new Date(startDate + "T00:00:00");
    if (isNaN(baseDate.getTime())) return dates;

    for (const ch of chapters) {
      // Chapter 1 publishes on startDate, chapter 2 on startDate + cadence, etc.
      const offset = (ch.chapterNumber - 1) * cadenceDays;
      const publishDate = new Date(baseDate);
      publishDate.setDate(publishDate.getDate() + offset);
      dates.set(ch.id, publishDate.toISOString());
    }
    return dates;
  };

  const handlePublish = async (asDraft = false) => {
    if (!storyId) return;
    setPublishing(true);
    try {
      // Save all chapter content first
      await handleSaveDraft();

      if (asDraft) {
        // Save as Draft: all chapters stay as "draft", story stays as "draft"
        for (const ch of chapters) {
          if (ch.dbId) {
            await updateChapter(ch.dbId, { status: "draft" });
          }
        }
        await updateStory(storyId, { status: "draft" });
        toast("success", "Draft saved!");
      } else {
        // Publish: set chapters to published or scheduled based on schedule dates
        const scheduleDates = computeScheduleDates();
        const now = new Date();

        for (const ch of chapters) {
          if (ch.dbId) {
            const publishAt = scheduleDates.get(ch.id);
            if (publishAt && new Date(publishAt) > now) {
              // Future date — schedule the chapter
              await updateChapter(ch.dbId, {
                status: "scheduled",
                publish_at: publishAt,
              });
            } else {
              // No schedule or date is in the past — publish immediately
              await updateChapter(ch.dbId, { status: "published" });
            }
          }
        }

        // Set story to published
        await updateStory(storyId, { status: "published" });
        toast("success", "Story published!");
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to publish";
      toast("error", message);
    } finally {
      setPublishing(false);
    }
  };

  // ── Category options ──

  const categoryOptions = [
    { value: "", label: "Select a category..." },
    ...CATEGORIES.map((c) => ({ value: c.id, label: c.name })),
  ];

  const cadenceOptions = RELEASE_CADENCES.map((r) => ({
    value: String(r.value),
    label: r.label,
  }));

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
            <h1 className="text-xl font-bold">Create New Story</h1>
            {step === 2 && (
              <Badge variant="accent">
                Editing: {activeChapter?.title || ""}
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
              onClick={handleSaveDraft}
              disabled={saving || !storyId}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              size="sm"
              onClick={() => handlePublish(false)}
              disabled={publishing || !storyId || !user?.is_verified}
            >
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {publishing ? "Publishing..." : "Publish"}
            </Button>
          </div>
          {user && !user.is_verified && (
            <p className="text-xs text-danger">You must verify your identity before publishing.</p>
          )}
        </div>
      </div>

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
            onClick={() => {
              if (storyId && title.trim()) setStep(2);
            }}
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

            {/* Format selection */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Story Format
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormat("prose")}
                  className={cn(
                    "flex-1 flex items-center gap-3 rounded-lg border-2 p-4 transition-all cursor-pointer",
                    format === "prose"
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/30"
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
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("chat")}
                  className={cn(
                    "flex-1 flex items-center gap-3 rounded-lg border-2 p-4 transition-all cursor-pointer",
                    format === "chat"
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/30"
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
                </button>
              </div>
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
                <Button variant="secondary" onClick={addTag} disabled={!tagInput.trim()}>
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
                <Input
                  label="Unlock Price ($) — set to 0 for subscription-only"
                  id="story_price"
                  type="number"
                  value={String(storyPrice)}
                  onChange={(e) => setStoryPrice(Number(e.target.value))}
                  placeholder="0.00"
                />
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
              onClick={handleCreateStoryAndProceed}
              disabled={!title.trim() || saving || !user}
              className="w-full"
              size="lg"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating Story...</>
              ) : (
                "Continue to Editor"
              )}
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
                  <div className="space-y-1">
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
                        <span className="flex-1 truncate">
                          {ch.chapterNumber}. {ch.title}
                        </span>
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
                          <p className="text-muted italic">
                            Preview of formatted prose content will appear here
                            once you write something in the editor.
                          </p>
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
                            activeChapter.chatContent.messages.length === 0) && (
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
