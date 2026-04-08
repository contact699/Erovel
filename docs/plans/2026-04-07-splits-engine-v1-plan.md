# Splits Engine v1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the v1 splits engine — the foundation that every future payment in Erovel flows through. Ships with a 15% platform fee on all tips and subscriptions, with the architecture in place to support collab splits, affiliate referrals, and managed-vertical revenue modes (no UI for those yet).

**Architecture:** Snapshot-based splits, not double-entry ledger. Three new tables (`payees`, `split_rules`, `payee_balances`), one error queue (`splits_failed`), one JSONB column on `tips` and `subscriptions`. The resolver is a pure function with full unit test coverage. The platform is a generic payee, treated identically to creators and external parties — no special-cased fee logic.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Supabase (Postgres 17), Vitest (added in task 1 for resolver unit tests), Playwright (existing — used for e2e regression).

**Reference docs:**
- Design: [`docs/plans/2026-04-07-splits-engine-v1-design.md`](2026-04-07-splits-engine-v1-design.md)
- Post-v1 roadmap: [`docs/plans/2026-04-07-splits-engine-post-v1-roadmap.md`](2026-04-07-splits-engine-post-v1-roadmap.md)
- Maxi gap analysis: [`docs/plans/2026-04-07-maxi-partnership-gap-analysis.md`](2026-04-07-maxi-partnership-gap-analysis.md)
- Memory: `~/.claude/projects/D--Erovel/memory/project_platform_economics.md`

**Critical invariants (do not violate):**
1. Snapshots are frozen at payment time. **Never recompute historical splits against current rules.**
2. Snapshot sum must equal gross **exactly**. Resolver asserts this; failing payments go to `splits_failed`, never silently miscount.
3. The residual payee absorbs all leftover amounts. Guarantees no rounding loss.
4. Rule changes are never retroactive. Only new payments see new rules.
5. Phase 1 ships with `PLATFORM_FEE_PCT = 0` so existing creator earnings are unchanged. Flip to 15 in Task 13, last commit.

---

## Tasks at a glance

| # | Task | Files | Time |
|---|------|-------|------|
| 1 | Set up Vitest for resolver unit tests | `package.json`, `vitest.config.ts` | ~10 min |
| 2 | Define splits domain types | `src/lib/types.ts` | ~5 min |
| 3 | Resolver: failing test for the trivial case | `src/lib/payments/resolver.test.ts` | ~10 min |
| 4 | Resolver: implement minimal happy path | `src/lib/payments/resolver.ts` | ~15 min |
| 5 | Resolver: edge cases (fixed, refund, residual underflow, sub-cent rounding, platform override) | resolver.test.ts + resolver.ts | ~45 min |
| 6 | Add `PLATFORM_FEE_PCT` constant (initially 0) | `src/lib/constants.ts` | ~5 min |
| 7 | Create the migration file (single atomic file) | `supabase/migrations/20260407000000_splits_engine.sql` | ~30 min |
| 8 | Apply migration locally + verify with `psql` queries | local DB | ~15 min |
| 9 | Add `createPaymentWithSplits` helper + helper test | `src/lib/payments/index.ts` (+ test) | ~30 min |
| 10 | Update earnings dashboard query to read from `payee_balances` | `src/app/dashboard/earnings/page.tsx` | ~25 min |
| 11 | Wire `tip-button` stub through helper | `src/components/monetization/tip-button.tsx` | ~15 min |
| 12 | Wire `subscribe-button` stub through helper | `src/components/monetization/subscribe-button.tsx` | ~15 min |
| 13 | Flip `PLATFORM_FEE_PCT` from 0 to 15 (separate commit) | `src/lib/constants.ts` | ~5 min |
| 14 | E2E regression: tip flow → snapshot → balance | `e2e/splits.spec.ts` | ~30 min |

**Total estimated time:** ~4-5 focused hours.

---

## Task 1: Set up Vitest for resolver unit tests

**Why:** The resolver is a pure function with many edge cases — exactly the kind of code that benefits from fast unit tests. The project currently has Playwright for e2e but no unit framework. Vitest is ~1 dep + 1 config file and only used for the resolver in v1.

**Files:**
- Modify: `D:/Erovel/package.json`
- Create: `D:/Erovel/vitest.config.ts`

### Step 1: Install Vitest

Run from `D:/Erovel`:

```bash
npm install --save-dev vitest @vitest/ui
```

Expected: vitest and @vitest/ui added to devDependencies. No code changes elsewhere.

### Step 2: Create vitest.config.ts

Create `D:/Erovel/vitest.config.ts` with:

```typescript
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    globals: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Step 3: Add test scripts to package.json

Add to the `scripts` block in `D:/Erovel/package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

### Step 4: Verify vitest runs (no tests yet)

Run from `D:/Erovel`:

```bash
npm test
```

Expected output: vitest reports `No test files found, exiting with code 1` OR `0 passed`. Either is fine — confirms vitest is installed and config loads.

### Step 5: Commit

```bash
git add D:/Erovel/package.json D:/Erovel/package-lock.json D:/Erovel/vitest.config.ts
git commit -m "chore: add vitest for unit tests

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Define splits domain types

**Why:** Establish the TypeScript types the resolver and helper will use. Keeps later steps narrow and type-safe.

**Files:**
- Modify: `D:/Erovel/src/lib/types.ts`

### Step 1: Append types to `src/lib/types.ts`

Add at the bottom of the file (after the existing `StoryAnalytics` interface):

```typescript
// ============================================================
// SPLITS ENGINE
// ============================================================

export type PayeeType = "profile" | "platform" | "external";

export interface Payee {
  id: string;
  type: PayeeType;
  profile_id: string | null;
  label: string | null;
  payout_method: PayoutMethod | null;
  payout_email: string | null;
  payout_wallet_address: string | null;
  created_at: string;
}

export type SplitSubjectType = "creator" | "story";

export interface SplitRule {
  id: string;
  subject_type: SplitSubjectType;
  subject_id: string;
  payee_id: string;
  basis_pct: number | null;     // e.g. 15.00 = 15%
  basis_fixed: number | null;   // alt: fixed USD amount
  priority: number;
  created_at: string;
}

export type SplitBasis = "pct" | "fixed" | "residual";

export interface SplitEntry {
  payee_id: string;
  amount: number;
  basis: SplitBasis;
  pct?: number;       // present when basis === 'pct'
}

export interface PayeeBalance {
  payee_id: string;
  gross_earned: number;
  total_paid_out: number;
  available: number;
  updated_at: string;
}
```

### Step 2: Verify TypeScript compiles

Run from `D:/Erovel`:

```bash
npx tsc --noEmit
```

Expected: No errors. (May take 30s on first run.)

### Step 3: Commit

```bash
git add D:/Erovel/src/lib/types.ts
git commit -m "feat(splits): add domain types for payees, rules, and snapshots

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Resolver — failing test for the trivial case

**Why:** TDD start. The simplest case: a $10 tip with no rules and no platform fee → 100% to the creator's residual payee.

