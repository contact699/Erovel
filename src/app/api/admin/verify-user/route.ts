import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const { supabase, response, adminUserId } = await requireAdminRoute();
  if (!supabase || response) {
    return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { userId?: string; username?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { userId, username } = body;
  if (!userId && !username) {
    return NextResponse.json(
      { error: "Provide userId or username" },
      { status: 400 }
    );
  }

  const profileQuery = supabase
    .from("profiles")
    .select("id, username, display_name, is_verified, role")
    .limit(1);

  const { data: profile, error: profileErr } = userId
    ? await profileQuery.eq("id", userId).single()
    : await profileQuery.eq("username", username!).single();

  if (profileErr || !profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ is_verified: true })
    .eq("id", profile.id);

  if (updateErr) {
    return NextResponse.json(
      { error: `Profile update failed: ${updateErr.message}` },
      { status: 500 }
    );
  }

  // Also mark the latest verification_sessions row as approved so the
  // check route doesn't keep polling Veriff for a stale session.
  const { data: latestSession } = await supabase
    .from("verification_sessions")
    .select("id, status")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestSession && latestSession.status !== "approved") {
    await supabase
      .from("verification_sessions")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", latestSession.id);
  }

  console.log(
    `[Admin verify-user] ${adminUserId} manually approved ${profile.username} (${profile.id})`
  );

  return NextResponse.json({
    verified: true,
    user: {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
    },
  });
}
