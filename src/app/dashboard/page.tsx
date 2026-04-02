"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { getMyStories } from "@/lib/supabase/queries";
import { toast } from "@/components/ui/toast";
import type { Story } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import { PenTool, BookOpen, Eye, DollarSign, Plus, ShieldCheck } from "lucide-react";
import { VerifyButton } from "@/components/monetization/verify-button";

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [stories, setStories] = useState<Story[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [retryCount, setRetryCount] = useState(0);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getMyStories(user.id)
      .then((data) => { if (!cancelled) { setError(null); setStories(data); setLoaded(true); } })
      .catch(() => { if (!cancelled) { setError("Failed to load stories"); setLoaded(true); } });
    return () => { cancelled = true; };
  }, [user, retryCount]);

  // Auto-check verification status if not verified
  useEffect(() => {
    if (!user || user.is_verified) return;
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch("/api/veriff/check", { method: "POST" });
        const data = await res.json();
        if (!cancelled && data.verified) {
          await refreshProfile();
          toast("success", "Identity verified!");
        }
      } catch {
        // silently fail
      }
    };
    // Check once on load, then every 10 seconds for 2 minutes
    check();
    const interval = setInterval(check, 10000);
    const timeout = setTimeout(() => clearInterval(interval), 120000);
    return () => { cancelled = true; clearInterval(interval); clearTimeout(timeout); };
  }, [user, refreshProfile]);

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Creator Dashboard</h1>
        <p className="text-muted mb-6">Log in as a creator to access your dashboard.</p>
        <Link href="/login"><Button>Log in</Button></Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-danger mb-4">{error}</p>
        <button onClick={() => setRetryCount(c => c + 1)} className="text-accent hover:underline text-sm cursor-pointer">
          Try again
        </button>
      </div>
    );
  }

  const totalViews = stories.reduce((sum: number, s: Story) => sum + (s.view_count || 0), 0);
  const publishedCount = stories.filter((s) => s.status === "published").length;
  const draftCount = stories.filter((s) => s.status === "draft").length;

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user.display_name}</h1>
          <p className="text-muted text-sm mt-1">Manage your stories and track performance</p>
        </div>
        <Link href="/dashboard/stories/new">
          <Button><Plus size={16} /> New Story</Button>
        </Link>
      </div>

      {user.role === "creator" && !user.is_verified && (
        <div className="flex items-center gap-4 p-4 bg-accent/5 border border-accent/20 rounded-xl">
          <ShieldCheck size={24} className="text-accent shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-sm">Verify your identity to publish</p>
            <p className="text-xs text-muted">Required for 2257 compliance before your first publication.</p>
          </div>
          <VerifyButton />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <BookOpen size={20} className="text-accent mx-auto mb-2" />
          <span className="text-2xl font-bold block">{publishedCount}</span>
          <span className="text-xs text-muted">Published</span>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <PenTool size={20} className="text-accent mx-auto mb-2" />
          <span className="text-2xl font-bold block">{draftCount}</span>
          <span className="text-xs text-muted">Drafts</span>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <Eye size={20} className="text-accent mx-auto mb-2" />
          <span className="text-2xl font-bold block">{formatNumber(totalViews)}</span>
          <span className="text-xs text-muted">Total Views</span>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <DollarSign size={20} className="text-accent mx-auto mb-2" />
          <span className="text-2xl font-bold block">$0</span>
          <span className="text-xs text-muted">Earnings</span>
        </div>
      </div>

      {/* Recent Stories */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Your Stories</h2>
          <Link href="/dashboard/stories" className="text-sm text-accent hover:underline">View all</Link>
        </div>
        {!loaded ? (
          <div className="p-8 text-center text-muted">Loading...</div>
        ) : stories.length === 0 ? (
          <div className="p-8 text-center">
            <BookOpen size={32} className="text-muted mx-auto mb-3 opacity-40" />
            <p className="text-muted mb-4">You haven&apos;t created any stories yet.</p>
            <Link href="/dashboard/stories/new"><Button size="sm"><Plus size={14} /> Create Your First Story</Button></Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {stories.slice(0, 5).map((story) => (
              <Link
                key={story.id}
                href={`/dashboard/stories/${story.id}/edit`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-surface-hover transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{story.title}</p>
                  <p className="text-xs text-muted mt-0.5">{story.format} &middot; {story.status} &middot; {story.chapter_count} chapters</p>
                </div>
                <span className="text-xs text-muted shrink-0">{formatNumber(story.view_count)} views</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
