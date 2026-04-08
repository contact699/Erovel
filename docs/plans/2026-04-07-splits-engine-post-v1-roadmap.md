# Splits engine post-v1 roadmap

**Date:** 2026-04-07
**Status:** Validated design, not yet implemented
**Related docs:** [2026-04-07-splits-engine-v1-design.md](2026-04-07-splits-engine-v1-design.md), [2026-04-07-maxi-partnership-gap-analysis.md](2026-04-07-maxi-partnership-gap-analysis.md)

## Overview

Five features deliberately deferred from the v1 splits engine, each fully specced here so they're ready to build when their trigger fires. None are built in v1. Sections 1, 1.5, 2, and 3 are buildable in sequence as ~2 weeks of follow-up work immediately after v1. Section 4 is trigger-driven (first international creator request). Section 5 is deliberately deferred until an audit or a volume threshold forces it.

All five build on the v1 engine without requiring schema breaks. The v1 design is intentionally general enough to absorb each addition without rewrites.

---

## Section 1: Affiliate / referral splits

**Trigger to build:** Immediately after v1 ships. Highest immediate value — it's the plumbing you'd reuse for OF model affiliates later, validated first in a low-risk marketplace context (creator-to-creator or creator-to-external referrals).

### Schema additions

```sql
create table referral_codes (
  id uuid primary key default gen_random_uuid(),
  payee_id uuid not null references payees(id) on delete cascade,
  code text unique not null,                    -- short, URL-safe
  label text,                                   -- internal display
  cut_pct numeric(5,2) not null default 5.00,   -- % earned on attributed payments
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_referral_codes_code on referral_codes(code) where is_active;

create table referral_attributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  referral_code_id uuid not null references referral_codes(id),
  attributed_at timestamptz not null default now(),
  expires_at timestamptz not null,              -- attributed_at + 90 days
  unique (user_id)                              -- first-touch wins, one per user
);
```

### Attribution flow

1. Visitor hits `erovel.com/?ref=CODE` (or `/c/username?ref=CODE`). Middleware sets a signed cookie `ref_code=CODE` with 90-day expiry.
2. On signup, the cookie is consumed and a `referral_attributions` row is written linking the new user to the code. First-touch wins — existing attributions are never overwritten.
3. On every payment event, before the splits resolver runs, the engine checks whether the paying user has an active (non-expired) attribution. If so, the `referral_code.payee_id` is added to the effective rule set with `basis_pct = referral_code.cut_pct`.
4. The v1 splits resolver handles the rest. Referral is just another payee in the snapshot.

### Platform fee interaction

The 15% platform fee is calculated first, then the referral cut comes out of the creator's 85%. A $10 tip with a 5% referral: $1.50 platform / $0.50 referrer / $8.00 creator. Platform cut is stable regardless of referrals.

### UI surface

- Creator dashboard: "Referral codes" tab — generate code, view code, see attributed signups, see earnings from referrals.
- Public: landing and creator pages respect `?ref=` param, no visible UI change to readers.

### Effort: ~1 week

3 days for schema + resolver integration, 2 days for the dashboard UI, rest for attribution edge cases and tests.

### Non-goals

- Multi-tier referrals (referrer of a referrer)
- Click-only attribution without signup conversion
- Fraud detection beyond first-touch

---

## Section 1.5: External payee support (bundled with section 1)

**Trigger to build:** Ship alongside section 1. Adds ~2 days to that effort.

Building external payee infrastructure does **not** create legal liability. The schema is just "a recipient that isn't an Erovel profile." It could be a referral partner, an agency, a marketing collaborator, or eventually an OF model. The system doesn't know or care. Liability only arrives if/when a real performer's imagery is displayed or paid out on tracked metrics without a contract in place — and those are separate builds that stay gated.

### In scope

