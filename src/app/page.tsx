"use client";

import Link from "next/link";
import { mockStories, mockCategories } from "@/lib/mock-data";
import { PLATFORM_NAME, PLATFORM_TAGLINE } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import { StoryCard } from "@/components/story/story-card";
import { Button } from "@/components/ui/button";
import {
  Flame,
  Clock,
  Grid3X3,
  PenTool,
  ArrowRight,
  BookOpen,
  MessageSquare,
  DollarSign,
  Users,
} from "lucide-react";

const trendingStories = [...mockStories]
  .sort((a, b) => b.view_count - a.view_count)
  .slice(0, 6);

const latestStories = [...mockStories]
  .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  .slice(0, 5);

export default function HomePage() {
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
              <Link href="/dashboard">
                <Button variant="secondary" size="lg">
                  <PenTool size={18} />
                  Start Writing
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted">
              <span className="flex items-center gap-2">
                <BookOpen size={16} className="text-accent" />
                {mockStories.length}+ stories
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

      {/* Trending Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Flame size={24} className="text-accent" />
            <h2 className="text-2xl sm:text-3xl font-bold">Trending</h2>
          </div>
          <Link
            href="/browse?sort=trending"
            className="text-sm text-accent hover:text-accent-hover transition-colors flex items-center gap-1"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      </section>

      {/* Latest Updates Section */}
      <section className="bg-surface border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Clock size={24} className="text-accent" />
              <h2 className="text-2xl sm:text-3xl font-bold">Latest Updates</h2>
            </div>
            <Link
              href="/browse?sort=newest"
              className="text-sm text-accent hover:text-accent-hover transition-colors flex items-center gap-1"
            >
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

      {/* Browse by Category Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Grid3X3 size={24} className="text-accent" />
            <h2 className="text-2xl sm:text-3xl font-bold">Browse by Category</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {mockCategories.map((category) => (
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
                <p className="text-sm text-muted mt-1">
                  Rich prose editor or interactive chat-bubble stories
                </p>
              </div>
              <div className="bg-surface/80 backdrop-blur border border-border rounded-xl p-5">
                <DollarSign size={20} className="text-accent mb-3" />
                <h3 className="font-semibold text-sm">Monetization</h3>
                <p className="text-sm text-muted mt-1">
                  Tips, subscriptions, and gated content -- you set the price
                </p>
              </div>
              <div className="bg-surface/80 backdrop-blur border border-border rounded-xl p-5">
                <MessageSquare size={20} className="text-accent mb-3" />
                <h3 className="font-semibold text-sm">Community</h3>
                <p className="text-sm text-muted mt-1">
                  Comments, analytics, and direct connection with your readers
                </p>
              </div>
            </div>
            <div className="mt-10">
              <Link href="/dashboard">
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
