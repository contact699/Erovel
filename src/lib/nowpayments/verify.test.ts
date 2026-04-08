import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { verifyIpnSignature, sortObjectKeys } from "./verify";

const TEST_SECRET = "test-secret-key";

function signPayload(payload: Record<string, unknown>, secret: string): string {
  const sorted = sortObjectKeys(payload);
  const hmac = crypto.createHmac("sha512", secret);
  hmac.update(JSON.stringify(sorted));
  return hmac.digest("hex");
}

describe("verifyIpnSignature", () => {
  it("returns true for a correctly signed payload", () => {
    const payload = { payment_id: 123, payment_status: "finished" };
    const signature = signPayload(payload, TEST_SECRET);

    const result = verifyIpnSignature({
      rawBody: JSON.stringify(payload),
      signature,
      secret: TEST_SECRET,
    });

    expect(result).toBe(true);
  });
});

describe("verifyIpnSignature — edge cases", () => {
  it("returns false when signature is wrong", () => {
    const payload = { payment_id: 123 };
    const signature = "0".repeat(128); // 128 hex chars = 64 bytes = right length but wrong value

    expect(
      verifyIpnSignature({
        rawBody: JSON.stringify(payload),
        signature,
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });

  it("returns false when signature is empty", () => {
    expect(
      verifyIpnSignature({
        rawBody: JSON.stringify({ a: 1 }),
        signature: "",
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });

  it("returns false when secret is empty", () => {
    expect(
      verifyIpnSignature({
        rawBody: JSON.stringify({ a: 1 }),
        signature: "abc",
        secret: "",
      })
    ).toBe(false);
  });

  it("returns false when rawBody is empty", () => {
    expect(
      verifyIpnSignature({
        rawBody: "",
        signature: "abc",
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });

  it("returns false when rawBody is not valid JSON (does not throw)", () => {
    expect(
      verifyIpnSignature({
        rawBody: "{not json}",
        signature: "abc",
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });

  it("returns false when body has been tampered with after signing", () => {
    const original = { payment_id: 123, payment_status: "finished" };
    const tampered = { payment_id: 123, payment_status: "waiting" };
    const signature = signPayload(original, TEST_SECRET);

    expect(
      verifyIpnSignature({
        rawBody: JSON.stringify(tampered),
        signature,
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });

  it("verifies regardless of original key order in body", () => {
    // Two equivalent JSON bodies with different key orders should both verify
    // against the same signature, because signing uses sorted keys.
    const sortedSig = signPayload(
      { a: 1, b: 2, c: 3 },
      TEST_SECRET
    );
    const reorderedBody = JSON.stringify({ c: 3, a: 1, b: 2 });

    expect(
      verifyIpnSignature({
        rawBody: reorderedBody,
        signature: sortedSig,
        secret: TEST_SECRET,
      })
    ).toBe(true);
  });

  it("handles nested objects (recursive sorting)", () => {
    const payload = {
      payment_id: 123,
      fee: { withdrawalFee: 0, depositFee: 0.5, serviceFee: 0, currency: "btc" },
    };
    const signature = signPayload(payload, TEST_SECRET);

    // Send with the inner object in a different key order
    const reorderedBody = JSON.stringify({
      fee: { currency: "btc", depositFee: 0.5, serviceFee: 0, withdrawalFee: 0 },
      payment_id: 123,
    });

    expect(
      verifyIpnSignature({
        rawBody: reorderedBody,
        signature,
        secret: TEST_SECRET,
      })
    ).toBe(true);
  });

  it("handles null values correctly", () => {
    const payload = {
      payment_id: 123,
      order_id: null,
      payin_extra_id: null,
    };
    const signature = signPayload(payload, TEST_SECRET);

    expect(
      verifyIpnSignature({
        rawBody: JSON.stringify(payload),
        signature,
        secret: TEST_SECRET,
      })
    ).toBe(true);
  });

  it("verifies a realistic NowPayments payload", () => {
    // Sample taken directly from the NowPayments docs
    const payload = {
      payment_id: 123456789,
      parent_payment_id: 987654321,
      invoice_id: null,
      payment_status: "finished",
      pay_address: "address",
      payin_extra_id: null,
      price_amount: 1,
      price_currency: "usd",
      pay_amount: 15,
      actually_paid: 15,
      actually_paid_at_fiat: 0,
      pay_currency: "trx",
      order_id: null,
      order_description: null,
      purchase_id: "123456789",
      outcome_amount: 14.8106,
      outcome_currency: "trx",
      payment_extra_ids: null,
      fee: {
        currency: "btc",
        depositFee: 0.09853637216235617,
        withdrawalFee: 0,
        serviceFee: 0,
      },
    };
    const signature = signPayload(payload, TEST_SECRET);

    expect(
      verifyIpnSignature({
        rawBody: JSON.stringify(payload),
        signature,
        secret: TEST_SECRET,
      })
    ).toBe(true);
  });

  it("uses timing-safe comparison (returns false for length mismatch without throwing)", () => {
    expect(
      verifyIpnSignature({
        rawBody: JSON.stringify({ a: 1 }),
        signature: "deadbeef", // too short
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });
});

describe("sortObjectKeys", () => {
  it("sorts keys at top level", () => {
    expect(sortObjectKeys({ b: 2, a: 1, c: 3 })).toEqual({ a: 1, b: 2, c: 3 });
  });

  it("sorts keys recursively in nested objects", () => {
    const result = sortObjectKeys({ b: { y: 2, x: 1 }, a: 1 }) as Record<string, unknown>;
    expect(Object.keys(result)).toEqual(["a", "b"]);
    expect(Object.keys(result.b as Record<string, unknown>)).toEqual(["x", "y"]);
  });

  it("preserves null and primitives", () => {
    expect(sortObjectKeys(null)).toBe(null);
    expect(sortObjectKeys(42)).toBe(42);
    expect(sortObjectKeys("hello")).toBe("hello");
  });

  it("handles arrays without sorting array contents", () => {
    expect(sortObjectKeys([3, 1, 2])).toEqual([3, 1, 2]);
  });

  it("recursively sorts objects inside arrays", () => {
    const result = sortObjectKeys([{ b: 2, a: 1 }]) as Array<Record<string, unknown>>;
    expect(Object.keys(result[0])).toEqual(["a", "b"]);
  });
});
