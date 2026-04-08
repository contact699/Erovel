-- Add processor column to pending_crypto_payments to support multiple
-- crypto processors (NowPayments, BTCPay) writing to the same table.

create type crypto_processor as enum ('nowpayments', 'btcpay');

alter table pending_crypto_payments
  add column processor crypto_processor not null default 'nowpayments';

-- Existing rows are NowPayments by default (unchanged behavior).
-- Future inserts must specify the processor.

create index idx_pending_crypto_processor on pending_crypto_payments(processor, status, created_at desc);

-- Generic external invoice ID column to replace the NowPayments-specific
-- nowpayments_invoice_id and nowpayments_payment_id columns going forward.
-- Existing columns stay for backward compat with NowPayments-side data.
alter table pending_crypto_payments
  add column external_invoice_id text;

-- For BTCPay rows: external_invoice_id = BTCPay's invoice ID
-- For NowPayments rows: external_invoice_id = nowpayments_invoice_id (mirror)
-- The mirror happens at insert time in the routes; nothing to backfill.

create index idx_pending_crypto_external_id on pending_crypto_payments(external_invoice_id) where external_invoice_id is not null;
