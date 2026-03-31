"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth-store";
import { formatDate, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Report } from "@/lib/types";
import {
  Users,
  BookOpen,
  Flag,
  ArrowRight,
  Eye,
  Loader2,
  FileText,
} from "lucide-react";

interface DashboardMetrics {
  totalUsers: number;
  totalStories: number;
  publishedStories: number;
  pendingReports: number;
}

const reportStatusVariant: Record<string, "default" | "accent" | "success" | "danger"> = {
  pending: "default",
  reviewed: "accent",
  resolved: "success",
  dismissed: "default",
};

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      const supabase = createClient();
      if (!supabase) {
        setError("Database not configured");
        setLoading(false);
        return;
      }

      try {
        // Fetch all metrics in parallel
        const [usersRes, storiesRes, publishedRes, pendingReportsRes, recentReportsRes] =
          await Promise.all([
            supabase.from("profiles").select("id", { count: "exact", head: true }),
            supabase.from("stories").select("id", { count: "exact", head: true }),
            supabase
              .from("stories")
              .select("id", { count: "exact", head: true })
              .eq("status", "published"),
            supabase
              .from("reports")
              .select("id", { count: "exact", head: true })
              .eq("status", "pending"),
            supabase
              .from("reports")
              .select("*, reporter:profiles!reports_reporter_id_fkey(*)")
              .order("created_at", { ascending: false })
              .limit(5),
          ]);

        setMetrics({
          totalUsers: usersRes.count ?? 0,
          totalStories: storiesRes.count ?? 0,
          publishedStories: publishedRes.count ?? 0,
          pendingReports: pendingReportsRes.count ?? 0,
        });

        if (recentReportsRes.data) {
          setRecentReports(recentReportsRes.data as unknown as Report[]);
        }
      } catch {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    if (user?.role === "admin") {
      fetchDashboardData();
    }
  }, [user]);

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted">Access denied. Admin role required.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-danger">{error}</p>
      </div>
    );
  }

  const platformMetrics = [
    {
      label: "Total Users",
      value: formatNumber(metrics?.totalUsers ?? 0),
      icon: Users,
    },
    {
      label: "Total Stories",
      value: formatNumber(metrics?.totalStories ?? 0),
      icon: BookOpen,
    },
    {
      label: "Published Stories",
      value: formatNumber(metrics?.publishedStories ?? 0),
      icon: FileText,
    },
    {
      label: "Pending Reports",
      value: (metrics?.pendingReports ?? 0).toString(),
      icon: Flag,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted mt-1">
          Platform overview and recent activity
        </p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {platformMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="bg-surface border border-border rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted">{metric.label}</span>
                <div className="w-9 h-9 rounded-lg bg-foreground/5 flex items-center justify-center">
                  <Icon size={18} className="text-muted" />
                </div>
              </div>
              <p className="text-2xl font-bold">{metric.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent reports */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold">Recent Reports</h2>
            <Link href="/admin/reports">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
          {recentReports.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted">
              No reports to review.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-start gap-4 px-5 py-4"
                >
                  <div className="w-8 h-8 rounded-full bg-danger/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Flag size={14} className="text-danger" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {report.reporter?.display_name ?? "Unknown"}
                      </span>
                      <span className="text-xs text-muted">
                        reported a {report.target_type}
                      </span>
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
                    </div>
                    <p className="text-sm text-muted mt-1 truncate">
                      {report.reason}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {formatDate(report.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="font-semibold mb-4">Quick Links</h2>
            <div className="space-y-2">
              <Link href="/admin/reports" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-danger/10 flex items-center justify-center">
                    <Flag size={16} className="text-danger" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Reports Management</p>
                    <p className="text-xs text-muted">
                      {metrics?.pendingReports ?? 0} pending
                    </p>
                  </div>
                  <ArrowRight size={14} className="ml-auto text-muted" />
                </div>
              </Link>
              <Link href="/admin/users" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Users size={16} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">User Management</p>
                    <p className="text-xs text-muted">
                      Manage accounts & roles
                    </p>
                  </div>
                  <ArrowRight size={14} className="ml-auto text-muted" />
                </div>
              </Link>
            </div>
          </div>

          {/* Platform summary */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="font-semibold mb-4">Platform Health</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted flex items-center gap-1">
                  <Eye size={13} />
                  Total Users
                </span>
                <span className="font-medium">
                  {formatNumber(metrics?.totalUsers ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Published Stories</span>
                <span className="font-medium">
                  {formatNumber(metrics?.publishedStories ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Draft Stories</span>
                <span className="font-medium">
                  {formatNumber(
                    (metrics?.totalStories ?? 0) -
                      (metrics?.publishedStories ?? 0)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Pending Reports</span>
                <span className="font-medium">
                  {metrics?.pendingReports ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
