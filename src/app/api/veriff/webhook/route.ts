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

    console.log("[Veriff webhook] Incoming request", {
      hasSignature: !!signature,
      hasSecret: !!secret,
      bodyLength: body.length,
      contentType: request.headers.get("content-type"),
    });

    // Verify webhook signature
    if (secret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

      if (signature.toLowerCase() !== expectedSignature.toLowerCase()) {
        // Full signatures logged (not secret themselves — secret is used to
        // compute them). Helps diagnose whether the hashes are totally
        // different (secret mismatch) or similar (body-transform issue).
        console.error("[Veriff webhook] Invalid signature", {
          received: signature,
          expected: expectedSignature,
          bodyLength: body.length,
          bodyPreview: body.slice(0, 120),
          secretLen: secret.length,
        });
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
      console.log("[Veriff webhook] Signature verified");
    } else if (!secret) {
      console.warn("[Veriff webhook] VERIFF_API_SECRET not set — skipping signature check");
    } else if (!signature) {
      console.warn("[Veriff webhook] No x-hmac-signature header — request may not be from Veriff");
    }

    const data = JSON.parse(body);
    console.log("[Veriff webhook] Payload:", JSON.stringify(data).slice(0, 500));

    // Veriff sends two webhook shapes depending on the webhook version:
    //   v1.0.0 (fullauto): { sessionId, vendorData, status: "success"|"fail",
    //                        eventType, data: { verification: { decision, decisionScore, ... } } }
    //   legacy:            { status, verification: { id, vendorData, status, ... } }
    const isV1 = data.version === "1.0.0" || typeof data.data === "object";
    const sessionId: string | undefined = data.sessionId ?? data.verification?.id;
    const userId: string | undefined = data.vendorData ?? data.verification?.vendorData;
    // Decision field: "approved" | "declined" | "resubmission_requested" | ...
    // Root-level `status: "success"` in v1.0.0 only means the webhook was delivered,
    // NOT that the verification passed — the real outcome is inside data.verification.decision.
    const decision: string | undefined = isV1
      ? data.data?.verification?.decision
      : data.verification?.status ?? data.status;

    if (!sessionId) {
      console.error("[Veriff webhook] Missing sessionId / verification.id", {
        shape: isV1 ? "v1.0.0" : "legacy",
      });
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const supabase = getAdminClient();
    if (!supabase) {
      console.error("[Veriff webhook] Database not configured");
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    console.log(
      `[Veriff webhook] shape=${isV1 ? "v1.0.0" : "legacy"} session=${sessionId} decision=${decision} userId=${userId}`
    );

    // Update verification session
    const { error: sessionError } = await supabase
      .from("verification_sessions")
      .update({
        status: decision ?? "unknown",
        updated_at: new Date().toISOString(),
      })
      .eq("veriff_session_id", sessionId);

    if (sessionError) {
      console.error("[Veriff webhook] Session update error:", sessionError);
    } else {
      console.log(`[Veriff webhook] Session ${sessionId} updated to ${decision}`);
    }

    // If approved, mark profile as verified
    if (decision === "approved" && userId) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ is_verified: true })
        .eq("id", userId);

      if (profileError) {
        console.error("[Veriff webhook] Profile update error:", profileError);
      } else {
        console.log(`[Veriff webhook] Profile ${userId} marked as verified`);
      }
    } else if (!userId) {
      console.warn("[Veriff webhook] No vendorData (userId) in payload — cannot update profile");
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Veriff webhook] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