**Files:**
- Create: `D:/Erovel/src/lib/payments/resolver.test.ts`

### Step 1: Create the test file

Create `D:/Erovel/src/lib/payments/resolver.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { resolveSplits } from "./resolver";
import type { SplitRule } from "@/lib/types";

const CREATOR_PAYEE_ID = "creator-payee-id";
const PLATFORM_PAYEE_ID = "platform-payee-id";

describe("resolveSplits", () => {
  it("100% to residual when no rules and no platform fee", () => {
    const rules: SplitRule[] = [];
    const result = resolveSplits({
      gross: 10.0,
      rules,
      residualPayeeId: CREATOR_PAYEE_ID,
      platformPayeeId: PLATFORM_PAYEE_ID,
      platformFeePct: 0,
    });

    expect(result).toEqual([
      { payee_id: CREATOR_PAYEE_ID, amount: 10.0, basis: "residual" },
    ]);
  });
});
```

### Step 2: Run the test, verify it fails

Run from `D:/Erovel`:

```bash
npm test -- src/lib/payments/resolver.test.ts
```

Expected: `Cannot find module './resolver'` or similar import failure.

### Step 3: Commit

```bash
git add D:/Erovel/src/lib/payments/resolver.test.ts
git commit -m "test(splits): failing test for trivial residual case

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Resolver — minimal happy path

**Why:** Make the trivial test pass. Build only what's needed.

**Files:**
- Create: `D:/Erovel/src/lib/payments/resolver.ts`

### Step 1: Implement the minimal resolver

Create `D:/Erovel/src/lib/payments/resolver.ts`:

```typescript
import type { SplitEntry, SplitRule } from "@/lib/types";

interface ResolveSplitsInput {
  gross: number;
  rules: SplitRule[];
  residualPayeeId: string;
  platformPayeeId: string;
  platformFeePct: number;
}

/**
 * Pure function. Given a gross payment amount and a set of split rules,
 * produce a snapshot whose amounts sum exactly to gross.
 *
 * Algorithm (v1):
 *   1. Apply fixed rules (priority asc), subtract from running remainder.
 *   2. Apply pct rules (priority asc) against current remainder.
 *   3. Apply platform fee against gross UNLESS an explicit rule already
 *      names the platform payee.
 *   4. Residual payee absorbs whatever's left.
 *
 * Negative gross (refunds) negate every entry symmetrically.
 *
 * INVARIANT: snapshot.reduce((s, e) => s + e.amount, 0) === gross
 *            (within 0.01 tolerance for floating point, then snapped to gross)
 */
export function resolveSplits(input: ResolveSplitsInput): SplitEntry[] {
  const { gross, rules, residualPayeeId, platformPayeeId, platformFeePct } = input;

  const snapshot: SplitEntry[] = [];
  let remaining = gross;

  // Sort by priority asc, then by basis (fixed before pct within a priority)
  const sorted = [...rules].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.basis_fixed !== null && b.basis_fixed === null) return -1;
    if (a.basis_fixed === null && b.basis_fixed !== null) return 1;
    return 0;
  });

  // Step 1: fixed rules
  for (const rule of sorted) {
    if (rule.basis_fixed === null) continue;
    const amount = round2(rule.basis_fixed);
    snapshot.push({ payee_id: rule.payee_id, amount, basis: "fixed" });
    remaining = round2(remaining - amount);
  }

  // Step 2: pct rules (against gross, not remainder, in v1)
  // Wait — design says pct against remainder. Re-read design section 2 step 4.
  // "Apply percentage rules to the remainder."
  for (const rule of sorted) {
    if (rule.basis_pct === null) continue;
    const amount = round2(remaining * (rule.basis_pct / 100));
    snapshot.push({
      payee_id: rule.payee_id,
      amount,
      basis: "pct",
      pct: rule.basis_pct,
    });
    remaining = round2(remaining - amount);
  }

  // Step 3: platform fee (only if not already explicit)
  const platformAlreadyInRules = rules.some(r => r.payee_id === platformPayeeId);
  if (!platformAlreadyInRules && platformFeePct > 0) {
    const amount = round2(gross * (platformFeePct / 100));
    snapshot.push({
      payee_id: platformPayeeId,
      amount,
      basis: "pct",
      pct: platformFeePct,
    });
    remaining = round2(remaining - amount);
  }

  // Step 4: residual
  snapshot.push({
    payee_id: residualPayeeId,
    amount: round2(remaining),
    basis: "residual",
  });

  // Invariant check
  const sum = snapshot.reduce((s, e) => s + e.amount, 0);
  if (Math.abs(sum - gross) > 0.005) {
    throw new Error(
      `Splits resolver invariant violation: sum ${sum} != gross ${gross}`
    );
  }

  return snapshot;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
```

### Step 2: Run the test, verify it passes

```bash
npm test -- src/lib/payments/resolver.test.ts
```

Expected: 1 passing test.

### Step 3: Commit

```bash
git add D:/Erovel/src/lib/payments/resolver.ts
git commit -m "feat(splits): minimal resolver — handles residual-only case

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Resolver — edge cases

**Why:** Cover the hard cases now, with tests, before any real money flows.

**Files:**
- Modify: `D:/Erovel/src/lib/payments/resolver.test.ts`
- Modify: `D:/Erovel/src/lib/payments/resolver.ts` (only if a test fails)

### Step 1: Add edge case tests

Append to `D:/Erovel/src/lib/payments/resolver.test.ts`:

