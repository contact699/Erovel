"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { mockStories, mockCategories } from "@/lib/mock-data";
import { StoryCard } from "@/components/story/story-card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import type { StoryFormat } from "@/lib/types";
import { ArrowLeft } from "lucide-react";

type SortOption = "trending" | "newest" | "most-tipped";

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;

  const category = mockCategories.find((c) => c.slug === categorySlug);

  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortOption>("trending");

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
    let stories = mockStories.filter(
      (s) => s.category?.slug === categorySlug || s.category_id === categorySlug
    );

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
  }, [categorySlug, formatFilter, sort]);

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
          {mockCategories
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
