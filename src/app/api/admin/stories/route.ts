import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const { supabase, response } = await requireAdminRoute();
  if (!supabase || response) {
    return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  try {
    let query = supabase
      .from("stories")
      .select(
        "id, title, slug, description, format, category_id, status, is_gated, price, visibility, chapter_count, published_chapter_count, view_count, tip_total, comment_count, created_at, updated_at, creator:profiles!creator_id(id, username, display_name, avatar_url)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ stories: data ?? [], total: count ?? 0 });
  } catch {
    return NextResponse.json({ error: "Failed to load stories" }, { status: 500 });
  }
}
