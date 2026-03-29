"use client";

import { useState, useCallback, useMemo } from "react";
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
import { mockStories, mockChapters, mockChatContent } from "@/lib/mock-data";
import type { StoryFormat, ChatContent } from "@/lib/types";
import type { JSONContent } from "@tiptap/react";

interface ChapterDraft {
  id: string;
  title: string;
  chapterNumber: number;
  proseContent?: JSONContent;
  chatContent?: ChatContent;
}

// Load mock data for the first story
const mockStory = mockStories[0];
const storyChapters = mockChapters.filter(
  (c) => c.story_id === mockStory.id
);

// Demo prose content for the first chapter
const demoProse: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "The Proposal" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "The conference room smelled of expensive coffee and tension. Claire adjusted her blazer for the third time, watching the city lights blink far below through floor-to-ceiling windows.",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: '"You\'re staring," said a voice behind her. ' },
        {
          type: "text",
          marks: [{ type: "italic" }],
          text: "His",
        },
        {
          type: "text",
          text: " voice. The one she'd been trying not to think about for the past six months.",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "She turned slowly, and there he was. Marcus Cole. Tailored suit, crooked smile, and those eyes that made every business meeting feel like a private conversation.",
        },
      ],
    },
    { type: "horizontalRule" },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: '"I have a proposition," he said, sliding a folder across the mahogany table. "One that benefits us both."',
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Claire raised an eyebrow but reached for it. Their fingers brushed. Neither pulled away.",
        },
      ],
    },
  ],
};

export default function EditStoryPage() {
  // Step management
  const [step, setStep] = useState<1 | 2>(2);
  const [showPreview, setShowPreview] = useState(false);

  // Story details (pre-populated from mock)
  const [title, setTitle] = useState(mockStory.title);
  const [description, setDescription] = useState(mockStory.description);
  const [categoryId, setCategoryId] = useState(mockStory.category_id);
  const [format] = useState<StoryFormat>(mockStory.format);
  const [tags, setTags] = useState<string[]>(
    mockStory.tags.map((t) => t.name)
  );
  const [tagInput, setTagInput] = useState("");
  const [isGated, setIsGated] = useState(mockStory.is_gated);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    mockStory.cover_image_url
  );

  // Chapters (pre-populated from mock)
  const initialChapters: ChapterDraft[] = useMemo(
    () =>
      storyChapters.map((ch, i) => ({
        id: ch.id,
        title: ch.title,
        chapterNumber: ch.chapter_number,
        proseContent: i === 0 ? demoProse : undefined,
      })),
    []
  );

  const [chapters, setChapters] = useState<ChapterDraft[]>(initialChapters);
  const [activeChapterId, setActiveChapterId] = useState<string>(
    chapters[0]?.id || ""
  );

  // Schedule
  const [releaseCadence, setReleaseCadence] = useState("3");
  const [startDate, setStartDate] = useState("2026-04-01");

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

  const addChapter = () => {
    const newChapter: ChapterDraft = {
      id: generateId(),
      title: `Chapter ${chapters.length + 1}`,
      chapterNumber: chapters.length + 1,
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

  // ── Options ──

  const categoryOptions = [
    { value: "", label: "Select a category..." },
    ...CATEGORIES.map((c) => ({ value: c.id, label: c.name })),
  ];

  const cadenceOptions = RELEASE_CADENCES.map((r) => ({
    value: String(r.value),
    label: r.label,
  }));

  // Find chapter status from mock data
  const getChapterStatus = (id: string) => {
    const ch = mockChapters.find((c) => c.id === id);
    return ch?.status || "draft";
  };

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
            <Button variant="secondary" size="sm">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
            <Button size="sm">
              <Send className="h-4 w-4" />
              Update
            </Button>
          </div>
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
                    <p className="text-sm font-medium">Prose</p>
                    <p className="text-xs text-muted">
                      Traditional narrative with rich text formatting
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
                    <p className="text-sm font-medium">Chat</p>
                    <p className="text-xs text-muted">
                      Message bubbles between characters
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
                    {chapters.map((ch, idx) => {
                      const status = getChapterStatus(ch.id);
                      return (
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
                                status === "published"
                                  ? "text-success"
                                  : status === "scheduled"
                                  ? "text-accent"
                                  : "text-muted"
                              )}
                            >
                              {status}
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
                      );
                    })}
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
        // eslint-disable-next-line @next/next/no-img-element
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
