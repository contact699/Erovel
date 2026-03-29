"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { StoryCard } from "@/components/story/story-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchStories } from "@/lib/supabase/queries";
import { Search as SearchIcon } from "lucide-react";

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  async function handleSearch(q?: string) {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    const data = await searchStories(searchQuery.trim());
    setResults(data);
    setSearched(true);
    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-3xl font-bold mb-6">Search Stories</h1>

      <div className="flex gap-3 mb-8">
        <div className="flex-1">
          <Input
            id="search"
            placeholder="Search by title or description..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
          />
        </div>
        <Button onClick={() => handleSearch()} loading={loading}>
          <SearchIcon size={16} />
          Search
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted">Searching...</div>
      ) : searched && results.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-muted">No stories found for &quot;{query}&quot;</p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-muted mb-4">{results.length} result{results.length !== 1 ? "s" : ""}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {results.map((story: any) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
