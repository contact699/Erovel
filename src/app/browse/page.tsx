"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { mockStories, mockCategories } from "@/lib/mock-data";
import { StoryCard } from "@/components/story/story-card";
import { Select } from "@/components/ui/select";
import { formatNumber } from "@/lib/utils";
import type { StoryFormat } from "@/lib/types";

type SortOption = "trending" | "newest" | "most-tipped";

function isValidSort(v: string | null): v is SortOption {
  return v === "trending" || v === "newest" || v === "most-tipped";
}

export default function BrowsePage() {
  return (
    <Suspense>
      <BrowseContent />
    </Suspense>
  );
}

function BrowseContent() {
  const searchParams = useSearchParams();
  const initialSort = searchParams.get("sort");
  const initialFormat = searchParams.get("format");

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>(
    initialFormat === "prose" || initialFormat === "chat" ? initialFormat : "all"
  );
  const [sort, setSort] = useState<SortOption>(
    isValidSort(initialSort) ? initialSort : "trending"
  );

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    ...mockCategories.map((c) => ({ value: c.slug, label: c.name })),
  ];

  const formatOptions = [
    { value: "all", label: "All Formats" },
    { value: "prose", label: "Prose" },
    { value: "chat", label: "Chat" },
  ];

  const sortOptions = [
    { value: "trending", label: "Trending" },
    { value: "newest", label: "Newest" },
    { value: "most-tipped", label: "Most Tipped" },
  ];

  const filteredStories = useMemo(() => {
    let stories = [...mockStories];

    if (categoryFilter !== "all") {
      stories = stories.filter(
        (s) => s.category?.slug === categoryFilter || s.category_id === categoryFilter
      );
    }

    if (formatFilter !== "all") {
      stories = stories.filter((s) => s.format === (formatFilter as StoryFormat));
    }

    switch (sort) {
      case "trending":
        stories.sort((a, b) => b.view_count - a.view_count);
        break;
      case "newest":
        stories.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "most-tipped":
        stories.sort((a, b) => b.tip_total - a.tip_total);
        break;
    }

    return stories;
  }, [categoryFilter, formatFilter, sort]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold">Browse Stories</h1>
        <p className="text-muted mt-2">
          Discover stories from our community of creators
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Category Sidebar (Desktop) */}
        <aside className="hidden lg:block w-56 shrink-0">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
            Categories
          </h3>
          <nav className="space-y-1">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                categoryFilter === "all"
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-foreground hover:bg-surface-hover"
              }`}
            >
              All Categories
            </button>
            {mockCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setCategoryFilter(category.slug)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between cursor-pointer ${
                  categoryFilter === category.slug
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-foreground hover:bg-surface-hover"
                }`}
              >
                <span>{category.name}</span>
                <span className="text-xs text-muted">
                  {formatNumber(category.story_count)}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Filter Bar */}
          <div className="flex flex-wrap gap-3 mb-6 p-4 bg-surface border border-border rounded-xl">
            {/* Category filter (mobile only) */}
            <div className="w-full sm:w-auto lg:hidden">
              <Select
                options={categoryOptions}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-auto sm:flex-1 sm:max-w-48">
              <Select
                options={formatOptions}
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-auto sm:flex-1 sm:max-w-48">
              <Select
                options={sortOptions}
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
              />
            </div>
            <div className="flex items-center text-sm text-muted ml-auto">
              {filteredStories.length} {filteredStories.length === 1 ? "story" : "stories"}
            </div>
          </div>

          {/* Stories Grid */}
          {filteredStories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg text-muted">No stories found matching your filters.</p>
              <button
                onClick={() => {
                  setCategoryFilter("all");
                  setFormatFilter("all");
                  setSort("trending");
                }}
                className="mt-4 text-accent hover:text-accent-hover transition-colors text-sm cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
