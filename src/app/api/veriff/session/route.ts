import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

const VERIFF_API_URL = "https://stationapi.veriff.com/v1";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, is_verified")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.is_verified) {
      return NextResponse.json({ error: "Already verified" }, { status: 400 });
    }

    // Check if there's already an approved session in verification_sessions
    const adminClient = getAdminClient();
    if (adminClient) {
      const { data: approvedSessions } = await adminClient
        .from("verification_sessions")
        .select("veriff_session_id")
        .eq("user_id", profile.id)
        .eq("status", "approved")
        .limit(1);

      if (approvedSessions && approvedSessions.length > 0) {
        // Profile wasn't marked verified but session is approved — fix it
        await adminClient
          .from("profiles")
          .update({ is_verified: true })
          .eq("id", profile.id);
        return NextResponse.json({ error: "Already verified" }, { status: 400 });
      }
    }

    const apiKey = process.env.VERIFF_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Verification service not configured" }, { status: 503 });
    }

    // Create Veriff session
    const veriffResponse = await fetch(`${VERIFF_API_URL}/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-AUTH-CLIENT": apiKey,
      },
      body: JSON.stringify({
        verification: {
          callback: `https://www.erovel.com/dashboard`,
          person: {
            firstName: profile.display_name.split(" ")[0] || profile.display_name,
            lastName: profile.display_name.split(" ").slice(1).join(" ") || "-",
          },
          vendorData: profile.id,
        },
      }),
    });

    if (!veriffResponse.ok) {
      const err = await veriffResponse.text();
      console.error("Veriff session creation failed:", err);
      return NextResponse.json({ error: "Failed to create verification session" }, { status: 502 });
    }

    const veriffData = await veriffResponse.json();
    const session = veriffData.verification;

    // Store session in DB (use admin client to bypass RLS)
    const storeClient = adminClient ?? getAdminClient();
    if (storeClient) {
      await storeClient.from("verification_sessions").insert({
        user_id: profile.id,
        veriff_session_id: session.id,
        status: session.status,
        veriff_url: session.url,
      });
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    console.error("Veriff session error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