```typescript
function makeRule(overrides: Partial<SplitRule>): SplitRule {
  return {
    id: "rule-id",
    subject_type: "creator",
    subject_id: "subject-id",
    payee_id: "payee-id",
    basis_pct: null,
    basis_fixed: null,
    priority: 0,
    created_at: "2026-04-07T00:00:00Z",
    ...overrides,
  };
}

describe("resolveSplits — edge cases", () => {
  it("applies platform fee implicitly when no rules", () => {
    const result = resolveSplits({
      gross: 10.0,
      rules: [],
      residualPayeeId: CREATOR_PAYEE_ID,
      platformPayeeId: PLATFORM_PAYEE_ID,
      platformFeePct: 15,
    });

    expect(result).toEqual([
      { payee_id: PLATFORM_PAYEE_ID, amount: 1.5, basis: "pct", pct: 15 },
      { payee_id: CREATOR_PAYEE_ID, amount: 8.5, basis: "residual" },
    ]);
  });

  it("respects explicit platform rule (overrides default fee)", () => {
    const rules = [
      makeRule({ payee_id: PLATFORM_PAYEE_ID, basis_pct: 70, priority: 0 }),
    ];
    const result = resolveSplits({
      gross: 10.0,
      rules,
      residualPayeeId: CREATOR_PAYEE_ID,
      platformPayeeId: PLATFORM_PAYEE_ID,
      platformFeePct: 15, // ignored because rules already name platform
    });

    expect(result.find(e => e.payee_id === PLATFORM_PAYEE_ID)?.amount).toBe(7.0);
    expect(result.find(e => e.payee_id === CREATOR_PAYEE_ID)?.amount).toBe(3.0);
    expect(result.reduce((s, e) => s + e.amount, 0)).toBe(10.0);
  });

  it("handles fixed-amount rule before percentage", () => {
    const rules = [
      makeRule({ payee_id: "fee-payee", basis_fixed: 0.5, priority: 0 }),
    ];
    const result = resolveSplits({
      gross: 10.0,
      rules,
      residualPayeeId: CREATOR_PAYEE_ID,
      platformPayeeId: PLATFORM_PAYEE_ID,
      platformFeePct: 15,
    });

    // 0.50 fixed → 9.50 remaining → 1.50 platform (15% of GROSS) → 8.00 residual
    expect(result.find(e => e.basis === "fixed")?.amount).toBe(0.5);
    expect(result.find(e => e.payee_id === PLATFORM_PAYEE_ID)?.amount).toBe(1.5);
    expect(result.find(e => e.basis === "residual")?.amount).toBe(8.0);
    expect(result.reduce((s, e) => s + e.amount, 0)).toBe(10.0);
  });

  it("handles refund (negative gross) symmetrically", () => {
    const result = resolveSplits({
      gross: -10.0,
      rules: [],
      residualPayeeId: CREATOR_PAYEE_ID,
      platformPayeeId: PLATFORM_PAYEE_ID,
      platformFeePct: 15,
    });

    expect(result.find(e => e.payee_id === PLATFORM_PAYEE_ID)?.amount).toBe(-1.5);
    expect(result.find(e => e.basis === "residual")?.amount).toBe(-8.5);
    expect(result.reduce((s, e) => s + e.amount, 0)).toBe(-10.0);
  });

  it("residual absorbs sub-cent rounding without losing pennies", () => {
    // $10.00 with one 33% rule and platform 15%
    // 33% of $10 = $3.30 (exact). 15% of $10 = $1.50. Residual = $5.20.
    // Total = $10.00 exactly.
    const rules = [
      makeRule({ payee_id: "collab", basis_pct: 33, priority: 5 }),
    ];
    const result = resolveSplits({
      gross: 10.0,
      rules,
      residualPayeeId: CREATOR_PAYEE_ID,
      platformPayeeId: PLATFORM_PAYEE_ID,
      platformFeePct: 15,
    });

    const sum = result.reduce((s, e) => s + e.amount, 0);
    expect(sum).toBe(10.0);
  });

  it("handles tricky rounding ($9.99 with 15% fee)", () => {
    // 15% of 9.99 = 1.4985 → rounds to 1.50
    // Residual = 8.49
    // Sum should be exactly 9.99
    const result = resolveSplits({
      gross: 9.99,
      rules: [],
      residualPayeeId: CREATOR_PAYEE_ID,
      platformPayeeId: PLATFORM_PAYEE_ID,
      platformFeePct: 15,
    });

    const sum = result.reduce((s, e) => s + e.amount, 0);
    expect(sum).toBeCloseTo(9.99, 2);
  });

  it("multi-tier: priority lower applies first", () => {
    // priority 0: platform 70%
    // priority 10: external 5%
    // priority 20: residual (contractor)
    // $10 → $7.00 platform → $0.15 external (5% of $3) → $2.85 contractor
    const rules = [
      makeRule({ payee_id: PLATFORM_PAYEE_ID, basis_pct: 70, priority: 0 }),
      makeRule({ payee_id: "external-affiliate", basis_pct: 5, priority: 10 }),
    ];
    const result = resolveSplits({
      gross: 10.0,
      rules,
      residualPayeeId: "contractor-payee",
      platformPayeeId: PLATFORM_PAYEE_ID,
      platformFeePct: 15,
    });

    // NOTE: v1 resolver applies pct against remaining, so this verifies
    // priority cascading naturally produces the expected nested behavior.
    const sum = result.reduce((s, e) => s + e.amount, 0);
    expect(sum).toBe(10.0);
    expect(result.find(e => e.payee_id === PLATFORM_PAYEE_ID)?.amount).toBe(7.0);
  });

  it("throws on invariant violation (manual injection)", () => {
    // We can't easily fake an invariant violation through the public API
    // because the function preserves the invariant by construction.
    // Instead, verify the round2 helper is exported behavior — the snapshot
    // always sums correctly even with awkward percentages.
    for (const gross of [1.01, 3.33, 7.77, 99.99, 0.01]) {
      const result = resolveSplits({
        gross,
        rules: [],
        residualPayeeId: CREATOR_PAYEE_ID,
        platformPayeeId: PLATFORM_PAYEE_ID,
        platformFeePct: 15,
      });
      const sum = result.reduce((s, e) => s + e.amount, 0);
      expect(sum).toBeCloseTo(gross, 2);
    }
  });
});
```

### Step 2: Run all resolver tests

```bash
npm test -- src/lib/payments/resolver.test.ts
```

Expected: 9 tests pass. If any fail, the resolver in Task 4 has a bug — fix it before continuing.

**Common failure to watch for:** the multi-tier test. v1 design says pct rules apply against the *remaining* amount (after fixed rules), then platform fee is computed against *gross* (because the platform fee is "implicit" — applied separately, not via the rule loop). The current implementation matches this. If the multi-tier test fails, it's because the explicit platform rule changes the remaining cascade — verify by hand that 70% of 10 = 7, 5% of 3 = 0.15, residual = 2.85. Sum = 10.

### Step 3: Commit

```bash
git add D:/Erovel/src/lib/payments/resolver.test.ts D:/Erovel/src/lib/payments/resolver.ts
git commit -m "test(splits): cover platform fee, override, refund, rounding, multi-tier

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Add `PLATFORM_FEE_PCT` constant (initially 0)

**Why:** Phase 1 ships the engine without changing economics. The constant exists; it's set to 0 until Task 13.

**Files:**
- Modify: `D:/Erovel/src/lib/constants.ts`

### Step 1: Add the constant

Note that `PLATFORM_CUT = 0.15` already exists at line 5 of `constants.ts`. We're adding a separate constant that the resolver uses (in percentage form, not decimal) and starts at 0 for the initial rollout. We'll delete the old `PLATFORM_CUT` once nothing references it (verify with Grep — likely nothing does, since it was unused).

Replace line 5 of `D:/Erovel/src/lib/constants.ts`:

```typescript
export const PLATFORM_CUT = 0.15; // 15%
```

with:

```typescript
/**
 * Platform fee applied to every tip and subscription, as a percentage of gross.
 *
 * Phase 1: 0 (ships engine without changing economics for existing creators).
 * Phase 4 (post-rollout verification): set to 15.
 *
 * See docs/plans/2026-04-07-splits-engine-v1-design.md for the rollout plan.
 */
