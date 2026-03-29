import type { Category } from "./types";

export const PLATFORM_NAME = "Erovel";
export const PLATFORM_TAGLINE = "Stories that ignite";
export const PLATFORM_CUT = 0.15; // 15%

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
  { id: "romance", name: "Romance", slug: "romance", story_count: 0 },
  { id: "fantasy", name: "Fantasy", slug: "fantasy", story_count: 0 },
  { id: "bdsm", name: "BDSM", slug: "bdsm", story_count: 0 },
  { id: "lesbian", name: "Lesbian", slug: "lesbian", story_count: 0 },
  { id: "gay", name: "Gay", slug: "gay", story_count: 0 },
  { id: "group", name: "Group", slug: "group", story_count: 0 },
  { id: "voyeur", name: "Voyeur/Exhibitionism", slug: "voyeur", story_count: 0 },
  { id: "mature", name: "Mature", slug: "mature", story_count: 0 },
  { id: "scifi", name: "Sci-Fi & Fantasy", slug: "scifi", story_count: 0 },
  { id: "interracial", name: "Interracial", slug: "interracial", story_count: 0 },
  { id: "cheating", name: "Cheating", slug: "cheating", story_count: 0 },
  { id: "first-time", name: "First Time", slug: "first-time", story_count: 0 },
  { id: "taboo", name: "Taboo", slug: "taboo", story_count: 0 },
  { id: "celebrity", name: "Celebrity", slug: "celebrity", story_count: 0 },
  { id: "anal", name: "Anal", slug: "anal", story_count: 0 },
  { id: "fetish", name: "Fetish", slug: "fetish", story_count: 0 },
  { id: "humor", name: "Humor & Satire", slug: "humor", story_count: 0 },
  { id: "nonconsent", name: "Non-consent/Reluctance", slug: "nonconsent", story_count: 0 },
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
