import { createClient } from "./client";

// ============================================================
// CATEGORIES
// ============================================================

export async function getCategories() {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  return data || [];
}

// ============================================================
// STORIES
// ============================================================

export async function getPublishedStories(options?: {
  category?: string;
  format?: string;
  sort?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = createClient();
  if (!supabase) return [];

  let query = supabase
    .from("stories")
    .select("*, category:categories(*), creator:profiles!creator_id(id, username, display_name, avatar_url, is_verified, subscription_price)")
    .eq("status", "published")
    .eq("visibility", "public");

  if (options?.category && options.category !== "all") {
    query = query.eq("category_id", options.category);
  }

  if (options?.format && options.format !== "all") {
    query = query.eq("format", options.format);
  }

  if (options?.search) {
    query = query.textSearch("fts", options.search);
  }

  switch (options?.sort) {
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "most-tipped":
      query = query.order("tip_total", { ascending: false });
      break;
    default: // trending
      query = query.order("view_count", { ascending: false });
      break;
  }

  const limit = options?.limit || 12;
  const offset = options?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data } = await query;
  return data || [];
}

export async function getStoryBySlug(slug: string) {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("stories")
    .select("*, category:categories(*), creator:profiles!creator_id(id, username, display_name, avatar_url, bio, is_verified, follower_count, story_count, subscription_price, created_at)")
    .eq("slug", slug)
    .single();
  return data;
}

