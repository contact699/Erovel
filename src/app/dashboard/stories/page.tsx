"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { mockStories } from "@/lib/mock-data";
import {
  formatNumber,
  formatCurrency,
  formatRelativeDate,
} from "@/lib/utils";
import type { StoryStatus } from "@/lib/types";
import {
  PlusCircle,
  Eye,
  DollarSign,
  MessageCircle,
  BookOpen,
  MessageSquare,
  Trash2,
  Pencil,
  Lock,
} from "lucide-react";

const creatorStories = mockStories.filter(
  (s) => s.creator_id === "creator-1"
);

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
];

const statusBadgeVariant: Record<StoryStatus, "success" | "default" | "accent"> = {
  published: "success",
  draft: "default",
  scheduled: "accent",
};

export default function StoriesPage() {
  const [filter, setFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [stories, setStories] = useState(creatorStories);

  const filtered =
    filter === "all"
      ? stories
      : stories.filter((s) => s.status === filter);

  const storyToDelete = stories.find((s) => s.id === deleteTarget);

  function handleDelete() {
    if (!deleteTarget) return;
    setStories((prev) => prev.filter((s) => s.id !== deleteTarget));
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Your Stories</h1>
          <p className="text-muted mt-1">
            Manage and organize your published and draft stories.
          </p>
        </div>
        <Button variant="primary" size="md">
          <PlusCircle size={16} />
          New Story
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select
          options={statusOptions}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-40"
        />
        <span className="text-sm text-muted">
          {filtered.length} {filtered.length === 1 ? "story" : "stories"}
        </span>
      </div>

      {/* Stories list */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {/* Table header (desktop) */}
        <div className="hidden md:grid md:grid-cols-[1fr_100px_100px_80px_80px_80px_100px_50px] gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted uppercase tracking-wide">
          <span>Title</span>
          <span>Format</span>
          <span>Status</span>
          <span>Chapters</span>
          <span>Views</span>
          <span>Tips</span>
          <span>Updated</span>
          <span />
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted">
            <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No stories found</p>
            <p className="text-sm mt-1">
              {filter === "all"
                ? "Create your first story to get started."
                : `No ${filter} stories.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((story) => {
              const isChat = story.format === "chat";
              return (
                <div
                  key={story.id}
                  className="md:grid md:grid-cols-[1fr_100px_100px_80px_80px_80px_100px_50px] gap-4 px-5 py-4 hover:bg-surface-hover transition-colors items-center"
                >
                  {/* Title (always visible) */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                      {isChat ? (
                        <MessageSquare size={16} className="text-accent" />
                      ) : (
                        <BookOpen size={16} className="text-accent" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/story/${story.slug}`}
                        className="text-sm font-medium hover:text-accent transition-colors truncate block"
                      >
                        {story.is_gated && (
                          <Lock
                            size={12}
                            className="inline mr-1 text-accent"
                          />
                        )}
                        {story.title}
                      </Link>
                      {/* Mobile meta */}
                      <div className="md:hidden flex flex-wrap items-center gap-2 mt-1 text-xs text-muted">
                        <Badge variant={isChat ? "accent" : "default"}>
                          {isChat ? "Chat" : "Prose"}
                        </Badge>
                        <Badge variant={statusBadgeVariant[story.status]}>
                          {story.status}
                        </Badge>
                        <span>{story.chapter_count} ch</span>
                        <span className="flex items-center gap-1">
                          <Eye size={11} />
                          {formatNumber(story.view_count)}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign size={11} />
                          {formatCurrency(story.tip_total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Format */}
                  <div className="hidden md:block">
                    <Badge variant={isChat ? "accent" : "default"}>
                      {isChat ? "Chat" : "Prose"}
                    </Badge>
                  </div>

                  {/* Status */}
                  <div className="hidden md:block">
                    <Badge variant={statusBadgeVariant[story.status]}>
                      {story.status}
                    </Badge>
                  </div>

                  {/* Chapters */}
                  <span className="hidden md:block text-sm text-muted">
                    {story.published_chapter_count}/{story.chapter_count}
                  </span>

                  {/* Views */}
                  <span className="hidden md:block text-sm text-muted">
                    {formatNumber(story.view_count)}
                  </span>

                  {/* Tips */}
                  <span className="hidden md:block text-sm text-muted">
                    {formatCurrency(story.tip_total)}
                  </span>

                  {/* Updated */}
                  <span className="hidden md:block text-xs text-muted">
                    {formatRelativeDate(story.updated_at)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 mt-2 md:mt-0">
                    <Link
                      href={`/dashboard/stories/${story.id}/edit`}
                      className="p-1.5 text-muted hover:text-foreground transition-colors rounded-md hover:bg-surface-hover"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(story.id)}
                      className="p-1.5 text-muted hover:text-danger transition-colors rounded-md hover:bg-danger/10 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Story"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              {storyToDelete?.title}
            </span>
            ? This action cannot be undone. All chapters, comments, and tips
            associated with this story will be permanently removed.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 size={14} />
              Delete Story
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
