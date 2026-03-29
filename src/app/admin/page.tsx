"use client";

import Link from "next/link";
import { mockReports } from "@/lib/mock-data";
import { formatDate, formatCurrency, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  DollarSign,
  Flag,
  ArrowRight,
  TrendingUp,
  Eye,
} from "lucide-react";

const platformMetrics = [
  {
    label: "Total Users",
    value: formatNumber(12847),
    icon: Users,
    change: "+8.2%",
  },
  {
    label: "Total Stories",
    value: formatNumber(3421),
    icon: BookOpen,
    change: "+12.5%",
  },
  {
    label: "Total Revenue",
    value: formatCurrency(89420),
    icon: DollarSign,
    change: "+15.3%",
  },
  {
    label: "Active Reports",
    value: mockReports.filter((r) => r.status === "pending").length.toString(),
    icon: Flag,
    change: "",
  },
];

const reportStatusVariant: Record<string, "default" | "accent" | "success" | "danger"> = {
  pending: "default",
  reviewed: "accent",
  resolved: "success",
  dismissed: "default",
};

export default function AdminDashboardPage() {
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
              {metric.change && (
                <div className="flex items-center gap-1 mt-1 text-xs text-success">
                  <TrendingUp size={12} />
                  {metric.change} from last month
                </div>
              )}
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
          {mockReports.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted">
              No reports to review.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {mockReports.map((report) => (
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
                      {mockReports.filter((r) => r.status === "pending").length}{" "}
                      pending
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
                <span className="text-muted">Uptime</span>
                <span className="text-success font-medium">99.9%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Avg. Response</span>
                <span className="font-medium">142ms</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted flex items-center gap-1">
                  <Eye size={13} />
                  Views Today
                </span>
                <span className="font-medium">{formatNumber(24300)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">New Signups (24h)</span>
                <span className="font-medium">87</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
