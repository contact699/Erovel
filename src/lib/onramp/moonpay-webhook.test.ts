import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { verifyMoonPaySignature } from "./moonpay-webhook";

const KEY = "wk_test_secret";

function signedHeader(body: string, timestamp: number, key: string) {
  const sig = crypto
    .createHmac("sha256", key)
    .update(`${timestamp}.${body}`)
    .digest("base64");
  return `t=${timestamp},s=${sig}`;
}

describe("verifyMoonPaySignature", () => {
  it("returns valid for a correctly signed payload", () => {
    const body = JSON.stringify({ data: { id: "tx_1" } });
    const ts = Math.floor(Date.now() / 1000);
    const result = verifyMoonPaySignature({
      rawBody: body,
      signatureHeader: signedHeader(body, ts, KEY),
      webhookKey: KEY,
    });
    expect(result.valid).toBe(true);
  });

  it("returns invalid when the signature doesn't match", () => {
    const body = JSON.stringify({ data: { id: "tx_1" } });
    const ts = Math.floor(Date.now() / 1000);
    const header = signedHeader(body, ts, KEY);
    const result = verifyMoonPaySignature({
      rawBody: body,
      signatureHeader: header,
      webhookKey: "wrong_key",
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it("returns invalid when the body has been tampered", () => {
    const ts = Math.floor(Date.now() / 1000);
    const header = signedHeader("original", ts, KEY);
    const result = verifyMoonPaySignature({
      rawBody: "tampered",
      signatureHeader: header,
      webhookKey: KEY,
    });
    expect(result.valid).toBe(false);
  });

  it("returns invalid when the timestamp is older than tolerance", () => {
    const body = JSON.stringify({ data: { id: "tx_1" } });
    const oldTs = Math.floor(Date.now() / 1000) - 3600;
    const result = verifyMoonPaySignature({
      rawBody: body,
      signatureHeader: signedHeader(body, oldTs, KEY),
      webhookKey: KEY,
      toleranceSeconds: 300,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/tolerance/);
  });

  it("returns invalid when signature header is missing", () => {
    const result = verifyMoonPaySignature({
      rawBody: "{}",
      signatureHeader: null,
      webhookKey: KEY,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/missing/);
  });

  it("returns invalid when signature header is malformed", () => {
    const result = verifyMoonPaySignature({
      rawBody: "{}",
      signatureHeader: "garbage",
      webhookKey: KEY,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/malformed/);
  });

  it("returns invalid when webhook key is empty", () => {
    const body = "{}";
    const ts = Math.floor(Date.now() / 1000);
    const result = verifyMoonPaySignature({
      rawBody: body,
      signatureHeader: signedHeader(body, ts, KEY),
      webhookKey: "",
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/not configured/);
  });
});
