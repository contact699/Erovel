"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { getMyStories, deleteStory } from "@/lib/supabase/queries";
import type { Story } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDate } from "@/lib/utils";
import { Plus, BookOpen, Eye, Trash2, Edit } from "lucide-react";

export default function DashboardStoriesPage() {
  const { user } = useAuthStore();
  const [stories, setStories] = useState<Story[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getMyStories(user.id)
      .then((data) => { if (!cancelled) { setError(null); setStories(data); setLoaded(true); } })
      .catch(() => { if (!cancelled) { setError("Failed to load stories"); setLoaded(true); } });
    return () => { cancelled = true; };
  }, [user, retryCount]);

  const filtered = filter === "all"
    ? stories
    : stories.filter((s) => s.status === filter);

  async function handleDelete(id: string) {
    if (!confirm("Delete this story? This cannot be undone.")) return;
    try {
      await deleteStory(id);
      setStories((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert("Failed to delete story");
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Stories</h1>
        <Link href="/dashboard/stories/new">
          <Button><Plus size={16} /> New Story</Button>
        </Link>
      </div>

      <div className="flex gap-2">
        {["all", "published", "draft"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${
              filter === f ? "bg-accent/10 text-accent font-medium" : "text-muted hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
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
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={40} className="text-muted mx-auto mb-3 opacity-40" />
          <p className="text-muted">No stories found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((story) => (
            <div key={story.id} className="bg-surface border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{story.title}</h3>
                  <Badge variant={story.status === "published" ? "success" : "default"}>
                    {story.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                  <span>{story.format}</span>
                  <span>{story.chapter_count} chapters</span>
                  <span className="flex items-center gap-1"><Eye size={11} /> {formatNumber(story.view_count)}</span>
                  <span>Updated {formatDate(story.updated_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/dashboard/stories/${story.id}/edit`}>
                  <Button variant="secondary" size="sm"><Edit size={14} /> Edit</Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(story.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
