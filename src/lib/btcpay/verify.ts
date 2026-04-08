import crypto from "node:crypto";

interface VerifyInput {
  /** The exact raw request body bytes received from BTCPay */
  rawBody: string;
  /** The value of the BTCPay-Sig header */
  signature: string;
  /** Your BTCPAY_WEBHOOK_SECRET */
  secret: string;
}

/**
 * Verify the HMAC-SHA256 signature on a BTCPay Server webhook.
 *
 * Algorithm (per BTCPay docs):
 * 1. Compute HMAC-SHA256(rawBody, secret) → hex digest
 * 2. Prefix with "sha256="
 * 3. Compare against the BTCPay-Sig header value (timing-safe)
 *
 * Returns true if signature matches, false otherwise.
 * Returns false on any error (never throws).
 */
export function verifyBTCPayWebhookSignature(input: VerifyInput): boolean {
  const { rawBody, signature, secret } = input;

  if (!signature || !secret || !rawBody) return false;
  if (!signature.startsWith("sha256=")) return false;

  const expectedHex = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const expected = `sha256=${expectedHex}`;

  // Timing-safe comparison
  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}
