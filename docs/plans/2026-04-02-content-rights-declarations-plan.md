# Content Rights Declarations — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow creators to declare content rights (real person permission, AI-generated, fictional) for stories, with tiered evidence upload, admin review queue, and reader-facing badges.

**Architecture:** New DB tables for declarations + story-declaration join. Creator-side form integrated into the story creation/edit flow. Admin review page at `/admin/rights-review`. Badges rendered on story cards and story pages. Evidence files uploaded via existing BunnyCDN upload API.

**Tech Stack:** Next.js 16, Supabase (PostgreSQL + RLS), TypeScript, Tailwind CSS, lucide-react icons, existing UI components (Badge, Button, Input, Select, Textarea, MediaUpload).

**Design doc:** `docs/plans/2026-04-02-content-rights-declarations-design.md`

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260402100000_content_rights_declarations.sql`

**Step 1: Write the migration SQL**

```sql
-- Content rights declaration types
create type declaration_type as enum ('real_person_active', 'real_person_prior', 'ai_generated', 'fictional');
create type evidence_tier as enum ('video', 'screenshot', 'signed_consent', 'prior_declaration');
create type badge_level as enum ('verified_permission', 'permission_documented', 'ai_generated', 'none');
create type declaration_status as enum ('pending', 'approved', 'rejected', 'more_info_requested', 'expired');

