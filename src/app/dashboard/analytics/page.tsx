"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { getCreatorAnalytics } from "@/lib/supabase/queries";
import type { Story } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatCurrency } from "@/lib/utils";
import {
  BarChart3,
  Eye,
  DollarSign,
  MessageCircle,
  TrendingUp,
  Loader2,
} from "lucide-react";

interface DailyView {
  viewed_at: string;
  story_id: string;
}

export default function AnalyticsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [stories, setStories] = useState<Story[]>([]);
  const [dailyViews, setDailyViews] = useState<DailyView[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getCreatorAnalytics(user.id)
      .then((data) => {
        if (!cancelled) {
          setError(null);
          if (data) {
            setStories(data.stories);
            setDailyViews(data.dailyViews);
          }
          setLoaded(true);
        }
      })
      .catch(() => { if (!cancelled) { setError("Failed to load analytics"); setLoaded(true); } });
    return () => { cancelled = true; };
  }, [user, retryCount]);

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Analytics</h1>
        <p className="text-muted mb-6">Log in to view your analytics.</p>
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

  const totalViews = stories.reduce((sum, s) => sum + (s.view_count || 0), 0);
  const totalTips = stories.reduce((sum, s) => sum + Number(s.tip_total || 0), 0);
  const totalComments = stories.reduce((sum, s) => sum + (s.comment_count || 0), 0);

  // Build last 30 days chart data
  const chartData: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const count = dailyViews.filter((v) => v.viewed_at === dateStr).length;
    chartData.push({ date: dateStr, count });
  }
  const maxViews = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted text-sm mt-1">Track your content performance</p>
      </div>

      {!loaded ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-muted" />
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface border border-border rounded-xl p-4 text-center">
              <Eye size={20} className="text-accent mx-auto mb-2" />
              <span className="text-2xl font-bold block">{formatNumber(totalViews)}</span>
              <span className="text-xs text-muted">Total Views</span>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 text-center">
              <DollarSign size={20} className="text-accent mx-auto mb-2" />
              <span className="text-2xl font-bold block">{formatCurrency(totalTips)}</span>
              <span className="text-xs text-muted">Total Tips</span>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 text-center">
              <MessageCircle size={20} className="text-accent mx-auto mb-2" />
              <span className="text-2xl font-bold block">{formatNumber(totalComments)}</span>
              <span className="text-xs text-muted">Comments</span>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 text-center">
              <TrendingUp size={20} className="text-accent mx-auto mb-2" />
              <span className="text-2xl font-bold block">{stories.length}</span>
              <span className="text-xs text-muted">Stories</span>
            </div>
          </div>

          {/* Views chart */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-accent" />
              <h2 className="font-semibold">Views — Last 30 Days</h2>
            </div>
            <div className="flex items-end gap-[2px] h-32">
              {chartData.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full" title={`${d.date}: ${d.count} views`}>
                  <div
                    className="w-full bg-accent/70 rounded-t-sm min-h-[2px] transition-all"
                    style={{ height: `${(d.count / maxViews) * 100}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted">
              <span>{chartData[0]?.date.slice(5)}</span>
              <span>{chartData[chartData.length - 1]?.date.slice(5)}</span>
            </div>
          </div>

          {/* Stories table */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold">Story Performance</h2>
            </div>
            {stories.length === 0 ? (
              <div className="p-8 text-center text-muted">No stories yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted">
                      <th className="px-5 py-3 font-medium">Story</th>
                      <th className="px-3 py-3 font-medium text-right">Views</th>
                      <th className="px-3 py-3 font-medium text-right">Tips</th>
                      <th className="px-3 py-3 font-medium text-right">Comments</th>
                      <th className="px-3 py-3 font-medium">Format</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stories.map((story) => (
                      <tr key={story.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-5 py-3">
                          <Link href={`/story/${story.slug}`} className="font-medium hover:text-accent transition-colors">
                            {story.title}
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-right text-muted">{formatNumber(story.view_count)}</td>
                        <td className="px-3 py-3 text-right text-muted">{formatCurrency(Number(story.tip_total))}</td>
                        <td className="px-3 py-3 text-right text-muted">{story.comment_count}</td>
                        <td className="px-3 py-3">
                          <Badge variant={story.format === "chat" ? "accent" : "default"}>{story.format}</Badge>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant={story.status === "published" ? "success" : "default"}>{story.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
