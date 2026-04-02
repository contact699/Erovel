"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { getBookmarks, removeBookmark as removeBookmarkQuery } from "@/lib/supabase/queries";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { BookMarked, BookOpen, X } from "lucide-react";
import type { Bookmark } from "@/lib/types";

export default function BookmarksPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getBookmarks(user.id)
      .then((data) => { if (!cancelled) { setError(null); setBookmarks(data as Bookmark[]); setLoaded(true); } })
      .catch(() => { if (!cancelled) { setError("Failed to load bookmarks"); setLoaded(true); } });
    return () => { cancelled = true; };
  }, [user, retryCount]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <BookMarked size={40} className="text-muted mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your Bookmarks</h1>
        <p className="text-muted mb-6">Log in to see your bookmarks.</p>
        <Link href="/login"><Button>Log in</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center gap-3 mb-8">
        <BookMarked size={24} className="text-accent" />
        <h1 className="text-2xl font-bold">Your Bookmarks</h1>
      </div>

      {error ? (
        <div className="text-center py-16">
          <p className="text-danger mb-4">{error}</p>
          <button onClick={() => setRetryCount(c => c + 1)} className="text-accent hover:underline text-sm cursor-pointer">
            Try again
          </button>
        </div>
      ) : !loaded ? (
        <div className="text-center py-16 text-muted">Loading...</div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-4">
            <BookMarked size={28} className="text-muted" />
          </div>
          <h2 className="text-lg font-medium mb-2">No bookmarks yet</h2>
          <p className="text-sm text-muted mb-6">Browse stories to find something you love.</p>
          <Link href="/browse"><Button variant="secondary"><BookOpen size={16} /> Browse Stories</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((bookmark: Bookmark) => {
            const story = bookmark.story;
            if (!story) return null;
            const nextChapter = bookmark.last_read_chapter?.chapter_number ?? 1;
            return (
              <div key={bookmark.story_id} className="bg-surface border border-border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-24 h-32 sm:h-auto rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center shrink-0">
                  <BookOpen size={24} className="text-accent/40" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/story/${story.slug}`} className="text-base font-semibold hover:text-accent transition-colors">
                        {story.title}
                      </Link>
                      {story.creator && (
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar src={story.creator.avatar_url} name={story.creator.display_name} size="sm" />
                          <span className="text-sm text-muted">{story.creator.display_name}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        if (user) await removeBookmarkQuery(user.id, bookmark.story_id);
                        setBookmarks((prev) => prev.filter((b: Bookmark) => b.story_id !== bookmark.story_id));
                      }}
                      className="text-muted hover:text-danger transition-colors shrink-0 cursor-pointer p-1"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <Badge variant="outline">{story.published_chapter_count} chapters</Badge>
                    {story.format === "chat" && <Badge variant="accent">Chat</Badge>}
                    <span>Bookmarked {formatDate(bookmark.created_at)}</span>
                  </div>
                  <div className="pt-1">
                    <Link href={`/story/${story.slug}/${nextChapter}`}>
                      <Button size="sm"><BookOpen size={14} /> Continue Reading</Button>
                    </Link>
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
