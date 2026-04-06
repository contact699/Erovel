import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export async function GET(request: NextRequest) {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
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
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
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

    const { data, error } = await supabase
      .from("content_rights_declarations")
      .update(updates)
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
