# Splits engine v1 — design

**Date:** 2026-04-07
**Status:** Validated, ready to implement
**Related docs:** [2026-04-07-maxi-partnership-gap-analysis.md](2026-04-07-maxi-partnership-gap-analysis.md), [2026-04-07-splits-engine-post-v1-roadmap.md](2026-04-07-splits-engine-post-v1-roadmap.md)

## Context

There is no live CCBill payment pipeline yet. `subscribe-button.tsx` and `tip-button.tsx` are stubs; `/api/tips` and `/api/subscriptions` POST routes don't exist; the earnings dashboard reads directly from the `tips` table and assumes the creator receives 100% of every tip. This design defines the schema that the future CCBill webhook handler will write through from day one — so the data model is correct *before* any real money flows.

The splits engine is the foundation that supports platform fees today and (trivially) collab splits, creator referrals, external-payee affiliates, contractor revenue modes, and the Maxi managed vertical later. It is deliberately *not* a double-entry ledger — snapshots are sufficient for current scale and are replayable into a ledger if a real audit ever forces it.

## Core invariants

1. **Snapshots are frozen at payment time.** Historical earnings are always read from the snapshot, never recomputed against current rules. Changing a rule never alters history.
2. **Sum of snapshot equals gross.** The resolver asserts this on every write. If validation fails, the payment is held in a `splits_failed` queue for manual review, not silently miscounted.
3. **Rules are configured intent; snapshots are recorded transactions.** These are never confused.
4. **The residual payee absorbs all leftover amounts.** This guarantees no rounding loss and no orphaned cents.
5. **15% gross platform fee.** Applied to every payment, calculated against the full pre-processor-fee amount that CCBill settles to us. See [project_platform_economics](../../../Users/computer/.claude/projects/D--Erovel/memory/project_platform_economics.md).

## Schema

Three additions:

### 1. `payees` — generic recipient abstraction

```sql
create type payee_type as enum ('profile', 'platform', 'external');

create table payees (
  id uuid primary key default gen_random_uuid(),
  type payee_type not null,
  profile_id uuid references profiles(id) on delete cascade,
  label text,                      -- for 'external' / 'platform'
  payout_method payout_method,     -- optional override
  payout_email text,
  payout_wallet_address text,
  created_at timestamptz not null default now()
);

create index idx_payees_profile on payees(profile_id);
create index idx_payees_type on payees(type);
```

Seeded at migration time: a single `type='platform'` row (label: 'Erovel'). Every existing profile gets an auto-created `type='profile'` payee row via backfill + trigger on `profiles` insert.

This is the key decoupling: splits target payees, not profiles. Profiles are the user-facing concept; payees are the money-flow concept. A creator is both. An OF model affiliate (later) is a payee without a profile.

### 2. `split_rules` — configured defaults

```sql
create type split_subject_type as enum ('creator', 'story');

create table split_rules (
  id uuid primary key default gen_random_uuid(),
  subject_type split_subject_type not null,
  subject_id uuid not null,
  payee_id uuid not null references payees(id),
  basis_pct numeric(5,2),          -- e.g. 10.00 = 10%
  basis_fixed numeric(10,2),       -- alt: fixed amount in USD
  priority integer not null default 0,
  created_at timestamptz not null default now(),
  check (basis_pct is not null or basis_fixed is not null)
);

create index idx_split_rules_subject on split_rules(subject_type, subject_id);
```

Rules attach to a *subject* (creator or story) and list the payees + shares that apply when that subject receives a payment. No rules exist for most creators at launch — they rely on the default resolver behavior (platform fee + residual to creator).

### 3. `splits` JSONB column on payment tables

```sql
alter table tips add column splits jsonb not null default '[]'::jsonb;
alter table subscriptions add column splits jsonb not null default '[]'::jsonb;
```

Shape:

```json
[
  {"payee_id": "...", "amount": 1.50, "basis": "pct", "pct": 15.00},
  {"payee_id": "...", "amount": 8.50, "basis": "residual"}
]
```

The snapshot is the single source of truth for historical earnings. It is frozen at insert time and never mutated.

### 4. `payee_balances` — materialized earnings view

```sql
create table payee_balances (
  payee_id uuid primary key references payees(id) on delete cascade,
  gross_earned numeric(12,2) not null default 0,
  total_paid_out numeric(12,2) not null default 0,
  available numeric(12,2) generated always as (gross_earned - total_paid_out) stored,
  updated_at timestamptz not null default now()
);
```

