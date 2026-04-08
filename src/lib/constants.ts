import type { Category } from "./types";

export const PLATFORM_NAME = "Erovel";
export const PLATFORM_TAGLINE = "Stories that ignite";
/**
 * Platform fee applied to every tip and subscription, as a percentage of gross.
 *
 * Phase 1: 0 (ships engine without changing economics for existing creators).
 * Phase 4 (post-rollout verification): set to 15.
 *
 * See docs/plans/2026-04-07-splits-engine-v1-design.md for the rollout plan.
 */
export const PLATFORM_FEE_PCT = 0;

export const TIP_PRESETS = [2, 5, 10, 20];
export const MIN_PAYOUT = 50;

export const RELEASE_CADENCES = [
  { value: 1, label: "Daily" },
  { value: 2, label: "Every 2 days" },
  { value: 3, label: "Every 3 days" },
  { value: 7, label: "Weekly" },
  { value: 14, label: "Bi-weekly" },
];

export const CATEGORIES: Category[] = [
  { id: "mf", name: "M/F", slug: "mf", story_count: 0 },
  { id: "family", name: "Family", slug: "family", story_count: 0 },
  { id: "cheating", name: "Cheating", slug: "cheating", story_count: 0 },
  { id: "hotwife", name: "Hotwife", slug: "hotwife", story_count: 0 },
  { id: "cuckold", name: "Cuckold", slug: "cuckold", story_count: 0 },
  { id: "mff", name: "M/F/F", slug: "mff", story_count: 0 },
  { id: "mmf", name: "M/M/F", slug: "mmf", story_count: 0 },
  { id: "group", name: "Group", slug: "group", story_count: 0 },
  { id: "lesbian", name: "F/F", slug: "lesbian", story_count: 0 },
  { id: "gay", name: "M/M", slug: "gay", story_count: 0 },
  { id: "trans", name: "Trans", slug: "trans", story_count: 0 },
  { id: "nonbinary", name: "Non-Binary", slug: "nonbinary", story_count: 0 },
  { id: "cnc", name: "CNC", slug: "cnc", story_count: 0 },
  { id: "bdsm", name: "BDSM", slug: "bdsm", story_count: 0 },
  { id: "fetish", name: "Fetish", slug: "fetish", story_count: 0 },
  { id: "scifi", name: "Sci-Fi & Fantasy", slug: "scifi", story_count: 0 },
  { id: "other", name: "Other", slug: "other", story_count: 0 },
];

export const CHAT_BUBBLE_COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#8B5CF6", // purple
  "#F59E0B", // amber
  "#EF4444", // red
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
];

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
