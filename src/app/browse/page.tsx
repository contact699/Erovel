"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { StoryCard } from "@/components/story/story-card";
import { StoryCardSkeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { formatNumber } from "@/lib/utils";
import { getPublishedStories, getCategories } from "@/lib/supabase/queries";
import type { Story, Category } from "@/lib/types";

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
    initialFormat === "prose" || initialFormat === "chat" || initialFormat === "gallery" ? initialFormat : "all"
  );
  const [sort, setSort] = useState<SortOption>(
    isValidSort(initialSort) ? initialSort : "trending"
  );
  const [stories, setStories] = useState<Story[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const PAGE_SIZE = 12;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storiesData, catsData] = await Promise.all([
          getPublishedStories({ category: categoryFilter, format: formatFilter, sort, limit: PAGE_SIZE, offset: 0 }),
          getCategories(),
        ]);
        if (!cancelled) {
          setStories(storiesData);
          setCategories(catsData);
          setHasMore(storiesData.length >= PAGE_SIZE);
          setPage(1);
          setError(null);
          setLoaded(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load stories. Please try again.");
          setLoaded(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [categoryFilter, formatFilter, sort, retryCount]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextOffset = page * PAGE_SIZE;
    const moreStories = await getPublishedStories({
      category: categoryFilter,
      format: formatFilter,
      sort,
      limit: PAGE_SIZE,
      offset: nextOffset,
    });
    setStories((prev) => [...prev, ...moreStories]);
    setHasMore(moreStories.length >= PAGE_SIZE);
    setPage((prev) => prev + 1);
    setLoadingMore(false);
  }, [loadingMore, hasMore, page, categoryFilter, formatFilter, sort]);

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    ...categories.map((c) => ({ value: c.slug, label: c.name })),
  ];

  const formatOptions = [
    { value: "all", label: "All Formats" },
    { value: "prose", label: "Illustrated Story" },
    { value: "chat", label: "Sext Story" },
    { value: "gallery", label: "Gallery" },
  ];

  const sortOptions = [
    { value: "trending", label: "Trending" },
    { value: "newest", label: "Newest" },
    { value: "most-tipped", label: "Most Tipped" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold">Browse Stories</h1>
        <p className="text-muted mt-2">Discover stories from our community of creators</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block w-56 shrink-0">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">Categories</h3>
          <nav className="space-y-1">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                categoryFilter === "all" ? "bg-accent/10 text-accent font-medium" : "text-foreground hover:bg-surface-hover"
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setCategoryFilter(category.slug)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between cursor-pointer ${
                  categoryFilter === category.slug ? "bg-accent/10 text-accent font-medium" : "text-foreground hover:bg-surface-hover"
                }`}
              >
                <span>{category.name}</span>
                <span className="text-xs text-muted">{formatNumber(category.story_count)}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-3 mb-6 p-4 bg-surface border border-border rounded-xl">
            <div className="w-full sm:w-auto lg:hidden">
              <Select options={categoryOptions} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} />
            </div>
            <div className="w-full sm:w-auto sm:flex-1 sm:max-w-48">
              <Select options={formatOptions} value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)} />
            </div>
            <div className="w-full sm:w-auto sm:flex-1 sm:max-w-48">
              <Select options={sortOptions} value={sort} onChange={(e) => setSort(e.target.value as SortOption)} />
            </div>
            <div className="flex items-center text-sm text-muted ml-auto">
              {stories.length} {stories.length === 1 ? "story" : "stories"}
            </div>
          </div>

          {!loaded ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <StoryCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-lg text-red-500 mb-4">{error}</p>
              <button
                onClick={() => setRetryCount((c) => c + 1)}
                className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : stories.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {stories.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-6 py-2.5 rounded-xl bg-surface border border-border text-sm font-medium hover:bg-surface-hover transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {loadingMore ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg text-muted">No stories found matching your filters.</p>
              <button
                onClick={() => { setCategoryFilter("all"); setFormatFilter("all"); setSort("trending"); }}
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
