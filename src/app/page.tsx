"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PLATFORM_NAME, PLATFORM_TAGLINE } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import { StoryCard } from "@/components/story/story-card";
import { Button } from "@/components/ui/button";
import { getPublishedStories, getCategories, getReadingHistory } from "@/lib/supabase/queries";
import { useAuthStore } from "@/store/auth-store";
import type { Story, Category, Chapter } from "@/lib/types";
import {
  Flame, Clock, Grid3X3, PenTool, ArrowRight, BookOpen, MessageSquare, DollarSign, Users,
} from "lucide-react";

interface ReadingHistoryItem {
  id: string;
  story: Story;
  chapter: Pick<Chapter, "id" | "title" | "chapter_number"> | null;
}

export default function HomePage() {
  const [trendingStories, setTrendingStories] = useState<Story[]>([]);
  const [latestStories, setLatestStories] = useState<Story[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loaded, setLoaded] = useState(false);

  const user = useAuthStore((s) => s.user);
  const [continueReading, setContinueReading] = useState<ReadingHistoryItem[]>([]);

  useEffect(() => {
    if (user) {
      getReadingHistory(user.id).then((data) => {
        const seen = new Set<string>();
        const unique = (data as ReadingHistoryItem[]).filter((item) => {
          if (!item.story || seen.has(item.story.id)) return false;
          seen.add(item.story.id);
          return true;
        });
        setContinueReading(unique.slice(0, 3));
      });
    }
  }, [user]);

  useEffect(() => {
    async function load() {
      const [trending, latest, cats] = await Promise.all([
        getPublishedStories({ sort: "trending", limit: 6 }),
        getPublishedStories({ sort: "newest", limit: 5 }),
        getCategories(),
      ]);
      setTrendingStories(trending);
      setLatestStories(latest);
      setCategories(cats);
      setLoaded(true);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/10" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              {PLATFORM_TAGLINE}
              <span className="text-accent">.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted leading-relaxed">
              {PLATFORM_NAME} is a platform for adult fiction -- prose and chat-style stories
              crafted by independent creators. Read for free or support the writers you love.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/browse">
                <Button size="lg">
                  <BookOpen size={18} />
                  Browse Stories
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="secondary" size="lg">
                  <PenTool size={18} />
                  Start Writing
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted">
              <span className="flex items-center gap-2">
                <BookOpen size={16} className="text-accent" />
                Community-driven stories
              </span>
              <span className="flex items-center gap-2">
                <Users size={16} className="text-accent" />
                Growing creator community
              </span>
              <span className="flex items-center gap-2">
                <DollarSign size={16} className="text-accent" />
                Direct creator tipping
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Continue Reading Section */}
      {continueReading.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen size={20} className="text-accent" />
            <h2 className="text-xl font-bold">Continue Reading</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {continueReading.map((item) => (
              <Link
                key={item.id}
                href={`/story/${item.story.slug}/${item.chapter?.chapter_number || 1}`}
                className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl hover:border-accent/30 transition-all"
              >
                <div className="w-10 h-14 rounded bg-accent/10 flex items-center justify-center shrink-0">
                  <BookOpen size={16} className="text-accent/60" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.story.title}</p>
                  {item.chapter && (
                    <p className="text-xs text-muted">Ch. {item.chapter.chapter_number}: {item.chapter.title}</p>
                  )}
                  <p className="text-[10px] text-muted">{item.story.creator?.display_name}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending Section */}
      {loaded && trendingStories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Flame size={24} className="text-accent" />
              <h2 className="text-2xl sm:text-3xl font-bold">Trending</h2>
            </div>
            <Link href="/browse?sort=trending" className="text-sm text-accent hover:text-accent-hover transition-colors flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>
      )}

      {/* Latest Updates Section */}
      {loaded && latestStories.length > 0 && (
        <section className="bg-surface border-y border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Clock size={24} className="text-accent" />
                <h2 className="text-2xl sm:text-3xl font-bold">Latest Updates</h2>
              </div>
              <Link href="/browse?sort=newest" className="text-sm text-accent hover:text-accent-hover transition-colors flex items-center gap-1">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="space-y-1">
              {latestStories.map((story) => (
                <StoryCard key={story.id} story={story} variant="compact" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty state for new platform */}
      {loaded && trendingStories.length === 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <BookOpen size={48} className="text-muted mx-auto mb-4 opacity-40" />
          <h2 className="text-2xl font-bold mb-2">No stories yet</h2>
          <p className="text-muted mb-6">Be the first to publish a story on {PLATFORM_NAME}.</p>
          <Link href="/signup">
            <Button size="lg">
              <PenTool size={18} />
              Start Writing
            </Button>
          </Link>
        </section>
      )}

      {/* Browse by Category Section */}
      {loaded && categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Grid3X3 size={24} className="text-accent" />
              <h2 className="text-2xl sm:text-3xl font-bold">Browse by Category</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/browse/${category.slug}`}
                className="group block p-4 sm:p-5 bg-surface border border-border rounded-xl hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all"
              >
                <h3 className="font-semibold group-hover:text-accent transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-muted mt-1">
                  {formatNumber(category.story_count)} stories
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* For Creators Section */}
      <section className="bg-gradient-to-br from-accent/5 via-accent/10 to-accent/5 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <PenTool size={14} />
              For Creators
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Share your stories, earn from your craft
            </h2>
            <p className="mt-4 text-lg text-muted leading-relaxed">
              Write in prose or chat-bubble format. Gate premium chapters behind subscriptions.
              Receive tips directly from readers who love your work. Keep 85% of everything you earn.
            </p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className="bg-surface/80 backdrop-blur border border-border rounded-xl p-5">
                <BookOpen size={20} className="text-accent mb-3" />
                <h3 className="font-semibold text-sm">Two Formats</h3>
                <p className="text-sm text-muted mt-1">Rich prose editor or interactive chat-bubble stories</p>
              </div>
              <div className="bg-surface/80 backdrop-blur border border-border rounded-xl p-5">
                <DollarSign size={20} className="text-accent mb-3" />
                <h3 className="font-semibold text-sm">Monetization</h3>
                <p className="text-sm text-muted mt-1">Tips, subscriptions, and gated content -- you set the price</p>
              </div>
              <div className="bg-surface/80 backdrop-blur border border-border rounded-xl p-5">
                <MessageSquare size={20} className="text-accent mb-3" />
                <h3 className="font-semibold text-sm">Community</h3>
                <p className="text-sm text-muted mt-1">Comments, analytics, and direct connection with your readers</p>
              </div>
            </div>
            <div className="mt-10">
              <Link href="/signup">
                <Button size="lg">
                  Start Creating
                  <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