Kept in sync via triggers on `tips.insert` and `subscriptions.insert/update`, which walk the JSONB snapshot and bump the relevant `payee_balances` rows. Payouts decrement `total_paid_out` on status transitions. The earnings dashboard becomes a single-row lookup.

### 5. `splits_failed` — error queue

```sql
create table splits_failed (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,           -- 'tip', 'subscription', 'refund'
  source_payload jsonb not null,       -- the incoming event
  error_message text not null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
```

Any payment event that can't be split (validation failure, missing residual payee, rule conflict) is written here instead of being silently applied. Admin UI allows manual resolution.

## Resolution algorithm

On a payment event:

**Step 1 — Determine the subject.**
- Tip with `story_id` → subject is the story
- Tip without `story_id` → subject is the creator
- `target_type='story'` subscription → subject is the story
- `target_type='creator'` subscription → subject is the creator

**Step 2 — Resolve applicable rules.**
Look up `split_rules` where `(subject_type, subject_id)` matches. If no rules exist for a story-level subject, fall back to the creator-level rules for that story's creator.

**Step 3 — Always include the platform fee.**
Append a platform fee entry based on `PLATFORM_FEE_PCT` constant (15%) *unless* an explicit rule already names the platform payee. This allows special overrides (e.g. the future Maxi vertical at 70%).

**Step 4 — Compute the snapshot.**
Apply fixed rules first (by `priority` ascending, then by insertion order). Subtract each from the running remainder. Apply percentage rules against the remainder. The creator (or designated residual payee) absorbs whatever's left.

**Step 5 — Validate and write.**
Assert the snapshot sums exactly to the gross. If it doesn't, write to `splits_failed` instead of the payment table.

## Refund handling

When CCBill eventually posts a refund webhook: write a new `tips` or `subscriptions` row with `amount < 0` and a `splits` snapshot that mirrors the original with negated amounts. The balance triggers fire in reverse. No separate refund table, no reversal flag, no special-case logic. Balances can go temporarily negative; the payout UI blocks requests when `available < min_payout`.

## Earnings query

Today's query (`dashboard/earnings/page.tsx`) reads `tips.amount` and assumes the creator gets everything. After this change, earnings is a single-row lookup from `payee_balances` keyed on the creator's `payee_id`. Historical detail queries walk the JSONB snapshot with `jsonb_array_elements`.

## Payouts wiring

The `payouts` table currently has `creator_id` referencing `profiles`. Migration changes it to `payee_id` referencing `payees`. Backfill: every existing payout references the creator's auto-generated payee. A compatibility view or accessor keeps existing code working during the transition.

## Rollout

**Phase 1 — Schema only, no behavior change.**
Ship the migration. `PLATFORM_FEE_PCT = 0` for now. Backfill all existing profiles with payee rows. Backfill all existing tips/subscriptions with 100%-to-creator snapshots. Backfill `payee_balances`. Historical earnings are unchanged.

**Phase 2 — Cut over the reads.**
Update `dashboard/earnings/page.tsx` to read from `payee_balances`. Update payout queries to join through payees. Verify existing creators see identical numbers pre/post. Roll back if any diverge.

**Phase 3 — Wire the resolver into payment writes.**
Every existing insert path into `tips`/`subscriptions` goes through a new `createPaymentWithSplits()` helper in `lib/payments.ts`. Nothing real writes to these tables today (both buttons are stubs), so this phase is where we make the stubs wire through the helper and prepare the future CCBill webhook handler to call it.

**Phase 4 — Flip the platform fee.**
Change `PLATFORM_FEE_PCT` from `0` to `15`. New payments carry the fee; historical payments are untouched. Communicate to any existing paying creators before the flip.

## Testing strategy

- Unit tests on the resolver covering: fixed-only, pct-only, fixed+pct, residual overflow, residual underflow, sub-cent rounding, negative (refund) amounts, missing residual payee.
- Property test: for any set of rules and any gross amount, snapshot sum equals gross exactly.
- Integration test: the backfill script on a copy of prod data; assert earnings queries return identical numbers pre/post.
- Regression test: earnings dashboard pre/post cutover shows identical totals for existing creators.

## Non-goals (deferred — see post-v1 roadmap)

- Collab/co-author splits UI — schema supports it; no UI in v1.
- Affiliate/referral codes + external payee infra — schema supports it; no tables yet.
- Rule priority tiers beyond "fixed first, then pct" — priority column exists but only uses two effective tiers.
- Multi-currency display — assumed USD throughout.
- Ledger-style double-entry — snapshots are replayable into a ledger if ever needed.

Each of these is fully specced in `2026-04-07-splits-engine-post-v1-roadmap.md`.
