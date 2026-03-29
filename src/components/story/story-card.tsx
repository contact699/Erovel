"use client";

import Link from "next/link";
import type { Story } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatRelativeDate, estimateReadingTime } from "@/lib/utils";
import { Eye, MessageCircle, DollarSign, BookOpen, MessageSquare, Lock } from "lucide-react";

interface StoryCardProps {
  story: Story;
  variant?: "default" | "compact";
}

export function StoryCard({ story, variant = "default" }: StoryCardProps) {
  const isChat = story.format === "chat";

  if (variant === "compact") {
    return (
      <Link href={`/story/${story.slug}`} className="block group">
        <div className="flex gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors">
          <div className="shrink-0 w-12 h-16 rounded-md bg-accent/10 flex items-center justify-center">
            {isChat ? <MessageSquare size={20} className="text-accent" /> : <BookOpen size={20} className="text-accent" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium truncate group-hover:text-accent transition-colors">
              {story.is_gated && <Lock size={12} className="inline mr-1 text-accent" />}
              {story.title}
            </h3>
            <p className="text-xs text-muted mt-0.5">by {story.creator?.display_name}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted">
              <span className="flex items-center gap-1"><Eye size={12} />{formatNumber(story.view_count)}</span>
              <span>{story.published_chapter_count} ch</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/story/${story.slug}`} className="block group">
      <div className="bg-surface border border-border rounded-xl overflow-hidden hover:border-accent/30 transition-all hover:shadow-lg hover:shadow-accent/5">
        {/* Cover area */}
        <div className="h-32 bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center relative">
          {isChat ? (
            <MessageSquare size={36} className="text-accent/40" />
          ) : (
            <BookOpen size={36} className="text-accent/40" />
          )}
          <div className="absolute top-2 right-2 flex gap-1.5">
            <Badge variant={isChat ? "accent" : "default"}>
              {isChat ? "Chat" : "Prose"}
            </Badge>
            {story.is_gated && (
              <Badge variant="accent">
                <Lock size={10} className="mr-1" />
                Premium
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold group-hover:text-accent transition-colors line-clamp-1">
              {story.title}
            </h3>
            <p className="text-sm text-muted mt-1 line-clamp-2">{story.description}</p>
          </div>

          {/* Tags */}
          {story.tags && story.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {story.tags.slice(0, 3).map((tag) => (
                <span key={tag.id} className="text-xs text-muted bg-surface-hover px-2 py-0.5 rounded-full">
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Creator + stats */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Avatar src={story.creator?.avatar_url} name={story.creator?.display_name || ""} size="sm" />
              <span className="text-xs text-muted">{story.creator?.display_name}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="flex items-center gap-1"><Eye size={12} />{formatNumber(story.view_count)}</span>
              <span className="flex items-center gap-1"><MessageCircle size={12} />{formatNumber(story.comment_count)}</span>
              <span className="flex items-center gap-1"><DollarSign size={12} />{formatNumber(story.tip_total)}</span>
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{story.published_chapter_count} chapters &middot; {estimateReadingTime(story.word_count)}</span>
            <span>{formatRelativeDate(story.updated_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