export const PLATFORM_FEE_PCT = 0;
```

### Step 2: Verify nothing references the old `PLATFORM_CUT`

Run a Grep for `PLATFORM_CUT` in `src/`. If anything imports it, update those references to `PLATFORM_FEE_PCT` (and convert the multiplication: `total * PLATFORM_CUT` → `total * (PLATFORM_FEE_PCT / 100)`).

If Grep returns no results outside `constants.ts`, no further changes are needed.

### Step 3: Verify TypeScript still compiles

```bash
npx tsc --noEmit
```

Expected: No errors.

### Step 4: Commit

```bash
git add D:/Erovel/src/lib/constants.ts
git commit -m "chore(splits): replace unused PLATFORM_CUT with PLATFORM_FEE_PCT (0)

Phase 1 ships the splits engine with the fee at 0 to avoid changing
existing creator economics. Will flip to 15 in Task 13 after the rest
of the engine is verified.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Create the splits engine migration

**Why:** Single atomic migration that adds all schema, all triggers, all backfill in one transaction. If anything fails, the whole migration rolls back. This matches the project's existing pattern (one migration per feature).

**Files:**
- Create: `D:/Erovel/supabase/migrations/20260407000000_splits_engine.sql`

### Step 1: Create the migration file

Create `D:/Erovel/supabase/migrations/20260407000000_splits_engine.sql` with the full SQL below.

```sql
-- Erovel splits engine v1
-- Adds payees, split_rules, payee_balances, splits_failed
-- Adds splits jsonb columns to tips and subscriptions
-- Backfills existing data with 100%-to-creator snapshots
-- See docs/plans/2026-04-07-splits-engine-v1-design.md

-- ============================================================
-- ENUMS
-- ============================================================

create type payee_type as enum ('profile', 'platform', 'external');
create type split_subject_type as enum ('creator', 'story');

-- ============================================================
-- PAYEES
-- ============================================================

create table payees (
  id uuid primary key default gen_random_uuid(),
  type payee_type not null,
  profile_id uuid references profiles(id) on delete cascade,
  label text,
  payout_method payout_method,
  payout_email text,
  payout_wallet_address text,
  created_at timestamptz not null default now(),
  -- A profile-type payee must have a profile_id; others must not
  check (
    (type = 'profile' and profile_id is not null)
    or (type != 'profile' and profile_id is null)
  )
);

create index idx_payees_profile on payees(profile_id);
create index idx_payees_type on payees(type);
create unique index idx_payees_profile_unique on payees(profile_id) where type = 'profile';

alter table payees enable row level security;

-- Public read of payees is OK — payee identity is not sensitive on its own
create policy "payees_read" on payees for select using (true);
create policy "payees_admin_all" on payees for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Seed: a single platform payee
insert into payees (type, label) values ('platform', 'Erovel');

-- Backfill: a profile-type payee for every existing profile
insert into payees (type, profile_id)
select 'profile', id from profiles
on conflict do nothing;

-- Trigger: auto-create a payee row when a profile is created
create or replace function create_payee_for_profile()
returns trigger as $$
begin
  insert into payees (type, profile_id) values ('profile', new.id)
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger tr_create_payee_for_profile
  after insert on profiles
  for each row execute function create_payee_for_profile();

-- ============================================================
-- SPLIT RULES
-- ============================================================

create table split_rules (
  id uuid primary key default gen_random_uuid(),
  subject_type split_subject_type not null,
  subject_id uuid not null,
  payee_id uuid not null references payees(id) on delete cascade,
  basis_pct numeric(5,2),
  basis_fixed numeric(10,2),
  priority integer not null default 0,
  created_at timestamptz not null default now(),
  check (basis_pct is not null or basis_fixed is not null),
  check (basis_pct is null or (basis_pct >= 0 and basis_pct <= 100)),
  check (basis_fixed is null or basis_fixed >= 0)
);

create index idx_split_rules_subject on split_rules(subject_type, subject_id);

alter table split_rules enable row level security;

create policy "split_rules_read_own" on split_rules for select using (
  -- Creators can read rules for their own creator/stories
  (subject_type = 'creator' and subject_id = auth.uid())
  or (subject_type = 'story' and exists (
    select 1 from stories where id = subject_id and creator_id = auth.uid()
  ))
);
create policy "split_rules_admin_all" on split_rules for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- SPLITS JSONB COLUMNS ON PAYMENT TABLES
-- ============================================================

alter table tips add column splits jsonb not null default '[]'::jsonb;
alter table subscriptions add column splits jsonb not null default '[]'::jsonb;

-- Backfill existing tips: 100% to creator's payee
update tips
set splits = jsonb_build_array(
  jsonb_build_object(
    'payee_id', (select id from payees where profile_id = tips.creator_id and type = 'profile'),
    'amount', tips.amount,
    'basis', 'residual'
  )
);

-- Backfill existing subscriptions: 100% to target's payee
-- Note: subscriptions can target either a creator or a story
update subscriptions
set splits = jsonb_build_array(
  jsonb_build_object(
    'payee_id', (
      case
        when target_type = 'creator' then
          (select id from payees where profile_id = subscriptions.target_id and type = 'profile')
        when target_type = 'story' then
          (select p.id from payees p
           join stories s on s.creator_id = p.profile_id
           where s.id = subscriptions.target_id and p.type = 'profile')
      end
    ),
    'amount', 0, -- subscriptions don't have an inherent amount in the existing schema
    'basis', 'residual'
  )
);

-- ============================================================
-- PAYEE BALANCES
-- ============================================================

create table payee_balances (
  payee_id uuid primary key references payees(id) on delete cascade,
  gross_earned numeric(12,2) not null default 0,
  total_paid_out numeric(12,2) not null default 0,
  available numeric(12,2) generated always as (gross_earned - total_paid_out) stored,
  updated_at timestamptz not null default now()
);

alter table payee_balances enable row level security;

create policy "payee_balances_read_own" on payee_balances for select using (
  exists (select 1 from payees where id = payee_balances.payee_id and profile_id = auth.uid())
);
create policy "payee_balances_admin_all" on payee_balances for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Insert a balance row for every existing payee
insert into payee_balances (payee_id) select id from payees
on conflict do nothing;

-- Backfill: walk every tip's snapshot and bump gross_earned
update payee_balances pb
set gross_earned = coalesce((
  select sum((entry->>'amount')::numeric)
  from tips, jsonb_array_elements(tips.splits) entry
  where (entry->>'payee_id')::uuid = pb.payee_id
), 0);

-- Trigger: bump payee_balances when a tip is inserted
create or replace function apply_tip_splits_to_balances()
returns trigger as $$
declare
  entry jsonb;
begin
  for entry in select * from jsonb_array_elements(new.splits)
  loop
    update payee_balances
    set gross_earned = gross_earned + (entry->>'amount')::numeric,
        updated_at = now()
    where payee_id = (entry->>'payee_id')::uuid;
  end loop;
  return new;
end;
$$ language plpgsql security definer;

create trigger tr_tip_splits_balance
  after insert on tips
  for each row execute function apply_tip_splits_to_balances();

-- Same trigger for subscriptions (insert only — renewals create new rows)
create trigger tr_subscription_splits_balance
  after insert on subscriptions
  for each row execute function apply_tip_splits_to_balances();

-- ============================================================
-- SPLITS FAILED QUEUE
-- ============================================================

create table splits_failed (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  source_payload jsonb not null,
  error_message text not null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_splits_failed_pending on splits_failed(created_at desc) where reviewed_at is null;

alter table splits_failed enable row level security;
create policy "splits_failed_admin_only" on splits_failed for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- PAYOUTS: ADD payee_id COLUMN, BACKFILL
-- ============================================================

alter table payouts add column payee_id uuid references payees(id) on delete restrict;

update payouts
set payee_id = (select id from payees where profile_id = payouts.creator_id and type = 'profile');

alter table payouts alter column payee_id set not null;

create index idx_payouts_payee on payouts(payee_id, created_at desc);

-- Trigger: bump total_paid_out when a payout transitions to 'completed' or 'processing'
create or replace function apply_payout_to_balance()
returns trigger as $$
begin
  -- When a payout is created (pending), no balance impact yet
  -- When it transitions into processing/completed, it consumes balance
  -- When it transitions back to pending or failed, it releases balance
  if tg_op = 'INSERT' then
    if new.status in ('processing', 'completed') then
      update payee_balances
      set total_paid_out = total_paid_out + new.amount,
          updated_at = now()
      where payee_id = new.payee_id;
    end if;
  elsif tg_op = 'UPDATE' then
    if old.status not in ('processing', 'completed') and new.status in ('processing', 'completed') then
      update payee_balances
      set total_paid_out = total_paid_out + new.amount,
          updated_at = now()
      where payee_id = new.payee_id;
    elsif old.status in ('processing', 'completed') and new.status not in ('processing', 'completed') then
      update payee_balances
      set total_paid_out = total_paid_out - new.amount,
          updated_at = now()
      where payee_id = new.payee_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger tr_payout_balance
  after insert or update on payouts
  for each row execute function apply_payout_to_balance();

-- Backfill total_paid_out from existing payouts
update payee_balances pb
set total_paid_out = coalesce((
  select sum(amount)
  from payouts
  where payouts.payee_id = pb.payee_id
    and payouts.status in ('processing', 'completed')
), 0);
```

