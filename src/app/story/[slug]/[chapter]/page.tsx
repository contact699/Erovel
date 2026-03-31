"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TipButton } from "@/components/monetization/tip-button";
import { SubscribeButton } from "@/components/monetization/subscribe-button";
import { ChatReader } from "@/components/story/chat-reader";
import { ProseReader } from "@/components/story/prose-reader";
import { useSubscriptionStore } from "@/store/subscription-store";
import { useAuthStore } from "@/store/auth-store";
import {
  getStoryBySlug,
  getChapterWithContent,
  getChapters,
  recordReading,
  updateBookmarkProgress,
} from "@/lib/supabase/queries";
import type { Story, Chapter, ChatContent } from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  BookMarked,
  List,
  X,
  Lock,
  ArrowLeft,
  Bookmark,
  Loader2,
} from "lucide-react";

export default function ChapterPage() {
  const params = useParams();
  const slug = params.slug as string;
  const chapterNum = parseInt(params.chapter as string, 10);

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapter, setChapter] = useState<(Chapter & { content?: { content_json: unknown } | null }) | null>(null);
  const [loading, setLoading] = useState(true);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const user = useAuthStore((s) => s.user);
  const isContentUnlocked = useSubscriptionStore((s) => s.isContentUnlocked);
  const unlocked = story
    ? isContentUnlocked(story.id, story.creator_id)
    : false;
  const isGatedChapter = story?.is_gated && chapterNum > 2 && !unlocked;

  // Fetch story, chapters, and chapter content
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const storyData = await getStoryBySlug(slug);
        if (storyData) {
          setStory(storyData as Story);
          const [chaptersData, chapterData] = await Promise.all([
            getChapters(storyData.id),
            getChapterWithContent(storyData.id, chapterNum),
          ]);
          setChapters(chaptersData as Chapter[]);
          setChapter(chapterData as (Chapter & { content?: { content_json: unknown } | null }) | null);

          // Record reading and update bookmark progress if user is logged in
          if (user && chapterData) {
            recordReading(user.id, storyData.id, chapterData.id).catch(() => {});
            updateBookmarkProgress(user.id, storyData.id, chapterData.id).catch(() => {});
          }
        }
      } catch {
        // Silently handle errors
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug, chapterNum, user]);

  const isChat = story?.format === "chat";

  const prevChapter = chapters.find(
    (ch) => ch.chapter_number === chapterNum - 1 && ch.status === "published"
  );
  const nextChapter = chapters.find(
    (ch) => ch.chapter_number === chapterNum + 1 && ch.status === "published"
  );

  // Scroll progress tracking
  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    setScrollProgress(Math.min(progress, 100));
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Close sidebar on escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!story || !chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Chapter not found</h1>
          <p className="text-muted">
            This chapter does not exist or has not been published yet.
          </p>
          <Link href={story ? `/story/${story.slug}` : "/"}>
            <Button variant="secondary">
              {story ? "Back to Story" : "Back to Home"}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Extract content from the chapter_content join
  const contentJson = chapter.content?.content_json;
  const chatContent = isChat && contentJson ? (contentJson as ChatContent) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* ---- Reading progress bar ---- */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-border">
        <div
          className="h-full bg-accent transition-[width] duration-100 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* ---- Top navigation bar ---- */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href={`/story/${story.slug}`}
            className="text-muted hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted truncate">{story.title}</p>
            <p className="text-sm font-medium truncate">
              Ch. {chapter.chapter_number}: {chapter.title}
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-muted hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-surface-hover shrink-0"
            title="Chapter list"
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {/* ---- Chapter header ---- */}
      <div className="max-w-3xl mx-auto px-4 pt-10 pb-4 text-center">
        <p className="text-sm text-accent font-medium uppercase tracking-wider">
          Chapter {chapter.chapter_number}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-2">
          {chapter.title}
        </h1>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Badge variant={isChat ? "accent" : "default"}>
            {isChat ? "Chat Format" : "Prose"}
          </Badge>
          {isGatedChapter && (
            <Badge variant="accent">
              <Lock size={10} className="mr-1 inline" />
              Premium Chapter
            </Badge>
          )}
        </div>
      </div>

      {/* ---- Chapter content ---- */}
      <div className="max-w-3xl mx-auto px-4 pb-32">
        {isGatedChapter ? (
          // Gated: show teaser then blur + subscribe prompt
          <div className="relative">
            {/* Teaser content */}
            {isChat && chatContent ? (
              <ChatReader content={chatContent} teaserLimit={5} />
            ) : (
              <ProseReader content={contentJson as any} teaserLimit={2} />
            )}

            {/* Blur overlay */}
            <div className="relative -mt-32">
              <div className="h-32 bg-gradient-to-t from-background to-transparent" />
              <div className="bg-background py-12 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                  <Lock size={28} className="text-accent" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">
                    This chapter is for subscribers
                  </h3>
                  <p className="text-muted max-w-md mx-auto">
                    Subscribe to unlock all chapters of{" "}
                    <span className="font-medium text-foreground">
                      {story.title}
                    </span>{" "}
                    and continue reading.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <SubscribeButton
                    targetType="story"
                    targetName={story.title}
                    price={4.99}
                    storyId={story.id}
                    creatorId={story.creator_id}
                  />
                  <TipButton
                    creatorName={story.creator?.display_name || ""}
                    storyTitle={story.title}
                    variant="button"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Full content
          <>
            {isChat && chatContent ? (
              <ChatReader content={chatContent} />
            ) : (
              <ProseReader content={contentJson as any} />
            )}
          </>
        )}

        {/* ---- Chapter navigation ---- */}
        {!isGatedChapter && (
          <div className="border-t border-border pt-8 mt-8">
            <div className="flex items-center justify-between gap-4">
              {prevChapter ? (
                <Link
                  href={`/story/${story.slug}/${prevChapter.chapter_number}`}
                >
                  <Button variant="secondary" size="md">
                    <ChevronLeft size={16} />
                    Previous Chapter
                  </Button>
                </Link>
              ) : (
                <div />
              )}
              {nextChapter ? (
                <Link
                  href={`/story/${story.slug}/${nextChapter.chapter_number}`}
                >
                  <Button variant="primary" size="md">
                    Next Chapter
                    <ChevronRight size={16} />
                  </Button>
                </Link>
              ) : (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted">
                    You have reached the latest chapter.
                  </p>
                  <Link href={`/story/${story.slug}`}>
                    <Button variant="secondary" size="sm">
                      Back to Story
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ---- Sticky bottom bar ---- */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-md border-t border-border">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between">
          {/* Left: chapter nav */}
          <div className="flex items-center gap-1">
            {prevChapter ? (
              <Link
                href={`/story/${story.slug}/${prevChapter.chapter_number}`}
                className="p-2 text-muted hover:text-foreground transition-colors rounded-lg hover:bg-surface-hover"
                title="Previous chapter"
              >
                <ChevronLeft size={20} />
              </Link>
            ) : (
              <span className="p-2 text-muted/30">
                <ChevronLeft size={20} />
              </span>
            )}
            <button
              onClick={() => setSidebarOpen(true)}
              className="px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors rounded-lg hover:bg-surface-hover cursor-pointer"
            >
              {chapter.chapter_number} / {chapters.filter((c) => c.status === "published").length}
            </button>
            {nextChapter ? (
              <Link
                href={`/story/${story.slug}/${nextChapter.chapter_number}`}
                className="p-2 text-muted hover:text-foreground transition-colors rounded-lg hover:bg-surface-hover"
                title="Next chapter"
              >
                <ChevronRight size={20} />
              </Link>
            ) : (
              <span className="p-2 text-muted/30">
                <ChevronRight size={20} />
              </span>
            )}
          </div>

          {/* Center: progress */}
          <span className="text-xs text-muted hidden sm:block">
            {Math.round(scrollProgress)}% read
          </span>

          {/* Right: actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setBookmarked(!bookmarked)}
              className={`p-2 transition-colors rounded-lg hover:bg-surface-hover cursor-pointer ${
                bookmarked
                  ? "text-accent"
                  : "text-muted hover:text-foreground"
              }`}
              title={bookmarked ? "Remove bookmark" : "Bookmark"}
            >
              {bookmarked ? (
                <BookMarked size={20} />
              ) : (
                <Bookmark size={20} />
              )}
            </button>
            <TipButton
              creatorName={story.creator?.display_name || ""}
              storyTitle={story.title}
              variant="icon"
            />
          </div>
        </div>
      </div>

      {/* ---- Chapter sidebar / drawer ---- */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-surface border-l border-border shadow-2xl flex flex-col transition-transform duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <h3 className="font-semibold flex items-center gap-2">
                <BookOpen size={18} className="text-accent" />
                Chapters
              </h3>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Story title */}
            <div className="px-4 py-3 border-b border-border shrink-0">
              <Link
                href={`/story/${story.slug}`}
                className="text-sm font-medium hover:text-accent transition-colors"
              >
                {story.title}
              </Link>
              <p className="text-xs text-muted mt-0.5">
                by {story.creator?.display_name}
              </p>
            </div>

            {/* Chapter list */}
            <div className="flex-1 overflow-y-auto">
              {chapters.map((ch) => {
                const isCurrentChapter =
                  ch.chapter_number === chapter.chapter_number;
                const isPublished = ch.status === "published";
                const isLocked = story.is_gated && ch.chapter_number > 2 && !unlocked;

                return (
                  <div key={ch.id}>
                    {isPublished ? (
                      <Link
                        href={`/story/${story.slug}/${ch.chapter_number}`}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                          isCurrentChapter
                            ? "bg-accent/10 text-accent border-r-2 border-accent"
                            : "hover:bg-surface-hover"
                        }`}
                      >
                        <span
                          className={`w-6 text-center shrink-0 ${
                            isCurrentChapter
                              ? "font-bold"
                              : "text-muted font-medium"
                          }`}
                        >
                          {ch.chapter_number}
                        </span>
                        <span className="flex-1 truncate">{ch.title}</span>
                        {isLocked && (
                          <Lock size={12} className="text-accent shrink-0" />
                        )}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 text-sm opacity-40">
                        <span className="w-6 text-center shrink-0 text-muted font-medium">
                          {ch.chapter_number}
                        </span>
                        <span className="flex-1 truncate">{ch.title}</span>
                        <span className="text-[10px] text-muted">
                          {ch.status === "scheduled"
                            ? "Scheduled"
                            : "Draft"}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
