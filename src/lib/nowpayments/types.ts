/**
 * NowPayments API + IPN types.
 * Source: NowPayments Postman docs (verified 2026-04-08).
 *
 * VERIFY BEFORE SHIP: the payment_status enum below is best-effort from
 * docs+training data. Confirm against current Postman docs before flipping
 * the integration to live customer traffic.
 */

// All possible payment statuses returned by NowPayments
export type NowPaymentsStatus =
  | "waiting"          // Invoice created, awaiting customer payment
  | "confirming"       // Customer sent payment, blockchain confirmation pending
  | "confirmed"        // Confirmed on chain
  | "sending"          // Funds being sent to merchant payout wallet
  | "partially_paid"   // Customer underpaid; partial credit
  | "finished"         // Final state — funds settled in payout wallet
  | "failed"           // Payment failed
  | "refunded"         // Refunded back to customer
  | "expired";         // Invoice timed out (10 min for fixed-rate)

/** Request body for POST /v1/invoice */
export interface CreateInvoiceRequest {
  price_amount: number;
  price_currency: string;        // 'usd', 'eur', etc.
  pay_currency?: string;         // crypto code; null = customer chooses
  ipn_callback_url?: string;
  order_id?: string;
  order_description?: string;
  success_url?: string;
  cancel_url?: string;
  partially_paid_url?: string;
  is_fixed_rate?: boolean;       // we want true: locks rate for 10 min
  is_fee_paid_by_user?: boolean; // we want true: customer pays network fee
}

/** Response from POST /v1/invoice */
export interface CreateInvoiceResponse {
  id: string;
  token_id: string;
  order_id: string | null;
  order_description: string | null;
  price_amount: string;
  price_currency: string;
  pay_currency: string | null;
  ipn_callback_url: string | null;
  invoice_url: string;           // ← what we redirect the customer to
  success_url: string | null;
  cancel_url: string | null;
  partially_paid_url: string | null;
  payout_currency: string;
  created_at: string;
  updated_at: string;
  is_fixed_rate: boolean;
}

/** Body of an IPN webhook POST from NowPayments */
export interface IpnPaymentPayload {
  payment_id: number;
  parent_payment_id: number | null; // present on repeated deposits
  invoice_id: number | null;
  payment_status: NowPaymentsStatus;
  pay_address: string;
  payin_extra_id: string | null;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  actually_paid_at_fiat: number;
  pay_currency: string;
  order_id: string | null;        // ← our linkage back to pending_crypto_payments
  order_description: string | null;
  purchase_id: string;
  outcome_amount: number;
  outcome_currency: string;
  payment_extra_ids: unknown;
  fee?: {
    currency: string;
    depositFee: number;
    withdrawalFee: number;
    serviceFee: number;
  };
}
