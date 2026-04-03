import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const VERIFF_API_URL = "https://stationapi.veriff.com/v1";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export async function POST() {
  try {
    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }

    // Check if any session is already approved in our DB
    const { data: approvedSessions } = await adminClient
      .from("verification_sessions")
      .select("veriff_session_id")
      .eq("user_id", user.id)
      .eq("status", "approved")
      .limit(1);

    if (approvedSessions && approvedSessions.length > 0) {
      // Ensure profile is marked verified
      await adminClient
        .from("profiles")
        .update({ is_verified: true })
        .eq("id", user.id);
      return NextResponse.json({ verified: true, status: "approved" });
    }

    // Get all non-terminal sessions to check with Veriff API
    const { data: sessions } = await adminClient
      .from("verification_sessions")
      .select("veriff_session_id, status")
      .eq("user_id", user.id)
      .not("status", "in", '("declined","expired")')
      .order("created_at", { ascending: false });

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ verified: false, status: "no_session" });
    }

    const apiKey = process.env.VERIFF_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ verified: false, status: sessions[0].status });
    }

    // Check each session with Veriff until we find an approved one
    for (const session of sessions) {
      const veriffRes = await fetch(`${VERIFF_API_URL}/sessions/${session.veriff_session_id}`, {
        headers: { "X-AUTH-CLIENT": apiKey },
      });

      if (!veriffRes.ok) continue;

      const veriffData = await veriffRes.json();
      const veriffStatus = veriffData.verification?.status || veriffData.status;

      // Update session in DB
      await adminClient
        .from("verification_sessions")
        .update({ status: veriffStatus, updated_at: new Date().toISOString() })
        .eq("veriff_session_id", session.veriff_session_id);

      if (veriffStatus === "approved") {
        await adminClient
          .from("profiles")
          .update({ is_verified: true })
          .eq("id", user.id);
        return NextResponse.json({ verified: true, status: "approved" });
      }
    }

    // Return the latest session's status
    return NextResponse.json({ verified: false, status: sessions[0].status });
  } catch (err) {
    console.error("[Veriff check] Error:", err);
    return NextResponse.json({ error: "Check failed" }, { status: 500 });
  }
}
