// Core domain types for Erovel

export type UserRole = "reader" | "creator" | "admin";
export type StoryFormat = "prose" | "chat";
export type StoryStatus = "draft" | "published" | "scheduled";
export type ChapterStatus = "draft" | "published" | "scheduled";
export type SubscriptionTargetType = "creator" | "story";
export type SubscriptionStatus = "active" | "cancelled" | "expired";
export type PayoutMethod = "paxum" | "crypto";
export type PayoutStatus = "pending" | "processing" | "completed" | "failed";
export type MediaType = "image" | "gif" | "video";
export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  role: UserRole;
  is_verified: boolean;
  follower_count: number;
  story_count: number;
  created_at: string;
}

export interface Story {
  id: string;
  creator_id: string;
  creator?: Profile;
  title: string;
  slug: string;
  description: string;
  cover_image_url: string | null;
  format: StoryFormat;
  category_id: string;
  category?: Category;
  tags: Tag[];
  status: StoryStatus;
  is_gated: boolean;
  chapter_count: number;
  published_chapter_count: number;
  view_count: number;
  tip_total: number;
  comment_count: number;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  story_id: string;
  chapter_number: number;
  title: string;
  status: ChapterStatus;
  publish_at: string | null;
  created_at: string;
}

export interface ChapterContent {
  id: string;
  chapter_id: string;
  content_json: ProseContent | ChatContent;
}

// Prose editor content (TipTap JSON)
export interface ProseContent {
  type: "prose";
  content: TipTapNode[];
}

export interface TipTapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

// Chat bubble editor content
export interface ChatContent {
  type: "chat";
  characters: ChatCharacter[];
  messages: ChatMessage[];
}

export interface ChatCharacter {
  id: string;
  name: string;
  avatar_url: string | null;
  color: string;
  alignment: "left" | "right";
}

export interface ChatMessage {
  id: string;
  character_id: string;
  text: string;
  media_url: string | null;
  media_type: MediaType | null;
  order: number;
}

export interface Media {
  id: string;
  uploader_id: string;
  url: string;
  cdn_path: string;
  type: MediaType;
  file_size: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  story_count: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Comment {
  id: string;
  story_id: string;
  chapter_id: string | null;
  user_id: string;
  user?: Profile;
  body: string;
  created_at: string;
}

export interface BookmarkChapter {
  id: string;
  chapter_number: number;
  title: string;
}

export interface Bookmark {
  user_id: string;
  story_id: string;
  story?: Story;
  last_read_chapter_id: string | null;
  last_read_chapter?: BookmarkChapter | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  reader_id: string;
  target_type: SubscriptionTargetType;
  target_id: string;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string;
}

export interface Tip {
  id: string;
  reader_id: string;
  reader?: Profile;
  creator_id: string;
  story_id: string | null;
  story?: Story;
  amount: number;
  currency: string;
  created_at: string;
}

export interface Payout {
  id: string;
  creator_id: string;
  amount: number;
  method: PayoutMethod;
  status: PayoutStatus;
  processed_at: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reporter?: Profile;
  target_type: "story" | "comment" | "profile";
  target_id: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
}

export interface EarningsSummary {
  total_earnings: number;
  pending_payout: number;
  tips_this_month: number;
  subscriptions_this_month: number;
  subscriber_count: number;
}

export interface StoryAnalytics {
  story_id: string;
  views: number;
  unique_readers: number;
  tips: number;
  tip_amount: number;
  comments: number;
  bookmarks: number;
}
