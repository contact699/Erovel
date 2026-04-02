import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export async function GET() {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  try {
    // Run all counts in parallel
    const [
      { count: totalUsers },
      { count: totalCreators },
      { count: totalReaders },
      { count: totalStories },
      { count: publishedStories },
      { count: draftStories },
      { count: totalChapters },
      { count: totalComments },
      { count: totalBookmarks },
      { count: totalFollows },
      { count: pendingReports },
      { count: totalViews },
      { count: verifiedCreators },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "creator"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "reader"),
      supabase.from("stories").select("*", { count: "exact", head: true }),
      supabase.from("stories").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("stories").select("*", { count: "exact", head: true }).eq("status", "draft"),
      supabase.from("chapters").select("*", { count: "exact", head: true }),
      supabase.from("comments").select("*", { count: "exact", head: true }),
      supabase.from("bookmarks").select("*", { count: "exact", head: true }),
      supabase.from("follows").select("*", { count: "exact", head: true }),
      supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("story_views").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "creator").eq("is_verified", true),
    ]);

    // Recent signups (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: recentSignups } = await supabase
      .from("profiles")
      .select("id, username, display_name, role, is_verified, created_at")
      .gte("created_at", weekAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(20);

    // Recent stories
    const { data: recentStories } = await supabase
      .from("stories")
      .select("id, title, slug, format, status, view_count, creator_id, created_at, creator:profiles!creator_id(username, display_name)")
      .order("created_at", { ascending: false })
      .limit(10);

    // Top stories by views
    const { data: topStories } = await supabase
      .from("stories")
      .select("id, title, slug, view_count, tip_total, comment_count, creator:profiles!creator_id(username, display_name)")
      .eq("status", "published")
      .order("view_count", { ascending: false })
      .limit(10);

    // Recent reports
    const { data: recentReports } = await supabase
      .from("reports")
      .select("id, target_type, reason, status, created_at, reporter:profiles!reporter_id(username)")
      .order("created_at", { ascending: false })
      .limit(5);

    // Daily signups for last 14 days
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const { data: signupHistory } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", twoWeeksAgo.toISOString());

    // Daily views for last 14 days
    const { data: viewHistory } = await supabase
      .from("story_views")
      .select("viewed_at")
      .gte("viewed_at", twoWeeksAgo.toISOString().split("T")[0]);

    // Aggregate tips
    const { data: tipData } = await supabase
      .from("tips")
      .select("amount");
    const totalTipRevenue = (tipData || []).reduce((sum: number, t: { amount: number }) => sum + Number(t.amount), 0);
    const platformCut = totalTipRevenue * 0.15;

    return NextResponse.json({
      counts: {
        totalUsers: totalUsers || 0,
        totalCreators: totalCreators || 0,
        totalReaders: totalReaders || 0,
        verifiedCreators: verifiedCreators || 0,
        totalStories: totalStories || 0,
        publishedStories: publishedStories || 0,
        draftStories: draftStories || 0,
        totalChapters: totalChapters || 0,
        totalComments: totalComments || 0,
        totalBookmarks: totalBookmarks || 0,
        totalFollows: totalFollows || 0,
        pendingReports: pendingReports || 0,
        totalViews: totalViews || 0,
        totalTipRevenue,
        platformCut,
      },
      recentSignups: recentSignups || [],
      recentStories: recentStories || [],
      topStories: topStories || [],
      recentReports: recentReports || [],
      signupHistory: signupHistory || [],
      viewHistory: viewHistory || [],
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