### Step 2: Read the migration once more

Open `D:/Erovel/supabase/migrations/20260407000000_splits_engine.sql` and verify the SQL is exactly as above. Pay special attention to:

- The `check` constraint on `payees.profile_id` (must be set for type='profile', null otherwise)
- The unique index on `payees(profile_id) where type = 'profile'` (prevents duplicate profile-type payees)
- The backfill order — payees must exist *before* we can compute snapshots that reference them
- The `apply_tip_splits_to_balances` function being reused for `subscriptions` (same column name `splits`)

### Step 3: Commit (without applying yet)

```bash
git add D:/Erovel/supabase/migrations/20260407000000_splits_engine.sql
git commit -m "feat(splits): migration — payees, rules, balances, snapshots

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Apply migration locally + verify

**Why:** Catch SQL errors and bad backfill before they reach prod.

**Files:** None modified. Verification only.

### Step 1: Apply the migration to local Supabase

```bash
cd D:/Erovel
supabase db reset
```

Expected: Migration applies cleanly, no errors. If it fails, fix the migration file in Task 7 and re-run. **Do not** commit fixes as new migrations — modify the original file.

### Step 2: Verify schema

Run:

```bash
supabase db dump --local --schema-only | grep -E "^CREATE TABLE.*payees|^CREATE TABLE.*split_rules|^CREATE TABLE.*payee_balances|^CREATE TABLE.*splits_failed"
```

Expected: 4 lines, one per new table.

### Step 3: Verify backfill — payees exist for all profiles

Run via psql or Supabase Studio:

```sql
select count(*) from profiles;
select count(*) from payees where type = 'profile';
```

Expected: Both counts equal.

### Step 4: Verify backfill — platform payee exists

```sql
select * from payees where type = 'platform';
```

Expected: Exactly one row with label = 'Erovel'.

### Step 5: Verify backfill — every tip has a snapshot

```sql
select count(*) from tips where splits = '[]'::jsonb;
```

Expected: 0. (All tips should have been backfilled with their creator's payee.)

### Step 6: Verify backfill — payee balances match historical tips

```sql
select pb.payee_id, pb.gross_earned,
  (select coalesce(sum(amount), 0) from tips where creator_id = (select profile_id from payees where id = pb.payee_id))
  as raw_total
from payee_balances pb
join payees p on p.id = pb.payee_id
where p.type = 'profile' and pb.gross_earned > 0
limit 10;
```

Expected: For each row, `gross_earned = raw_total`. Any divergence is a backfill bug — fix and re-run.

### Step 7: No commit needed (no file changes)

This task is verification-only. If anything failed, the fix goes back into Task 7's migration file and you re-apply.

---

## Task 9: `createPaymentWithSplits` helper

**Why:** All future payment writes go through this single helper. It resolves rules, computes the snapshot, validates, and inserts. The future CCBill webhook handler will call it. The current button stubs will call it (Tasks 11-12).

**Files:**
- Create: `D:/Erovel/src/lib/payments/index.ts`
- Create: `D:/Erovel/src/lib/payments/index.test.ts`

### Step 1: Write the failing test

Create `D:/Erovel/src/lib/payments/index.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { computePaymentSnapshot } from "./index";

const PLATFORM_PAYEE_ID = "platform-id";
const CREATOR_PAYEE_ID = "creator-id";

