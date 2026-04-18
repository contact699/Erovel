"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import {
  formatRelativeDate,
  formatNumber,
  formatCurrency,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  Flag,
  ArrowRight,
  Eye,
  FileText,
  MessageSquare,
  Bookmark,
  UserCheck,
  UserPlus,
  DollarSign,
  TrendingUp,
  Heart,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ImageIcon,
} from "lucide-react";

// --- Types ---

interface AdminCounts {
  totalUsers: number;
  totalCreators: number;
  totalReaders: number;
  verifiedCreators: number;
  totalStories: number;
  publishedStories: number;
  draftStories: number;
  totalChapters: number;
  totalComments: number;
  totalBookmarks: number;
  totalFollows: number;
  pendingReports: number;
  totalViews: number;
  totalTipRevenue: number;
  platformCut: number;
}

interface RecentSignup {
  id: string;
  username: string;
  display_name: string;
  role: string;
  is_verified: boolean;
  created_at: string;
}

interface RecentStory {
  id: string;
  title: string;
  slug: string;
  format: string;
  status: string;
  view_count: number;
  creator_id: string;
  created_at: string;
  creator: { username: string; display_name: string } | null;
}

interface TopStory {
  id: string;
  title: string;
  slug: string;
  view_count: number;
  tip_total: number;
  comment_count: number;
  creator: { username: string; display_name: string } | null;
}

interface RecentReport {
  id: string;
  target_type: string;
  reason: string;
  status: string;
  created_at: string;
  reporter: { username: string } | null;
}

interface AdminStats {
  counts: AdminCounts;
  recentSignups: RecentSignup[];
  recentStories: RecentStory[];
  topStories: TopStory[];
  recentReports: RecentReport[];
  signupHistory: { created_at: string }[];
  viewHistory: { viewed_at: string }[];
}

// --- Helpers ---

const reportStatusVariant: Record<
  string,
  "default" | "accent" | "success" | "danger"
> = {
  pending: "default",
  reviewed: "accent",
  resolved: "success",
  dismissed: "default",
};

function aggregateByDay(
  items: { created_at?: string; viewed_at?: string }[],
  dateField: "created_at" | "viewed_at",
  days: number
): { label: string; count: number }[] {
  const now = new Date();
  const buckets: Record<string, number> = {};

  // Initialize all days
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    buckets[key] = 0;
  }

  // Fill counts
  for (const item of items) {
    const raw = (item as Record<string, string>)[dateField];
    if (!raw) continue;
    const key = new Date(raw).toISOString().split("T")[0];
    if (key in buckets) {
      buckets[key]++;
    }
  }

  return Object.entries(buckets).map(([date, count]) => ({
    label: new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    count,
  }));
}

// --- Simple Bar Chart ---