1. **External payee creation (admin only).** `/admin/payees` page to create `payees` rows of `type='external'` with label, contact email, payout method, destination, internal notes. No profile, no public surface, no story linkage.
2. **Referral codes assignable to external payees.** The `referral_codes.payee_id` foreign key already accepts any payee — no schema change. Admin "Create referral code" form gets a payee selector that lists creators *or* external payees.
3. **Payout flow for external payees.** Payouts already point to `payee_id` after v1. Since external payees don't log in, add an admin-initiated payout UI: `/admin/payees/[id]` shows accrued balance with a "Mark paid" button that writes a `payouts` row.
4. **Earnings visibility for external payees.** Admin-side only — lifetime earned, lifetime paid, current balance, recent attributed payments.

### Still gated (do NOT build until Maxi deal + legal review)

- Public model persona pages
- Any imagery display tied to external payees
- Any link from a story to an external payee (`story_models` join table)
- 2257 records
- Model release uploads
- Auto-onboarding of external payees by anyone other than admin

### Safety by construction

Until you create the first `type='external'` payee in admin, the system is invisible to the public and behaves identically to a creator-only platform. The day Maxi signs, you create the external payee, issue a referral code, and the existing flow handles the entire affiliate revenue path. **Zero new code, zero schema migration, zero deploy.**

---

## Section 2: Collab / co-author splits

**Trigger to build:** When the first creator asks to share revenue on a story with a co-author. Low urgency, user-request driven.

### Schema additions

**None.** v1 already supports this primitive. `split_rules` with `subject_type='story'` + multiple `payee_id` rows = collab. Only the UI is missing.

### UI surface — creator side

