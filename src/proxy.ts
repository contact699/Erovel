import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

// Third-party webhook endpoints are excluded: they don't carry Supabase
// auth cookies, and Next.js 15 proxy body-buffering has caused silent HMAC
// signature mismatches on incoming signed payloads.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png|api/veriff/webhook|api/payments/btcpay/webhook|api/payments/nowpayments/ipn|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
