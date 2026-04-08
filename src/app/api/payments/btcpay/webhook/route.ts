import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { verifyBTCPayWebhookSignature } from "@/lib/btcpay/verify";
import { createPaymentWithSplits } from "@/lib/payments";
import type { BTCPayWebhookPayload } from "@/lib/btcpay/types";

/**
 * BTCPay Server webhook handler.
 *
 * Flow:
 * 1. Read raw body bytes BEFORE parsing — needed for signature verification
 * 2. Verify BTCPay-Sig HMAC against BTCPAY_WEBHOOK_SECRET
 * 3. Parse the body
 * 4. Look up the pending row by external_invoice_id (= BTCPay invoiceId)
 * 5. Idempotency: if we've already credited this invoice, no-op
 * 6. Update pending row with the new event/status
 * 7. If type === 'InvoiceSettled', call createPaymentWithSplits
 * 8. Return 200 OK
 *
 * On error: log + return non-200 so BTCPay retries. Never throw.
 */
export async function POST(request: Request) {
  // STEP 1 — read raw body bytes
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "unreadable body" }, { status: 400 });
  }

  // STEP 2 — verify signature
  const signature = request.headers.get("BTCPay-Sig") ?? "";
  const secret = process.env.BTCPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[btcpay/webhook] BTCPAY_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const valid = verifyBTCPayWebhookSignature({ rawBody, signature, secret });
  if (!valid) {
    console.warn("[btcpay/webhook] signature verification failed");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // STEP 3 — parse the payload
  let payload: BTCPayWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as BTCPayWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!payload.invoiceId) {
    console.warn("[btcpay/webhook] payload missing invoiceId", { type: payload.type });
    return NextResponse.json({ ok: true }); // ack and ignore
  }

  // STEP 4 — service client for DB writes
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
    .eq("external_invoice_id", payload.invoiceId)
    .eq("processor", "btcpay")
    .single();

  if (lookupError || !pending) {
    console.warn("[btcpay/webhook] no pending row for invoiceId", { invoiceId: payload.invoiceId });
    return NextResponse.json({ ok: true }); // ack and ignore stale/test webhooks
  }

  // STEP 6 — IDEMPOTENCY CHECK
  // If this invoice is already 'finished', the webhook is a redelivery
  if (pending.status === "finished") {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  // STEP 7 — Map BTCPay event type to our status enum
  const statusMap: Record<string, string> = {
    InvoiceCreated: "waiting",
    InvoiceReceivedPayment: "confirming",
    InvoiceProcessing: "confirming",
    InvoiceSettled: "finished",
    InvoiceExpired: "expired",
    InvoiceInvalid: "failed",
  };
  const newStatus = statusMap[payload.type] ?? "waiting";

  const updateData: Record<string, unknown> = {
    status: newStatus,
    last_ipn_at: new Date().toISOString(),
    last_ipn_payload: payload as unknown as Record<string, unknown>,
  };

  // STEP 8 — On Settled, credit via the splits engine
  if (payload.type === "InvoiceSettled") {
    const splitsResult = await createPaymentWithSplits({
      supabase,
      source_type: "tip",
      reader_id: pending.reader_id,
      creator_id: pending.creator_id,
      story_id: pending.story_id ?? null,
      gross: Number(pending.gross_usd),
      currency: "USD",
      ccbill_transaction_id: undefined,
    });

    if (!splitsResult.ok) {
      console.error("[btcpay/webhook] splits engine refused payment", {
        invoiceId: payload.invoiceId,
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