-- Main declarations table
create table content_rights_declarations (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles(id) on delete cascade,
  declaration_type declaration_type not null,
  subject_name text,
  subject_platform text,
  subject_profile_url text,
  evidence_tier evidence_tier,
  evidence_urls text[],
  evidence_metadata jsonb,
  badge_level badge_level not null default 'none',
  status declaration_status not null default 'pending',
  admin_reviewer_id uuid references profiles(id) on delete set null,
  admin_notes text,
  reviewed_at timestamptz,
  grace_deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_declarations_creator on content_rights_declarations(creator_id);
create index idx_declarations_status on content_rights_declarations(status);
create index idx_declarations_grace on content_rights_declarations(grace_deadline) where grace_deadline is not null;

-- Join table: stories <-> declarations (many-to-many)
create table story_rights_declarations (
  story_id uuid not null references stories(id) on delete cascade,
  declaration_id uuid not null references content_rights_declarations(id) on delete cascade,
  primary key (story_id, declaration_id)
);

create index idx_story_rights_story on story_rights_declarations(story_id);
create index idx_story_rights_declaration on story_rights_declarations(declaration_id);

-- RLS
alter table content_rights_declarations enable row level security;
alter table story_rights_declarations enable row level security;

-- Creators can read their own declarations
create policy "declarations_read_own" on content_rights_declarations
  for select using (auth.uid() = creator_id);

-- Creators can insert their own declarations
create policy "declarations_insert_own" on content_rights_declarations
  for insert with check (auth.uid() = creator_id);

-- Creators can update their own pending declarations
create policy "declarations_update_own" on content_rights_declarations
  for update using (auth.uid() = creator_id and status in ('pending', 'more_info_requested'));

-- Admins can read all declarations
create policy "declarations_admin_read" on content_rights_declarations
  for select using (coalesce((auth.jwt()->'user_metadata'->>'role'), '') = 'admin');

-- Admins can update any declaration (for review actions)
create policy "declarations_admin_update" on content_rights_declarations
  for update using (coalesce((auth.jwt()->'user_metadata'->>'role'), '') = 'admin');

-- Anyone can read story_rights_declarations (badges are public)
create policy "story_rights_read_all" on story_rights_declarations
  for select using (true);

-- Creators can insert story_rights_declarations for their own stories
create policy "story_rights_insert_own" on story_rights_declarations
  for insert with check (
    exists (
      select 1 from stories where id = story_id and creator_id = auth.uid()
    )
  );

-- Creators can delete story_rights_declarations for their own stories
create policy "story_rights_delete_own" on story_rights_declarations
  for delete using (
    exists (
      select 1 from stories where id = story_id and creator_id = auth.uid()
    )
  );

-- Updated_at trigger
create trigger tr_declarations_updated before update on content_rights_declarations
  for each row execute function update_updated_at();
```

**Step 2: Apply migration**

Run: `npx supabase db push` (or apply via Supabase dashboard)

**Step 3: Commit**

```bash
git add supabase/migrations/20260402100000_content_rights_declarations.sql
git commit -m "feat: add content_rights_declarations tables and RLS policies"
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `src/lib/types.ts`

**Step 1: Add new types after the existing `ReportStatus` type (line 12)**

Add these type definitions after line 12 and the `Report` interface (after line 200):

```typescript
// After line 12, with the other type aliases:
export type DeclarationType = "real_person_active" | "real_person_prior" | "ai_generated" | "fictional";
export type EvidenceTier = "video" | "screenshot" | "signed_consent" | "prior_declaration";
export type BadgeLevel = "verified_permission" | "permission_documented" | "ai_generated" | "none";
export type DeclarationStatus = "pending" | "approved" | "rejected" | "more_info_requested" | "expired";

// After the Report interface (line 200):
export interface ContentRightsDeclaration {
  id: string;
  creator_id: string;
  creator?: Profile;
  declaration_type: DeclarationType;
  subject_name: string | null;
  subject_platform: string | null;
  subject_profile_url: string | null;
  evidence_tier: EvidenceTier | null;
  evidence_urls: string[] | null;
  evidence_metadata: Record<string, unknown> | null;
  badge_level: BadgeLevel;
  status: DeclarationStatus;
  admin_reviewer_id: string | null;
  admin_notes: string | null;
  reviewed_at: string | null;
  grace_deadline: string | null;
  created_at: string;
  updated_at: string;
  // Populated via join
  stories?: Story[];
  story_count?: number;
}

export interface StoryRightsDeclaration {
  story_id: string;
  declaration_id: string;
  declaration?: ContentRightsDeclaration;
}
```

**Step 2: Add `rights_declarations` to the `Story` interface (after line 53, before `created_at`)**

```typescript
  rights_declarations?: ContentRightsDeclaration[];
```

**Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add TypeScript types for content rights declarations"
```

---

## Task 3: Constants for Content Rights

**Files:**
- Modify: `src/lib/constants.ts`

**Step 1: Add declaration-related constants after `CHAT_BUBBLE_COLORS` (line 49)**

```typescript
export const SUBJECT_PLATFORMS = [
  { value: "onlyfans", label: "OnlyFans" },
  { value: "instagram", label: "Instagram" },
  { value: "twitter", label: "Twitter / X" },
  { value: "reddit", label: "Reddit" },
  { value: "tiktok", label: "TikTok" },
  { value: "other", label: "Other" },
];

export const DECLARATION_TYPE_LABELS: Record<string, string> = {
  real_person_active: "Real person (active permission)",
  real_person_prior: "Real person (prior consent)",
  ai_generated: "AI-generated imagery",
  fictional: "Fully fictional",
};

export const EVIDENCE_TIER_LABELS: Record<string, string> = {
  video: "Screen-recorded video",
  screenshot: "Screenshots",
  signed_consent: "Signed consent form",
  prior_declaration: "Prior consent declaration",
};

export const BADGE_LEVEL_LABELS: Record<string, string> = {
  verified_permission: "Verified Permission",
  permission_documented: "Permission Documented",
  ai_generated: "AI-Generated Imagery",
  none: "",
};

export const GRACE_PERIOD_DAYS = 14;
```

**Step 2: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat: add constants for content rights declarations"
```

---

## Task 4: Database Query Functions

**Files:**
- Modify: `src/lib/supabase/queries.ts`

**Step 1: Add declaration query functions at the end of the file**

```typescript
// ============================================================
// CONTENT RIGHTS DECLARATIONS
// ============================================================

export async function getDeclarationsByCreator(creatorId: string) {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("content_rights_declarations")
    .select("*")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getDeclarationsByStory(storyId: string) {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("story_rights_declarations")
    .select("declaration:content_rights_declarations(*)")
    .eq("story_id", storyId);
  return (data || []).map((d: { declaration: unknown }) => d.declaration);
}

export async function getApprovedDeclarationsByCreator(creatorId: string) {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("content_rights_declarations")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("status", "approved")
    .order("subject_name");
  return data || [];
}

export async function createDeclaration(declaration: {
  creator_id: string;
  declaration_type: string;
  subject_name?: string;
  subject_platform?: string;
  subject_profile_url?: string;
  evidence_tier?: string;
  evidence_urls?: string[];
  evidence_metadata?: Record<string, unknown>;
  badge_level: string;
  status: string;
  grace_deadline?: string;
}) {
  const supabase = createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("content_rights_declarations")
    .insert(declaration)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDeclaration(id: string, updates: Record<string, unknown>) {
  const supabase = createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("content_rights_declarations")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function linkDeclarationToStory(storyId: string, declarationId: string) {
  const supabase = createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("story_rights_declarations")
    .insert({ story_id: storyId, declaration_id: declarationId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function unlinkDeclarationFromStory(storyId: string, declarationId: string) {
  const supabase = createClient();
  if (!supabase) return;
  const { error } = await supabase
    .from("story_rights_declarations")
    .delete()
    .eq("story_id", storyId)
    .eq("declaration_id", declarationId);
  if (error) throw error;
}

export async function getStoryBadgeLevel(storyId: string): Promise<string> {
  const declarations = await getDeclarationsByStory(storyId);
  if (!declarations || declarations.length === 0) return "none";
  // Highest badge wins: verified_permission > permission_documented > ai_generated > none
  const priority = ["verified_permission", "permission_documented", "ai_generated", "none"];
  let best = "none";
  for (const d of declarations) {
    const idx = priority.indexOf(d.badge_level);
    if (idx < priority.indexOf(best)) best = d.badge_level;
  }
  return best;
}
```

**Step 2: Commit**

```bash
git add src/lib/supabase/queries.ts
git commit -m "feat: add query functions for content rights declarations"
```

---

## Task 5: Rights Badge Component

**Files:**
- Create: `src/components/story/rights-badge.tsx`

**Step 1: Create the badge component**

```typescript
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, FileCheck, Sparkles } from "lucide-react";
import type { BadgeLevel } from "@/lib/types";

interface RightsBadgeProps {
  badgeLevel: BadgeLevel;
  size?: "sm" | "md";
}

const badgeConfig: Record<string, {
  label: string;
  icon: typeof ShieldCheck;
  variant: "success" | "default" | "accent";
  tooltip: string;
} | null> = {
  verified_permission: {
    label: "Verified Permission",
    icon: ShieldCheck,
    variant: "success",
    tooltip: "This creator has admin-verified permission from the featured person",
  },
  permission_documented: {
    label: "Permission Documented",
    icon: FileCheck,
    variant: "default",
    tooltip: "This creator has submitted permission documentation for the featured person",
  },
  ai_generated: {
    label: "AI-Generated",
    icon: Sparkles,
    variant: "accent",
    tooltip: "This story contains AI-generated imagery — no real person is depicted",
  },
  none: null,
};

export function RightsBadge({ badgeLevel, size = "sm" }: RightsBadgeProps) {
  const config = badgeConfig[badgeLevel];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <span className="relative group">
      <Badge variant={config.variant} className="gap-1">
        <Icon size={size === "sm" ? 12 : 14} />
        {size === "md" && config.label}
        {size === "sm" && (
          <span className="hidden sm:inline">{config.label}</span>
        )}
      </Badge>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {config.tooltip}
      </span>
    </span>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/story/rights-badge.tsx
git commit -m "feat: add RightsBadge component for story content rights display"
```

---

## Task 6: Content Rights Form Component

**Files:**
- Create: `src/components/story/content-rights-form.tsx`

This is the form creators use to declare rights when creating/editing a story. It handles all 4 declaration types, evidence upload, and referencing existing approved declarations.

**Step 1: Create the form component**

```typescript
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MediaUpload } from "@/components/editor/media-upload";
import { toast } from "@/components/ui/toast";
import {
  SUBJECT_PLATFORMS,
  DECLARATION_TYPE_LABELS,
  EVIDENCE_TIER_LABELS,
  GRACE_PERIOD_DAYS,
} from "@/lib/constants";
import {
  getApprovedDeclarationsByCreator,
  createDeclaration,
  linkDeclarationToStory,
  unlinkDeclarationFromStory,
  getDeclarationsByStory,
} from "@/lib/supabase/queries";
import type { ContentRightsDeclaration, DeclarationType, EvidenceTier } from "@/lib/types";
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
import { cn } from "@/lib/utils";

interface ContentRightsFormProps {
  storyId: string;
  creatorId: string;
  onChange?: (declarations: ContentRightsDeclaration[]) => void;
}

const declarationTypeOptions = [
  { value: "fictional", label: "Fully fictional — no real people" },
  { value: "ai_generated", label: "Contains AI-generated imagery" },
  { value: "real_person_active", label: "Features a real person (active permission)" },
  { value: "real_person_prior", label: "Features a real person (prior/historical consent)" },
];

const evidenceTierOptions = [
  { value: "video", label: "Screen-recorded video of permission conversation" },
  { value: "screenshot", label: "Screenshots of permission conversation" },
  { value: "signed_consent", label: "Signed consent / release form (PDF or image)" },
  { value: "prior_declaration", label: "Prior consent — describe history below" },
];

function getBadgeLevelForTier(tier: EvidenceTier): string {
  if (tier === "video" || tier === "signed_consent") return "verified_permission";
  return "permission_documented";
}

export function ContentRightsForm({ storyId, creatorId, onChange }: ContentRightsFormProps) {
  const [linkedDeclarations, setLinkedDeclarations] = useState<ContentRightsDeclaration[]>([]);
  const [approvedDeclarations, setApprovedDeclarations] = useState<ContentRightsDeclaration[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New declaration form state
  const [declarationType, setDeclarationType] = useState<DeclarationType>("fictional");
  const [subjectName, setSubjectName] = useState("");
  const [subjectPlatform, setSubjectPlatform] = useState("");
  const [subjectProfileUrl, setSubjectProfileUrl] = useState("");
  const [evidenceTier, setEvidenceTier] = useState<EvidenceTier>("video");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [videoClockTime, setVideoClockTime] = useState("");
  const [priorConsentNotes, setPriorConsentNotes] = useState("");

  const isRealPerson = declarationType === "real_person_active" || declarationType === "real_person_prior";

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [linked, approved] = await Promise.all([
        getDeclarationsByStory(storyId),
        getApprovedDeclarationsByCreator(creatorId),
      ]);
      setLinkedDeclarations(linked || []);
      setApprovedDeclarations(approved || []);
      setLoading(false);
    }
    load();
  }, [storyId, creatorId]);

  const handleLinkExisting = async (declarationId: string) => {
    try {
      await linkDeclarationToStory(storyId, declarationId);
      const declaration = approvedDeclarations.find((d) => d.id === declarationId);
      if (declaration) {
        const updated = [...linkedDeclarations, declaration];
        setLinkedDeclarations(updated);
        onChange?.(updated);
      }
      toast("success", "Linked existing permission");
    } catch {
      toast("error", "Failed to link declaration");
    }
  };

  const handleUnlink = async (declarationId: string) => {
    try {
      await unlinkDeclarationFromStory(storyId, declarationId);
      const updated = linkedDeclarations.filter((d) => d.id !== declarationId);
      setLinkedDeclarations(updated);
      onChange?.(updated);
      toast("success", "Unlinked declaration");
    } catch {
      toast("error", "Failed to unlink declaration");
    }
  };

  const handleSubmitNew = async () => {
    if (isRealPerson && !subjectName.trim()) {
      toast("error", "Please enter the model/person's name");
      return;
    }
    if (isRealPerson && evidenceUrls.length === 0 && evidenceTier !== "prior_declaration") {
      toast("error", "Please upload evidence");
      return;
    }

    setSaving(true);
    try {
      let badgeLevel = "none";
      let status = "pending";
      let graceDeadline: string | undefined;

      if (declarationType === "ai_generated") {
        badgeLevel = "ai_generated";
        status = "approved"; // Auto-approved, just a disclosure
      } else if (declarationType === "fictional") {
        badgeLevel = "none";
        status = "approved"; // No review needed
      } else {
        badgeLevel = getBadgeLevelForTier(evidenceTier);
        status = "pending";
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + GRACE_PERIOD_DAYS);
        graceDeadline = deadline.toISOString();
      }

      const evidenceMetadata: Record<string, unknown> = {};
      if (videoClockTime) evidenceMetadata.video_clock_time = videoClockTime;
      if (priorConsentNotes) evidenceMetadata.prior_consent_notes = priorConsentNotes;

      const declaration = await createDeclaration({
        creator_id: creatorId,
        declaration_type: declarationType,
        subject_name: isRealPerson ? subjectName.trim() : undefined,
        subject_platform: isRealPerson ? subjectPlatform || undefined : undefined,
        subject_profile_url: isRealPerson ? subjectProfileUrl || undefined : undefined,
        evidence_tier: isRealPerson ? evidenceTier : undefined,
        evidence_urls: evidenceUrls.length > 0 ? evidenceUrls : undefined,
        evidence_metadata: Object.keys(evidenceMetadata).length > 0 ? evidenceMetadata : undefined,
        badge_level: badgeLevel,
        status,
        grace_deadline: graceDeadline,
      });

      if (declaration) {
        await linkDeclarationToStory(storyId, declaration.id);
        const updated = [...linkedDeclarations, declaration];
        setLinkedDeclarations(updated);
        onChange?.(updated);
        // Reset form
        resetNewForm();
        toast("success",
          isRealPerson
            ? "Rights declaration submitted for review"
            : "Content declaration saved"
        );
      }
    } catch {
      toast("error", "Failed to create declaration");
    } finally {
      setSaving(false);
    }
  };

  const resetNewForm = () => {
    setShowNewForm(false);
    setDeclarationType("fictional");
    setSubjectName("");
    setSubjectPlatform("");
    setSubjectProfileUrl("");
    setEvidenceTier("video");
    setEvidenceUrls([]);
    setVideoClockTime("");
    setPriorConsentNotes("");
  };

  const handleEvidenceUpload = (url: string) => {
    setEvidenceUrls((prev) => [...prev, url]);
  };

  const removeEvidenceUrl = (index: number) => {
    setEvidenceUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Approved declarations not already linked to this story
  const availableToLink = approvedDeclarations.filter(
    (a) => !linkedDeclarations.some((l) => l.id === a.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Content Rights</h3>
        {!showNewForm && (
          <Button variant="ghost" size="sm" onClick={() => setShowNewForm(true)}>
            <Plus className="h-4 w-4" />
            Add Declaration
          </Button>
        )}
      </div>

      {/* Linked declarations */}
      {linkedDeclarations.length > 0 && (
        <div className="space-y-2">
          {linkedDeclarations.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {d.declaration_type === "ai_generated" && <Sparkles size={16} className="text-accent shrink-0" />}
                {d.badge_level === "verified_permission" && <ShieldCheck size={16} className="text-success shrink-0" />}
                {d.badge_level === "permission_documented" && <FileCheck size={16} className="text-muted shrink-0" />}
                {d.declaration_type === "fictional" && <BookOpen size={16} className="text-muted shrink-0" />}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {d.subject_name || DECLARATION_TYPE_LABELS[d.declaration_type]}
                  </p>
                  <div className="flex items-center gap-2">
                    {d.subject_platform && (
                      <span className="text-xs text-muted">{d.subject_platform}</span>
                    )}
                    <Badge
                      variant={d.status === "approved" ? "success" : d.status === "rejected" ? "danger" : "default"}
                      className="text-[10px]"
                    >
                      {d.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleUnlink(d.id)}>
                <Trash2 className="h-4 w-4 text-muted" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Link existing approved declaration */}
      {availableToLink.length > 0 && !showNewForm && (
        <div className="rounded-lg border border-border bg-surface-hover/30 p-3 space-y-2">
          <p className="text-xs font-medium text-muted flex items-center gap-1.5">
            <LinkIcon size={12} />
            Link an existing approved permission
          </p>
          <div className="space-y-1">
            {availableToLink.map((d) => (
              <button
                key={d.id}
                onClick={() => handleLinkExisting(d.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <ShieldCheck size={14} className="text-success shrink-0" />
                <span className="truncate">{d.subject_name}</span>
                {d.subject_platform && (
                  <span className="text-xs text-muted">({d.subject_platform})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* New declaration form */}
      {showNewForm && (
        <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
          <Select
            label="Content type"
            options={declarationTypeOptions}
            value={declarationType}
            onChange={(e) => setDeclarationType(e.target.value as DeclarationType)}
          />

          {declarationType === "ai_generated" && (
            <div className="rounded-lg bg-accent/5 border border-accent/20 p-3">
              <p className="text-sm text-accent">
                This story will display an &quot;AI-Generated Imagery&quot; label visible to readers.
              </p>
            </div>
          )}

          {isRealPerson && (
            <>
              <Input
                label="Model / person's name (or stage name)"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g. Jane Doe"
              />
              <Select
                label="Platform"
                options={[{ value: "", label: "Select platform..." }, ...SUBJECT_PLATFORMS]}
                value={subjectPlatform}
                onChange={(e) => setSubjectPlatform(e.target.value)}
              />
              <Input
                label="Profile URL (optional)"
                value={subjectProfileUrl}
                onChange={(e) => setSubjectProfileUrl(e.target.value)}
                placeholder="https://onlyfans.com/..."
              />

              <Select
                label="Evidence type"
                options={evidenceTierOptions}
                value={evidenceTier}
                onChange={(e) => setEvidenceTier(e.target.value as EvidenceTier)}
              />

              {evidenceTier === "video" && (
                <Input
                  label="Clock time visible in the video (for timestamp verification)"
                  value={videoClockTime}
                  onChange={(e) => setVideoClockTime(e.target.value)}
                  placeholder="e.g. 10:49 AM"
                />
              )}

              {evidenceTier === "prior_declaration" && (
                <Textarea
                  label="Describe the consent history"
                  value={priorConsentNotes}
                  onChange={(e) => setPriorConsentNotes(e.target.value)}
                  placeholder="Explain when and how permission was given, and any evidence you have..."
                  rows={4}
                />
              )}

              {/* Evidence file uploads */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Upload evidence
                  {evidenceTier === "video" && " (screen recording)"}
                  {evidenceTier === "screenshot" && " (screenshots)"}
                  {evidenceTier === "signed_consent" && " (signed form — PDF or image)"}
                  {evidenceTier === "prior_declaration" && " (any supporting files — optional)"}
                </label>
                {evidenceUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted">
                    <span className="truncate flex-1">{url.split("/").pop()}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeEvidenceUrl(i)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <MediaUpload
                  accept={
                    evidenceTier === "video"
                      ? "video/*"
                      : evidenceTier === "signed_consent"
                        ? "image/*,application/pdf"
                        : "image/*,video/*,application/pdf"
                  }
                  maxSize={50 * 1024 * 1024}
                  onUpload={handleEvidenceUpload}
                />
              </div>
            </>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSubmitNew} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isRealPerson ? "Submit for Review" : "Save Declaration"}
            </Button>
            <Button variant="ghost" onClick={resetNewForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {linkedDeclarations.length === 0 && !showNewForm && (
        <p className="text-sm text-muted py-2">
          No content rights declarations yet. If your story features a real person or AI-generated imagery, add a declaration.
        </p>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/story/content-rights-form.tsx
git commit -m "feat: add ContentRightsForm component for creator rights declarations"
```

---

## Task 7: Integrate Rights Form into Story Creation/Edit Flow

**Files:**
- Modify: `src/app/dashboard/stories/new/page.tsx`
- Modify: `src/app/dashboard/stories/[id]/edit/page.tsx`

**Step 1: Add the ContentRightsForm to the story creation page (Step 2, in the left sidebar)**

In `src/app/dashboard/stories/new/page.tsx`, after the Schedule section in the left sidebar (Step 2), add:

```typescript
// Add import at top:
import { ContentRightsForm } from "@/components/story/content-rights-form";

// In the left sidebar of Step 2, after the Schedule <div>, add:
{storyId && user && (
  <div className="rounded-lg border border-border bg-surface p-3 space-y-3">
    <ContentRightsForm storyId={storyId} creatorId={user.id} />
  </div>
)}
```

**Step 2: Add the same to the story edit page**

In `src/app/dashboard/stories/[id]/edit/page.tsx`, same pattern — add `ContentRightsForm` in the sidebar after the schedule section.

**Step 3: Commit**

```bash
git add src/app/dashboard/stories/new/page.tsx src/app/dashboard/stories/[id]/edit/page.tsx
git commit -m "feat: integrate ContentRightsForm into story creation and edit flows"
```

---

## Task 8: Display Badges on Story Cards

**Files:**
- Modify: `src/components/story/story-card.tsx`

**Step 1: Add badge display to story cards**

```typescript
// Add import at top:
import { RightsBadge } from "@/components/story/rights-badge";
import type { BadgeLevel } from "@/lib/types";

// The story-card currently shows format badge + gating badge.
// Add the rights badge next to them.
// In the badges area (near format badge), add:
{story.rights_declarations && story.rights_declarations.length > 0 && (
  <RightsBadge
    badgeLevel={story.rights_declarations.reduce((best: BadgeLevel, d) => {
      const priority: BadgeLevel[] = ["verified_permission", "permission_documented", "ai_generated", "none"];
      return priority.indexOf(d.badge_level) < priority.indexOf(best) ? d.badge_level : best;
    }, "none" as BadgeLevel)}
    size="sm"
  />
)}
```

**Step 2: Update the story query to include declarations**

In `src/lib/supabase/queries.ts`, modify `getPublishedStories` to join declarations:

After fetching stories, add a secondary query to fetch declarations for the returned story IDs, or modify the select to include:

```typescript
// In getPublishedStories, update the select to also fetch rights:
// After getting stories, enrich with declarations
// This is simplest done as a follow-up query since Supabase doesn't support
// many-to-many joins in a single select easily.
```

Alternative: Add a `highest_badge_level` computed column or denormalized field to stories table for simpler querying. This avoids N+1 queries on the browse page. Add to stories table:

```sql
-- Add to migration or new migration:
alter table stories add column badge_level badge_level not null default 'none';
```

Then update badge_level on the story when declarations change. This is simpler for reads.

**Step 3: Commit**

```bash
git add src/components/story/story-card.tsx src/lib/supabase/queries.ts
git commit -m "feat: display rights badges on story cards"
```

---

## Task 9: Display Badges on Story Detail Page

**Files:**
- Modify: `src/app/story/[slug]/page.tsx`

**Step 1: Add badge to story page metadata area**

```typescript
// Add import:
import { RightsBadge } from "@/components/story/rights-badge";
import { getDeclarationsByStory } from "@/lib/supabase/queries";

// Fetch declarations in the data loading:
const declarations = story ? await getDeclarationsByStory(story.id) : [];

// In the hero section, near the existing format/gating badges, add:
{declarations.length > 0 && (
  <RightsBadge
    badgeLevel={declarations.reduce((best, d) => {
      const priority = ["verified_permission", "permission_documented", "ai_generated", "none"];
      return priority.indexOf(d.badge_level) < priority.indexOf(best) ? d.badge_level : best;
    }, "none")}
    size="md"
  />
)}
```

**Step 2: Commit**

```bash
git add src/app/story/[slug]/page.tsx
git commit -m "feat: display rights badges on story detail page"
```

---

## Task 10: Admin Rights Review Page

**Files:**
- Create: `src/app/admin/rights-review/page.tsx`
- Modify: `src/app/admin/layout.tsx` (add nav item)

**Step 1: Add nav item to admin layout**

In `src/app/admin/layout.tsx`, update the `navItems` array (line 18-22):

```typescript
import {
  LayoutDashboard,
  Flag,
  Users,
  Shield,
  ChevronLeft,
  Menu,
  X,
  FileCheck,  // Add this import
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/rights-review", label: "Rights Review", icon: FileCheck },
  { href: "/admin/users", label: "Users", icon: Users },
];
```

**Step 2: Create the admin rights review page**

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth-store";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { RightsBadge } from "@/components/story/rights-badge";
import {
  DECLARATION_TYPE_LABELS,
  EVIDENCE_TIER_LABELS,
  BADGE_LEVEL_LABELS,
} from "@/lib/constants";
import type { ContentRightsDeclaration, DeclarationStatus } from "@/lib/types";
import {
  FileCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  MessageSquare,
  Clock,
  Loader2,
  ExternalLink,
  Play,
  Image as ImageIcon,
  FileText,
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
      return <Badge className="bg-yellow-500/10 text-yellow-600">pending</Badge>;
    case "approved":
      return <Badge variant="success">approved</Badge>;
    case "rejected":
      return <Badge variant="danger">rejected</Badge>;
    case "more_info_requested":
      return <Badge variant="accent">more info requested</Badge>;
    case "expired":
      return <Badge className="bg-foreground/5 text-muted">expired</Badge>;
  }
}

