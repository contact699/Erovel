"use client";

import { useState } from "react";
import Link from "next/link";
import { mockStories } from "@/lib/mock-data";
import { formatRelativeDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Clock, BookOpen, Trash2, History } from "lucide-react";

// Mock reading history from mock stories
const READING_HISTORY_BASE = new Date("2026-03-28T12:00:00Z").getTime();
const mockHistory = mockStories.map((story, i) => ({
  story,
  chapterRead: Math.min(i + 2, story.published_chapter_count),
  readAt: new Date(
    READING_HISTORY_BASE - i * 3600000 * (i + 1) * 2
  ).toISOString(),
}));

export default function ReadingHistoryPage() {
  const [history, setHistory] = useState(mockHistory);
  const [clearModalOpen, setClearModalOpen] = useState(false);

  function clearHistory() {
    setHistory([]);
    setClearModalOpen(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <History size={24} className="text-accent" />
          <h1 className="text-2xl font-bold">Reading History</h1>
        </div>
        {history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setClearModalOpen(true)}
          >
            <Trash2 size={14} />
            Clear History
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-4">
            <Clock size={28} className="text-muted" />
          </div>
          <h2 className="text-lg font-medium mb-2">No reading history</h2>
          <p className="text-sm text-muted mb-6">
            Stories you read will appear here.
          </p>
          <Link href="/browse">
            <Button variant="secondary">
              <BookOpen size={16} />
              Browse Stories
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-1">
          {history.map((entry, idx) => {
            const { story, chapterRead, readAt } = entry;

            return (
              <div
                key={`${story.id}-${idx}`}
                className="flex items-center gap-4 p-3 sm:p-4 rounded-xl hover:bg-surface transition-colors group"
              >
                {/* Cover placeholder */}
                <div className="w-12 h-16 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center shrink-0">
                  <BookOpen size={16} className="text-accent/40" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/story/${story.slug}`}
                    className="text-sm font-semibold hover:text-accent transition-colors line-clamp-1"
                  >
                    {story.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    {story.creator && (
                      <span className="text-xs text-muted">
                        {story.creator.display_name}
                      </span>
                    )}
                    <span className="text-xs text-muted/50">|</span>
                    <span className="text-xs text-muted">
                      Chapter {chapterRead} of{" "}
                      {story.published_chapter_count}
                    </span>
                  </div>
                </div>

                {/* Time & action */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-muted whitespace-nowrap">
                    {formatRelativeDate(readAt)}
                  </span>
                  <Link href={`/story/${story.slug}/1`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Continue
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clear confirmation modal */}
      <Modal
        open={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
        title="Clear Reading History"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Are you sure you want to clear your entire reading history? This
            action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setClearModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={clearHistory}>
              Clear History
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
