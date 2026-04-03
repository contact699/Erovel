"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth-store";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { RightsBadge } from "@/components/story/rights-badge";
import { toast } from "@/components/ui/toast";
import {
  DECLARATION_TYPE_LABELS,
  EVIDENCE_TIER_LABELS,
  BADGE_LEVEL_LABELS,
} from "@/lib/constants";
import type { ContentRightsDeclaration, DeclarationStatus } from "@/lib/types";
import {
  FileCheck,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  ExternalLink,
  Clock,
  AlertTriangle,
} from "lucide-react";

const statusFilterOptions = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "more_info_requested", label: "More Info Requested" },
  { value: "expired", label: "Expired" },
];

function getStatusBadge(status: DeclarationStatus) {
  switch (status) {
    case "pending":
      return (
        <Badge className="bg-yellow-500/10 text-yellow-600">pending</Badge>
      );
    case "approved":
      return <Badge variant="success">approved</Badge>;
    case "rejected":
      return <Badge variant="danger">rejected</Badge>;
    case "more_info_requested":
      return <Badge variant="accent">more info requested</Badge>;
    case "expired":
      return (
        <Badge className="bg-foreground/5 text-muted">expired</Badge>
      );
  }
}

function daysUntilDeadline(deadline: string | null): number | null {
  if (!deadline) return null;
  const now = new Date();
  const dl = new Date(deadline);
  return Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function DeadlineDisplay({ deadline }: { deadline: string | null }) {
  const days = daysUntilDeadline(deadline);
  if (days === null) return <span className="text-muted">--</span>;
  if (days <= 0)
    return (
      <span className="text-danger font-medium flex items-center gap-1">
        <AlertTriangle size={12} />
        Overdue
      </span>
    );
  if (days <= 3)
    return (
      <span className="text-danger font-medium flex items-center gap-1">
        <Clock size={12} />
        {days}d left
      </span>
    );
  return (
    <span className="text-muted flex items-center gap-1">
      <Clock size={12} />
      {days}d left
    </span>
  );
}

function getEvidenceFileType(url: string): "video" | "image" | "pdf" | "unknown" {
  const lower = url.toLowerCase();
  if (lower.match(/\.(mp4|webm|mov|avi)(\?|$)/)) return "video";
  if (lower.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/)) return "image";
  if (lower.match(/\.pdf(\?|$)/)) return "pdf";
  return "unknown";
}

