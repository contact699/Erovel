import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createBTCPayInvoice } from "@/lib/btcpay/client";

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

  // 2. Parse + validate
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

  // BTCPay supports tiny amounts via Lightning, so the minimum is $1
  // (any lower and the user can't pay enough to make it worthwhile after
  // even the trivial Lightning fee).
  if (body.amount < 1) {
    return NextResponse.json(
      { error: "Minimum tip amount is $1" },
      { status: 400 }
    );
  }

  // 3. Service-role client for server-trusted DB writes
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const supabase = createServiceClient(url, serviceKey);

  // 4. Verify creator exists
  const { data: creator, error: creatorError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", body.creator_id)
    .single();

  if (creatorError || !creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  // 5. Insert pending row first (generates the order_id)
  const { data: pending, error: pendingError } = await supabase
    .from("pending_crypto_payments")
    .insert({
      reader_id: reader.id,
      creator_id: body.creator_id,
      story_id: body.story_id ?? null,
      source_type: "tip",
      gross_usd: body.amount,
      status: "created",
      processor: "btcpay",
    })
    .select("id, order_id")
    .single();

  if (pendingError || !pending) {
    return NextResponse.json(
      { error: "Failed to create pending payment" },
      { status: 500 }
    );
  }

  // 6. Create the BTCPay invoice
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://erovel.com";
  const successUrl = `${baseUrl}/payments/success?id=${pending.order_id}`;

  let invoice;
  try {
    invoice = await createBTCPayInvoice({
      amount: body.amount.toFixed(2),
      currency: "USD",
      metadata: {
        orderId: pending.order_id,
        orderUrl: `${baseUrl}/dashboard/earnings`,
      },
      checkout: {
        speedPolicy: "MediumSpeed",
        // Enable both BTC on-chain and Lightning. Customers pick on the
        // hosted checkout page. BTCPay handles routing.
        paymentMethods: ["BTC", "BTC-LightningNetwork"],
        defaultPaymentMethod: "BTC-LightningNetwork",
        expirationMinutes: 60,
        redirectURL: successUrl,
        redirectAutomatically: true,
      },
    });
  } catch (err) {
    console.error("[btcpay/create-invoice] BTCPay invoice creation failed:", err);
    await supabase
      .from("pending_crypto_payments")
      .update({ status: "failed" })
      .eq("id", pending.id);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 502 }
    );
  }

  // 7. Update pending row with BTCPay invoice details
  await supabase
    .from("pending_crypto_payments")
    .update({
      external_invoice_id: invoice.id,
      invoice_url: invoice.checkoutLink,
      status: "waiting",
    })
    .eq("id", pending.id);

  // 8. Return the checkout link
  return NextResponse.json({
    invoice_url: invoice.checkoutLink,
    order_id: pending.order_id,
  });
}
