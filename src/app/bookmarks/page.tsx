"use client";

import { useState } from "react";
import Link from "next/link";
import { mockBookmarks, mockChapters } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Bookmark } from "@/lib/types";
import { BookMarked, BookOpen, Trash2, X } from "lucide-react";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(mockBookmarks);

  function removeBookmark(storyId: string) {
    setBookmarks((prev) => prev.filter((b) => b.story_id !== storyId));
  }

  function getChapterTitle(chapterId: string | null) {
    if (!chapterId) return null;
    const chapter = mockChapters.find((c) => c.id === chapterId);
    return chapter
      ? `Ch. ${chapter.chapter_number}: ${chapter.title}`
      : null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <BookMarked size={24} className="text-accent" />
        <h1 className="text-2xl font-bold">Your Bookmarks</h1>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-4">
            <BookMarked size={28} className="text-muted" />
          </div>
          <h2 className="text-lg font-medium mb-2">No bookmarks yet</h2>
          <p className="text-sm text-muted mb-6">
            Browse stories to find something you love.
          </p>
          <Link href="/browse">
            <Button variant="secondary">
              <BookOpen size={16} />
              Browse Stories
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((bookmark) => {
            const story = bookmark.story;
            if (!story) return null;
            const lastChapter = getChapterTitle(
              bookmark.last_read_chapter_id
            );

            return (
              <div
                key={bookmark.story_id}
                className="bg-surface border border-border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4"
              >
                {/* Cover placeholder */}
                <div className="w-full sm:w-24 h-32 sm:h-auto rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center shrink-0">
                  <BookOpen size={24} className="text-accent/40" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/story/${story.slug}`}
                        className="text-base font-semibold hover:text-accent transition-colors"
                      >
                        {story.title}
                      </Link>
                      {story.creator && (
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar
                            src={story.creator.avatar_url}
                            name={story.creator.display_name}
                            size="sm"
                          />
                          <span className="text-sm text-muted">
                            {story.creator.display_name}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeBookmark(bookmark.story_id)}
                      className="text-muted hover:text-danger transition-colors shrink-0 cursor-pointer p-1"
                      title="Remove bookmark"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <Badge variant="outline">
                      {story.published_chapter_count} chapters
                    </Badge>
                    {story.format === "chat" && (
                      <Badge variant="accent">Chat</Badge>
                    )}
                    <span>Bookmarked {formatDate(bookmark.created_at)}</span>
                  </div>

                  {lastChapter && (
                    <p className="text-sm text-muted">
                      Last read: <span className="text-foreground">{lastChapter}</span>
                    </p>
                  )}

                  <div className="pt-1">
                    {(() => {
                      const lastChapterId = bookmark.last_read_chapter_id;
                      const lastReadChapter = lastChapterId
                        ? mockChapters.find((c) => c.id === lastChapterId)
                        : null;
                      // Go to next chapter after last read, or chapter 1 if no history
                      const nextChapterNum = lastReadChapter
                        ? lastReadChapter.chapter_number + 1
                        : 1;
                      // Cap at published chapter count
                      const targetChapter = Math.min(
                        nextChapterNum,
                        story.published_chapter_count
                      );
                      return (
                        <Link href={`/story/${story.slug}/${targetChapter}`}>
                          <Button size="sm">
                            <BookOpen size={14} />
                            {lastReadChapter ? "Continue Reading" : "Start Reading"}
                          </Button>
                        </Link>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