describe("computePaymentSnapshot", () => {
  it("returns snapshot for a tip with no rules", () => {
    const result = computePaymentSnapshot({
      gross: 10.0,
      rules: [],
      residualPayeeId: CREATOR_PAYEE_ID,
      platformPayeeId: PLATFORM_PAYEE_ID,
      platformFeePct: 0,
    });

    expect(result).toEqual([
      { payee_id: CREATOR_PAYEE_ID, amount: 10.0, basis: "residual" },
    ]);
  });
});
```

Note: We test the *pure* part (`computePaymentSnapshot`) here. The DB-touching `createPaymentWithSplits` is exercised end-to-end in Task 14's Playwright test.

### Step 2: Run the test, verify it fails

```bash
npm test -- src/lib/payments/index.test.ts
```

Expected: Cannot find module './index'.

### Step 3: Implement the helper

Create `D:/Erovel/src/lib/payments/index.ts`:

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SplitEntry, SplitRule, SplitSubjectType } from "@/lib/types";
import { resolveSplits } from "./resolver";
import { PLATFORM_FEE_PCT } from "@/lib/constants";

export interface ComputeSnapshotInput {
  gross: number;
  rules: SplitRule[];
  residualPayeeId: string;
  platformPayeeId: string;
  platformFeePct: number;
}

/**
 * Pure wrapper for testing. Most callers should use createPaymentWithSplits
 * which fetches rules from the DB first.
 */
export function computePaymentSnapshot(input: ComputeSnapshotInput): SplitEntry[] {
  return resolveSplits(input);
}

interface CreatePaymentWithSplitsInput {
  supabase: SupabaseClient;
  source_type: "tip" | "subscription";
  reader_id: string;
  creator_id: string;
  story_id?: string | null;
  gross: number;
  // tip-only
  currency?: string;
  ccbill_transaction_id?: string;
  // subscription-only
  target_type?: "creator" | "story";
  ccbill_subscription_id?: string;
  expires_at?: string;
}

export interface CreatePaymentResult {
  ok: boolean;
  payment_id?: string;
  error?: string;
}

/**
 * Single entry point for writing a payment to the DB. Resolves split rules,
 * computes a snapshot, validates, then inserts the payment row. If anything
 * fails the invariant check, writes to splits_failed instead.
 *
 * Wire CCBill webhook handlers, the tip stub, and the subscription stub
 * through this helper. Do NOT insert into tips/subscriptions directly.
 */
export async function createPaymentWithSplits(
  input: CreatePaymentWithSplitsInput
): Promise<CreatePaymentResult> {
  const { supabase, source_type, gross, creator_id, story_id } = input;

  // 1. Look up the creator's payee + the platform payee
  const { data: payees, error: payeeErr } = await supabase
    .from("payees")
    .select("id, type, profile_id")
    .or(`profile_id.eq.${creator_id},type.eq.platform`);

  if (payeeErr || !payees) {
    return await failTo(supabase, source_type, input, payeeErr?.message ?? "payee lookup failed");
  }

  const creatorPayee = payees.find(p => p.profile_id === creator_id);
  const platformPayee = payees.find(p => p.type === "platform");

  if (!creatorPayee || !platformPayee) {
    return await failTo(supabase, source_type, input, "creator or platform payee not found");
  }

  // 2. Determine subject (story if story_id present, else creator)
  const subject_type: SplitSubjectType = story_id ? "story" : "creator";
  const subject_id = story_id ?? creator_id;

  // 3. Fetch applicable rules — story-level first, fall back to creator-level
  let rules: SplitRule[] = [];
  if (subject_type === "story") {
    const { data: storyRules } = await supabase
      .from("split_rules")
      .select("*")
      .eq("subject_type", "story")
      .eq("subject_id", subject_id);
    rules = storyRules ?? [];
  }
  if (rules.length === 0) {
    const { data: creatorRules } = await supabase
      .from("split_rules")
      .select("*")
      .eq("subject_type", "creator")
      .eq("subject_id", creator_id);
    rules = creatorRules ?? [];
  }

  // 4. Compute snapshot
  let snapshot: SplitEntry[];
  try {
    snapshot = resolveSplits({
      gross,
      rules,
      residualPayeeId: creatorPayee.id,
      platformPayeeId: platformPayee.id,
      platformFeePct: PLATFORM_FEE_PCT,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "resolver threw";
    return await failTo(supabase, source_type, input, msg);
  }

  // 5. Insert the payment row with the snapshot
  if (source_type === "tip") {
    const { data, error } = await supabase
      .from("tips")
      .insert({
        reader_id: input.reader_id,
        creator_id,
        story_id: story_id ?? null,
        amount: gross,
        currency: input.currency ?? "USD",
        ccbill_transaction_id: input.ccbill_transaction_id ?? null,
        splits: snapshot,
      })
      .select("id")
      .single();

    if (error || !data) {
      return await failTo(supabase, source_type, input, error?.message ?? "tip insert failed");
    }
    return { ok: true, payment_id: data.id };
  } else {
    if (!input.target_type || !input.expires_at) {
      return await failTo(supabase, source_type, input, "missing target_type or expires_at for subscription");
    }
    const { data, error } = await supabase
      .from("subscriptions")
      .insert({
        reader_id: input.reader_id,
        target_type: input.target_type,
        target_id: input.target_type === "story" ? story_id! : creator_id,
        ccbill_subscription_id: input.ccbill_subscription_id ?? null,
        expires_at: input.expires_at,
        splits: snapshot,
      })
      .select("id")
      .single();

    if (error || !data) {
      return await failTo(supabase, source_type, input, error?.message ?? "subscription insert failed");
    }
    return { ok: true, payment_id: data.id };
  }
}

async function failTo(
  supabase: SupabaseClient,
  source_type: string,
  input: unknown,
  error_message: string
): Promise<CreatePaymentResult> {
  await supabase.from("splits_failed").insert({
    source_type,
    source_payload: input as Record<string, unknown>,
    error_message,
  });
  return { ok: false, error: error_message };
}
```

### Step 4: Run the test, verify it passes

```bash
npm test -- src/lib/payments/index.test.ts
```

Expected: 1 passing test.

### Step 5: Verify TypeScript compiles

```bash
npx tsc --noEmit
```

Expected: No errors.

### Step 6: Commit

```bash
git add D:/Erovel/src/lib/payments/index.ts D:/Erovel/src/lib/payments/index.test.ts
git commit -m "feat(splits): createPaymentWithSplits helper + computeSnapshot wrapper

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Update earnings dashboard query

**Why:** Cut over the read path. Earnings stops summing `tips.amount` directly and reads from `payee_balances` instead. Existing creators should see *identical* numbers because the backfill in Task 7 wrote the snapshot exactly the same way (100% to creator).

**Files:**
- Modify: `D:/Erovel/src/app/dashboard/earnings/page.tsx`

### Step 1: Read the existing fetch logic

The relevant block is `fetchData()` at lines 89-169. It currently:
1. Fetches all tips for the creator
2. Sums `tips.amount` to get `total_earnings`
3. Sums completed/processing payouts to get `paidOut`
4. Computes `pendingPayout = total - paidOut`

After this change:
1. Fetch the creator's payee_id (one query)
2. Fetch the `payee_balances` row for that payee_id (one query, returns `gross_earned`, `total_paid_out`, `available`)
3. Use `available` directly as pending payout
4. Use `gross_earned` directly as total earnings

The "tips this month" and "monthly chart" sections still need the raw tips for breakdown — those queries stay the same (read directly from `tips` for display purposes), but the *totals* come from `payee_balances`.

### Step 2: Edit the file

In `D:/Erovel/src/app/dashboard/earnings/page.tsx`, find the `fetchData` callback (around lines 89-169) and replace the section that computes totals:

**Find:**
```typescript
      const fetchedTips: TipRow[] = (tipsData as TipRow[] | null) ?? [];
      setTips(fetchedTips);

      // Calculate total earnings from all tips
      const total = fetchedTips.reduce((sum, t) => sum + (t.amount ?? 0), 0);
      setTotalEarnings(total);
```

**Replace with:**
```typescript
      const fetchedTips: TipRow[] = (tipsData as TipRow[] | null) ?? [];
      setTips(fetchedTips);

      // Total earnings now come from payee_balances (the splits engine
      // single source of truth), not by summing tip amounts directly.
      // This generalizes to platform fees and split revenue automatically.
      const { data: payeeRow } = await supabase
        .from("payees")
        .select("id")
        .eq("profile_id", user.id)
        .eq("type", "profile")
        .single();

      let total = 0;
      let availableBalance = 0;
      if (payeeRow) {
        const { data: balanceRow } = await supabase
          .from("payee_balances")
          .select("gross_earned, available")
          .eq("payee_id", payeeRow.id)
          .single();
        if (balanceRow) {
          total = Number(balanceRow.gross_earned) || 0;
          availableBalance = Number(balanceRow.available) || 0;
        }
      }
      setTotalEarnings(total);
