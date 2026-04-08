-- Pending crypto payments via NowPayments
-- Holds in-flight payment intent until the IPN webhook confirms 'finished'
-- See docs/plans/2026-04-08-nowpayments-crypto-tips-plan.md

create type pending_crypto_status as enum (
  'created',          -- Erovel created the invoice, awaiting customer action
  'waiting',          -- NowPayments status: awaiting customer payment
  'confirming',       -- NowPayments status: blockchain confirmation pending
  'confirmed',        -- NowPayments status: confirmed on chain
  'sending',          -- NowPayments status: funds being sent to payout wallet
  'partially_paid',   -- NowPayments status: customer underpaid
  'finished',         -- NowPayments status: settled — splits engine called
  'failed',           -- NowPayments status: payment failed
  'refunded',         -- NowPayments status: refunded
  'expired'           -- NowPayments status: invoice timed out
);

create table pending_crypto_payments (
  id uuid primary key default gen_random_uuid(),
  -- The order_id sent to NowPayments. We use the same UUID as our primary key.
  order_id uuid not null unique,
  -- Linking back to Erovel's domain entities
  reader_id uuid not null references profiles(id) on delete cascade,
  creator_id uuid not null references profiles(id) on delete cascade,
  story_id uuid references stories(id) on delete set null,
  -- Payment intent
  source_type text not null check (source_type in ('tip', 'subscription')),
  gross_usd numeric(10,2) not null check (gross_usd > 0),
  -- NowPayments references
  nowpayments_invoice_id text,    -- the 'id' field from createInvoice response
  nowpayments_payment_id bigint,  -- the 'payment_id' from IPN (set when first IPN arrives)
  invoice_url text,
  -- Status tracking
  status pending_crypto_status not null default 'created',
  last_ipn_at timestamptz,
  last_ipn_payload jsonb,
  -- Resulting tip row, set when status transitions to 'finished'
  resulting_tip_id uuid references tips(id) on delete set null,
  -- Audit
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_pending_crypto_order_id on pending_crypto_payments(order_id);
create index idx_pending_crypto_payment_id on pending_crypto_payments(nowpayments_payment_id);
create index idx_pending_crypto_reader on pending_crypto_payments(reader_id);
create index idx_pending_crypto_creator on pending_crypto_payments(creator_id);
create index idx_pending_crypto_status on pending_crypto_payments(status, created_at desc);

-- Idempotency: a given NowPayments payment_id maps to at most one row
-- (set NULL when not yet known, but unique once set)
create unique index idx_pending_crypto_payment_id_unique
  on pending_crypto_payments(nowpayments_payment_id)
  where nowpayments_payment_id is not null;

create trigger tr_pending_crypto_updated
  before update on pending_crypto_payments
  for each row execute function update_updated_at();

alter table pending_crypto_payments enable row level security;

-- Readers can read their own pending payments (so they can see status on a return page)
create policy "pending_crypto_read_own_reader" on pending_crypto_payments
  for select using (auth.uid() = reader_id);

-- Creators can read pending payments destined for them
create policy "pending_crypto_read_own_creator" on pending_crypto_payments
  for select using (auth.uid() = creator_id);

-- Admin full access
create policy "pending_crypto_admin_all" on pending_crypto_payments
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Inserts and updates happen via service role from server routes — no public policies needed
