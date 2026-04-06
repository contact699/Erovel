"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { formatRelativeDate, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  BookOpen,
  Search,
  Eye,
  MessageSquare,
  DollarSign,
  Loader2,
  AlertTriangle,
  Lock,
  EyeOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface AdminStory {
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
  chapter_count: number;
  published_chapter_count: number;
  view_count: number;
  tip_total: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  creator: { id: string; username: string; display_name: string; avatar_url: string | null } | null;
}

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
];

const PAGE_SIZE = 25;

export default function AdminStoriesPage() {
  const { user } = useAuthStore();
  const [stories, setStories] = useState<AdminStory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(page * PAGE_SIZE));

      const res = await fetch(`/api/admin/stories?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setStories(data.stories);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stories");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchStories();
    }
  }, [user, fetchStories]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted">Access denied.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">All Stories</h1>
        <p className="text-sm text-muted mt-1">
          Full moderation access to all stories, chapters, and content
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px] max-w-md">
          <Input
            id="story-search"
            placeholder="Search by title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button type="submit" variant="secondary" size="sm">
            <Search size={14} />
          </Button>
        </form>
        <Select
          id="status-filter"
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => {
            setPage(0);
            setStatusFilter(e.target.value);
          }}
        />
        <span className="text-xs text-muted self-center">
          {total} stor{total === 1 ? "y" : "ies"}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-danger bg-danger/10 rounded-lg px-4 py-3">
          <AlertTriangle size={16} />
          {error}
          <Button variant="secondary" size="sm" onClick={fetchStories} className="ml-auto">
            Retry
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <BookOpen size={32} className="mx-auto mb-3 opacity-50" />
          <p>No stories found.</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-hover/50">
                    <th className="text-left font-medium text-muted px-4 py-3">Story</th>
                    <th className="text-left font-medium text-muted px-4 py-3">Creator</th>
                    <th className="text-left font-medium text-muted px-4 py-3">Format</th>
                    <th className="text-left font-medium text-muted px-4 py-3">Status</th>
                    <th className="text-left font-medium text-muted px-4 py-3">Flags</th>
                    <th className="text-right font-medium text-muted px-4 py-3">Chs</th>
                    <th className="text-right font-medium text-muted px-4 py-3">Views</th>
                    <th className="text-left font-medium text-muted px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stories.map((story) => (
                    <tr key={story.id} className="hover:bg-surface-hover/30 transition-colors">
                      <td className="px-4 py-3 max-w-[250px]">
                        <Link
                          href={`/admin/stories/${story.id}`}
                          className="font-medium hover:text-accent transition-colors block truncate"
                        >
                          {story.title}
                        </Link>
                        <p className="text-xs text-muted truncate">{story.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                        {story.creator ? (
                          <Link href={`/creator/${story.creator.username}`} className="hover:text-accent transition-colors">
                            @{story.creator.username}
                          </Link>
                        ) : (
                          "unknown"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={story.format === "chat" ? "accent" : story.format === "gallery" ? "default" : "default"}>
                          {story.format}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={story.status === "published" ? "success" : story.status === "draft" ? "default" : "accent"}
                          className={story.status === "draft" ? "bg-yellow-500/10 text-yellow-600" : undefined}
                        >
                          {story.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {story.is_gated && (
                            <span title="Gated" className="text-accent"><DollarSign size={13} /></span>
                          )}
                          {story.visibility === "unlisted" && (
                            <span title="Unlisted" className="text-muted"><EyeOff size={13} /></span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs">
                        {story.published_chapter_count}/{story.chapter_count}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs">
                        {formatNumber(story.view_count)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                        {formatRelativeDate(story.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={14} />
                Previous
              </Button>
              <span className="text-xs text-muted">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
              >
                Next
                <ChevronRight size={14} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
