import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { verifyMoonPaySignature } from "@/lib/onramp/moonpay-webhook";

/**
 * MoonPay webhook endpoint.
 *
 * MoonPay posts transaction lifecycle events (created / updated / failed)
 * here. This is purely informational — the authoritative "money arrived"
 * signal is still BTCPay's webhook, which fires when the BTC actually
 * lands at the invoice address. MoonPay's webhook tells us the user
 * completed the card purchase and the crypto is outbound, which lets us
 * surface a "processing — crypto on its way" state in the UI.
 *
 * Register this URL in MoonPay's dashboard → Developers → Webhooks.
 * Signing key is the `MOONPAY_WEBHOOK_KEY` env var (distinct from API key
 * and secret key).
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureHeader =
    request.headers.get("moonpay-signature-v2") ??
    request.headers.get("Moonpay-Signature-V2");
  const webhookKey = process.env.MOONPAY_WEBHOOK_KEY ?? "";

  const verification = verifyMoonPaySignature({
    rawBody,
    signatureHeader,
    webhookKey,
  });

  if (!verification.valid) {
    console.error("[moonpay webhook] signature verification failed", {
      reason: verification.reason,
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let data: {
    data?: {
      id?: string;
      status?: string;
      externalTransactionId?: string;
      baseCurrencyAmount?: number;
      quoteCurrencyAmount?: number;
    };
    type?: string;
    environment?: string;
  };
  try {
    data = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tx = data.data ?? {};
  const orderId = tx.externalTransactionId;
  const status = tx.status;

  console.log(
    `[moonpay webhook] type=${data.type} env=${data.environment} ` +
      `order=${orderId} status=${status} tx=${tx.id}`
  );

  // Best-effort DB update: if we recognize the order_id and the tx has
  // reached "completed" (user finished paying MoonPay), record a timestamp
  // on the pending row for later UI / analytics. This is additive — does
  // NOT flip the row's status, which BTCPay still owns.
  if (orderId && status === "completed") {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && serviceKey) {
      const supabase = createServiceClient(url, serviceKey);
      const { error } = await supabase
        .from("pending_crypto_payments")
        .update({
          onramp_completed_at: new Date().toISOString(),
          onramp_provider: "moonpay",
          onramp_reference: tx.id ?? null,
        })
        .eq("order_id", orderId);
      if (error) {
        // Most likely the columns don't exist yet — the migration for the
        // onramp_* fields can be added later. Log and keep going so we
        // don't 500 on MoonPay and trigger retries.
        console.warn(
          "[moonpay webhook] pending_crypto_payments update failed:",
          error.message
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}

// Tiny GET responder so MoonPay's webhook-URL reachability check returns
// something other than 405.
export async function GET() {
  return NextResponse.json({
    status: "MoonPay webhook endpoint active. POST with Moonpay-Signature-V2.",
  });
}
