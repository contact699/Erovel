/**
 * BTCPay Server Greenfield API v1 types.
 * Source: https://docs.btcpayserver.org/API/Greenfield/v1/
 *
 * Verified against BTCPay Server v2.x as of 2026-04-08.
 */

// Possible invoice statuses returned by BTCPay
export type BTCPayInvoiceStatus =
  | "New"          // Invoice created, awaiting payment
  | "Processing"   // Customer sent payment, awaiting blockchain confirmation
  | "Settled"      // Final state — payment confirmed
  | "Invalid"      // Payment failed validation (wrong amount, etc.)
  | "Expired";     // Invoice timed out before customer paid

// Possible webhook event types
export type BTCPayWebhookEventType =
  | "InvoiceCreated"
  | "InvoiceReceivedPayment"
  | "InvoiceProcessing"
  | "InvoiceExpired"
  | "InvoiceSettled"
  | "InvoiceInvalid";

/** Request body for POST /api/v1/stores/{storeId}/invoices */
export interface CreateInvoiceRequest {
  amount: string;            // String to avoid float precision issues
  currency: string;          // "USD", "EUR", etc.
  metadata?: {
    orderId?: string;        // Our linkage back to pending_crypto_payments
    orderUrl?: string;
    buyerEmail?: string;
    [key: string]: unknown;
  };
  checkout?: {
    speedPolicy?: "HighSpeed" | "MediumSpeed" | "LowSpeed" | "LowMediumSpeed";
    paymentMethods?: string[];   // e.g. ["BTC", "BTC-LightningNetwork"]
    defaultPaymentMethod?: string;
    expirationMinutes?: number;
    monitoringMinutes?: number;
    paymentTolerance?: number;
    redirectURL?: string;        // Where customer goes after paying
    redirectAutomatically?: boolean;
    requiresRefundEmail?: boolean;
  };
}

/** Response from POST /api/v1/stores/{storeId}/invoices */
export interface CreateInvoiceResponse {
  id: string;                  // Invoice ID — link this back to our pending row
  storeId: string;
  amount: string;
  currency: string;
  status: BTCPayInvoiceStatus;
  additionalStatus: string;
  monitoringExpiration: number;
  expirationTime: number;
  createdTime: number;
  checkoutLink: string;        // The hosted checkout URL we redirect customers to
  metadata: Record<string, unknown>;
}

/** Body of a webhook POST from BTCPay */
export interface BTCPayWebhookPayload {
  deliveryId: string;
  webhookId: string;
  originalDeliveryId: string;
  isRedelivery: boolean;
  type: BTCPayWebhookEventType;
  timestamp: number;
  storeId: string;
  invoiceId: string;
  metadata?: Record<string, unknown>;
  // Settled/Processing-specific fields
  manuallyMarked?: boolean;
  overPaid?: boolean;
}