function MiniBarChart({
  data,
  color = "bg-accent",
  label,
}: {
  data: { label: string; count: number }[];
  color?: string;
  label: string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-muted" />
          <h3 className="font-semibold text-sm">{label}</h3>
        </div>
        <span className="text-xs text-muted">{total} total</span>
      </div>
      <div className="flex items-end gap-1 h-32">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-end gap-1 group relative"
          >
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 hidden group-hover:block z-10">
              <div className="bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap">
                {d.label}: {d.count}
              </div>
            </div>
            <div
              className={`w-full rounded-t ${color} transition-all min-h-[2px]`}
              style={{
                height: `${(d.count / max) * 100}%`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-muted">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

// --- Skeleton ---

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-7 w-40 bg-surface-hover rounded" />
        <div className="h-4 w-64 bg-surface-hover rounded mt-2" />
      </div>

      {/* Metric card skeletons */}
      {[0, 1, 2, 3].map((row) => (
        <div
          key={row}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[0, 1, 2, 3].map((col) => (
            <div
              key={col}
              className="bg-surface border border-border rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-3 w-20 bg-surface-hover rounded" />
                <div className="w-9 h-9 rounded-lg bg-surface-hover" />
              </div>
              <div className="h-7 w-16 bg-surface-hover rounded" />
            </div>
          ))}
        </div>
      ))}

      {/* Chart skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl p-5 h-52" />
        <div className="bg-surface border border-border rounded-xl p-5 h-52" />
      </div>

      {/* Table skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-xl h-64"
          />
        ))}
      </div>
    </div>
  );
}

// --- Main Component ---

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [rehosting, setRehosting] = useState(false);
  const [rehostResult, setRehostResult] = useState<{
    summary?: {
      imagesRehosted: number;
      imagesFailed: number;
      imagesBlocked: number;
      chaptersUpdated: number;
      coversUpdated: number;
    };
    log?: string[];
    error?: string;
  } | null>(null);

  async function runRehost() {
    setRehosting(true);
    setRehostResult(null);
    try {
      const res = await fetch("/api/admin/rehost-migrate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setRehostResult({ error: data.error || `HTTP ${res.status}` });
      } else {
        setRehostResult(data);
      }
    } catch (err) {
      setRehostResult({
        error: err instanceof Error ? err.message : "Request failed",
      });
    } finally {
      setRehosting(false);
    }
  }

  async function fetchStats(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data: AdminStats = await res.json();
      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (user?.role === "admin") {
      fetchStats();
    }
  }, [user]);

  // Chart data
  const signupChartData = useMemo(
    () =>
      stats
        ? aggregateByDay(stats.signupHistory, "created_at", 14)
        : [],
    [stats]
  );

  const viewChartData = useMemo(
    () =>
      stats
        ? aggregateByDay(stats.viewHistory, "viewed_at", 14)
        : [],
    [stats]
  );

  // --- Guards ---

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted">Access denied. Admin role required.</p>
      </div>
    );
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertTriangle size={24} className="text-danger" />
        <p className="text-sm text-danger">{error}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchStats()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  const { counts } = stats;

  // --- Metric card definitions ---

  const metricRows = [
    // Row 1: Users
    {
      title: "Users",
      metrics: [
        {
          label: "Total Users",
          value: formatNumber(counts.totalUsers),
          icon: Users,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
          href: "/admin/users",
        },
        {
          label: "Creators",
          value: formatNumber(counts.totalCreators),
          icon: UserPlus,
          color: "text-purple-500",
          bg: "bg-purple-500/10",
          href: "/admin/users",
        },
        {
          label: "Verified Creators",
          value: formatNumber(counts.verifiedCreators),
          icon: UserCheck,
          color: "text-green-500",
          bg: "bg-green-500/10",
          href: "/admin/users",
        },
        {
          label: "Readers",
          value: formatNumber(counts.totalReaders),
          icon: Eye,
          color: "text-cyan-500",
          bg: "bg-cyan-500/10",
          href: "/admin/users",
        },
      ],
    },
    // Row 2: Content
    {
      title: "Content",
      metrics: [
        {
          label: "Total Stories",
          value: formatNumber(counts.totalStories),
          icon: BookOpen,
          color: "text-indigo-500",
          bg: "bg-indigo-500/10",
          href: "/admin/stories",
        },
        {
          label: "Published",
          value: formatNumber(counts.publishedStories),
          icon: FileText,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
          href: "/admin/stories?status=published",
        },
        {
          label: "Drafts",
          value: formatNumber(counts.draftStories),
          icon: FileText,
          color: "text-amber-500",
          bg: "bg-amber-500/10",
          href: "/admin/stories?status=draft",
        },
        {
          label: "Chapters",
          value: formatNumber(counts.totalChapters),
          icon: FileText,
          color: "text-sky-500",
          bg: "bg-sky-500/10",
          href: "/admin/stories",
        },
      ],
    },
    // Row 3: Engagement
    {
      title: "Engagement",
      metrics: [
        {
          label: "Total Views",
          value: formatNumber(counts.totalViews),
          icon: TrendingUp,
          color: "text-rose-500",
          bg: "bg-rose-500/10",
          href: "/admin/stories",
        },
        {
          label: "Comments",
          value: formatNumber(counts.totalComments),
          icon: MessageSquare,
          color: "text-orange-500",
          bg: "bg-orange-500/10",
          href: "/admin/stories",
        },
        {
          label: "Bookmarks",
          value: formatNumber(counts.totalBookmarks),
          icon: Bookmark,
          color: "text-yellow-500",
          bg: "bg-yellow-500/10",
          href: "/admin/stories",
        },
        {
          label: "Follows",
          value: formatNumber(counts.totalFollows),
          icon: Heart,
          color: "text-pink-500",
          bg: "bg-pink-500/10",
          href: "/admin/users",
        },
      ],
    },
    // Row 4: Revenue & Reports
    {
      title: "Revenue & Moderation",
      metrics: [
        {
          label: "Total Tips",
          value: formatCurrency(counts.totalTipRevenue),
          icon: DollarSign,
          color: "text-green-600",
          bg: "bg-green-600/10",
          href: "/admin/stories",
        },
        {
          label: "Platform Cut (15%)",
          value: formatCurrency(counts.platformCut),
          icon: DollarSign,
          color: "text-teal-500",
          bg: "bg-teal-500/10",
          href: "/admin/stories",
        },
        {
          label: "Pending Reports",
          value: counts.pendingReports.toString(),
          icon: Flag,
          color:
            counts.pendingReports > 0 ? "text-red-500" : "text-muted",
          bg:
            counts.pendingReports > 0
              ? "bg-red-500/10"
              : "bg-foreground/5",
          href: "/admin/reports",
        },
        {
          label: "Creator Verify Rate",
          value:
            counts.totalCreators > 0
              ? `${Math.round((counts.verifiedCreators / counts.totalCreators) * 100)}%`
              : "0%",
          icon: CheckCircle,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
          href: "/admin/users",
        },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted mt-1">
            Comprehensive platform overview and monitoring
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchStats(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={14}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </Button>
      </div>

      {/* ===== ROW 1-4: Metric Cards ===== */}
      {metricRows.map((row) => (
        <div key={row.title}>
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
            {row.title}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {row.metrics.map((metric) => {
              const Icon = metric.icon;
              const inner = (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted">{metric.label}</span>
                    <div
                      className={`w-9 h-9 rounded-lg ${metric.bg} flex items-center justify-center`}
                    >
                      <Icon size={18} className={metric.color} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{metric.value}</p>
                </>
              );
              return metric.href ? (
                <Link
                  key={metric.label}
                  href={metric.href}
                  className="bg-surface border border-border rounded-xl p-5 hover:bg-surface-hover transition-colors block"
                >
                  {inner}
                </Link>
              ) : (
                <div
                  key={metric.label}
                  className="bg-surface border border-border rounded-xl p-5"
                >
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* ===== ROW 5: Charts ===== */}
      <div>
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
          Trends (Last 14 Days)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MiniBarChart
            data={signupChartData}
            color="bg-blue-500"
            label="Daily Signups"
          />
          <MiniBarChart
            data={viewChartData}
            color="bg-rose-500"
            label="Daily Views"
          />
        </div>
      </div>

      {/* ===== ROW 6: Tables ===== */}
      <div>
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
          Recent Activity
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Signups */}
          <div className="bg-surface border border-border rounded-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm">Recent Signups</h3>
              <Link href="/admin/users">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
            {stats.recentSignups.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted">
                No recent signups.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-hover/50">
                      <th className="text-left font-medium text-muted px-4 py-2.5">
                        User
                      </th>
                      <th className="text-left font-medium text-muted px-4 py-2.5">
                        Role
                      </th>
                      <th className="text-left font-medium text-muted px-4 py-2.5">
                        Verified
                      </th>
                      <th className="text-left font-medium text-muted px-4 py-2.5">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats.recentSignups.slice(0, 8).map((signup) => (
                      <tr
                        key={signup.id}
                        className="hover:bg-surface-hover/30 transition-colors"
                      >
                        <td className="px-4 py-2.5">
                          <div>
                            <p className="font-medium text-sm">
                              {signup.display_name}
                            </p>
                            <p className="text-xs text-muted">
                              @{signup.username}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge
                            variant={
                              signup.role === "creator"
                                ? "accent"
                                : signup.role === "admin"
                                  ? "danger"
                                  : "default"
                            }
                          >
                            {signup.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          {signup.is_verified ? (
                            <CheckCircle
                              size={14}
                              className="text-success"
                            />
                          ) : (
                            <span className="text-xs text-muted">No</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-muted whitespace-nowrap text-xs">
                          {formatRelativeDate(signup.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top Stories */}
          <div className="bg-surface border border-border rounded-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm">Top Stories</h3>
              <Link href="/admin/stories">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
            {stats.topStories.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted">
                No published stories yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-hover/50">
                      <th className="text-left font-medium text-muted px-4 py-2.5">
                        Title
                      </th>
                      <th className="text-left font-medium text-muted px-4 py-2.5">
                        Creator
                      </th>
                      <th className="text-right font-medium text-muted px-4 py-2.5">
                        Views
                      </th>
                      <th className="text-right font-medium text-muted px-4 py-2.5">
                        Tips
                      </th>
                      <th className="text-right font-medium text-muted px-4 py-2.5">
                        Comments
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats.topStories.slice(0, 8).map((story) => (
                      <tr
                        key={story.id}
                        className="hover:bg-surface-hover/30 transition-colors"
                      >
                        <td className="px-4 py-2.5 max-w-[180px]">
                          <Link
                            href={`/admin/stories/${story.id}`}
                            className="font-medium text-sm hover:text-accent transition-colors truncate block"
                          >
                            {story.title}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-muted text-xs whitespace-nowrap">
                          @{story.creator?.username ?? "unknown"}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {formatNumber(story.view_count)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {formatCurrency(story.tip_total)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {story.comment_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Stories */}
          <div className="bg-surface border border-border rounded-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm">Recent Stories</h3>
              <Link href="/admin/stories">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
            {stats.recentStories.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted">
                No stories yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-hover/50">
                      <th className="text-left font-medium text-muted px-4 py-2.5">
                        Title
                      </th>
                      <th className="text-left font-medium text-muted px-4 py-2.5">
                        Creator
                      </th>
                      <th className="text-left font-medium text-muted px-4 py-2.5">
                        Format
                      </th>
                      <th className="text-left font-medium text-muted px-4 py-2.5">
                        Status
                      </th>
                      <th className="text-left font-medium text-muted px-4 py-2.5">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats.recentStories.slice(0, 8).map((story) => (
                      <tr
                        key={story.id}
                        className="hover:bg-surface-hover/30 transition-colors"
                      >
                        <td className="px-4 py-2.5 max-w-[180px]">
                          <Link
                            href={`/admin/stories/${story.id}`}
                            className="font-medium text-sm hover:text-accent transition-colors truncate block"
                          >
                            {story.title}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-muted text-xs whitespace-nowrap">
                          @{story.creator?.username ?? "unknown"}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge
                            variant={
                              story.format === "chat" ? "accent" : "default"
                            }
                          >
                            {story.format}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge
                            variant={
                              story.status === "published"
                                ? "success"
                                : story.status === "draft"
                                  ? "default"
                                  : "accent"
                            }
                            className={
                              story.status === "draft"
                                ? "bg-yellow-500/10 text-yellow-600"
                                : undefined
                            }
                          >
                            {story.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-muted whitespace-nowrap text-xs">
                          {formatRelativeDate(story.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Reports */}
          <div className="bg-surface border border-border rounded-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm">Recent Reports</h3>
              <Link href="/admin/reports">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
            {stats.recentReports.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted">
                No reports to review.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-hover/50">
                      <th className="text-left font-medium text-muted px-4 py-2.5">
                        Reporter
                      </th>
                      <th className="text-left font-medium text-muted px-4 py-2.5">
                        Type
                      </th>
                      <th className="text-left font-medium text-muted px-4 py-2.5">
                        Reason
                      </th>
                      <th className="text-left font-medium text-muted px-4 py-2.5">
                        Status
                      </th>
                      <th className="text-left font-medium text-muted px-4 py-2.5">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats.recentReports.map((report) => (
                      <tr
                        key={report.id}
                        className="hover:bg-surface-hover/30 transition-colors"
                      >
                        <td className="px-4 py-2.5 text-sm whitespace-nowrap">
                          @{report.reporter?.username ?? "unknown"}
                        </td>
                        <td className="px-4 py-2.5 capitalize text-muted">
                          {report.target_type}
                        </td>
                        <td className="px-4 py-2.5 max-w-[200px] truncate text-muted">
                          {report.reason}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge
                            variant={reportStatusVariant[report.status]}
                            className={
                              report.status === "pending"
                                ? "bg-yellow-500/10 text-yellow-600"
                                : report.status === "dismissed"
                                  ? "bg-foreground/5 text-muted"
                                  : undefined
                            }
                          >
                            {report.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-muted whitespace-nowrap text-xs">
                          {formatRelativeDate(report.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== Maintenance ===== */}
      <div>
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
          Maintenance
        </h2>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <ImageIcon size={18} className="text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Re-host imgchest images</p>
              <p className="text-xs text-muted mt-1">
                Download any remaining imgchest.com URLs in chapter content and
                story covers, moderate them, and re-upload to BunnyCDN. Safe to
                re-run — only rows still pointing at imgchest are processed.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={runRehost}
                  disabled={rehosting}
                >
                  <RefreshCw
                    size={14}
                    className={rehosting ? "animate-spin" : ""}
                  />
                  {rehosting ? "Running…" : "Run migration"}
                </Button>
                {rehosting && (
                  <span className="text-xs text-muted">
                    This may take a while if many images need downloading.
                  </span>
                )}
              </div>

              {rehostResult?.error && (
                <div className="mt-4 text-sm text-danger">
                  {rehostResult.error}
                </div>
              )}

              {rehostResult?.summary && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div className="bg-surface-hover rounded-lg p-3">
                      <p className="text-muted">Re-hosted</p>
                      <p className="text-lg font-bold text-success mt-1">
                        {rehostResult.summary.imagesRehosted}
                      </p>
                    </div>
                    <div className="bg-surface-hover rounded-lg p-3">
                      <p className="text-muted">Failed</p>
                      <p className="text-lg font-bold text-danger mt-1">
                        {rehostResult.summary.imagesFailed}
                      </p>
                    </div>
                    <div className="bg-surface-hover rounded-lg p-3">
                      <p className="text-muted">Blocked</p>
                      <p className="text-lg font-bold text-amber-500 mt-1">
                        {rehostResult.summary.imagesBlocked}
                      </p>
                    </div>
                    <div className="bg-surface-hover rounded-lg p-3">
                      <p className="text-muted">Chapters updated</p>
                      <p className="text-lg font-bold mt-1">
                        {rehostResult.summary.chaptersUpdated}
                      </p>
                    </div>
                    <div className="bg-surface-hover rounded-lg p-3">
                      <p className="text-muted">Covers updated</p>
                      <p className="text-lg font-bold mt-1">
                        {rehostResult.summary.coversUpdated}
                      </p>
                    </div>
                  </div>
                  {rehostResult.log && rehostResult.log.length > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted hover:text-foreground">
                        View log ({rehostResult.log.length} entries)
                      </summary>
                      <pre className="mt-2 p-3 bg-surface-hover rounded-lg overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-all">
                        {rehostResult.log.join("\n")}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Quick Links ===== */}
      <div>
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
          Quick Links
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/reports" className="block">
            <div className="flex items-center gap-4 p-5 bg-surface border border-border rounded-xl hover:bg-surface-hover transition-colors">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                <Flag size={18} className="text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Reports Management</p>
                <p className="text-xs text-muted">
                  {counts.pendingReports} pending
                </p>
              </div>
              <ArrowRight size={16} className="text-muted shrink-0" />
            </div>
          </Link>
          <Link href="/admin/users" className="block">
            <div className="flex items-center gap-4 p-5 bg-surface border border-border rounded-xl hover:bg-surface-hover transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Users size={18} className="text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">User Management</p>
                <p className="text-xs text-muted">
                  {formatNumber(counts.totalUsers)} accounts
                </p>
              </div>
              <ArrowRight size={16} className="text-muted shrink-0" />
            </div>
          </Link>
          <Link href="/admin/stories" className="block">
            <div className="flex items-center gap-4 p-5 bg-surface border border-border rounded-xl hover:bg-surface-hover transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                <BookOpen size={18} className="text-indigo-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">All Stories</p>
                <p className="text-xs text-muted">
                  {formatNumber(counts.totalStories)} stories (moderation)
                </p>
              </div>
              <ArrowRight size={16} className="text-muted shrink-0" />
            </div>
          </Link>
          <Link href="/browse" className="block">
            <div className="flex items-center gap-4 p-5 bg-surface border border-border rounded-xl hover:bg-surface-hover transition-colors">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                <BookOpen size={18} className="text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Browse Stories</p>
                <p className="text-xs text-muted">
                  {formatNumber(counts.publishedStories)} published
                </p>
              </div>
              <ArrowRight size={16} className="text-muted shrink-0" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