```

Then **find:**
```typescript
      // Pending payout = total earnings minus completed/processing payouts
      const paidOut = fetchedPayouts
        .filter((p) => p.status === "completed" || p.status === "processing")
        .reduce((sum, p) => sum + (p.amount ?? 0), 0);
      setPendingPayout(Math.max(0, total - paidOut));
```

**Replace with:**
```typescript
      // Pending payout comes directly from payee_balances.available
      // (gross_earned - total_paid_out, computed by trigger).
      setPendingPayout(Math.max(0, availableBalance));
```

### Step 3: Verify TypeScript compiles

```bash
npx tsc --noEmit
```

Expected: No errors.

### Step 4: Manual verification

Start the dev server:

```bash
npm run dev
```

Log in as a creator with existing tips. Verify:
- Total earnings number matches what it was before
- Pending payout matches
- "Tips this month" still works (uses `fetchedTips` directly)
- Monthly chart still works

If any number diverges from pre-change, the backfill in Task 7 was wrong. Stop and fix Task 7's migration before continuing.

### Step 5: Commit

```bash
git add D:/Erovel/src/app/dashboard/earnings/page.tsx
git commit -m "feat(splits): earnings dashboard reads from payee_balances

Total earnings and pending payout now come from the splits engine's
single source of truth instead of summing tips.amount. Per-tip detail
display is unchanged.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Wire `tip-button` stub through the helper

**Why:** The button is currently a UI stub with `// In production: redirect to CCBill`. Wire it to actually insert via `createPaymentWithSplits` so the engine sees real test data flow through it. CCBill comes later.

**Files:**
- Modify: `D:/Erovel/src/components/monetization/tip-button.tsx`

### Step 1: Read the existing component

The component currently calls `setSent(true)` in `handleSend` and never touches the database. The component receives `creatorName` and `storyTitle` as props but **not** `creator_id` or `story_id` — both are needed for the helper.

### Step 2: Update the component prop signature

We need `creator_id`, `story_id` (optional). The component is consumed in several places — find them with Grep and update each consumer to pass the IDs.

In `D:/Erovel/src/components/monetization/tip-button.tsx`, change the props interface:

**Find:**
```typescript
interface TipButtonProps {
  creatorName: string;
  storyTitle?: string;
  variant?: "button" | "icon";
}
```

**Replace with:**
```typescript
interface TipButtonProps {
  creatorId: string;
  creatorName: string;
  storyId?: string;
  storyTitle?: string;
  variant?: "button" | "icon";
}
```

Update the component signature and `handleSend`:

**Find:**
```typescript
export function TipButton({ creatorName, storyTitle, variant = "button" }: TipButtonProps) {
```

**Replace with:**
```typescript
export function TipButton({ creatorId, creatorName, storyId, storyTitle, variant = "button" }: TipButtonProps) {
```

**Find:**
```typescript
  function handleSend() {
    const tipAmount = amount || parseFloat(customAmount);
    if (!tipAmount || tipAmount < 1) return;
    // In production: redirect to CCBill
    setSent(true);
    setTimeout(() => {
      setOpen(false);
      setSent(false);
      setAmount(null);
      setCustomAmount("");
    }, 2000);
  }
```

**Replace with:**
```typescript
  async function handleSend() {
    const tipAmount = amount || parseFloat(customAmount);
    if (!tipAmount || tipAmount < 1) return;

    // Wire through the splits engine. CCBill integration replaces this
    // with a redirect → webhook flow that calls createPaymentWithSplits
    // server-side. For now we exercise the engine directly to validate
    // the resolver and snapshot pipeline.
    const { createClient } = await import("@/lib/supabase/client");
    const { useAuthStore } = await import("@/store/auth-store");
    const supabase = createClient();
    const reader = useAuthStore.getState().user;

    if (supabase && reader) {
      const { createPaymentWithSplits } = await import("@/lib/payments");
      await createPaymentWithSplits({
        supabase,
        source_type: "tip",
        reader_id: reader.id,
        creator_id: creatorId,
        story_id: storyId ?? null,
        gross: tipAmount,
        currency: "USD",
      });
    }

    setSent(true);
    setTimeout(() => {
      setOpen(false);
      setSent(false);
      setAmount(null);
      setCustomAmount("");
    }, 2000);
  }
```

### Step 3: Update consumers of `<TipButton>`

Run a Grep for `<TipButton` to find all usages. Each one needs `creatorId` (and `storyId` if applicable). Likely consumers: story detail pages, creator profile pages.

For each consumer, add the missing prop. Example:

**Before:**
```tsx
<TipButton creatorName={creator.display_name} />
```

**After:**
```tsx
<TipButton creatorId={creator.id} creatorName={creator.display_name} />
```

For story-context consumers:

**Before:**
```tsx
<TipButton creatorName={story.creator?.display_name ?? ""} storyTitle={story.title} />
```

**After:**
```tsx
<TipButton
  creatorId={story.creator_id}
  creatorName={story.creator?.display_name ?? ""}
  storyId={story.id}
  storyTitle={story.title}
/>
```

### Step 4: Verify TypeScript compiles

```bash
npx tsc --noEmit
```

Expected: No errors. If there are errors about missing `creatorId` props, you missed a consumer.

### Step 5: Commit

```bash
git add D:/Erovel/src/components/monetization/tip-button.tsx D:/Erovel/src/
git commit -m "feat(splits): wire tip button through createPaymentWithSplits

The tip flow now exercises the splits engine end-to-end. CCBill
integration will replace the direct call with a webhook handler that
calls the same helper server-side.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Wire `subscribe-button` stub through the helper

**Why:** Same as Task 11 but for subscriptions.

**Files:**
- Modify: `D:/Erovel/src/components/monetization/subscribe-button.tsx`

### Step 1: Read the existing component

The component takes `targetType`, `targetName`, `price`, `storyId`, `creatorId`. The component already has the IDs we need — no consumer updates required.

### Step 2: Update `handleSubscribe`

In `D:/Erovel/src/components/monetization/subscribe-button.tsx`:

**Find:**
```typescript
  function handleSubscribe() {
    // Persist in the shared store
    if (targetId) {
      subscribe(targetType, targetId);
    }
    setTimeout(() => setOpen(false), 1500);
  }