A "Collaborators" tab on the story edit page, owner-only (the story's `creator_id` is the only one who can add or remove).

- **Add collaborator** — search by username, set share as % (1–99%). Sum of all collaborator shares ≤ 85% (since 15% is the platform fee). Validated in UI and server.
- **Collaborator list** — display name, avatar, % share, remove button.
- **Save** — writes/updates `split_rules` rows for `(subject_type='story', subject_id=story.id)`. The owner's residual is implicit.

### Invariant to protect

The story owner is always the residual payee. Collaborators can only take slices off the *owner's* share, never off the platform's 15%. Prevents a creator from configuring a 0% platform fee through the collab UI.

### UI surface — reader side

Below the author line on story detail pages: "with [collab1], [collab2]" attribution, clickable to each collaborator's profile. No revenue info visible.

### Notification hook

When a creator adds a collaborator, notify them via the existing `notifications` table (from the 2026-04-01 migration): "X added you as a collaborator on [story]." They can decline, which removes the `split_rules` row. Default is accept — no handshake gate.

### Edge cases

- Collaborator deletes account → `payees` cascade → `split_rules` cascade → owner absorbs residual automatically. History untouched because snapshots are immutable.
- Collaborator added after the story has tips → only future tips affected.
- Collaborator added after subscription is active → existing subscription's snapshot is frozen; next renewal applies the new split.

### Effort: ~3–4 days

Mostly UI. Server side is straightforward CRUD against `split_rules`.

### Non-goals

- Ghost-writer / hidden collab — all collaborators are public
- Per-chapter collab — story-level only
- Time-based splits ("50/50 for month 1, then 80/20")

---

## Section 3: Rule priority tiers

**Trigger to build:** When the first feature needs rules to stack in an order that "fixed-first, then-percentages" can't express. Most likely trigger: the Maxi managed vertical (platform 70% + affiliate 5% + contractor residual).

### What's already in v1

`split_rules.priority` column exists. v1 resolver uses it only implicitly: fixed rules at priority 0, percentage rules at priority 1. Enough for everything v1 needs.

### What this section adds

Make `priority` actually meaningful. Rules apply in strict priority order (ascending). Each rule operates on whatever remains after all lower-priority rules have been applied. Sum-preservation invariant is unchanged: total equals gross, residual payee absorbs leftover.

### Concrete example — Maxi managed vertical

Rules attached to a managed story:

- priority 0, payee=platform, basis_pct=70.00 → 70% of gross
- priority 10, payee=of_model (external), basis_pct=5.00 → 5% of the remaining 30% = 1.5% of gross
- priority 20, payee=contractor_writer, residual → whatever's left = 28.5% of gross

A $10 payment: $7.00 / $0.15 / $2.85. Sum = $10.00.

### Resolver change

```typescript
function resolveSplits(gross: number, rules: SplitRule[], residualPayeeId: string) {
  const sorted = [...rules].sort((a, b) => a.priority - b.priority);
  const priorities = [...new Set(sorted.map(r => r.priority))];
  let remaining = gross;
  const snapshot: SplitEntry[] = [];

  for (const p of priorities) {
    const tier = sorted.filter(r => r.priority === p);
    // Fixed first within a tier
    for (const r of tier.filter(x => x.basis_fixed !== null)) {
      const amt = Math.min(r.basis_fixed!, remaining);
      snapshot.push({ payee_id: r.payee_id, amount: amt, basis: 'fixed' });
      remaining -= amt;
    }
    // Then pct (against current remaining, not gross)
    for (const r of tier.filter(x => x.basis_pct !== null)) {
      const amt = round2(remaining * (r.basis_pct! / 100));
      snapshot.push({ payee_id: r.payee_id, amount: amt, basis: 'pct', pct: r.basis_pct! });
      remaining -= amt;
    }
  }

  snapshot.push({ payee_id: residualPayeeId, amount: round2(remaining), basis: 'residual' });
  return snapshot;
}
```

### Admin UI

A numeric `priority` input on the admin rule creator. Creators don't see priority — their UI (collab splits) always uses priority 50, sandwiched between platform/contractor rules (priority 0–10) and affiliate rules (priority 20–30).

### Effort: ~1–2 days

Resolver change + one new admin field. Most of the work is regression testing existing flows.

---

## Section 4: Multi-currency

**Trigger to build:** When the first international creator asks to see earnings in local currency, or when A/B tests show local-currency display materially improves conversion.

### Key insight

CCBill handles multi-currency on the user's side — readers can pay in local currency, but CCBill settles to the merchant in USD. **The splits engine never sees a non-USD amount.** "Multi-currency" is a *display* feature, not an accounting feature. The splits engine doesn't change at all.

### Schema additions

```sql
create table fx_rates (
  currency_code text not null,                  -- 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'
  rate_date date not null,
  usd_to_currency numeric(12,6) not null,
  source text not null default 'exchangerate-api',
  created_at timestamptz not null default now(),
  primary key (currency_code, rate_date)
);

alter table profiles add column display_currency text not null default 'USD';
```

### Data flow

1. Daily cron fetches USD→X rates for an allowlist of currencies and upserts into `fx_rates`.
2. A `formatCurrency(amountUSD, displayCurrency)` helper looks up the most recent rate and converts.
3. Stored amounts are **always USD**. Never touched by FX.
4. CCBill tells us the USD settlement; that's what lands in the DB.

### Reader-side conversion

Subscribe and tip buttons detect the reader's currency from browser locale (with manual override in settings). Display prices as "€9.30" (converted from canonical $10 USD). When they click through to CCBill, CCBill does the real FX — final amount may differ by pennies. Expected.

### Creator-side conversion

Earnings dashboard respects `profiles.display_currency`. Stored in USD, converted at display time. Disclaimer: "Amounts shown in EUR. Earnings recorded in USD." so creators understand FX-driven fluctuation.

### Payouts stay USD

Always denominated in USD. Paxum and crypto handle their own downstream FX.

### Intentionally not here

- Historical FX recording (rates at the time of each tip)
- Multi-currency storage
- Per-currency payout accounting

### Effort: ~3–4 days

FX cron + table + format helper + wiring helper into existing money displays + dashboard setting + reader currency detection.

---

## Section 5: Ledger-style double-entry

**Trigger to build:** Build only when one of these happens:

- A formal financial audit is required (CCBill compliance review, investor due diligence, tax inquiry)
- Monthly processed volume crosses ~$50K and snapshot reconciliation feels fragile
- A dispute requires reconstructing every cent for non-engineers
- A co-founder/CFO joins who needs GAAP-shaped books

**None of these are imminent. Do not build preemptively.**

### Why v1 snapshots are sufficient until the trigger

v1 already preserves every detail of every payment: gross, every payee's share, the basis, the rule that produced it. Earnings are deterministic and replayable. The only thing missing is structural "every cent accounted for in two places" enforcement — useful for audit defense, irrelevant otherwise.

### Schema sketch

```sql
create type account_type as enum (
  'asset',        -- cash_in, cash_holding
  'liability',    -- creator_payable, contractor_payable, affiliate_payable
  'revenue',      -- platform_revenue
  'expense',      -- processor_fees, refunds, write_offs
  'equity'        -- retained_earnings
);

create table accounts (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  type account_type not null,
  payee_id uuid references payees(id),
  created_at timestamptz not null default now()
);

create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null,
  description text not null,
  source_type text not null,        -- 'tip', 'subscription', 'payout', 'refund', 'adjustment'
  source_id uuid,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table ledger_lines (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references journal_entries(id) on delete cascade,
  account_id uuid not null references accounts(id),
  debit numeric(12,2) not null default 0,
  credit numeric(12,2) not null default 0,
  check ((debit > 0 and credit = 0) or (credit > 0 and debit = 0))
);

create index idx_ledger_lines_entry on ledger_lines(entry_id);
create index idx_ledger_lines_account on ledger_lines(account_id);
```

A trigger on `ledger_lines` enforces that every `journal_entries` row balances (sum of debits = sum of credits).

### Example: $10 tip with 15% platform fee

```
Journal entry 4521: "Tip from user X to creator Y"
  source_type: tip, source_id: <tip uuid>
Lines:
  DR cash_in              10.00
  CR platform_revenue      1.50
  CR creator_payable:Y     8.50
  -> entry balances ✓
```

Payout:

```
Journal entry 4622: "Payout to creator Y via Paxum"
  source_type: payout, source_id: <payout uuid>
Lines:
  DR creator_payable:Y    50.00
  CR cash_out             50.00
```

Refunds reverse the original entry. Account balances are computed by `select sum(credit) - sum(debit) from ledger_lines where account_id = X` (or inverse for asset/expense accounts) — never stored, always derived.

### Migration from v1 snapshots

A one-time replay script walks every `tips`, `subscriptions`, and `payouts` row in chronological order and produces equivalent journal entries. v1 snapshots preserve full payee + amount data, so replay is mechanical. Run in a transaction, verify ledger balances match `payee_balances.gross_earned` exactly, then atomically cut over the earnings dashboard. If anything diverges by even one cent, abort and investigate.

### Effort when the trigger fires: ~2–3 weeks

Schema + replay script + balance triggers + earnings dashboard cutover + admin ledger viewer. The biggest cost isn't code — it's care required to verify the migration is bit-for-bit correct.

### What changes for users

**Nothing visible.** Earnings dashboard, payouts, creator UX all stay the same. The ledger is invisible infrastructure. Only admin gains a "general ledger" page.

---

## Summary

| # | Feature | Trigger | Effort |
|---|---|---|---|
| 1 | Affiliate / referral splits | Immediately after v1 | ~1 week |
| 1.5 | External payee infra | Bundled with #1 | +2 days |
| 2 | Collab / co-author splits | First user request | ~3-4 days |
| 3 | Rule priority tiers | First multi-tier rule (likely Maxi vertical) | ~1-2 days |
| 4 | Multi-currency display | First international ask or conversion test | ~3-4 days |
| 5 | Double-entry ledger | Audit / volume / dispute | ~2-3 weeks |

Sections 1, 1.5, 2, and 3 form a natural sequence (~2 weeks total) buildable immediately after v1 ships. Sections 4 and 5 are trigger-driven and may never be built.