export async function getStoriesByCreator(creatorId: string) {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("stories")
    .select("*, category:categories(*)")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getMyStories(creatorId: string) {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("stories")
    .select("*, category:categories(*)")
    .eq("creator_id", creatorId)
    .order("updated_at", { ascending: false });
  return data || [];
}

export async function createStory(story: {
  creator_id: string;
  title: string;
  slug: string;
  description: string;
  format: "prose" | "chat" | "gallery";
  category_id: string;
  status: "draft" | "published";
  is_gated: boolean;
  price?: number;
  cover_image_url?: string;
  visibility?: "public" | "unlisted";
  password_hash?: string | null;
}) {
  const supabase = createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("stories")
    .insert(story)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateStory(id: string, updates: Record<string, unknown>) {
  const supabase = createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("stories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteStory(id: string) {
  const supabase = createClient();
  if (!supabase) return;
  const { error } = await supabase.from("stories").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// CHAPTERS
// ============================================================

export async function getChapters(storyId: string) {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("chapters")
    .select("*")
    .eq("story_id", storyId)
    .order("chapter_number");
  return data || [];
}

export async function getChapterWithContent(storyId: string, chapterNumber: number) {
  const supabase = createClient();
  if (!supabase) return null;
  const { data: chapter } = await supabase
    .from("chapters")
    .select("*, content:chapter_content(content_json)")
    .eq("story_id", storyId)
    .eq("chapter_number", chapterNumber)
    .single();
  return chapter;
}

export async function createChapter(chapter: {
  story_id: string;
  chapter_number: number;
  title: string;
  status: "draft" | "published" | "scheduled";
  publish_at?: string;
}) {
  const supabase = createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("chapters")
    .insert(chapter)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateChapter(id: string, updates: Record<string, unknown>) {
  const supabase = createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("chapters")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function saveChapterContent(chapterId: string, contentJson: unknown) {
  const supabase = createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("chapter_content")
    .upsert({ chapter_id: chapterId, content_json: contentJson }, { onConflict: "chapter_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// PROFILES
// ============================================================

export async function getProfileByUsername(username: string) {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();
  return data;
}

export async function updateProfile(id: string, updates: Record<string, unknown>) {
  const supabase = createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// BOOKMARKS
// ============================================================

export async function getBookmarks(userId: string) {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("bookmarks")
    .select("*, story:stories(*, creator:profiles!creator_id(id, username, display_name, avatar_url)), last_read_chapter:chapters!last_read_chapter_id(id, chapter_number, title)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function addBookmark(userId: string, storyId: string) {
  const supabase = createClient();
  if (!supabase) return;
  const { error } = await supabase
    .from("bookmarks")
    .upsert({ user_id: userId, story_id: storyId }, { onConflict: "user_id,story_id" });
  if (error) throw error;
}

export async function removeBookmark(userId: string, storyId: string) {
  const supabase = createClient();
  if (!supabase) return;
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", userId)
    .eq("story_id", storyId);
  if (error) throw error;
}

export async function updateBookmarkProgress(userId: string, storyId: string, chapterId: string) {
  const supabase = createClient();
  if (!supabase) return;
  await supabase
    .from("bookmarks")
    .update({ last_read_chapter_id: chapterId })
    .eq("user_id", userId)
    .eq("story_id", storyId);
}

// ============================================================
// COMMENTS
// ============================================================

export async function getComments(storyId: string) {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("comments")
    .select("*, user:profiles!user_id(id, username, display_name, avatar_url)")
    .eq("story_id", storyId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function addComment(comment: { story_id: string; chapter_id?: string; user_id: string; body: string }) {
  const supabase = createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("comments")
    .insert(comment)
    .select("*, user:profiles!user_id(id, username, display_name, avatar_url)")
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// READING HISTORY
// ============================================================

export async function getReadingHistory(userId: string) {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("reading_history")
    .select("*, story:stories(*, creator:profiles!creator_id(id, username, display_name, avatar_url)), chapter:chapters(id, title, chapter_number)")
    .eq("user_id", userId)
    .order("read_at", { ascending: false })
    .limit(50);
  return data || [];
}

export async function recordReading(userId: string, storyId: string, chapterId: string) {
  const supabase = createClient();
  if (!supabase) return;
  await supabase
    .from("reading_history")
    .upsert(
      { user_id: userId, story_id: storyId, chapter_id: chapterId, read_at: new Date().toISOString() },
      { onConflict: "user_id,story_id,chapter_id" }
    );
}

// ============================================================
// SEARCH
// ============================================================

export async function searchStories(query: string) {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("stories")
    .select("*, category:categories(*), creator:profiles!creator_id(id, username, display_name, avatar_url)")
    .eq("status", "published")
    .eq("visibility", "public")
    .textSearch("fts", query)
    .limit(20);
  return data || [];
}

// ============================================================
// FOLLOWS
// ============================================================

export async function followCreator(followerId: string, followingId: string) {
  const supabase = createClient();
  if (!supabase) return;
  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: followerId, following_id: followingId });
  if (error && error.code !== "23505") throw error; // ignore duplicate
}

export async function unfollowCreator(followerId: string, followingId: string) {
  const supabase = createClient();
  if (!supabase) return;
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  if (error) throw error;
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return !!data;
}

export async function getFollowing(userId: string) {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("follows")
    .select("following:profiles!following_id(id, username, display_name, avatar_url, bio, story_count, follower_count)")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

// ============================================================
// REPORTS
// ============================================================

export async function submitReport(report: {
  reporter_id: string;
  target_type: "story" | "comment" | "profile";
  target_id: string;
  reason: string;
}) {
  const supabase = createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("reports")
    .insert(report)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// ANALYTICS
// ============================================================

export async function getCreatorAnalytics(creatorId: string) {
  const supabase = createClient();
  if (!supabase) return null;

  // Get all stories for this creator
  const { data: stories } = await supabase
    .from("stories")
    .select("id, title, slug, view_count, tip_total, comment_count, format, status, created_at")
    .eq("creator_id", creatorId)
    .order("view_count", { ascending: false });

  // Get daily view counts for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: dailyViews } = await supabase
    .from("story_views")
    .select("viewed_at, story_id")
    .in("story_id", (stories || []).map((s: { id: string }) => s.id))
    .gte("viewed_at", thirtyDaysAgo.toISOString().split("T")[0]);

  return {
    stories: stories || [],
    dailyViews: dailyViews || [],
  };
}

export async function recordStoryView(storyId: string, chapterId: string | null, viewerId: string | null) {
  const supabase = createClient();
  if (!supabase) return;
  await supabase.from("story_views").insert({
    story_id: storyId,
    chapter_id: chapterId,
    viewer_id: viewerId,
  });
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export async function getNotifications(userId: string, limit = 20) {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = createClient();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);
  return count || 0;
}

export async function markNotificationRead(notificationId: string) {
  const supabase = createClient();
  if (!supabase) return;
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);
}

export async function markAllNotificationsRead(userId: string) {
  const supabase = createClient();
  if (!supabase) return;
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
}

export async function createNotification(notification: {
  user_id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}) {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("notifications")
    .insert(notification)
    .select()
    .single();
  return data;
}

// ============================================================
// TAGS
// ============================================================

/** Persist tags for a story — creates missing tags, links all to story */
export async function saveStoryTags(storyId: string, tagNames: string[]): Promise<void> {
  const supabase = createClient();
  if (!supabase || tagNames.length === 0) return;

  const normalized = tagNames.map(t => t.trim().toLowerCase()).filter(Boolean);
  if (normalized.length === 0) return;

  // Remove existing story_tags for this story
  await supabase.from("story_tags").delete().eq("story_id", storyId);

  for (const name of normalized) {
    const slug = name.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    // Try to find existing tag
    const { data: existing } = await supabase
      .from("tags")
      .select("id")
      .eq("slug", slug)
      .single();

    let tagId: string;
    if (existing) {
      tagId = existing.id;
    } else {
      const { data: created } = await supabase
        .from("tags")
        .insert({ name, slug })
        .select("id")
        .single();
      if (!created) continue;
      tagId = created.id;
    }

    await supabase.from("story_tags").insert({ story_id: storyId, tag_id: tagId });
  }
}

// ============================================================
// HELPERS
// ============================================================

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80)
    + "-" + Math.random().toString(36).slice(2, 8);
}

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
