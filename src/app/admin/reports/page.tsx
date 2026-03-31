"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth-store";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { Report, ReportStatus } from "@/lib/types";
import {
  Flag,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
} from "lucide-react";

const statusFilterOptions = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

function getStatusBadge(status: ReportStatus) {
  switch (status) {
    case "pending":
      return (
        <Badge className="bg-yellow-500/10 text-yellow-600">pending</Badge>
      );
    case "reviewed":
      return <Badge variant="accent">reviewed</Badge>;
    case "resolved":
      return <Badge variant="success">resolved</Badge>;
    case "dismissed":
      return (
        <Badge className="bg-foreground/5 text-muted">dismissed</Badge>
      );
  }
}

export default function AdminReportsPage() {
  const { user } = useAuthStore();
  const [reports, setReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) {
      setError("Database not configured");
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("reports")
        .select("*, reporter:profiles!reports_reporter_id_fkey(*)")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setReports((data ?? []) as unknown as Report[]);
    } catch {
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (user?.role === "admin") {
      setLoading(true);
      fetchReports();
    }
  }, [user, fetchReports]);

  async function updateReportStatus(id: string, status: ReportStatus) {
    const supabase = createClient();
    if (!supabase) return;

    setUpdating(id);
    try {
      const { error: updateError } = await supabase
        .from("reports")
        .update({ status })
        .eq("id", id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Update local state
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch {
      setError("Failed to update report");
    } finally {
      setUpdating(null);
    }
  }

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
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-sm text-danger">{error}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setError(null);
            setLoading(true);
            fetchReports();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted mt-1">
            Review and manage user reports
          </p>
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={statusFilterOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Reports table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-hover/50">
                <th className="text-left font-medium text-muted px-5 py-3">
                  Reporter
                </th>
                <th className="text-left font-medium text-muted px-5 py-3">
                  Target Type
                </th>
                <th className="text-left font-medium text-muted px-5 py-3">
                  Target
                </th>
                <th className="text-left font-medium text-muted px-5 py-3">
                  Reason
                </th>
                <th className="text-left font-medium text-muted px-5 py-3">
                  Status
                </th>
                <th className="text-left font-medium text-muted px-5 py-3">
                  Date
                </th>
                <th className="text-right font-medium text-muted px-5 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reports.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-muted"
                  >
                    No reports found.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <>
                    <tr
                      key={report.id}
                      className="hover:bg-surface-hover/30 transition-colors cursor-pointer"
                      onClick={() =>
                        setExpandedId(
                          expandedId === report.id ? null : report.id
                        )
                      }
                    >
                      <td className="px-5 py-3 font-medium">
                        {report.reporter?.display_name ?? "Unknown"}
                      </td>
                      <td className="px-5 py-3">
                        <span className="capitalize">{report.target_type}</span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-muted">
                        {report.target_id}
                      </td>
                      <td className="px-5 py-3 max-w-[200px] truncate">
                        {report.reason}
                      </td>
                      <td className="px-5 py-3">
                        {getStatusBadge(report.status)}
                      </td>
                      <td className="px-5 py-3 text-muted whitespace-nowrap">
                        {formatDate(report.created_at)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateReportStatus(report.id, "reviewed");
                            }}
                            disabled={
                              report.status !== "pending" ||
                              updating === report.id
                            }
                            title="Review"
                          >
                            {updating === report.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Eye size={14} />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateReportStatus(report.id, "resolved");
                            }}
                            disabled={
                              report.status === "resolved" ||
                              report.status === "dismissed" ||
                              updating === report.id
                            }
                            title="Resolve"
                          >
                            <CheckCircle size={14} className="text-success" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateReportStatus(report.id, "dismissed");
                            }}
                            disabled={
                              report.status === "resolved" ||
                              report.status === "dismissed" ||
                              updating === report.id
                            }
                            title="Dismiss"
                          >
                            <XCircle size={14} className="text-muted" />
                          </Button>
                          {expandedId === report.id ? (
                            <ChevronUp size={14} className="text-muted ml-1" />
                          ) : (
                            <ChevronDown
                              size={14}
                              className="text-muted ml-1"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === report.id && (
                      <tr key={`${report.id}-details`}>
                        <td
                          colSpan={7}
                          className="px-5 py-4 bg-surface-hover/30"
                        >
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">
                              Report Details
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted">Reporter: </span>
                                <span className="font-medium">
                                  @{report.reporter?.username ?? "unknown"}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted">Report ID: </span>
                                <span className="font-mono text-xs">
                                  {report.id}
                                </span>
                              </div>
                              <div className="sm:col-span-2">
                                <span className="text-muted">
                                  Full Reason:{" "}
                                </span>
                                <span>{report.reason}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {reports.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted">
              No reports found.
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flag size={14} className="text-danger" />
                    <span className="text-sm font-medium">
                      {report.reporter?.display_name ?? "Unknown"}
                    </span>
                  </div>
                  {getStatusBadge(report.status)}
                </div>
                <div className="text-sm">
                  <span className="text-muted">Target: </span>
                  <span className="capitalize">{report.target_type}</span>
                  <span className="text-muted"> ({report.target_id})</span>
                </div>
                <p className="text-sm text-muted">{report.reason}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">
                    {formatDate(report.created_at)}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        updateReportStatus(report.id, "reviewed")
                      }
                      disabled={
                        report.status !== "pending" ||
                        updating === report.id
                      }
                    >
                      {updating === report.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Eye size={14} />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        updateReportStatus(report.id, "resolved")
                      }
                      disabled={
                        report.status === "resolved" ||
                        report.status === "dismissed" ||
                        updating === report.id
                      }
                    >
                      <CheckCircle size={14} className="text-success" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        updateReportStatus(report.id, "dismissed")
                      }
                      disabled={
                        report.status === "resolved" ||
                        report.status === "dismissed" ||
                        updating === report.id
                      }
                    >
                      <XCircle size={14} className="text-muted" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
