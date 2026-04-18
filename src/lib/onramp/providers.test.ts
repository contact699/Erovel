import { describe, it, expect, beforeEach, afterEach } from "vitest";
import crypto from "node:crypto";
import { buildOnRampUrl, PROVIDER_META } from "./providers";

const ORIGINAL_ENV = { ...process.env };

describe("buildOnRampUrl — moonpay", () => {
  beforeEach(() => {
    process.env.MOONPAY_API_KEY = "pk_test_abc";
    process.env.MOONPAY_SECRET_KEY = "sk_test_secret";
    process.env.MOONPAY_ENVIRONMENT = "sandbox";
  });
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("builds a sandbox URL with the required query params", () => {
    const url = buildOnRampUrl("moonpay", {
      walletAddress: "bc1q-test-address",
      asset: "btc",
      fiatAmountUsd: 20.5,
      redirectUrl: "https://erovel.com/payments/success?id=abc",
      externalId: "order_123",
    });
    expect(url.startsWith("https://buy-sandbox.moonpay.com?")).toBe(true);
    const params = new URL(url).searchParams;
    expect(params.get("apiKey")).toBe("pk_test_abc");
    expect(params.get("currencyCode")).toBe("btc");
    expect(params.get("walletAddress")).toBe("bc1q-test-address");
    expect(params.get("baseCurrencyCode")).toBe("usd");
    expect(params.get("baseCurrencyAmount")).toBe("20.50");
    expect(params.get("externalTransactionId")).toBe("order_123");
    expect(params.get("lockAmount")).toBe("true");
  });

  it("signs the URL with HMAC-SHA256 base64 of the query string", () => {
    const url = buildOnRampUrl("moonpay", {
      walletAddress: "bc1q-test-address",
      asset: "btc",
      fiatAmountUsd: 20,
      redirectUrl: "https://erovel.com/payments/success?id=abc",
      externalId: "order_123",
    });
    const parsed = new URL(url);
    const signature = parsed.searchParams.get("signature");
    expect(signature).toBeTruthy();

    // Recompute the expected signature over the unsigned query string.
    parsed.searchParams.delete("signature");
    const expected = crypto
      .createHmac("sha256", "sk_test_secret")
      .update(`?${parsed.searchParams.toString()}`)
      .digest("base64");
    expect(signature).toBe(expected);
  });

  it("uses the production base URL when MOONPAY_ENVIRONMENT=production", () => {
    process.env.MOONPAY_ENVIRONMENT = "production";
    const url = buildOnRampUrl("moonpay", {
      walletAddress: "x",
      asset: "btc",
      fiatAmountUsd: 10,
      redirectUrl: "https://erovel.com/",
      externalId: "id",
    });
    expect(url.startsWith("https://buy.moonpay.com?")).toBe(true);
  });

  it("throws if MOONPAY_API_KEY is not set", () => {
    delete process.env.MOONPAY_API_KEY;
    expect(() =>
      buildOnRampUrl("moonpay", {
        walletAddress: "x",
        asset: "btc",
        fiatAmountUsd: 10,
        redirectUrl: "https://erovel.com/",
        externalId: "id",
      })
    ).toThrow(/MOONPAY_API_KEY/);
  });

  it("maps usdc_polygon asset to 'usdc_polygon' currencyCode", () => {
    const url = buildOnRampUrl("moonpay", {
      walletAddress: "0xabc",
      asset: "usdc_polygon",
      fiatAmountUsd: 10,
      redirectUrl: "https://erovel.com/",
      externalId: "id",
    });
    const params = new URL(url).searchParams;
    expect(params.get("currencyCode")).toBe("usdc_polygon");
  });
});

describe("buildOnRampUrl — ramp", () => {
  beforeEach(() => {
    process.env.RAMP_API_KEY = "ramp_test_key";
    process.env.RAMP_ENVIRONMENT = "staging";
  });
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("builds a staging URL with required params", () => {
    const url = buildOnRampUrl("ramp", {
      walletAddress: "bc1q-ramp",
      asset: "btc",
      fiatAmountUsd: 30,
      redirectUrl: "https://erovel.com/payments/success?id=abc",
      externalId: "order_456",
    });
    expect(url.startsWith("https://app.demo.ramp.network/?")).toBe(true);
    const params = new URL(url).searchParams;
    expect(params.get("hostApiKey")).toBe("ramp_test_key");
    expect(params.get("swapAsset")).toBe("BTC");
    expect(params.get("userAddress")).toBe("bc1q-ramp");
    expect(params.get("fiatCurrency")).toBe("USD");
    expect(params.get("fiatValue")).toBe("30.00");
    expect(params.get("hostReferenceId")).toBe("order_456");
  });

  it("uses the production base URL when RAMP_ENVIRONMENT=production", () => {
    process.env.RAMP_ENVIRONMENT = "production";
    const url = buildOnRampUrl("ramp", {
      walletAddress: "x",
      asset: "btc",
      fiatAmountUsd: 10,
      redirectUrl: "https://erovel.com/",
      externalId: "id",
    });
    expect(url.startsWith("https://app.ramp.network/?")).toBe(true);
  });

  it("maps usdc_polygon asset to 'MATIC_USDC'", () => {
    const url = buildOnRampUrl("ramp", {
      walletAddress: "0xabc",
      asset: "usdc_polygon",
      fiatAmountUsd: 10,
      redirectUrl: "https://erovel.com/",
      externalId: "id",
    });
    const params = new URL(url).searchParams;
    expect(params.get("swapAsset")).toBe("MATIC_USDC");
  });

  it("throws if RAMP_API_KEY is not set", () => {
    delete process.env.RAMP_API_KEY;
    expect(() =>
      buildOnRampUrl("ramp", {
        walletAddress: "x",
        asset: "btc",
        fiatAmountUsd: 10,
        redirectUrl: "https://erovel.com/",
        externalId: "id",
      })
    ).toThrow(/RAMP_API_KEY/);
  });
});

describe("PROVIDER_META.isConfigured", () => {
  beforeEach(() => {
    delete process.env.MOONPAY_API_KEY;
    delete process.env.RAMP_API_KEY;
  });
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns false when the provider's API key is missing", () => {
    expect(PROVIDER_META.moonpay.isConfigured()).toBe(false);
    expect(PROVIDER_META.ramp.isConfigured()).toBe(false);
  });

  it("returns true when the provider's API key is set", () => {
    process.env.MOONPAY_API_KEY = "pk_test";
    process.env.RAMP_API_KEY = "rk_test";
    expect(PROVIDER_META.moonpay.isConfigured()).toBe(true);
    expect(PROVIDER_META.ramp.isConfigured()).toBe(true);
  });
});
