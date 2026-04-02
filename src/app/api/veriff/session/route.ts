import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
          callback: `https://erovel.com/api/veriff/webhook`,
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

    // Store session in DB
    await supabase.from("verification_sessions").insert({
      user_id: profile.id,
      veriff_session_id: session.id,
      status: session.status,
      veriff_url: session.url,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    console.error("Veriff session error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
