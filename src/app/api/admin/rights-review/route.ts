import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const { supabase, response } = await requireAdminRoute();
  if (!supabase || response) {
    return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status") || "all";

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

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ declarations: data ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Failed to load declarations" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { supabase, response, adminUserId } = await requireAdminRoute();
  if (!supabase || response || !adminUserId) {
    return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, updates, notification } = body;

    if (!id || !updates) {
      return NextResponse.json(
        { error: "Missing id or updates" },
        { status: 400 }
      );
    }

    const safeUpdates = Object.fromEntries(
      Object.entries(updates as Record<string, unknown>).filter(([key]) =>
        ["status", "admin_notes", "badge_level"].includes(key)
      )
    );
    safeUpdates.admin_reviewer_id = adminUserId;
    safeUpdates.reviewed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("content_rights_declarations")
      .update(safeUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send notification if provided (non-blocking — failure here won't fail the response)
    if (notification) {
      try {
        await supabase.from("notifications").insert({
          user_id: notification.user_id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          link: notification.link,
        });
      } catch {
        // Notification failure should not block the main action
      }
    }

    return NextResponse.json({ declaration: data });
  } catch {
    return NextResponse.json(
      { error: "Failed to update declaration" },
      { status: 500 }
    );
  }
}
