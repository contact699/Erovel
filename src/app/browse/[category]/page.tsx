"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StoryCard } from "@/components/story/story-card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import { getPublishedStories, getCategories } from "@/lib/supabase/queries";
import type { Story, Category, StoryFormat } from "@/lib/types";
import { ArrowLeft, Loader2 } from "lucide-react";

type SortOption = "trending" | "newest" | "most-tipped";

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;

  const [stories, setStories] = useState<Story[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortOption>("trending");

  const category = categories.find((c) => c.slug === categorySlug);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [categoriesData, storiesData] = await Promise.all([
          getCategories(),
          getPublishedStories({
            category: categorySlug,
            format: formatFilter !== "all" ? formatFilter : undefined,
            sort,
          }),
        ]);
        if (!cancelled) {
          setCategories(categoriesData as Category[]);
          setStories(storiesData as Story[]);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load stories. Please try again.");
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [categorySlug, formatFilter, sort, retryCount]);

  // Client-side filtering for format (since the query already filters, this is just
  // for the case where the category filter uses slug matching)
  const filteredStories = useMemo(() => {
    let result = stories;
    if (formatFilter !== "all") {
      result = result.filter((s) => s.format === (formatFilter as StoryFormat));
    }
    return result;
  }, [stories, formatFilter]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-red-500 mb-6">{error}</p>
        <button
          onClick={() => setRetryCount((c) => c + 1)}
          className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
        <p className="text-muted mb-6">
          The category &ldquo;{categorySlug}&rdquo; does not exist.
        </p>
        <Link
          href="/browse"
          className="text-accent hover:text-accent-hover transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Browse
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted">
        <Link href="/browse" className="hover:text-accent transition-colors">
          Browse
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl sm:text-4xl font-bold">{category.name}</h1>
          <Badge variant="outline">{formatNumber(category.story_count)} stories</Badge>
        </div>
        <p className="text-muted mt-2">
          Browse {category.name.toLowerCase()} stories from our community
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-surface border border-border rounded-xl">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-lg text-muted">
            No {category.name.toLowerCase()} stories found matching your filters.
          </p>
          <button
            onClick={() => {
              setFormatFilter("all");
              setSort("trending");
            }}
            className="mt-4 text-accent hover:text-accent-hover transition-colors text-sm cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Other Categories */}
      <div className="mt-16 pt-8 border-t border-border">
        <h2 className="text-lg font-semibold mb-4">Other Categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories
            .filter((c) => c.slug !== categorySlug)
            .map((c) => (
              <Link
                key={c.id}
                href={`/browse/${c.slug}`}
                className="px-3 py-1.5 text-sm bg-surface border border-border rounded-full hover:border-accent/30 hover:text-accent transition-all"
              >
                {c.name}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