export default function AdminRightsReviewPage() {
  const { user } = useAuthStore();
  const [declarations, setDeclarations] = useState<ContentRightsDeclaration[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const fetchDeclarations = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) {
      setError("Database not configured");
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("content_rights_declarations")
        .select(
          "*, creator:profiles!content_rights_declarations_creator_id_fkey(id, username, display_name, avatar_url, is_verified)"
        )
        .order("grace_deadline", { ascending: true, nullsFirst: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setDeclarations((data ?? []) as unknown as ContentRightsDeclaration[]);
    } catch {
      setError("Failed to load declarations");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (user?.role === "admin") {
      setLoading(true);
      fetchDeclarations();
    }
  }, [user, fetchDeclarations]);

  // Compute stats
  const stats = {
    pending: declarations.filter((d) => d.status === "pending").length,
    approved: declarations.filter((d) => d.status === "approved").length,
    rejected: declarations.filter((d) => d.status === "rejected").length,
    more_info: declarations.filter((d) => d.status === "more_info_requested").length,
  };

  // When filtering, stats reflect filtered set only for "all"; otherwise show from full
  // Actually, stats should always reflect the current view
  const handleAction = async (
    id: string,
    action: "approve" | "reject" | "more_info_requested"
  ) => {
    const notes = adminNotes[id]?.trim() || "";

    if ((action === "reject" || action === "more_info_requested") && !notes) {
      toast("error", "Admin notes are required to reject or request more info.");
      return;
    }

    const supabase = createClient();
    if (!supabase) return;

    setUpdating(id);
    try {
      const updates: Record<string, unknown> = {
        status: action === "approve" ? "approved" : action,
        admin_reviewer_id: user?.id,
        reviewed_at: new Date().toISOString(),
      };

      if (notes) {
        updates.admin_notes = notes;
      }

      // When approving, determine the badge level
      if (action === "approve") {
        const decl = declarations.find((d) => d.id === id);
        if (decl) {
          if (decl.declaration_type === "ai_generated") {
            updates.badge_level = "ai_generated";
          } else if (
            decl.evidence_tier === "video" ||
            decl.evidence_tier === "signed_consent"
          ) {
            updates.badge_level = "verified_permission";
          } else {
            updates.badge_level = "permission_documented";
          }
        }
      }

      const { error: updateError } = await supabase
        .from("content_rights_declarations")
        .update(updates)
        .eq("id", id);

      if (updateError) {
        toast("error", updateError.message);
        return;
      }

      // Send notification to the creator (non-blocking)
      try {
        const declaration = declarations.find((dec) => dec.id === id);
        if (declaration) {
          const notifTitle =
            action === "approve"
              ? "Rights declaration approved"
              : action === "reject"
                ? "Rights declaration rejected"
                : "More info requested for rights declaration";
          const notifBody =
            action === "approve"
              ? `Your permission documentation for "${declaration.subject_name || "content"}" has been approved.`
              : action === "reject"
                ? `Your permission documentation for "${declaration.subject_name || "content"}" was rejected: ${notes}`
                : `We need more information about your permission for "${declaration.subject_name || "content"}": ${notes}`;

          await supabase.from("notifications").insert({
            user_id: declaration.creator_id,
            type: "rights_review",
            title: notifTitle,
            body: notifBody,
            link: "/dashboard/stories",
          });
        }
      } catch {
        // Notification failure should not block the main action
      }

      toast("success", `Declaration ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "returned for more info"}.`);
      setAdminNotes((prev) => ({ ...prev, [id]: "" }));
      setExpandedId(null);
      fetchDeclarations();
    } catch {
      toast("error", "Failed to update declaration");
    } finally {
      setUpdating(null);
    }
  };

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
            fetchDeclarations();
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileCheck size={24} />
            Rights Review
          </h1>
          <p className="text-sm text-muted mt-1">
            Review content rights declarations and approve or reject evidence
          </p>
        </div>
        <div className="w-full sm:w-56">
          <Select
            options={statusFilterOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-sm text-muted">Pending</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-sm text-muted">Approved</div>
          <div className="text-2xl font-bold text-success mt-1">{stats.approved}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-sm text-muted">Rejected</div>
          <div className="text-2xl font-bold text-danger mt-1">{stats.rejected}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-sm text-muted">More Info Requested</div>
          <div className="text-2xl font-bold text-accent mt-1">{stats.more_info}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-hover/50">
                <th className="text-left font-medium text-muted px-5 py-3">
                  Creator
                </th>
                <th className="text-left font-medium text-muted px-5 py-3">
                  Subject
                </th>
                <th className="text-left font-medium text-muted px-5 py-3">
                  Evidence
                </th>
                <th className="text-left font-medium text-muted px-5 py-3">
                  Status
                </th>
                <th className="text-left font-medium text-muted px-5 py-3">
                  Deadline
                </th>
                <th className="text-right font-medium text-muted px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {declarations.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-muted"
                  >
                    No declarations found.
                  </td>
                </tr>
              ) : (
                declarations.map((decl) => (
                  <>
                    <tr
                      key={decl.id}
                      className="hover:bg-surface-hover/30 transition-colors cursor-pointer"
                      onClick={() =>
                        setExpandedId(
                          expandedId === decl.id ? null : decl.id
                        )
                      }
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {decl.creator?.avatar_url ? (
                            <img
                              src={decl.creator.avatar_url}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-surface-hover" />
                          )}
                          <div>
                            <div className="font-medium">
                              {decl.creator?.display_name ?? "Unknown"}
                            </div>
                            <div className="text-xs text-muted">
                              @{decl.creator?.username ?? "unknown"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {decl.subject_name ?? (
                          <span className="text-muted italic">
                            {DECLARATION_TYPE_LABELS[decl.declaration_type] ?? decl.declaration_type}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {decl.evidence_tier ? (
                          <Badge variant="outline">
                            {EVIDENCE_TIER_LABELS[decl.evidence_tier] ?? decl.evidence_tier}
                          </Badge>
                        ) : (
                          <span className="text-muted">--</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {getStatusBadge(decl.status)}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <DeadlineDisplay deadline={decl.grace_deadline} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end">
                          {expandedId === decl.id ? (
                            <ChevronUp size={14} className="text-muted" />
                          ) : (
                            <ChevronDown size={14} className="text-muted" />
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === decl.id && (
                      <tr key={`${decl.id}-details`}>
                        <td
                          colSpan={6}
                          className="px-5 py-5 bg-surface-hover/30"
                        >
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left: Evidence viewer */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium">Evidence</h4>

                              {/* Evidence files */}
                              {decl.evidence_urls && decl.evidence_urls.length > 0 ? (
                                <div className="space-y-3">
                                  {decl.evidence_urls.map((url, idx) => {
                                    const fileType = getEvidenceFileType(url);
                                    if (fileType === "video") {
                                      return (
                                        <video
                                          key={idx}
                                          controls
                                          className="w-full max-w-md rounded-lg border border-border"
                                          src={url}
                                        />
                                      );
                                    }
                                    if (fileType === "image") {
                                      return (
                                        <img
                                          key={idx}
                                          src={url}
                                          alt={`Evidence ${idx + 1}`}
                                          className="w-full max-w-md rounded-lg border border-border"
                                        />
                                      );
                                    }
                                    if (fileType === "pdf") {
                                      return (
                                        <a
                                          key={idx}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors text-sm"
                                        >
                                          <FileText size={16} className="text-accent" />
                                          View PDF document
                                          <ExternalLink size={12} className="text-muted" />
                                        </a>
                                      );
                                    }
                                    return (
                                      <a
                                        key={idx}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover"
                                      >
                                        View file {idx + 1}
                                        <ExternalLink size={12} />
                                      </a>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-muted">
                                  No evidence files uploaded.
                                </p>
                              )}

                              {/* Evidence metadata */}
                              {decl.evidence_metadata && Object.keys(decl.evidence_metadata).length > 0 && (
                                <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
                                  <h5 className="text-xs font-medium text-muted uppercase tracking-wider">
                                    Metadata
                                  </h5>
                                  <div className="space-y-1 text-sm">
                                    {"video_clock_time" in decl.evidence_metadata && decl.evidence_metadata.video_clock_time != null && (
                                      <div>
                                        <span className="text-muted">Video clock time: </span>
                                        <span>{String(decl.evidence_metadata.video_clock_time)}</span>
                                      </div>
                                    )}
                                    {"prior_consent_notes" in decl.evidence_metadata && decl.evidence_metadata.prior_consent_notes != null && (
                                      <div>
                                        <span className="text-muted">Prior consent notes: </span>
                                        <span>{String(decl.evidence_metadata.prior_consent_notes)}</span>
                                      </div>
                                    )}
                                    {Object.entries(decl.evidence_metadata)
                                      .filter(
                                        ([key]) =>
                                          key !== "video_clock_time" &&
                                          key !== "prior_consent_notes"
                                      )
                                      .map(([key, value]) => (
                                        <div key={key}>
                                          <span className="text-muted">{key}: </span>
                                          <span>{String(value)}</span>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}

                              {/* Subject profile link */}
                              {decl.subject_profile_url && (
                                <a
                                  href={decl.subject_profile_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors"
                                >
                                  View subject profile
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>

                            {/* Right: Details + Actions */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium">Details</h4>

                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="text-muted">Type: </span>
                                  <span className="font-medium">
                                    {DECLARATION_TYPE_LABELS[decl.declaration_type] ?? decl.declaration_type}
                                  </span>
                                </div>
                                {decl.subject_name && (
                                  <div>
                                    <span className="text-muted">Subject: </span>
                                    <span>{decl.subject_name}</span>
                                    {decl.subject_platform && (
                                      <span className="text-muted"> ({decl.subject_platform})</span>
                                    )}
                                  </div>
                                )}
                                {decl.status === "approved" && decl.badge_level && decl.badge_level !== "none" && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted">Badge: </span>
                                    <RightsBadge badgeLevel={decl.badge_level} size="sm" />
                                  </div>
                                )}
                                <div>
                                  <span className="text-muted">Submitted: </span>
                                  <span>{formatDate(decl.created_at)}</span>
                                </div>
                                {decl.reviewed_at && (
                                  <div>
                                    <span className="text-muted">Reviewed: </span>
                                    <span>{formatDate(decl.reviewed_at)}</span>
                                  </div>
                                )}
                                {decl.admin_notes && (
                                  <div>
                                    <span className="text-muted">Previous notes: </span>
                                    <span className="italic">{decl.admin_notes}</span>
                                  </div>
                                )}
                              </div>

                              {/* Admin notes + actions */}
                              {(decl.status === "pending" || decl.status === "more_info_requested") && (
                                <div className="space-y-3 pt-2 border-t border-border">
                                  <div>
                                    <label className="block text-sm font-medium mb-1.5">
                                      Admin Notes
                                    </label>
                                    <textarea
                                      value={adminNotes[decl.id] ?? ""}
                                      onChange={(e) =>
                                        setAdminNotes((prev) => ({
                                          ...prev,
                                          [decl.id]: e.target.value,
                                        }))
                                      }
                                      placeholder="Add notes (required for reject / request info)..."
                                      rows={3}
                                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-none"
                                    />
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      variant="accent"
                                      size="sm"
                                      loading={updating === decl.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAction(decl.id, "approve");
                                      }}
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      loading={updating === decl.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAction(decl.id, "reject");
                                      }}
                                    >
                                      Reject
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      loading={updating === decl.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAction(decl.id, "more_info_requested");
                                      }}
                                    >
                                      Request Info
                                    </Button>
                                  </div>
                                </div>
                              )}
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
          {declarations.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted">
              No declarations found.
            </div>
          ) : (
            declarations.map((decl) => (
              <div key={decl.id} className="p-4 space-y-3">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === decl.id ? null : decl.id)
                  }
                >
                  <div className="flex items-center gap-2">
                    {decl.creator?.avatar_url ? (
                      <img
                        src={decl.creator.avatar_url}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-surface-hover" />
                    )}
                    <div>
                      <span className="text-sm font-medium">
                        {decl.creator?.display_name ?? "Unknown"}
                      </span>
                      <span className="text-xs text-muted ml-1">
                        @{decl.creator?.username ?? "unknown"}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(decl.status)}
                </div>

                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-muted">Subject: </span>
                    <span>
                      {decl.subject_name ?? (
                        <span className="italic text-muted">
                          {DECLARATION_TYPE_LABELS[decl.declaration_type] ?? decl.declaration_type}
                        </span>
                      )}
                    </span>
                  </div>
                  {decl.evidence_tier && (
                    <div>
                      <span className="text-muted">Evidence: </span>
                      <span>{EVIDENCE_TIER_LABELS[decl.evidence_tier] ?? decl.evidence_tier}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <DeadlineDisplay deadline={decl.grace_deadline} />
                    {expandedId === decl.id ? (
                      <ChevronUp size={14} className="text-muted" />
                    ) : (
                      <ChevronDown size={14} className="text-muted" />
                    )}
                  </div>
                </div>

                {expandedId === decl.id && (
                  <div className="pt-3 border-t border-border space-y-4">
                    {/* Evidence */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-medium text-muted uppercase tracking-wider">
                        Evidence
                      </h4>
                      {decl.evidence_urls && decl.evidence_urls.length > 0 ? (
                        decl.evidence_urls.map((url, idx) => {
                          const fileType = getEvidenceFileType(url);
                          if (fileType === "video") {
                            return (
                              <video
                                key={idx}
                                controls
                                className="w-full rounded-lg border border-border"
                                src={url}
                              />
                            );
                          }
                          if (fileType === "image") {
                            return (
                              <img
                                key={idx}
                                src={url}
                                alt={`Evidence ${idx + 1}`}
                                className="w-full rounded-lg border border-border"
                              />
                            );
                          }
                          if (fileType === "pdf") {
                            return (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface text-sm"
                              >
                                <FileText size={16} className="text-accent" />
                                View PDF
                                <ExternalLink size={12} className="text-muted" />
                              </a>
                            );
                          }
                          return (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-accent"
                            >
                              View file {idx + 1}
                            </a>
                          );
                        })
                      ) : (
                        <p className="text-sm text-muted">No evidence files.</p>
                      )}
                    </div>

                    {/* Metadata */}
                    {decl.evidence_metadata && Object.keys(decl.evidence_metadata).length > 0 && (
                      <div className="rounded-lg border border-border bg-surface p-3 space-y-1 text-sm">
                        {"video_clock_time" in decl.evidence_metadata && decl.evidence_metadata.video_clock_time != null && (
                          <div>
                            <span className="text-muted">Video clock time: </span>
                            <span>{String(decl.evidence_metadata.video_clock_time)}</span>
                          </div>
                        )}
                        {"prior_consent_notes" in decl.evidence_metadata && decl.evidence_metadata.prior_consent_notes != null && (
                          <div>
                            <span className="text-muted">Prior consent notes: </span>
                            <span>{String(decl.evidence_metadata.prior_consent_notes)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Subject profile link */}
                    {decl.subject_profile_url && (
                      <a
                        href={decl.subject_profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-accent"
                      >
                        Subject profile <ExternalLink size={12} />
                      </a>
                    )}

                    {/* Details */}
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-muted">Type: </span>
                        <span>{DECLARATION_TYPE_LABELS[decl.declaration_type] ?? decl.declaration_type}</span>
                      </div>
                      {decl.status === "approved" && decl.badge_level && decl.badge_level !== "none" && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted">Badge: </span>
                          <RightsBadge badgeLevel={decl.badge_level} size="sm" />
                        </div>
                      )}
                      <div>
                        <span className="text-muted">Submitted: </span>
                        <span>{formatDate(decl.created_at)}</span>
                      </div>
                      {decl.reviewed_at && (
                        <div>
                          <span className="text-muted">Reviewed: </span>
                          <span>{formatDate(decl.reviewed_at)}</span>
                        </div>
                      )}
                      {decl.admin_notes && (
                        <div>
                          <span className="text-muted">Notes: </span>
                          <span className="italic">{decl.admin_notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {(decl.status === "pending" || decl.status === "more_info_requested") && (
                      <div className="space-y-3 pt-2 border-t border-border">
                        <textarea
                          value={adminNotes[decl.id] ?? ""}
                          onChange={(e) =>
                            setAdminNotes((prev) => ({
                              ...prev,
                              [decl.id]: e.target.value,
                            }))
                          }
                          placeholder="Admin notes..."
                          rows={2}
                          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-none"
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="accent"
                            size="sm"
                            loading={updating === decl.id}
                            onClick={() => handleAction(decl.id, "approve")}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            loading={updating === decl.id}
                            onClick={() => handleAction(decl.id, "reject")}
                          >
                            Reject
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={updating === decl.id}
                            onClick={() => handleAction(decl.id, "more_info_requested")}
                          >
                            Request Info
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
