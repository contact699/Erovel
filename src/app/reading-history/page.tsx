"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { getReadingHistory } from "@/lib/supabase/queries";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/utils";
import { Clock, BookOpen } from "lucide-react";

export default function ReadingHistoryPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [history, setHistory] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    getReadingHistory(user.id).then((data) => {
      setHistory(data);
      setLoaded(true);
    });
  }, [user]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Clock size={40} className="text-muted mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Reading History</h1>
        <p className="text-muted mb-6">Log in to see your reading history.</p>
        <Link href="/login"><Button>Log in</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center gap-3 mb-8">
        <Clock size={24} className="text-accent" />
        <h1 className="text-2xl font-bold">Reading History</h1>
      </div>

      {!loaded ? (
        <div className="text-center py-16 text-muted">Loading...</div>
      ) : history.length === 0 ? (
        <div className="text-center py-16">
          <Clock size={40} className="text-muted mx-auto mb-4 opacity-40" />
          <h2 className="text-lg font-medium mb-2">No reading history yet</h2>
          <p className="text-sm text-muted mb-6">Start reading stories to build your history.</p>
          <Link href="/browse"><Button variant="secondary"><BookOpen size={16} /> Browse Stories</Button></Link>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((item: any) => (
            <Link
              key={item.id}
              href={`/story/${item.story?.slug}/${item.chapter?.chapter_number || 1}`}
              className="flex items-center gap-4 p-4 bg-surface border border-border rounded-xl hover:bg-surface-hover transition-colors"
            >
              {item.story?.creator && (
                <Avatar src={item.story.creator.avatar_url} name={item.story.creator.display_name} size="sm" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.story?.title}</p>
                {item.chapter && (
                  <p className="text-xs text-muted">Ch. {item.chapter.chapter_number}: {item.chapter.title}</p>
                )}
              </div>
              <span className="text-xs text-muted shrink-0">{formatRelativeDate(item.read_at)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
