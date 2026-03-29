"use client";

import { useState } from "react";
import { mockReports } from "@/lib/mock-data";
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
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredReports =
    statusFilter === "all"
      ? reports
      : reports.filter((r) => r.status === statusFilter);

  function updateReportStatus(id: string, status: ReportStatus) {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
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
              {filteredReports.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-muted"
                  >
                    No reports found.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
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
                            disabled={report.status !== "pending"}
                            title="Review"
                          >
                            <Eye size={14} />
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
                              report.status === "dismissed"
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
                              report.status === "dismissed"
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
          {filteredReports.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted">
              No reports found.
            </div>
          ) : (
            filteredReports.map((report) => (
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
                      disabled={report.status !== "pending"}
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        updateReportStatus(report.id, "resolved")
                      }
                      disabled={
                        report.status === "resolved" ||
                        report.status === "dismissed"
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
                        report.status === "dismissed"
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
