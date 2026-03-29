"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { mockStories } from "@/lib/mock-data";
import { StoryCard } from "@/components/story/story-card";
import { Select } from "@/components/ui/select";
import type { StoryFormat } from "@/lib/types";
import { Search, X } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [formatFilter, setFormatFilter] = useState<string>("all");

  const formatOptions = [
    { value: "all", label: "All Formats" },
    { value: "prose", label: "Prose" },
    { value: "chat", label: "Chat" },
  ];

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase().trim();

    let stories = mockStories.filter((s) => {
      const matchesTitle = s.title.toLowerCase().includes(q);
      const matchesDescription = s.description.toLowerCase().includes(q);
      const matchesCreator = s.creator?.display_name.toLowerCase().includes(q);
      const matchesTags = s.tags.some((t) => t.name.toLowerCase().includes(q));
      const matchesCategory = s.category?.name.toLowerCase().includes(q);
      return matchesTitle || matchesDescription || matchesCreator || matchesTags || matchesCategory;
    });

    if (formatFilter !== "all") {
      stories = stories.filter((s) => s.format === (formatFilter as StoryFormat));
    }

    return stories;
  }, [query, formatFilter]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">Search</h1>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stories, creators, tags..."
              className="w-full rounded-lg border border-border bg-surface pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Format Filter */}
          <div className="w-full sm:w-48">
            <Select
              options={formatOptions}
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {query.trim() ? (
        <>
          <div className="mb-6 text-sm text-muted">
            {results.length} {results.length === 1 ? "result" : "results"} for &ldquo;
            {query.trim()}&rdquo;
            {formatFilter !== "all" && (
              <span>
                {" "}
                in <span className="text-foreground font-medium">{formatFilter}</span>
              </span>
            )}
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-hover mb-4">
                <Search size={24} className="text-muted" />
              </div>
              <h2 className="text-lg font-semibold mb-2">No results found</h2>
              <p className="text-muted max-w-md mx-auto">
                We couldn&apos;t find any stories matching &ldquo;{query.trim()}&rdquo;.
                Try different keywords or browse our categories.
              </p>
              {formatFilter !== "all" && (
                <button
                  onClick={() => setFormatFilter("all")}
                  className="mt-4 text-accent hover:text-accent-hover transition-colors text-sm cursor-pointer"
                >
                  Clear format filter
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-hover mb-4">
            <Search size={24} className="text-muted" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Search for stories</h2>
          <p className="text-muted max-w-md mx-auto">
            Find stories by title, description, creator name, tags, or category.
          </p>
        </div>
      )}
    </div>
  );
}

function SearchFallback() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <div className="h-10 w-48 bg-surface-hover rounded-lg animate-pulse mb-6" />
        <div className="h-11 w-full bg-surface-hover rounded-lg animate-pulse" />
      </div>
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-hover mb-4">
          <Search size={24} className="text-muted" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Search for stories</h2>
        <p className="text-muted max-w-md mx-auto">
          Find stories by title, description, creator name, tags, or category.
        </p>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchContent />
    </Suspense>
  );
}
