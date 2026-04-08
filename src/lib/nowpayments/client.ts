import type {
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  MinAmountResponse,
} from "./types";

const API_BASE = process.env.NOWPAYMENTS_API_BASE_URL ?? "https://api.nowpayments.io/v1";

function getApiKey(): string {
  const key = process.env.NOWPAYMENTS_API_KEY;
  if (!key) {
    throw new Error(
      "NOWPAYMENTS_API_KEY is not set. Check your .env.local or Vercel env vars."
    );
  }
  return key;
}

/**
 * Create a NowPayments invoice. Returns the response containing
 * the hosted checkout URL (`invoice_url`) to redirect the customer to.
 *
 * Throws if the API returns a non-2xx response. The caller is responsible
 * for catching and converting to a user-friendly error.
 *
 * SECURITY: never log the request body or response if they contain the
 * API key. The API key is sent in the header, not the body, so it's
 * safe to log the body for debugging — but be careful in error paths.
 */
export async function createInvoice(
  body: CreateInvoiceRequest
): Promise<CreateInvoiceResponse> {
  const response = await fetch(`${API_BASE}/invoice`, {
    method: "POST",
    headers: {
      "x-api-key": getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorBody: string;
    try {
      errorBody = await response.text();
    } catch {
      errorBody = "<unreadable>";
    }
    throw new Error(
      `NowPayments createInvoice failed: ${response.status} ${response.statusText} — ${errorBody}`
    );
  }

  const data = (await response.json()) as CreateInvoiceResponse;
  return data;
}

interface GetMinAmountInput {
  currency_from: string;
  currency_to: string;
  is_fixed_rate?: boolean;
  is_fee_paid_by_user?: boolean;
}

/**
 * Fetch the current NOWPayments minimum amount for a currency pair.
 * Used to block impossible checkout attempts before creating invoices.
 */
export async function getMinAmount(
  input: GetMinAmountInput
): Promise<MinAmountResponse> {
  const params = new URLSearchParams({
    currency_from: input.currency_from,
    currency_to: input.currency_to,
  });

  if (typeof input.is_fixed_rate === "boolean") {
    params.set("is_fixed_rate", String(input.is_fixed_rate));
  }

  if (typeof input.is_fee_paid_by_user === "boolean") {
    params.set("is_fee_paid_by_user", String(input.is_fee_paid_by_user));
  }

  const response = await fetch(`${API_BASE}/min-amount?${params.toString()}`, {
    headers: {
      "x-api-key": getApiKey(),
    },
  });

  if (!response.ok) {
    let errorBody: string;
    try {
      errorBody = await response.text();
    } catch {
      errorBody = "<unreadable>";
    }
    throw new Error(
      `NowPayments getMinAmount failed: ${response.status} ${response.statusText} — ${errorBody}`
    );
  }

  const data = (await response.json()) as MinAmountResponse;
  return data;
}

/**
 * Quick health check for the NowPayments API. Returns true if reachable.
 * Used for sanity checks and dashboard health monitoring.
 */
export async function checkApiStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/status`);
    if (!response.ok) return false;
    const data = (await response.json()) as { message: string };
    return data.message === "OK";
  } catch {
    return false;
  }
}
