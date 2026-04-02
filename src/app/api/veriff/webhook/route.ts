import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Use service role key to bypass RLS — webhooks are unauthenticated server-to-server calls
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export async function GET() {
  return NextResponse.json({ status: "Veriff webhook endpoint active. This URL accepts POST requests from Veriff." });
}

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
        console.error("[Veriff webhook] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const data = JSON.parse(body);
    console.log("[Veriff webhook] Received:", JSON.stringify(data).slice(0, 500));

    // Veriff sends different payload shapes depending on the webhook type
    // fullauto: { status, verification: { id, code, vendorData, status, ... } }
    // decisions: { verification: { id, vendorData, status, ... } }
    const verification = data.verification;

    if (!verification?.id) {
      console.error("[Veriff webhook] Missing verification.id");
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const supabase = getAdminClient();
    if (!supabase) {
      console.error("[Veriff webhook] Database not configured");
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const veriffStatus = verification.status || data.status;
    const userId = verification.vendorData;

    console.log(`[Veriff webhook] Session ${verification.id}, status: ${veriffStatus}, userId: ${userId}`);

    // Update verification session
    const { error: sessionError } = await supabase
      .from("verification_sessions")
      .update({ status: veriffStatus, updated_at: new Date().toISOString() })
      .eq("veriff_session_id", verification.id);

    if (sessionError) {
      console.error("[Veriff webhook] Session update error:", sessionError);
    }

    // If approved, mark profile as verified
    if (veriffStatus === "approved" && userId) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ is_verified: true })
        .eq("id", userId);

      if (profileError) {
        console.error("[Veriff webhook] Profile update error:", profileError);
      } else {
        console.log(`[Veriff webhook] Profile ${userId} marked as verified`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Veriff webhook] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
