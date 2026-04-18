import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getBTCPayInvoicePaymentMethods } from "@/lib/btcpay/client";
import {
  buildOnRampUrl,
  PROVIDER_META,
  type OnRampProvider,
} from "@/lib/onramp/providers";

interface RequestBody {
  order_id: string;
  provider: OnRampProvider;
}

export async function POST(request: Request) {
  const authSupabase = await createServerSupabaseClient();
  if (!authSupabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const {
    data: { user },
  } = await authSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.order_id || !body.provider) {
    return NextResponse.json(
      { error: "order_id and provider are required" },
      { status: 400 }
    );
  }
  if (body.provider !== "moonpay" && body.provider !== "ramp") {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }
  if (!PROVIDER_META[body.provider].isConfigured()) {
    return NextResponse.json(
      { error: `${PROVIDER_META[body.provider].label} is not configured` },
      { status: 503 }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const supabase = createServiceClient(url, serviceKey);

  const { data: pending } = await supabase
    .from("pending_crypto_payments")
    .select("id, reader_id, order_id, gross_usd, processor, external_invoice_id")
    .eq("order_id", body.order_id)
    .single();

  if (!pending) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (pending.reader_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Resolve destination wallet address based on the processor. For BTCPay we
  // fetch the BTC payment method; for NowPayments the address is stored on
  // the pending row when the IPN invoice is created (not implemented yet —
  // on-ramp is BTCPay-only for now).
  let walletAddress: string | null = null;
  let asset: "btc" | "usdc_polygon" = "btc";

  if (pending.processor === "btcpay") {
    if (!pending.external_invoice_id) {
      return NextResponse.json(
        { error: "Invoice has no BTCPay reference yet" },
        { status: 409 }
      );
    }
    try {
      const methods = await getBTCPayInvoicePaymentMethods(
        pending.external_invoice_id
      );
      // Prefer on-chain BTC for on-ramp — most on-ramps don't support
      // Lightning destinations. Pick the first BTC (non-Lightning) entry.
      const btc = methods.find(
        (m) => m.paymentMethod === "BTC" && m.destination
      );
      if (!btc?.destination) {
        return NextResponse.json(
          { error: "No BTC address available on this invoice" },
          { status: 409 }
        );
      }
      walletAddress = btc.destination;
      asset = "btc";
    } catch (err) {
      console.error("[onramp/url] BTCPay address fetch failed:", err);
      return NextResponse.json(
        { error: "Failed to resolve destination address" },
        { status: 502 }
      );
    }
  } else {
    return NextResponse.json(
      {
        error:
          "On-ramp is only supported for BTCPay invoices right now. " +
          "Retry this tip with crypto selection or wait until NowPayments wiring lands.",
      },
      { status: 501 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://erovel.com";
  const redirectUrl = `${baseUrl}/payments/success?id=${pending.order_id}`;

  try {
    const onRampUrl = buildOnRampUrl(body.provider, {
      walletAddress,
      asset,
      fiatAmountUsd: Number(pending.gross_usd),
      redirectUrl,
      externalId: pending.order_id,
    });

    console.log(
      `[onramp/url] user=${user.id} provider=${body.provider} order=${pending.order_id}`
    );

    return NextResponse.json({
      url: onRampUrl,
      provider: body.provider,
      walletAddress,
      asset,
    });
  } catch (err) {
    console.error("[onramp/url] URL build failed:", err);
    return NextResponse.json(
      { error: "Failed to build on-ramp URL" },
      { status: 500 }
    );
  }
}