function daysUntilDeadline(deadline: string | null): number | null {
  if (!deadline) return null;
  const now = new Date();
  const dl = new Date(deadline);
  return Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function AdminRightsReviewPage() {
  const { user } = useAuthStore();
  const [declarations, setDeclarations] = useState<ContentRightsDeclaration[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchDeclarations = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) {
      setError("Database not configured");
      setLoading(false);
      return;
    }

    let query = supabase
      .from("content_rights_declarations")
      .select("*, creator:profiles!content_rights_declarations_creator_id_fkey(id, username, display_name, avatar_url, is_verified)")
      .order("grace_deadline", { ascending: true, nullsFirst: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error: fetchError } = await query;
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setDeclarations(data || []);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchDeclarations();
  }, [fetchDeclarations]);

  const handleAction = async (id: string, action: "approve" | "reject" | "more_info_requested") => {
    if ((action === "reject" || action === "more_info_requested") && !adminNotes.trim()) {
      toast("error", "Please provide a reason/message");
      return;
    }

    setUpdating(id);
    const supabase = createClient();
    if (!supabase) return;

    const updates: Record<string, unknown> = {
      status: action === "approve" ? "approved" : action,
      admin_reviewer_id: user?.id,
      reviewed_at: new Date().toISOString(),
    };

    if (adminNotes.trim()) {
      updates.admin_notes = adminNotes.trim();
    }

    const { error: updateError } = await supabase
      .from("content_rights_declarations")
      .update(updates)
      .eq("id", id);

    if (updateError) {
      toast("error", updateError.message);
    } else {
      toast("success", `Declaration ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "flagged for more info"}`);
      setAdminNotes("");
      setExpandedId(null);
      fetchDeclarations();
    }
    setUpdating(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileCheck className="h-6 w-6" />
            Rights Review
          </h1>
          <p className="text-sm text-muted mt-1">
            Review content rights declarations from creators
          </p>
        </div>
        <div className="w-48">
          <Select
            options={statusFilterOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {["pending", "approved", "rejected", "more_info_requested"].map((s) => (
          <div key={s} className="bg-surface border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">
              {declarations.filter((d) => d.status === s).length}
            </p>
            <p className="text-xs text-muted capitalize">{s.replace(/_/g, " ")}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {declarations.length === 0 ? (
        <div className="text-center py-12">
          <FileCheck className="h-10 w-10 mx-auto text-muted mb-3" />
          <p className="text-muted">No declarations found</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-hover/50">
                <th className="text-left font-medium text-muted px-5 py-3 text-sm">Creator</th>
                <th className="text-left font-medium text-muted px-5 py-3 text-sm">Subject</th>
                <th className="text-left font-medium text-muted px-5 py-3 text-sm">Evidence</th>
                <th className="text-left font-medium text-muted px-5 py-3 text-sm">Status</th>
                <th className="text-left font-medium text-muted px-5 py-3 text-sm">Deadline</th>
                <th className="text-right font-medium text-muted px-5 py-3 text-sm"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {declarations.map((d) => {
                const isExpanded = expandedId === d.id;
                const days = daysUntilDeadline(d.grace_deadline);
                return (
                  <>
                    <tr
                      key={d.id}
                      className="hover:bg-surface-hover/30 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : d.id)}
                    >
                      <td className="px-5 py-3 text-sm">
                        {d.creator?.display_name || "Unknown"}
                      </td>
                      <td className="px-5 py-3 text-sm">
                        <div>
                          <span className="font-medium">{d.subject_name || DECLARATION_TYPE_LABELS[d.declaration_type]}</span>
                          {d.subject_platform && (
                            <span className="text-xs text-muted ml-2">({d.subject_platform})</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm">
                        {d.evidence_tier ? EVIDENCE_TIER_LABELS[d.evidence_tier] : "—"}
                      </td>
                      <td className="px-5 py-3">{getStatusBadge(d.status)}</td>
                      <td className="px-5 py-3 text-sm">
                        {days !== null ? (
                          <span className={days <= 3 ? "text-danger font-medium" : "text-muted"}>
                            {days <= 0 ? "Overdue" : `${days}d left`}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {isExpanded ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr key={`${d.id}-detail`}>
                        <td colSpan={6} className="px-5 py-5 bg-surface-hover/20">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left: Evidence */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-semibold">Evidence</h4>

                              {d.evidence_urls && d.evidence_urls.length > 0 ? (
                                <div className="space-y-3">
                                  {d.evidence_urls.map((url, i) => {
                                    const ext = url.split(".").pop()?.toLowerCase();
                                    const isVideo = ["mp4", "webm", "mov"].includes(ext || "");
                                    const isPdf = ext === "pdf";
                                    return (
                                      <div key={i} className="rounded-lg border border-border overflow-hidden">
                                        {isVideo ? (
                                          <video controls className="w-full max-h-80" src={url}>
                                            <track kind="captions" />
                                          </video>
                                        ) : isPdf ? (
                                          <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-4 hover:bg-surface-hover transition-colors"
                                          >
                                            <FileText size={20} className="text-accent" />
                                            <span className="text-sm">View PDF</span>
                                            <ExternalLink size={14} className="text-muted ml-auto" />
                                          </a>
                                        ) : (
                                          <img src={url} alt={`Evidence ${i + 1}`} className="w-full max-h-80 object-contain" />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-muted">No evidence files uploaded</p>
                              )}

                              {/* Metadata */}
                              {d.evidence_metadata && (
                                <div className="space-y-1 text-sm">
                                  {(d.evidence_metadata as Record<string, unknown>).video_clock_time && (
                                    <p className="text-muted">
                                      <Clock size={12} className="inline mr-1" />
                                      Noted clock time: <span className="text-foreground font-medium">{String((d.evidence_metadata as Record<string, unknown>).video_clock_time)}</span>
                                    </p>
                                  )}
                                  {(d.evidence_metadata as Record<string, unknown>).prior_consent_notes && (
                                    <div className="mt-2">
                                      <p className="text-muted text-xs font-medium mb-1">Prior consent notes:</p>
                                      <p className="text-foreground bg-surface rounded-lg p-3 border border-border">
                                        {String((d.evidence_metadata as Record<string, unknown>).prior_consent_notes)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {d.subject_profile_url && (
                                <a
                                  href={d.subject_profile_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors"
                                >
                                  <ExternalLink size={14} />
                                  View subject profile
                                </a>
                              )}
                            </div>

                            {/* Right: Details + Actions */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-semibold">Details</h4>

                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted">Type</span>
                                  <span>{DECLARATION_TYPE_LABELS[d.declaration_type]}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted">Badge if approved</span>
                                  <RightsBadge badgeLevel={d.badge_level} size="sm" />
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted">Submitted</span>
                                  <span>{formatDate(d.created_at)}</span>
                                </div>
                                {d.reviewed_at && (
                                  <div className="flex justify-between">
                                    <span className="text-muted">Reviewed</span>
                                    <span>{formatDate(d.reviewed_at)}</span>
                                  </div>
                                )}
                                {d.admin_notes && (
                                  <div className="mt-2">
                                    <p className="text-muted text-xs font-medium mb-1">Admin notes:</p>
                                    <p className="text-foreground bg-surface rounded-lg p-3 border border-border">
                                      {d.admin_notes}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Actions (only for non-final states) */}
                              {(d.status === "pending" || d.status === "more_info_requested") && (
                                <div className="space-y-3 pt-2 border-t border-border">
                                  <Textarea
                                    label="Admin notes / rejection reason"
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Required for reject or request more info..."
                                    rows={3}
                                  />
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="accent"
                                      size="sm"
                                      onClick={() => handleAction(d.id, "approve")}
                                      disabled={updating === d.id}
                                    >
                                      {updating === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                      Approve
                                    </Button>
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() => handleAction(d.id, "reject")}
                                      disabled={updating === d.id}
                                    >
                                      <XCircle className="h-4 w-4" />
                                      Reject
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleAction(d.id, "more_info_requested")}
                                      disabled={updating === d.id}
                                    >
                                      <MessageSquare className="h-4 w-4" />
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/admin/rights-review/page.tsx src/app/admin/layout.tsx
git commit -m "feat: add admin rights review page with evidence viewer and approval actions"
```

---

## Task 11: Notification Integration

**Files:**
- Modify: `src/app/admin/rights-review/page.tsx` (already handled via toast)

**Step 1: Add notification creation on admin actions**

In the `handleAction` function, after the successful update, insert a notification:

```typescript
// After successful update, notify the creator
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
        ? `Your permission documentation for "${declaration.subject_name || "content"}" was rejected: ${adminNotes}`
        : `We need more information about your permission for "${declaration.subject_name || "content"}": ${adminNotes}`;

  await supabase.from("notifications").insert({
    user_id: declaration.creator_id,
    type: "rights_review",
    title: notifTitle,
    body: notifBody,
    link: "/dashboard/stories",
  });
}
```

**Step 2: Commit**

```bash
git add src/app/admin/rights-review/page.tsx
git commit -m "feat: send notifications to creators on rights review actions"
```

---

## Task 12: Grace Period Auto-Unpublish (Cron/API)

**Files:**
- Create: `src/app/api/cron/expire-declarations/route.ts`

**Step 1: Create the cron API route**

This endpoint is called periodically (e.g., daily via Vercel Cron or external scheduler) to expire declarations past their grace deadline and unpublish associated stories.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Find expired pending declarations
  const { data: expired } = await supabase
    .from("content_rights_declarations")
    .select("id, creator_id, subject_name")
    .in("status", ["pending", "more_info_requested"])
    .lt("grace_deadline", new Date().toISOString());

  if (!expired || expired.length === 0) {
    return NextResponse.json({ expired: 0 });
  }

  let unpublishedCount = 0;

  for (const declaration of expired) {
    // Mark declaration as expired
    await supabase
      .from("content_rights_declarations")
      .update({ status: "expired" })
      .eq("id", declaration.id);

    // Find linked stories that have no other approved declaration
    const { data: linkedStories } = await supabase
      .from("story_rights_declarations")
      .select("story_id")
      .eq("declaration_id", declaration.id);

    for (const link of linkedStories || []) {
      // Check if story has any other approved declaration
      const { data: otherDeclarations } = await supabase
        .from("story_rights_declarations")
        .select("declaration:content_rights_declarations(status)")
        .eq("story_id", link.story_id)
        .neq("declaration_id", declaration.id);

      const hasApproved = (otherDeclarations || []).some(
        (d: { declaration: { status: string } }) => d.declaration?.status === "approved"
      );

      if (!hasApproved) {
        // Unpublish the story
        await supabase
          .from("stories")
          .update({ status: "draft" })
          .eq("id", link.story_id)
          .eq("status", "published");
        unpublishedCount++;
      }
    }

    // Notify creator
    await supabase.from("notifications").insert({
      user_id: declaration.creator_id,
      type: "rights_expired",
      title: "Rights declaration expired",
      body: `Your permission documentation for "${declaration.subject_name || "content"}" has expired. Associated stories have been unpublished. Please submit updated documentation.`,
      link: "/dashboard/stories",
    });
  }

  return NextResponse.json({
    expired: expired.length,
    unpublished: unpublishedCount,
  });
}
```

**Step 2: Commit**

```bash
git add src/app/api/cron/expire-declarations/route.ts
git commit -m "feat: add cron endpoint to expire declarations and unpublish stories past grace period"
```

---

## Summary of All Tasks

| Task | Description | Files |
|------|-------------|-------|
| 1 | Database migration | `supabase/migrations/20260402100000_content_rights_declarations.sql` |
| 2 | TypeScript types | `src/lib/types.ts` |
| 3 | Constants | `src/lib/constants.ts` |
| 4 | Query functions | `src/lib/supabase/queries.ts` |
| 5 | RightsBadge component | `src/components/story/rights-badge.tsx` |
| 6 | ContentRightsForm component | `src/components/story/content-rights-form.tsx` |
| 7 | Integrate form into story creation/edit | `src/app/dashboard/stories/new/page.tsx`, `src/app/dashboard/stories/[id]/edit/page.tsx` |
| 8 | Badges on story cards | `src/components/story/story-card.tsx`, `src/lib/supabase/queries.ts` |
| 9 | Badges on story detail page | `src/app/story/[slug]/page.tsx` |
| 10 | Admin rights review page | `src/app/admin/rights-review/page.tsx`, `src/app/admin/layout.tsx` |
| 11 | Notification integration | `src/app/admin/rights-review/page.tsx` |
| 12 | Grace period cron job | `src/app/api/cron/expire-declarations/route.ts` |
