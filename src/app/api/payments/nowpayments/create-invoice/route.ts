import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createInvoice } from "@/lib/nowpayments/client";

interface RequestBody {
  creator_id: string;
  story_id?: string;
  amount: number;
}

export async function POST(request: Request) {
  // 1. Authenticate the reader
  const authSupabase = await createServerSupabaseClient();
  if (!authSupabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const {
    data: { user: reader },
    error: authError,
  } = await authSupabase.auth.getUser();

  if (authError || !reader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse + validate the request body
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.creator_id || typeof body.amount !== "number" || body.amount <= 0) {
    return NextResponse.json(
      { error: "creator_id and a positive amount are required" },
      { status: 400 }
    );
  }

  if (body.amount < 1) {
    return NextResponse.json(
      { error: "Minimum tip amount is $1" },
      { status: 400 }
    );
  }

  // 3. Use the service-role client for DB writes (bypasses RLS for the
  //    pending_crypto_payments table since this is a server-trusted insert)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const supabase = createServiceClient(url, serviceKey);

  // 4. Verify the creator exists
  const { data: creator, error: creatorError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", body.creator_id)
    .single();

  if (creatorError || !creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  // 5. Insert the pending row first — this generates the order_id we send to NowPayments
  const { data: pending, error: pendingError } = await supabase
    .from("pending_crypto_payments")
    .insert({
      reader_id: reader.id,
      creator_id: body.creator_id,
      story_id: body.story_id ?? null,
      source_type: "tip",
      gross_usd: body.amount,
      status: "created",
    })
    .select("id, order_id")
    .single();

  if (pendingError || !pending) {
    return NextResponse.json(
      { error: "Failed to create pending payment" },
      { status: 500 }
    );
  }

  // 6. Create the NowPayments invoice
  const ipnUrl = process.env.NOWPAYMENTS_IPN_CALLBACK_URL;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://erovel.com";
  const successUrl = `${baseUrl}/payments/success?id=${pending.order_id}`;
  const cancelUrl = `${baseUrl}/payments/cancel?id=${pending.order_id}`;

  let invoice;
  try {
    invoice = await createInvoice({
      price_amount: body.amount,
      // Price in USD (the merchant's display currency), customer pays in
      // USDC on Polygon (which matches the payout wallet so no real conversion
      // happens). The "$19.28 minimum on the conversion path" reported by
      // /v1/min-amount is misleading — it's a generic floor that doesn't
      // actually fire when in==out currency. Tested with usdcmatic pricing
      // instead (variant A in 2026-04-08 debug session) and the hosted
      // checkout broke worse (empty currency dropdown), so reverting to USD
      // pricing as the cleaner path. The actual blocker is a NowPayments
      // account-level issue where the hosted checkout refuses to quote
      // amounts regardless of code parameters.
      price_currency: "usd",
      pay_currency: "usdcmatic",
      ipn_callback_url: ipnUrl,
      order_id: pending.order_id,
      order_description: `Tip on Erovel`,
      success_url: successUrl,
      cancel_url: cancelUrl,
      is_fixed_rate: true,
      is_fee_paid_by_user: true,
    });
  } catch (err) {
    // Mark the pending row as failed and return a generic error
    await supabase
      .from("pending_crypto_payments")
      .update({ status: "failed" })
      .eq("id", pending.id);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 502 }
    );
  }

  // 7. Update the pending row with the invoice details
  await supabase
    .from("pending_crypto_payments")
    .update({
      nowpayments_invoice_id: invoice.id,
      invoice_url: invoice.invoice_url,
      status: "waiting",
    })
    .eq("id", pending.id);

  // 8. Return the invoice_url to the frontend for redirect
  return NextResponse.json({
    invoice_url: invoice.invoice_url,
    order_id: pending.order_id,
  });
}
