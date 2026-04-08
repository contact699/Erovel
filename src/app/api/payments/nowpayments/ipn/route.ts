import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { verifyIpnSignature } from "@/lib/nowpayments/verify";
import { createPaymentWithSplits } from "@/lib/payments";
import type { IpnPaymentPayload, NowPaymentsStatus } from "@/lib/nowpayments/types";

/**
 * NowPayments IPN webhook handler.
 *
 * Flow:
 * 1. Read the raw body BEFORE parsing — we need the exact bytes for signature verification
 * 2. Verify x-nowpayments-sig HMAC against NOWPAYMENTS_IPN_SECRET
 * 3. Parse the body as IpnPaymentPayload
 * 4. Look up the pending row by order_id
 * 5. Idempotency check: if we've already seen this payment_id, no-op
 * 6. Update the pending row with the new status
 * 7. If status === 'finished' AND no parent_payment_id (not a re-deposit),
 *    create the tip via createPaymentWithSplits and link it to the pending row
 * 8. Return 200 OK
 *
 * On any error: log + return 400/500 so NowPayments will retry. Never throw.
 */
export async function POST(request: Request) {
  // STEP 1 — read raw body bytes (required for signature verification)
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "unreadable body" }, { status: 400 });
  }

  // STEP 2 — verify signature
  const signature = request.headers.get("x-nowpayments-sig") ?? "";
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret) {
    console.error("[nowpayments-ipn] NOWPAYMENTS_IPN_SECRET not configured");
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const valid = verifyIpnSignature({ rawBody, signature, secret });
  if (!valid) {
    console.warn("[nowpayments-ipn] signature verification failed");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // STEP 3 — parse the payload
  let payload: IpnPaymentPayload;
  try {
    payload = JSON.parse(rawBody) as IpnPaymentPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!payload.order_id) {
    console.warn("[nowpayments-ipn] payload missing order_id", { payment_id: payload.payment_id });
    return NextResponse.json({ ok: true }); // ack and ignore
  }

  // STEP 4 — set up service client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  const supabase = createServiceClient(url, serviceKey);

  // STEP 5 — look up the pending row
  const { data: pending, error: lookupError } = await supabase
    .from("pending_crypto_payments")
    .select("*")
    .eq("order_id", payload.order_id)
    .single();

  if (lookupError || !pending) {
    console.warn("[nowpayments-ipn] no pending row for order_id", { order_id: payload.order_id });
    return NextResponse.json({ ok: true }); // ack and ignore — could be a stale or test webhook
  }

  // STEP 6 — IDEMPOTENCY CHECK
  // If this payment_id is already recorded as 'finished', we've already processed it
  if (pending.status === "finished" && pending.nowpayments_payment_id === payload.payment_id) {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  // STEP 7 — Refuse to process repeated deposits automatically
  // Per NowPayments docs: parent_payment_id indicates a re-deposit and should not be auto-credited
  if (payload.parent_payment_id) {
    console.warn("[nowpayments-ipn] refusing to auto-credit repeated deposit", {
      payment_id: payload.payment_id,
      parent_payment_id: payload.parent_payment_id,
    });
    // Still update the pending row's last_ipn_at + payload for visibility
    await supabase
      .from("pending_crypto_payments")
      .update({
        last_ipn_at: new Date().toISOString(),
        last_ipn_payload: payload as unknown as Record<string, unknown>,
      })
      .eq("id", pending.id);
    return NextResponse.json({ ok: true, repeated_deposit: true });
  }

  // STEP 8 — Update pending row with the latest status
  const newStatus: NowPaymentsStatus = payload.payment_status;
  const updateData: Record<string, unknown> = {
    nowpayments_payment_id: payload.payment_id,
    status: newStatus,
    last_ipn_at: new Date().toISOString(),
    last_ipn_payload: payload as unknown as Record<string, unknown>,
  };

  // STEP 9 — On 'finished', credit via the splits engine
  if (newStatus === "finished") {
    const splitsResult = await createPaymentWithSplits({
      supabase,
      source_type: "tip",
      reader_id: pending.reader_id,
      creator_id: pending.creator_id,
      story_id: pending.story_id ?? null,
      gross: Number(pending.gross_usd),
      currency: "USD",
      ccbill_transaction_id: undefined, // not a CCBill payment
    });

    if (!splitsResult.ok) {
      console.error("[nowpayments-ipn] splits engine refused payment", {
        order_id: payload.order_id,
        error: splitsResult.error,
      });
      // Don't update pending to 'finished' — leave for manual review
      return NextResponse.json({ error: "splits failed" }, { status: 500 });
    }

    updateData.resulting_tip_id = splitsResult.payment_id;
  }

  await supabase
    .from("pending_crypto_payments")
    .update(updateData)
    .eq("id", pending.id);

  return NextResponse.json({ ok: true });
}
