import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-hmac-signature");
    const secret = process.env.VERIFF_API_SECRET;

    // Verify webhook signature
    if (secret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

      if (signature.toLowerCase() !== expectedSignature.toLowerCase()) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const data = JSON.parse(body);
    const { verification } = data;

    if (!verification?.id || !verification?.vendorData) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const status = verification.status;
    const userId = verification.vendorData;

    // Update verification session
    await supabase
      .from("verification_sessions")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("veriff_session_id", verification.id);

    // If approved, mark profile as verified
    if (status === "approved") {
      await supabase
        .from("profiles")
        .update({ is_verified: true })
        .eq("id", userId);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Veriff webhook error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