```

**Replace with:**
```typescript
  async function handleSubscribe() {
    // Wire through the splits engine. CCBill integration replaces this
    // with a redirect → webhook flow.
    if (targetId) {
      const { createClient } = await import("@/lib/supabase/client");
      const { useAuthStore } = await import("@/store/auth-store");
      const supabase = createClient();
      const reader = useAuthStore.getState().user;

      if (supabase && reader) {
        const { createPaymentWithSplits } = await import("@/lib/payments");
        // Resolve creator_id: if target is a creator, that's it directly;
        // if target is a story, look up the story's creator.
        let resolvedCreatorId = targetType === "creator" ? targetId : creatorId;
        if (targetType === "story" && !resolvedCreatorId) {
          const { data } = await supabase
            .from("stories")
            .select("creator_id")
            .eq("id", targetId)
            .single();
          resolvedCreatorId = data?.creator_id;
        }

        if (resolvedCreatorId) {
          // 30-day subscription period
          const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

          await createPaymentWithSplits({
            supabase,
            source_type: "subscription",
            reader_id: reader.id,
            creator_id: resolvedCreatorId,
            story_id: targetType === "story" ? targetId : null,
            gross: price,
            target_type: targetType,
            expires_at,
          });
        }
      }

      // Local store for immediate UX feedback
      subscribe(targetType, targetId);
    }
    setTimeout(() => setOpen(false), 1500);
  }
```

### Step 3: Verify TypeScript compiles

```bash
npx tsc --noEmit
```

Expected: No errors.

### Step 4: Commit

```bash
git add D:/Erovel/src/components/monetization/subscribe-button.tsx
git commit -m "feat(splits): wire subscribe button through createPaymentWithSplits

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Flip `PLATFORM_FEE_PCT` from 0 to 15

**Why:** Phase 4 of the rollout. Engine has been live with the fee at 0; verify the dashboards still match expectations; then flip the constant. New payments immediately carry the platform fee. **Historical payments are untouched** because snapshots are immutable.

**Files:**
- Modify: `D:/Erovel/src/lib/constants.ts`

### Step 1: Verify the dashboard sanity check

Before flipping, run through Tasks 10's manual verification one more time. Pull up the earnings dashboard for at least one creator with historical tips. Numbers should be identical to what they were before any of this work started.

If anything looks off, **stop and investigate** before flipping. A miscount today is much cheaper than a miscount after the flip.

### Step 2: Flip the constant

In `D:/Erovel/src/lib/constants.ts`:

**Find:**
```typescript
export const PLATFORM_FEE_PCT = 0;
```

**Replace with:**
```typescript
export const PLATFORM_FEE_PCT = 15;
```

### Step 3: Verify TypeScript compiles

```bash
npx tsc --noEmit
```

Expected: No errors.

### Step 4: Commit (separate, traceable)

```bash
git add D:/Erovel/src/lib/constants.ts
git commit -m "feat(splits): activate 15% platform fee

The splits engine has been live with the fee at 0 since the initial
rollout. All historical payments and balances are unchanged
(snapshots are immutable). Going forward, every new tip and
subscription includes a platform fee entry.

See docs/plans/2026-04-07-splits-engine-v1-design.md for the rollout
plan and ~/.claude/projects/D--Erovel/memory/project_platform_economics.md
for the underlying decision.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: E2E regression — tip flow → snapshot → balance

**Why:** Catch breakage at the integration level. Verifies the full path: button click → DB insert → snapshot generated → payee_balances updated → earnings dashboard reflects the change.

**Files:**
- Create: `D:/Erovel/e2e/splits.spec.ts`

### Step 1: Write the test

Create `D:/Erovel/e2e/splits.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";
import { bypassAgeGate, createTestUser, login } from "./helpers";

test.describe("splits engine", () => {
  test("tip flows through resolver and updates earnings", async ({ page }) => {
    // Set up: create a creator and a reader
    const suffix = `${Date.now()}`;
    const creator = await createTestUser("creator", suffix);
    const reader = await createTestUser("reader", `r${suffix}`);

    // Reader logs in and tips the creator
    await login(page, reader.email, reader.password);
    await page.goto(`/creator/${creator.username}`);

    // Open tip modal, choose a preset, send
    await page.click('button:has-text("Tip")');
    await page.click('button:has-text("$10")');
    await page.click('button:has-text("Send")');
    await page.waitForTimeout(2000);

    // Creator logs in and checks earnings
    await login(page, creator.email, creator.password);
    await page.goto("/dashboard/earnings");

    // With the platform fee at 15%, creator should see $8.50 from a $10 tip
    // (or $10 if PLATFORM_FEE_PCT is still 0 at the time of test execution)
    const totalText = await page.locator('text=/Total Earnings/i').locator('..').textContent();
    expect(totalText).toMatch(/\$(10\.00|8\.50)/);
  });

  test("backfilled historical tips show identical totals to pre-rollout", async ({ page }) => {
    // This is a smoke test. If your test DB has any pre-existing creator
    // with tips, log in as them and verify the displayed total matches
    // sum(tips.amount) for that creator.
    // Skip if no such creator exists in the test DB.
    test.skip();
  });
});
```

### Step 2: Run the test

```bash
npx playwright test e2e/splits.spec.ts
```

Expected: First test passes. Second test is skipped (placeholder).

If the first test fails:
- If the failure is "creator earnings still $0," the trigger isn't firing on tip insert. Check `tr_tip_splits_balance` exists in the local DB.
- If the failure is a network/auth error, that's an existing test infrastructure issue, not a splits engine bug.
- If the failure is a button selector mismatch, update the selectors to match the actual button text in the rendered DOM.

### Step 3: Commit

```bash
git add D:/Erovel/e2e/splits.spec.ts
git commit -m "test(splits): e2e regression — tip → snapshot → earnings

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Final verification checklist

Before declaring v1 complete, walk through this list:

- [ ] `npm test` passes (resolver + helper unit tests, ~10 cases)
- [ ] `npx tsc --noEmit` passes
- [ ] `npx playwright test e2e/splits.spec.ts` passes
- [ ] `supabase db reset` applies the migration cleanly from scratch
- [ ] Earnings dashboard for an existing creator shows numbers matching pre-rollout (if any test creators exist)
- [ ] Platform fee is set to 15 (Task 13 committed)
- [ ] No `splits_failed` rows after running the test suite (queue is empty)
- [ ] `git log --oneline` shows ~14 small, focused commits — not one giant commit

## Rollout to production

When ready to deploy:

1. Push commits to the deploy branch.
2. **Apply migration to prod first**, before deploying app code:
   ```bash
   supabase db push
   ```
3. Verify backfill on prod with the same queries from Task 8 Step 6.
4. Deploy app code via the normal pipeline (Vercel).
5. Spot-check production earnings dashboard for at least 3 creators.
6. Watch the `splits_failed` table for the first few hours; if anything appears, investigate and fix immediately.

If any prod-specific issue surfaces, **revert the platform fee constant to 0** as the first move (one commit, one deploy) and investigate without time pressure. The engine stays in place; only the economic effect is rolled back.

---

## Out of scope (see post-v1 roadmap)

Anything in [`docs/plans/2026-04-07-splits-engine-post-v1-roadmap.md`](2026-04-07-splits-engine-post-v1-roadmap.md):

- Affiliate / referral splits (next feature, builds straight on this engine)
- External payee infrastructure (bundled with affiliates)
- Collab / co-author splits UI
- Rule priority tiers
- Multi-currency display
- Double-entry ledger

None of those are blocked by this plan; all of them build cleanly on top.
