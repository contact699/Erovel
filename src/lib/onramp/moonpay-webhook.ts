import crypto from "node:crypto";

/**
 * Verify a MoonPay webhook signature.
 *
 * MoonPay v2 signatures live in the `Moonpay-Signature-V2` header in the
 * format `t=<unix timestamp>,s=<base64 signature>`. The signature is
 * HMAC-SHA256 over `<timestamp>.<raw body>` using the webhook signing
 * key (distinct from the API/publishable/secret keys).
 *
 * Returns true on valid match; false otherwise. Tolerance optional —
 * MoonPay doesn't enforce replay protection via timestamp, but we
 * reject anything > 5 minutes old defensively.
 */
export function verifyMoonPaySignature(opts: {
  rawBody: string;
  signatureHeader: string | null;
  webhookKey: string;
  toleranceSeconds?: number;
}): { valid: boolean; reason?: string } {
  if (!opts.signatureHeader) {
    return { valid: false, reason: "missing signature header" };
  }
  if (!opts.webhookKey) {
    return { valid: false, reason: "webhook key not configured" };
  }

  // Parse `t=123,s=xyz` format. The order is not guaranteed.
  const parts = opts.signatureHeader.split(",");
  let timestamp: string | null = null;
  let provided: string | null = null;
  for (const part of parts) {
    const [k, ...rest] = part.trim().split("=");
    const v = rest.join("=");
    if (k === "t") timestamp = v;
    else if (k === "s") provided = v;
  }

  if (!timestamp || !provided) {
    return { valid: false, reason: "malformed signature header" };
  }

  const toleranceSec = opts.toleranceSeconds ?? 300;
  const ageSec = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(ageSec) || ageSec > toleranceSec) {
    return { valid: false, reason: `timestamp outside ${toleranceSec}s tolerance` };
  }

  const expected = crypto
    .createHmac("sha256", opts.webhookKey)
    .update(`${timestamp}.${opts.rawBody}`)
    .digest("base64");

  // Constant-time compare to avoid timing leaks.
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return { valid: false, reason: "signature length mismatch" };
  }
  const match = crypto.timingSafeEqual(a, b);
  return match ? { valid: true } : { valid: false, reason: "signature mismatch" };
}
