"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MediaUpload } from "@/components/editor/media-upload";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  getApprovedDeclarationsByCreator,
  getDeclarationsByStory,
  createDeclaration,
  linkDeclarationToStory,
  unlinkDeclarationFromStory,
} from "@/lib/supabase/queries";
import {
  SUBJECT_PLATFORMS,
  DECLARATION_TYPE_LABELS,
  EVIDENCE_TIER_LABELS,
  GRACE_PERIOD_DAYS,
} from "@/lib/constants";
import type {
  ContentRightsDeclaration,
  DeclarationType,
  EvidenceTier,
  BadgeLevel,
} from "@/lib/types";
import {
  ShieldCheck,
  FileCheck,
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBadgeLevelForTier(tier: EvidenceTier): BadgeLevel {
  if (tier === "video" || tier === "signed_consent") {
    return "verified_permission";
  }
  return "permission_documented";
}

const declarationTypeOptions = Object.entries(DECLARATION_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

const evidenceTierOptions = Object.entries(EVIDENCE_TIER_LABELS).map(
  ([value, label]) => ({ value, label })
);

const platformOptions = [
  { value: "", label: "Select platform..." },
  ...SUBJECT_PLATFORMS,
];

const badgeIcons: Record<string, typeof ShieldCheck> = {
  verified_permission: ShieldCheck,
  permission_documented: FileCheck,
  ai_generated: Sparkles,
  none: BookOpen,
};

const statusVariant: Record<string, "success" | "accent" | "danger" | "default" | "outline"> = {
  approved: "success",
  pending: "accent",
  rejected: "danger",
  more_info_requested: "danger",
  expired: "outline",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ContentRightsFormProps {
  storyId: string;
  creatorId: string;
  onChange?: (declarations: ContentRightsDeclaration[]) => void;
}

export function ContentRightsForm({
  storyId,
  creatorId,
  onChange,
}: ContentRightsFormProps) {
  // Linked declarations for this story
  const [linkedDeclarations, setLinkedDeclarations] = useState<
    ContentRightsDeclaration[]
  >([]);

  // All approved declarations by this creator (for "link existing")
  const [approvedDeclarations, setApprovedDeclarations] = useState<
    ContentRightsDeclaration[]
  >([]);

  // New declaration form visibility
  const [showNewForm, setShowNewForm] = useState(false);

  // Form fields
  const [declarationType, setDeclarationType] =
    useState<DeclarationType>("real_person_active");
  const [subjectName, setSubjectName] = useState("");
  const [subjectPlatform, setSubjectPlatform] = useState("");
  const [subjectProfileUrl, setSubjectProfileUrl] = useState("");
  const [evidenceTier, setEvidenceTier] = useState<EvidenceTier>("video");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [videoClockTime, setVideoClockTime] = useState("");
  const [priorConsentNotes, setPriorConsentNotes] = useState("");

  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // -----------------------------------------------------------------------
  // Data loading
  // -----------------------------------------------------------------------

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [linked, approved] = await Promise.all([
        getDeclarationsByStory(storyId),
        getApprovedDeclarationsByCreator(creatorId),
      ]);
      setLinkedDeclarations(linked as ContentRightsDeclaration[]);
      setApprovedDeclarations(approved as ContentRightsDeclaration[]);
      onChange?.(linked as ContentRightsDeclaration[]);
    } catch {
      toast("error", "Failed to load rights declarations");
    } finally {
      setLoading(false);
    }
  }, [storyId, creatorId, onChange]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId, creatorId]);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  async function handleUnlink(declarationId: string) {
    try {
      await unlinkDeclarationFromStory(storyId, declarationId);
      const updated = linkedDeclarations.filter((d) => d.id !== declarationId);
      setLinkedDeclarations(updated);
      onChange?.(updated);
      toast("success", "Declaration unlinked from story");
    } catch {
      toast("error", "Failed to unlink declaration");
    }
  }

  async function handleLinkExisting(declarationId: string) {
    try {
      await linkDeclarationToStory(storyId, declarationId);
      const declaration = approvedDeclarations.find(
        (d) => d.id === declarationId
      );
      if (declaration) {
        const updated = [...linkedDeclarations, declaration];
        setLinkedDeclarations(updated);
        onChange?.(updated);
      }
      toast("success", "Declaration linked to story");
    } catch {
      toast("error", "Failed to link declaration");
    }
  }

  function resetForm() {
    setDeclarationType("real_person_active");
    setSubjectName("");
    setSubjectPlatform("");
    setSubjectProfileUrl("");
    setEvidenceTier("video");
    setEvidenceUrls([]);
    setVideoClockTime("");
    setPriorConsentNotes("");
    setShowNewForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const isRealPerson =
        declarationType === "real_person_active" ||
        declarationType === "real_person_prior";

      // Determine status and badge level
      let status: string;
      let badgeLevel: BadgeLevel;
      let graceDeadline: string | undefined;

      if (declarationType === "ai_generated") {
        status = "approved";
        badgeLevel = "ai_generated";
      } else if (declarationType === "fictional") {
        status = "approved";
        badgeLevel = "none";
      } else {
        // Real person types need review
        status = "pending";
        badgeLevel = getBadgeLevelForTier(evidenceTier);
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + GRACE_PERIOD_DAYS);
        graceDeadline = deadline.toISOString();
      }

      // Build metadata
      const evidenceMetadata: Record<string, unknown> = {};
      if (isRealPerson && videoClockTime) {
        evidenceMetadata.video_clock_time = videoClockTime;
      }
      if (isRealPerson && priorConsentNotes) {
        evidenceMetadata.prior_consent_notes = priorConsentNotes;
      }

      const declaration = await createDeclaration({
        creator_id: creatorId,
        declaration_type: declarationType,
        subject_name: isRealPerson ? subjectName || undefined : undefined,
        subject_platform: isRealPerson ? subjectPlatform || undefined : undefined,
        subject_profile_url: isRealPerson
          ? subjectProfileUrl || undefined
          : undefined,
        evidence_tier: isRealPerson ? evidenceTier : undefined,
        evidence_urls: isRealPerson && evidenceUrls.length > 0 ? evidenceUrls : undefined,
        evidence_metadata:
          Object.keys(evidenceMetadata).length > 0
            ? evidenceMetadata
            : undefined,
        badge_level: badgeLevel,
        status,
        grace_deadline: graceDeadline,
      });

      if (declaration) {
        // Link to story
        await linkDeclarationToStory(storyId, declaration.id);
        const updated = [
          ...linkedDeclarations,
          declaration as ContentRightsDeclaration,
        ];
        setLinkedDeclarations(updated);
        onChange?.(updated);

        // If it was auto-approved, also update approved list
        if (status === "approved") {
          setApprovedDeclarations((prev) => [
            ...prev,
            declaration as ContentRightsDeclaration,
          ]);
        }

        toast(
          "success",
          status === "pending"
            ? "Declaration submitted for review"
            : "Declaration created and linked"
        );
        resetForm();
      }
    } catch {
      toast("error", "Failed to create declaration");
    } finally {
      setSaving(false);
    }
  }

  // -----------------------------------------------------------------------
  // Derived values
  // -----------------------------------------------------------------------

  const linkedIds = new Set(linkedDeclarations.map((d) => d.id));
  const unlinkableApproved = approvedDeclarations.filter(
    (d) => !linkedIds.has(d.id)
  );

  const isRealPersonType =
    declarationType === "real_person_active" ||
    declarationType === "real_person_prior";

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading declarations...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Content Rights Declarations
          </h3>
          <p className="text-sm text-muted mt-0.5">
            Declare the rights status of people featured in your story
          </p>
        </div>
      </div>

      {/* Linked declarations list */}
      {linkedDeclarations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">
            Linked Declarations
          </h4>
          <div className="space-y-2">
            {linkedDeclarations.map((decl) => {
              const Icon = badgeIcons[decl.badge_level] || BookOpen;
              return (
                <div
                  key={decl.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="h-4 w-4 text-muted shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {DECLARATION_TYPE_LABELS[decl.declaration_type] ||
                          decl.declaration_type}
                        {decl.subject_name && (
                          <span className="text-muted font-normal">
                            {" "}
                            &mdash; {decl.subject_name}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant={statusVariant[decl.status] || "default"}
                        >
                          {decl.status}
                        </Badge>
                        {decl.evidence_tier && (
                          <span className="text-xs text-muted">
                            {EVIDENCE_TIER_LABELS[decl.evidence_tier]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnlink(decl.id)}
                    title="Unlink from story"
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Link existing approved declaration */}
      {unlinkableApproved.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">
            Link Existing Approved Declaration
          </h4>
          <div className="space-y-2">
            {unlinkableApproved.map((decl) => {
              const Icon = badgeIcons[decl.badge_level] || BookOpen;
              return (
                <div
                  key={decl.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-surface/50 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="h-4 w-4 text-muted shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {DECLARATION_TYPE_LABELS[decl.declaration_type] ||
                          decl.declaration_type}
                        {decl.subject_name && (
                          <span className="text-muted font-normal">
                            {" "}
                            &mdash; {decl.subject_name}
                          </span>
                        )}
                      </p>
                      {decl.evidence_tier && (
                        <p className="text-xs text-muted mt-0.5">
                          {EVIDENCE_TIER_LABELS[decl.evidence_tier]}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => handleLinkExisting(decl.id)}
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    Link
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New declaration form toggle */}
      {!showNewForm ? (
        <Button
          variant="secondary"
          onClick={() => setShowNewForm(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4" />
          Add New Declaration
        </Button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-lg border border-border bg-surface p-5"
        >
          <h4 className="text-sm font-semibold text-foreground">
            New Declaration
          </h4>

          {/* Declaration type */}
          <Select
            id="declarationType"
            label="Declaration Type"
            value={declarationType}
            onChange={(e) =>
              setDeclarationType(e.target.value as DeclarationType)
            }
            options={declarationTypeOptions}
          />

          {/* AI-generated disclosure */}
          {declarationType === "ai_generated" && (
            <div className="rounded-lg bg-accent/5 border border-accent/20 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    AI-Generated Content Disclosure
                  </p>
                  <p className="text-sm text-muted mt-1">
                    By selecting this option you confirm that all person imagery
                    in this story is AI-generated and does not depict any real
                    individual. This declaration will be auto-approved.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Fictional — nothing extra */}
          {declarationType === "fictional" && (
            <div className="rounded-lg bg-surface-hover border border-border p-4">
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-muted shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Fully Fictional Content
                  </p>
                  <p className="text-sm text-muted mt-1">
                    This story features only fictional characters with no
                    reference to real people. No additional documentation is
                    required.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Real person fields */}
          {isRealPersonType && (
            <div className="space-y-4">
              <Input
                id="subjectName"
                label="Subject Name"
                placeholder="Full name or stage name of the person"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                required
              />

              <Select
                id="subjectPlatform"
                label="Platform"
                value={subjectPlatform}
                onChange={(e) => setSubjectPlatform(e.target.value)}
                options={platformOptions}
              />

              <Input
                id="subjectProfileUrl"
                label="Profile URL"
                type="url"
                placeholder="https://..."
                value={subjectProfileUrl}
                onChange={(e) => setSubjectProfileUrl(e.target.value)}
              />

              <Select
                id="evidenceTier"
                label="Evidence Tier"
                value={evidenceTier}
                onChange={(e) =>
                  setEvidenceTier(e.target.value as EvidenceTier)
                }
                options={evidenceTierOptions}
              />

              {/* Evidence upload */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">
                  Evidence Upload
                </label>
                <p className="text-xs text-muted mb-2">
                  Upload screenshots, videos, or signed consent documents as
                  proof of permission.
                </p>
                <MediaUpload
                  accept="image/*,video/*,.pdf"
                  maxSize={50 * 1024 * 1024}
                  onUpload={(url) =>
                    setEvidenceUrls((prev) => [...prev, url])
                  }
                />
                {evidenceUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {evidenceUrls.map((url, idx) => (
                      <Badge key={idx} variant="outline" className="gap-1.5">
                        File {idx + 1}
                        <button
                          type="button"
                          onClick={() =>
                            setEvidenceUrls((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          className="text-muted hover:text-danger cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Conditional fields by evidence tier */}
              {evidenceTier === "video" && (
                <Input
                  id="videoClockTime"
                  label="Video Clock Time"
                  placeholder="Timestamp where consent is stated (e.g. 0:42)"
                  value={videoClockTime}
                  onChange={(e) => setVideoClockTime(e.target.value)}
                />
              )}

              {declarationType === "real_person_prior" && (
                <Textarea
                  id="priorConsentNotes"
                  label="Prior Consent Notes"
                  placeholder="Describe how and when consent was previously obtained..."
                  value={priorConsentNotes}
                  onChange={(e) => setPriorConsentNotes(e.target.value)}
                />
              )}

              {/* Grace period notice */}
              <div
                className={cn(
                  "rounded-lg p-3 text-xs",
                  "bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400"
                )}
              >
                Real-person declarations require admin review. Your story will
                have a {GRACE_PERIOD_DAYS}-day grace period while the declaration
                is being reviewed.
              </div>
            </div>
          )}

          {/* Form actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={saving} disabled={saving}>
              {saving ? "Submitting..." : "Submit Declaration"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Empty state */}
      {linkedDeclarations.length === 0 &&
        unlinkableApproved.length === 0 &&
        !showNewForm && (
          <p className="text-sm text-muted text-center py-4">
            No declarations linked to this story yet. Add one to display a
            content rights badge.
          </p>
        )}
    </div>
  );
}
