import type {
  CreateInvoiceRequest,
  CreateInvoiceResponse,
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
