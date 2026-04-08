import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { verifyBTCPayWebhookSignature } from "./verify";

const TEST_SECRET = "test-webhook-secret";

function signBody(body: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  return `sha256=${hmac.digest("hex")}`;
}

describe("verifyBTCPayWebhookSignature", () => {
  it("returns true for a correctly signed body", () => {
    const body = JSON.stringify({ invoiceId: "abc123", type: "InvoiceSettled" });
    const signature = signBody(body, TEST_SECRET);

    const result = verifyBTCPayWebhookSignature({
      rawBody: body,
      signature,
      secret: TEST_SECRET,
    });

    expect(result).toBe(true);
  });
});

describe("verifyBTCPayWebhookSignature — edge cases", () => {
  it("returns false when signature is wrong", () => {
    expect(
      verifyBTCPayWebhookSignature({
        rawBody: '{"a":1}',
        signature: "sha256=" + "0".repeat(64),
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });

  it("returns false when signature is missing the sha256= prefix", () => {
    const body = '{"a":1}';
    const signatureHexOnly = crypto
      .createHmac("sha256", TEST_SECRET)
      .update(body)
      .digest("hex");
    expect(
      verifyBTCPayWebhookSignature({
        rawBody: body,
        signature: signatureHexOnly, // no "sha256=" prefix
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });

  it("returns false when signature is empty", () => {
    expect(
      verifyBTCPayWebhookSignature({
        rawBody: '{"a":1}',
        signature: "",
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });

  it("returns false when secret is empty", () => {
    expect(
      verifyBTCPayWebhookSignature({
        rawBody: '{"a":1}',
        signature: signBody('{"a":1}', "wrong"),
        secret: "",
      })
    ).toBe(false);
  });

  it("returns false when rawBody is empty", () => {
    expect(
      verifyBTCPayWebhookSignature({
        rawBody: "",
        signature: signBody("anything", TEST_SECRET),
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });

  it("returns false when body has been tampered with", () => {
    const original = '{"invoiceId":"abc","type":"InvoiceSettled"}';
    const tampered = '{"invoiceId":"abc","type":"InvoiceInvalid"}';
    const signature = signBody(original, TEST_SECRET);

    expect(
      verifyBTCPayWebhookSignature({
        rawBody: tampered,
        signature,
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });

  it("BTCPay signs the raw bytes — whitespace differences break verification", () => {
    // Unlike NowPayments which canonicalizes via key sorting, BTCPay signs
    // the exact bytes. So {"a":1} and { "a": 1 } produce different signatures.
    const body1 = '{"a":1}';
    const body2 = '{ "a": 1 }';
    const signature1 = signBody(body1, TEST_SECRET);

    expect(
      verifyBTCPayWebhookSignature({
        rawBody: body2,
        signature: signature1,
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });

  it("verifies a realistic BTCPay payload", () => {
    const payload = JSON.stringify({
      deliveryId: "abc123",
      webhookId: "wh_xyz",
      originalDeliveryId: "abc123",
      isRedelivery: false,
      type: "InvoiceSettled",
      timestamp: 1712592000,
      storeId: "store_abc",
      invoiceId: "inv_xyz",
      manuallyMarked: false,
      overPaid: false,
    });
    const signature = signBody(payload, TEST_SECRET);

    expect(
      verifyBTCPayWebhookSignature({
        rawBody: payload,
        signature,
        secret: TEST_SECRET,
      })
    ).toBe(true);
  });

  it("uses timing-safe comparison (returns false for length mismatch without throwing)", () => {
    expect(
      verifyBTCPayWebhookSignature({
        rawBody: '{"a":1}',
        signature: "sha256=deadbeef", // too short
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });
});
