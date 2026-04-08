import crypto from "node:crypto";

interface VerifyInput {
  /** The exact raw request body bytes received from NowPayments */
  rawBody: string;
  /** The value of the x-nowpayments-sig header */
  signature: string;
  /** Your NOWPAYMENTS_IPN_SECRET */
  secret: string;
}

/**
 * Recursively sort object keys alphabetically.
 * NowPayments signs the JSON-stringified version of this sorted object.
 */
export function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);

  return Object.keys(obj as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((result, key) => {
      result[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
      return result;
    }, {});
}

/**
 * Verify the HMAC-SHA512 signature on a NowPayments IPN webhook.
 *
 * Algorithm (from NowPayments docs):
 * 1. Parse rawBody as JSON
 * 2. Recursively sort all object keys alphabetically
 * 3. JSON.stringify the sorted object
 * 4. HMAC-SHA512(stringified_sorted_object, secret) -> hex
 * 5. Compare against the x-nowpayments-sig header (timing-safe)
 *
 * Returns true if signature matches, false otherwise.
 * Returns false on any parse error (never throws — failed verification
 * should never crash the webhook handler).
 */
export function verifyIpnSignature(input: VerifyInput): boolean {
  const { rawBody, signature, secret } = input;

  if (!signature || !secret || !rawBody) return false;

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return false;
  }

  const sorted = sortObjectKeys(parsed);
  const message = JSON.stringify(sorted);

  const hmac = crypto.createHmac("sha512", secret);
  hmac.update(message);
  const expectedSignature = hmac.digest("hex");

  // Timing-safe comparison
  const expectedBuf = Buffer.from(expectedSignature, "hex");
  const receivedBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}
