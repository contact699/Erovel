import { NextResponse } from "next/server";
import { PROVIDER_META, type OnRampProvider } from "@/lib/onramp/providers";

// Lightweight lookup so the client can hide providers whose env isn't set.
// Safe for unauth use — the response leaks only which providers have keys,
// not the keys themselves.
export async function GET() {
  const ids: OnRampProvider[] = ["moonpay", "ramp"];
  const providers = ids
    .filter((id) => PROVIDER_META[id].isConfigured())
    .map((id) => ({
      id,
      label: PROVIDER_META[id].label,
      blurb: PROVIDER_META[id].blurb,
    }));
  return NextResponse.json({ providers });
}
