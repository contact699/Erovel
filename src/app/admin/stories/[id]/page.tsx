"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { formatDate } from "@/lib/utils";
import type { ChatContent } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatReader } from "@/components/story/chat-reader";
import { GalleryReader } from "@/components/story/gallery-reader";
import { ProseReader } from "@/components/story/prose-reader";
import { effectiveStoryFormat } from "@/lib/story-format";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Lock,
  EyeOff,
  DollarSign,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";

interface AdminStoryDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  format: string;
  category_id: string;
  status: string;
  is_gated: boolean;
  price: number;
  visibility: string;
  password_hash: string | null;
  chapter_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  creator: { id: string; username: string; display_name: string; avatar_url: string | null } | null;
}

interface AdminChapter {
  id: string;
  chapter_number: number;
  title: string;
  status: string;
  is_exclusive: boolean;
  publish_at: string | null;
  content: { content_json: unknown } | null;
}

export default function AdminStoryDetailPage() {
  const params = useParams();
  const storyId = params.id as string;
  const { user } = useAuthStore();

  const [story, setStory] = useState<AdminStoryDetail | null>(null);
  const [chapters, setChapters] = useState<AdminChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  const fetchStory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/stories/${storyId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setStory(data.story);
      setChapters(data.chapters);
      setExpandedChapter(data.chapters[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load story");
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    void fetchStory();
  }, [user, fetchStory]);

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted">Access denied.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertTriangle size={24} className="text-danger" />
        <p className="text-sm text-danger">{error || "Story not found"}</p>
        <Link href="/admin/stories">
          <Button variant="secondary" size="sm">
            <ArrowLeft size={14} />
            Back to stories
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back link */}
      <Link
        href="/admin/stories"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        All Stories
      </Link>

      {/* Story header */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">{story.title}</h1>
            <p className="text-sm text-muted mt-1">{story.description}</p>
          </div>
          <Link href={`/story/${story.slug}`} target="_blank">
            <Button variant="secondary" size="sm">
              <ExternalLink size={14} />
              Public page
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant={story.status === "published" ? "success" : story.status === "draft" ? "default" : "accent"}
            className={story.status === "draft" ? "bg-yellow-500/10 text-yellow-600" : undefined}>
            {story.status}
          </Badge>
          <Badge>{story.format}</Badge>
          {story.is_gated && (
            <Badge variant="accent" className="flex items-center gap-1">
              <DollarSign size={10} />
              Gated (${story.price})
            </Badge>
          )}
          {story.visibility === "unlisted" && (
            <Badge className="flex items-center gap-1 bg-foreground/5 text-muted">
              <EyeOff size={10} />
              Unlisted
            </Badge>
          )}
          {story.password_hash && (
            <Badge className="flex items-center gap-1 bg-foreground/5 text-muted">
              <Lock size={10} />
              Password
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted text-xs">Creator</p>
            <p className="font-medium">
              {story.creator ? (
                <Link href={`/creator/${story.creator.username}`} className="hover:text-accent transition-colors">
                  @{story.creator.username}
                </Link>
              ) : "unknown"}
            </p>
          </div>
          <div>
            <p className="text-muted text-xs">Chapters</p>
            <p className="font-medium">{chapters.length}</p>
          </div>
          <div>
            <p className="text-muted text-xs">Views</p>
            <p className="font-medium">{story.view_count}</p>
          </div>
          <div>
            <p className="text-muted text-xs">Created</p>
            <p className="font-medium">{formatDate(story.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Chapters */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Chapters ({chapters.length})
        </h2>

        {chapters.length === 0 ? (
          <p className="text-sm text-muted">No chapters.</p>
        ) : (
          chapters.map((ch) => {
            const isExpanded = expandedChapter === ch.id;
            const contentJson = ch.content?.content_json;
            const chatContent = (story.format === "chat" || story.format === "gallery") && contentJson
              ? contentJson as ChatContent
              : null;

            return (
              <div key={ch.id} className="bg-surface border border-border rounded-xl overflow-hidden">
                {/* Chapter header */}
                <button
                  onClick={() => setExpandedChapter(isExpanded ? null : ch.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-surface-hover/50 transition-colors cursor-pointer text-left"
                >
                  <span className="text-sm font-mono text-muted w-8 shrink-0">
                    {ch.chapter_number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{ch.title}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {ch.is_exclusive && (
                      <Badge className="bg-yellow-500/10 text-yellow-600 text-[10px]">exclusive</Badge>
                    )}
                    <Badge
                      variant={ch.status === "published" ? "success" : ch.status === "scheduled" ? "accent" : "default"}
                      className={ch.status === "draft" ? "bg-yellow-500/10 text-yellow-600" : undefined}
                    >
                      {ch.status}
                    </Badge>
                    {contentJson == null && (
                      <span className="text-xs text-muted">(no content)</span>
                    )}
                    {isExpanded ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                  </div>
                </button>

                {/* Chapter content */}
                {isExpanded && contentJson != null && (() => {
                  const fmt = effectiveStoryFormat(story.format, chatContent);
                  return (
                    <div className="border-t border-border p-5">
                      <div className="max-w-3xl mx-auto">
                        {fmt === "chat" && chatContent ? (
                          <ChatReader content={chatContent} />
                        ) : fmt === "gallery" && chatContent ? (
                          <GalleryReader content={chatContent} />
                        ) : (
                          <ProseReader content={contentJson as Record<string, unknown>} />
                        )}
                      </div>
                    </div>
                  );
                })()}

                {isExpanded && contentJson == null && (
                  <div className="border-t border-border p-5 text-center text-sm text-muted">
                    This chapter has no content yet.
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
