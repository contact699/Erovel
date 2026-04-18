// Fiat-to-crypto on-ramp providers. Each provider exposes a URL builder
// that takes the destination wallet address + amount + asset and returns
// a URL the user can open in a popup or new tab to buy crypto with a card.
// The crypto lands at the destination address; our BTCPay / NowPayments
// invoice polling picks it up exactly like any other wallet transfer.

import crypto from "node:crypto";

export type OnRampProvider = "moonpay" | "ramp";

export interface OnRampRequest {
  // Destination wallet address — where the bought crypto should be sent.
  // For BTCPay invoices this is the BTC address the invoice expects.
  walletAddress: string;
  // Crypto asset code in the provider's vocabulary (e.g. "btc", "usdc_polygon").
  // Each builder maps this to the provider-specific code.
  asset: "btc" | "usdc_polygon";
  // Fiat amount in USD. The user may see a slightly different total after
  // provider fees and fiat-crypto spread, but this is what we're asking for.
  fiatAmountUsd: number;
  // URL to return the user to after they finish the on-ramp transaction.
  redirectUrl: string;
  // External invoice / order id we can trace back to our pending_crypto_payments
  // row. Passed through to the provider as a reference.
  externalId: string;
}

export interface OnRampProviderMeta {
  id: OnRampProvider;
  label: string;
  blurb: string;
  // Set false if the provider's env is not configured — the checkout picker
  // should hide it entirely.
  isConfigured(): boolean;
}

export const PROVIDER_META: Record<OnRampProvider, OnRampProviderMeta> = {
  moonpay: {
    id: "moonpay",
    label: "MoonPay",
    blurb: "Card, Apple Pay, Google Pay — 160+ countries",
    isConfigured: () => Boolean(process.env.MOONPAY_API_KEY),
  },
  ramp: {
    id: "ramp",
    label: "Ramp",
    blurb: "Card, SEPA, Apple Pay — Europe-friendly",
    isConfigured: () => Boolean(process.env.RAMP_API_KEY),
  },
};

export function buildOnRampUrl(
  provider: OnRampProvider,
  req: OnRampRequest
): string {
  switch (provider) {
    case "moonpay":
      return buildMoonPayUrl(req);
    case "ramp":
      return buildRampUrl(req);
  }
}

// --- MoonPay ---
// Docs: https://dev.moonpay.com/docs/on-ramp-integrate-using-simple-url
// Production requires HMAC-SHA256 of the query string with the secret key.

const MOONPAY_CURRENCY: Record<OnRampRequest["asset"], string> = {
  btc: "btc",
  // MoonPay uses "usdc_polygon" for USDC on Polygon.
  usdc_polygon: "usdc_polygon",
};

function buildMoonPayUrl(req: OnRampRequest): string {
  const apiKey = process.env.MOONPAY_API_KEY;
  if (!apiKey) {
    throw new Error("MOONPAY_API_KEY is not set");
  }

  const base =
    process.env.MOONPAY_ENVIRONMENT === "production"
      ? "https://buy.moonpay.com"
      : "https://buy-sandbox.moonpay.com";

  const params = new URLSearchParams({
    apiKey,
    currencyCode: MOONPAY_CURRENCY[req.asset],
    walletAddress: req.walletAddress,
    baseCurrencyCode: "usd",
    baseCurrencyAmount: req.fiatAmountUsd.toFixed(2),
    redirectURL: req.redirectUrl,
    externalTransactionId: req.externalId,
    // Prevent users from changing the destination wallet in the widget.
    lockAmount: "true",
  });

  const query = params.toString();
  const secret = process.env.MOONPAY_SECRET_KEY;
  if (secret) {
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`?${query}`)
      .digest("base64");
    params.set("signature", signature);
  }

  return `${base}?${params.toString()}`;
}

// --- Ramp ---
// Docs: https://docs.ramp.com/
// Ramp's URL integration accepts the host API key inline; no HMAC signing
// required for the simple URL flow (their SDK adds signing on top, which
// we can adopt later if we move to the embedded widget).

const RAMP_ASSET: Record<OnRampRequest["asset"], string> = {
  btc: "BTC",
  // Ramp uses "MATIC_USDC" for USDC on Polygon.
  usdc_polygon: "MATIC_USDC",
};

function buildRampUrl(req: OnRampRequest): string {
  const apiKey = process.env.RAMP_API_KEY;
  if (!apiKey) {
    throw new Error("RAMP_API_KEY is not set");
  }

  const base =
    process.env.RAMP_ENVIRONMENT === "production"
      ? "https://app.ramp.network"
      : "https://app.demo.ramp.network";

  const params = new URLSearchParams({
    hostApiKey: apiKey,
    hostAppName: "Erovel",
    hostLogoUrl: "https://erovel.com/favicon.ico",
    swapAsset: RAMP_ASSET[req.asset],
    userAddress: req.walletAddress,
    fiatCurrency: "USD",
    fiatValue: req.fiatAmountUsd.toFixed(2),
    finalUrl: req.redirectUrl,
    hostReferenceId: req.externalId,
  });

  return `${base}/?${params.toString()}`;
}
