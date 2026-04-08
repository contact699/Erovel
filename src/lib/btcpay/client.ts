import type {
  CreateInvoiceRequest,
  CreateInvoiceResponse,
} from "./types";

function getBaseUrl(): string {
  const url = process.env.BTCPAY_URL;
  if (!url) {
    throw new Error("BTCPAY_URL is not set");
  }
  return url.replace(/\/$/, "");
}

function getStoreId(): string {
  const id = process.env.BTCPAY_STORE_ID;
  if (!id) {
    throw new Error("BTCPAY_STORE_ID is not set");
  }
  return id;
}

function getApiKey(): string {
  const key = process.env.BTCPAY_API_KEY;
  if (!key) {
    throw new Error("BTCPAY_API_KEY is not set");
  }
  return key;
}

/**
 * Create a BTCPay invoice. Returns the invoice including the
 * `checkoutLink` URL to redirect the customer to.
 *
 * Throws if BTCPay returns a non-2xx response. Caller is responsible
 * for catching and converting to a user-friendly error.
 *
 * SECURITY: never log the API key. The key is in an Authorization
 * header, never in the body, so logging the body is safe.
 */
export async function createBTCPayInvoice(
  body: CreateInvoiceRequest
): Promise<CreateInvoiceResponse> {
  const url = `${getBaseUrl()}/api/v1/stores/${getStoreId()}/invoices`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `token ${getApiKey()}`,
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
      `BTCPay createInvoice failed: ${response.status} ${response.statusText} — ${errorBody}`
    );
  }

  return (await response.json()) as CreateInvoiceResponse;
}

/**
 * Quick health check — fetches the BTCPay server status.
 * Returns true if reachable and synchronized.
 */
export async function checkBTCPayHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/v1/health`);
    if (!response.ok) return false;
    const data = (await response.json()) as { synchronized: boolean };
    return data.synchronized === true;
  } catch {
    return false;
  }
}
