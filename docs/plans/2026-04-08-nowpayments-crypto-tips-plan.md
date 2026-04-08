# NowPayments Crypto Tips Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add crypto-tips support to Erovel as a payment-rails hedge against single-processor risk on CCBill. Customers tipping can choose "Pay with crypto" → get redirected to NowPayments hosted checkout → pay in any supported coin → funds settle to Rob's NOW Wallet (USDC on Polygon) → Erovel records the tip via the splits engine.

**Architecture:** Hosted-invoice flow (not embedded). Server-side `lib/nowpayments` client wraps the API. Frontend tip button gets a "Pay with crypto" option that calls a server route, which creates a NowPayments invoice and returns the `invoice_url`. User is redirected. Payment confirmation arrives via IPN webhook, which verifies the HMAC signature, looks up the pending payment by `order_id`, and calls `createPaymentWithSplits` on `payment_status = 'finished'`. All money flows through the splits engine — crypto tips are indistinguishable from CCBill tips at the recording layer.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Supabase, Vitest (added by splits engine plan), Node `crypto` for HMAC verification, NowPayments API v1.

**Prerequisites:**
- **Splits engine v1 must ship first** (`docs/plans/2026-04-07-splits-engine-v1-plan.md`). This plan calls `createPaymentWithSplits` which doesn't exist until that plan ships.
- NowPayments account with API key and IPN secret generated (Rob has these as of 2026-04-08).
- Production NOW Wallet configured with USDC (Polygon) as the payout asset.

**Reference docs:**
- API spec source: NowPayments Postman docs (extracted 2026-04-08)
- Splits engine: `docs/plans/2026-04-07-splits-engine-v1-design.md`
- Memory: `~/.claude/projects/D--Erovel/memory/project_legal_compliance_posture.md`

**Critical invariants (do not violate):**
1. **Verify the HMAC signature on every IPN**, with no exceptions, before trusting any payload. This is the only thing standing between Erovel and a forged-payment attack.
2. **Idempotency on `payment_id`** — NowPayments retries IPNs on error. Receiving the same `payment_id` twice must result in zero double-credits.
3. **Only credit on `payment_status = 'finished'`**. Every other status updates the pending row but does not create a tip. Unknown statuses are logged and ignored, never trusted.
4. **`parent_payment_id` indicates a repeated deposit** — these are NOT auto-credited. Per NowPayments' own recommendation, repeated deposits require manual review because they may underpay.
5. **Crypto tips flow through the splits engine** identically to CCBill tips. The only difference is the `currency` field on the resulting `tips` row.
6. **Never log secrets** (API key, IPN secret) to console, errors, or analytics. Strip them from all log statements.

---

## Tasks at a glance

| # | Task | Files | Time |
|---|------|-------|------|
| 1 | Add NowPayments env vars + `.env.local` setup | `.env.local`, `.env.example` | ~10 min |
| 2 | TypeScript types for the NowPayments API | `src/lib/nowpayments/types.ts` | ~10 min |
| 3 | HMAC signature verification (TDD, security-critical) | `src/lib/nowpayments/verify.ts` (+ test) | ~45 min |
| 4 | NowPayments API client (create invoice) | `src/lib/nowpayments/client.ts` | ~30 min |
| 5 | Migration: `pending_crypto_payments` table | `supabase/migrations/...` | ~15 min |
| 6 | Apply migration locally + verify | local DB | ~5 min |
| 7 | POST `/api/payments/nowpayments/create-invoice` route | `src/app/api/payments/nowpayments/create-invoice/route.ts` | ~30 min |
| 8 | POST `/api/payments/nowpayments/ipn` route (webhook handler) | `src/app/api/payments/nowpayments/ipn/route.ts` | ~45 min |
| 9 | Add "Pay with crypto" option to tip button | `src/components/monetization/tip-button.tsx` | ~30 min |
| 10 | Payment success + cancel landing pages | `src/app/payments/success/page.tsx`, `src/app/payments/cancel/page.tsx` | ~20 min |
| 11 | Configure NowPayments dashboard IPN URL | dashboard | ~5 min |
| 12 | End-to-end test with a real $1 payment | manual | ~15 min |

**Total estimated time:** ~4-5 focused hours.

---

## Task 1: Environment variables

**Why:** Credentials live in env vars only — never hardcoded, never committed, never logged.

**Files:**
- Modify: `D:/Erovel/.env.local` (gitignored — verify before saving)
- Modify: `D:/Erovel/.env.example` (committed — only contains placeholder values)

### Step 1: Verify `.env.local` is gitignored

Run:

```bash
grep -E "^\.env" D:/Erovel/.gitignore
```

Expected: At least `.env*` or `.env.local` listed. If not, add `.env*.local` to `.gitignore` immediately and commit that change before proceeding.

### Step 2: Add credentials to `.env.local`

Add these lines to `D:/Erovel/.env.local`:

```bash
# NowPayments crypto payment processor
NOWPAYMENTS_API_KEY=<paste_your_rotated_api_key_here>
NOWPAYMENTS_IPN_SECRET=<paste_your_ipn_secret_here>
NOWPAYMENTS_API_BASE_URL=https://api.nowpayments.io/v1
NOWPAYMENTS_IPN_CALLBACK_URL=https://erovel.com/api/payments/nowpayments/ipn
```

Use the **rotated** API key (the one you generated after the chat-leak incident). For local development, the IPN URL should be your tunnel URL (e.g. `https://your-ngrok-url.ngrok.io/api/payments/nowpayments/ipn`) — see Task 11 for production setup.

### Step 3: Add placeholder values to `.env.example`

In `D:/Erovel/.env.example`, add:

```bash
# NowPayments crypto payment processor
NOWPAYMENTS_API_KEY=
NOWPAYMENTS_IPN_SECRET=
NOWPAYMENTS_API_BASE_URL=https://api.nowpayments.io/v1
NOWPAYMENTS_IPN_CALLBACK_URL=
```

### Step 4: Commit the example file (NOT `.env.local`)

```bash
git add D:/Erovel/.env.example
git diff --cached D:/Erovel/.env.example   # Verify no secrets leaked
git commit -m "chore(crypto): add NowPayments env var placeholders to .env.example

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

**Critical:** Run `git status` after the commit and verify `.env.local` is shown as untracked, NOT staged. If `.env.local` was somehow added, `git rm --cached .env.local` immediately, fix `.gitignore`, and re-commit.

---

## Task 2: TypeScript types for NowPayments

**Why:** Establishes the contract for the API and IPN payloads. Keeps the rest of the integration narrow and type-safe.

**Files:**
- Create: `D:/Erovel/src/lib/nowpayments/types.ts`

### Step 1: Create the types file

Create `D:/Erovel/src/lib/nowpayments/types.ts`:

```typescript
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
```

### Step 2: Verify TypeScript compiles

```bash
npx tsc --noEmit
```

Expected: No errors.

### Step 3: Commit

```bash
git add D:/Erovel/src/lib/nowpayments/types.ts
git commit -m "feat(nowpayments): add TypeScript types for API and IPN

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: HMAC signature verification (TDD, security-critical)

**Why:** This single function is the only thing standing between Erovel and a forged-payment attack. If verification is wrong, anyone can POST a fake "finished" payment to the IPN endpoint and steal credit. **Build it test-first with extensive coverage.** No shortcuts here.

**Files:**
- Create: `D:/Erovel/src/lib/nowpayments/verify.test.ts`
- Create: `D:/Erovel/src/lib/nowpayments/verify.ts`

### Step 1: Write the failing test for the basic valid case

Create `D:/Erovel/src/lib/nowpayments/verify.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { verifyIpnSignature, sortObjectKeys } from "./verify";

const TEST_SECRET = "test-secret-key";

function signPayload(payload: Record<string, unknown>, secret: string): string {
  const sorted = sortObjectKeys(payload);
  const hmac = crypto.createHmac("sha512", secret);
  hmac.update(JSON.stringify(sorted));
  return hmac.digest("hex");
}

describe("verifyIpnSignature", () => {
  it("returns true for a correctly signed payload", () => {
    const payload = { payment_id: 123, payment_status: "finished" };
    const signature = signPayload(payload, TEST_SECRET);

    const result = verifyIpnSignature({
      rawBody: JSON.stringify(payload),
      signature,
      secret: TEST_SECRET,
    });

    expect(result).toBe(true);
  });
});
```

### Step 2: Run the test, verify it fails

```bash
npm test -- src/lib/nowpayments/verify.test.ts
```

Expected: Cannot find module './verify'.

### Step 3: Implement the minimal verifier

Create `D:/Erovel/src/lib/nowpayments/verify.ts`:

```typescript
import crypto from "node:crypto";

interface VerifyInput {
  /** The exact raw request body bytes received from NowPayments */
  rawBody: string;
  /** The value of the x-nowpayments-sig header */
  signature: string;
  /** Your NOWPAYMENTS_IPN_SECRET */
  secret: string;
}

/**
 * Recursively sort object keys alphabetically.
 * NowPayments signs the JSON-stringified version of this sorted object.
 */
export function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);

  return Object.keys(obj as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((result, key) => {
      result[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
      return result;
    }, {});
}

/**
 * Verify the HMAC-SHA512 signature on a NowPayments IPN webhook.
 *
 * Algorithm (from NowPayments docs):
 * 1. Parse rawBody as JSON
 * 2. Recursively sort all object keys alphabetically
 * 3. JSON.stringify the sorted object
 * 4. HMAC-SHA512(stringified_sorted_object, secret) -> hex
 * 5. Compare against the x-nowpayments-sig header (timing-safe)
 *
 * Returns true if signature matches, false otherwise.
 * Returns false on any parse error (never throws — failed verification
 * should never crash the webhook handler).
 */
export function verifyIpnSignature(input: VerifyInput): boolean {
  const { rawBody, signature, secret } = input;

  if (!signature || !secret || !rawBody) return false;

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return false;
  }

  const sorted = sortObjectKeys(parsed);
  const message = JSON.stringify(sorted);

  const hmac = crypto.createHmac("sha512", secret);
  hmac.update(message);
  const expectedSignature = hmac.digest("hex");

  // Timing-safe comparison
  const expectedBuf = Buffer.from(expectedSignature, "hex");
  const receivedBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}
```

### Step 4: Run the test, verify it passes

```bash
npm test -- src/lib/nowpayments/verify.test.ts
```

Expected: 1 passing test.

### Step 5: Add the full edge-case test suite

Append to `D:/Erovel/src/lib/nowpayments/verify.test.ts`:

```typescript
describe("verifyIpnSignature — edge cases", () => {
  it("returns false when signature is wrong", () => {
    const payload = { payment_id: 123 };
    const signature = "0".repeat(128); // 128 hex chars = 64 bytes = right length but wrong value

    expect(
      verifyIpnSignature({
        rawBody: JSON.stringify(payload),
        signature,
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });

  it("returns false when signature is empty", () => {
    expect(
      verifyIpnSignature({
        rawBody: JSON.stringify({ a: 1 }),
        signature: "",
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });

  it("returns false when secret is empty", () => {
    expect(
      verifyIpnSignature({
        rawBody: JSON.stringify({ a: 1 }),
        signature: "abc",
        secret: "",
      })
    ).toBe(false);
  });

  it("returns false when rawBody is empty", () => {
    expect(
      verifyIpnSignature({
        rawBody: "",
        signature: "abc",
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });

  it("returns false when rawBody is not valid JSON (does not throw)", () => {
    expect(
      verifyIpnSignature({
        rawBody: "{not json}",
        signature: "abc",
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });

  it("returns false when body has been tampered with after signing", () => {
    const original = { payment_id: 123, payment_status: "finished" };
    const tampered = { payment_id: 123, payment_status: "waiting" };
    const signature = signPayload(original, TEST_SECRET);

    expect(
      verifyIpnSignature({
        rawBody: JSON.stringify(tampered),
        signature,
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });

  it("verifies regardless of original key order in body", () => {
    // Two equivalent JSON bodies with different key orders should both verify
    // against the same signature, because signing uses sorted keys.
    const sortedSig = signPayload(
      { a: 1, b: 2, c: 3 },
      TEST_SECRET
    );
    const reorderedBody = JSON.stringify({ c: 3, a: 1, b: 2 });

    expect(
      verifyIpnSignature({
        rawBody: reorderedBody,
        signature: sortedSig,
        secret: TEST_SECRET,
      })
    ).toBe(true);
  });

  it("handles nested objects (recursive sorting)", () => {
    const payload = {
      payment_id: 123,
      fee: { withdrawalFee: 0, depositFee: 0.5, serviceFee: 0, currency: "btc" },
    };
    const signature = signPayload(payload, TEST_SECRET);

    // Send with the inner object in a different key order
    const reorderedBody = JSON.stringify({
      fee: { currency: "btc", depositFee: 0.5, serviceFee: 0, withdrawalFee: 0 },
      payment_id: 123,
    });

    expect(
      verifyIpnSignature({
        rawBody: reorderedBody,
        signature,
        secret: TEST_SECRET,
      })
    ).toBe(true);
  });

  it("handles null values correctly", () => {
    const payload = {
      payment_id: 123,
      order_id: null,
      payin_extra_id: null,
    };
    const signature = signPayload(payload, TEST_SECRET);

    expect(
      verifyIpnSignature({
        rawBody: JSON.stringify(payload),
        signature,
        secret: TEST_SECRET,
      })
    ).toBe(true);
  });

  it("verifies a realistic NowPayments payload", () => {
    // Sample taken directly from the NowPayments docs
    const payload = {
      payment_id: 123456789,
      parent_payment_id: 987654321,
      invoice_id: null,
      payment_status: "finished",
      pay_address: "address",
      payin_extra_id: null,
      price_amount: 1,
      price_currency: "usd",
      pay_amount: 15,
      actually_paid: 15,
      actually_paid_at_fiat: 0,
      pay_currency: "trx",
      order_id: null,
      order_description: null,
      purchase_id: "123456789",
      outcome_amount: 14.8106,
      outcome_currency: "trx",
      payment_extra_ids: null,
      fee: {
        currency: "btc",
        depositFee: 0.09853637216235617,
        withdrawalFee: 0,
        serviceFee: 0,
      },
    };
    const signature = signPayload(payload, TEST_SECRET);

    expect(
      verifyIpnSignature({
        rawBody: JSON.stringify(payload),
        signature,
        secret: TEST_SECRET,
      })
    ).toBe(true);
  });

  it("uses timing-safe comparison (returns false for length mismatch without throwing)", () => {
    expect(
      verifyIpnSignature({
        rawBody: JSON.stringify({ a: 1 }),
        signature: "deadbeef", // too short
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });
});

describe("sortObjectKeys", () => {
  it("sorts keys at top level", () => {
    expect(sortObjectKeys({ b: 2, a: 1, c: 3 })).toEqual({ a: 1, b: 2, c: 3 });
  });

  it("sorts keys recursively in nested objects", () => {
    const result = sortObjectKeys({ b: { y: 2, x: 1 }, a: 1 }) as Record<string, unknown>;
    expect(Object.keys(result)).toEqual(["a", "b"]);
    expect(Object.keys(result.b as Record<string, unknown>)).toEqual(["x", "y"]);
  });

  it("preserves null and primitives", () => {
    expect(sortObjectKeys(null)).toBe(null);
    expect(sortObjectKeys(42)).toBe(42);
    expect(sortObjectKeys("hello")).toBe("hello");
  });

  it("handles arrays without sorting array contents", () => {
    expect(sortObjectKeys([3, 1, 2])).toEqual([3, 1, 2]);
  });

  it("recursively sorts objects inside arrays", () => {
    const result = sortObjectKeys([{ b: 2, a: 1 }]) as Array<Record<string, unknown>>;
    expect(Object.keys(result[0])).toEqual(["a", "b"]);
  });
});
```

### Step 6: Run all tests

```bash
npm test -- src/lib/nowpayments/verify.test.ts
```

Expected: All ~14 tests pass. **If any fail, the verifier has a bug — fix it before continuing.** Do not proceed with a broken signature verifier; the rest of the integration assumes this function is correct.

### Step 7: Commit

```bash
git add D:/Erovel/src/lib/nowpayments/verify.ts D:/Erovel/src/lib/nowpayments/verify.test.ts
git commit -m "feat(nowpayments): HMAC-SHA512 IPN signature verification

Pure function with extensive test coverage for the security-critical
webhook signature verification path. Uses timing-safe comparison to
prevent timing attacks. Recursively sorts object keys per NowPayments
spec before signing.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: NowPayments API client (create invoice)

**Why:** Wraps the HTTP call to `POST /v1/invoice` in a typed function so the rest of the codebase doesn't deal with `fetch` directly.

**Files:**
- Create: `D:/Erovel/src/lib/nowpayments/client.ts`

### Step 1: Implement the client

Create `D:/Erovel/src/lib/nowpayments/client.ts`:

```typescript
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
```

### Step 2: Verify TypeScript compiles

```bash
npx tsc --noEmit
```

Expected: No errors.

### Step 3: Commit

```bash
git add D:/Erovel/src/lib/nowpayments/client.ts
git commit -m "feat(nowpayments): API client wrapper for createInvoice

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Migration — `pending_crypto_payments` table

**Why:** When the user clicks "Pay with crypto," we generate a UUID, store everything we need (creator, story, reader, amount) keyed by that UUID, and pass the UUID to NowPayments as `order_id`. When the IPN arrives later, we look up the row by `order_id` and have all the context we need to call `createPaymentWithSplits`. Without this table, we'd have no way to link the IPN back to the original tip intent.

**Files:**
- Create: `D:/Erovel/supabase/migrations/20260408000000_pending_crypto_payments.sql`

### Step 1: Create the migration

Create `D:/Erovel/supabase/migrations/20260408000000_pending_crypto_payments.sql`:

```sql
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
```

### Step 2: Commit

```bash
git add D:/Erovel/supabase/migrations/20260408000000_pending_crypto_payments.sql
git commit -m "feat(crypto): migration — pending_crypto_payments table

Holds in-flight NowPayments invoices and links the eventual IPN
webhook back to Erovel's reader/creator/story context via order_id.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Apply migration locally + verify

### Step 1: Apply

```bash
cd D:/Erovel
supabase db reset
```

Expected: Migration applies cleanly. If it fails, fix the file in Task 5 and re-run.

### Step 2: Verify the table exists with the right shape

```sql
\d pending_crypto_payments
```

Expected: All the columns from the migration, RLS enabled, indexes present.

### Step 3: No commit (verification only)

---

## Task 7: POST `/api/payments/nowpayments/create-invoice` route

**Why:** The frontend tip button calls this endpoint. It validates the request, generates a `pending_crypto_payments` row, calls NowPayments to create the invoice, stores the resulting `invoice_url`, and returns it to the frontend.

**Files:**
- Create: `D:/Erovel/src/app/api/payments/nowpayments/create-invoice/route.ts`

### Step 1: Create the route

Create `D:/Erovel/src/app/api/payments/nowpayments/create-invoice/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createInvoice } from "@/lib/nowpayments/client";

interface RequestBody {
  creator_id: string;
  story_id?: string;
  amount: number;
}

export async function POST(request: Request) {
  // 1. Authenticate the reader
  const authSupabase = await createServerSupabaseClient();
  if (!authSupabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const {
    data: { user: reader },
    error: authError,
  } = await authSupabase.auth.getUser();

  if (authError || !reader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse + validate the request body
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.creator_id || typeof body.amount !== "number" || body.amount <= 0) {
    return NextResponse.json(
      { error: "creator_id and a positive amount are required" },
      { status: 400 }
    );
  }

  if (body.amount < 1) {
    return NextResponse.json(
      { error: "Minimum tip amount is $1" },
      { status: 400 }
    );
  }

  // 3. Use the service-role client for DB writes (bypasses RLS for the
  //    pending_crypto_payments table since this is a server-trusted insert)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const supabase = createServiceClient(url, serviceKey);

  // 4. Verify the creator exists
  const { data: creator, error: creatorError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", body.creator_id)
    .single();

  if (creatorError || !creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  // 5. Insert the pending row first — this generates the order_id we send to NowPayments
  const { data: pending, error: pendingError } = await supabase
    .from("pending_crypto_payments")
    .insert({
      reader_id: reader.id,
      creator_id: body.creator_id,
      story_id: body.story_id ?? null,
      source_type: "tip",
      gross_usd: body.amount,
      status: "created",
    })
    .select("id, order_id")
    .single();

  if (pendingError || !pending) {
    return NextResponse.json(
      { error: "Failed to create pending payment" },
      { status: 500 }
    );
  }

  // 6. Create the NowPayments invoice
  const ipnUrl = process.env.NOWPAYMENTS_IPN_CALLBACK_URL;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://erovel.com";
  const successUrl = `${baseUrl}/payments/success?id=${pending.order_id}`;
  const cancelUrl = `${baseUrl}/payments/cancel?id=${pending.order_id}`;

  let invoice;
  try {
    invoice = await createInvoice({
      price_amount: body.amount,
      price_currency: "usd",
      // pay_currency intentionally null — let customer choose any supported coin
      ipn_callback_url: ipnUrl,
      order_id: pending.order_id,
      order_description: `Tip on Erovel`,
      success_url: successUrl,
      cancel_url: cancelUrl,
      is_fixed_rate: true,
      is_fee_paid_by_user: true,
    });
  } catch (err) {
    // Mark the pending row as failed and return a generic error
    await supabase
      .from("pending_crypto_payments")
      .update({ status: "failed" })
      .eq("id", pending.id);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 502 }
    );
  }

  // 7. Update the pending row with the invoice details
  await supabase
    .from("pending_crypto_payments")
    .update({
      nowpayments_invoice_id: invoice.id,
      invoice_url: invoice.invoice_url,
      status: "waiting",
    })
    .eq("id", pending.id);

  // 8. Return the invoice_url to the frontend for redirect
  return NextResponse.json({
    invoice_url: invoice.invoice_url,
    order_id: pending.order_id,
  });
}
```

### Step 2: Verify TypeScript compiles

```bash
npx tsc --noEmit
```

Expected: No errors.

### Step 3: Commit

```bash
git add D:/Erovel/src/app/api/payments/nowpayments/create-invoice/route.ts
git commit -m "feat(crypto): POST /api/payments/nowpayments/create-invoice route

Creates a pending payment row, generates an order_id, calls NowPayments
to create the invoice, returns the invoice_url for redirect.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: POST `/api/payments/nowpayments/ipn` route (webhook handler)

**Why:** This is where the money actually lands. NowPayments POSTs here when payment status changes; we verify the signature, dedup by `payment_id`, update the pending row, and on `finished` we call `createPaymentWithSplits` to create the actual tip record. **Build defensively — every error path must be safe.**

**Files:**
- Create: `D:/Erovel/src/app/api/payments/nowpayments/ipn/route.ts`

### Step 1: Create the route

Create `D:/Erovel/src/app/api/payments/nowpayments/ipn/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { verifyIpnSignature } from "@/lib/nowpayments/verify";
import { createPaymentWithSplits } from "@/lib/payments";
import type { IpnPaymentPayload, NowPaymentsStatus } from "@/lib/nowpayments/types";

/**
 * NowPayments IPN webhook handler.
 *
 * Flow:
 * 1. Read the raw body BEFORE parsing — we need the exact bytes for signature verification
 * 2. Verify x-nowpayments-sig HMAC against NOWPAYMENTS_IPN_SECRET
 * 3. Parse the body as IpnPaymentPayload
 * 4. Look up the pending row by order_id
 * 5. Idempotency check: if we've already seen this payment_id, no-op
 * 6. Update the pending row with the new status
 * 7. If status === 'finished' AND no parent_payment_id (not a re-deposit),
 *    create the tip via createPaymentWithSplits and link it to the pending row
 * 8. Return 200 OK
 *
 * On any error: log + return 400/500 so NowPayments will retry. Never throw.
 */
export async function POST(request: Request) {
  // STEP 1 — read raw body bytes (required for signature verification)
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "unreadable body" }, { status: 400 });
  }

  // STEP 2 — verify signature
  const signature = request.headers.get("x-nowpayments-sig") ?? "";
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret) {
    console.error("[nowpayments-ipn] NOWPAYMENTS_IPN_SECRET not configured");
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const valid = verifyIpnSignature({ rawBody, signature, secret });
  if (!valid) {
    console.warn("[nowpayments-ipn] signature verification failed");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // STEP 3 — parse the payload
  let payload: IpnPaymentPayload;
  try {
    payload = JSON.parse(rawBody) as IpnPaymentPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!payload.order_id) {
    console.warn("[nowpayments-ipn] payload missing order_id", { payment_id: payload.payment_id });
    return NextResponse.json({ ok: true }); // ack and ignore
  }

  // STEP 4 — set up service client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  const supabase = createServiceClient(url, serviceKey);

  // STEP 5 — look up the pending row
  const { data: pending, error: lookupError } = await supabase
    .from("pending_crypto_payments")
    .select("*")
    .eq("order_id", payload.order_id)
    .single();

  if (lookupError || !pending) {
    console.warn("[nowpayments-ipn] no pending row for order_id", { order_id: payload.order_id });
    return NextResponse.json({ ok: true }); // ack and ignore — could be a stale or test webhook
  }

  // STEP 6 — IDEMPOTENCY CHECK
  // If this payment_id is already recorded as 'finished', we've already processed it
  if (pending.status === "finished" && pending.nowpayments_payment_id === payload.payment_id) {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  // STEP 7 — Refuse to process repeated deposits automatically
  // Per NowPayments docs: parent_payment_id indicates a re-deposit and should not be auto-credited
  if (payload.parent_payment_id) {
    console.warn("[nowpayments-ipn] refusing to auto-credit repeated deposit", {
      payment_id: payload.payment_id,
      parent_payment_id: payload.parent_payment_id,
    });
    // Still update the pending row's last_ipn_at + payload for visibility
    await supabase
      .from("pending_crypto_payments")
      .update({
        last_ipn_at: new Date().toISOString(),
        last_ipn_payload: payload as unknown as Record<string, unknown>,
      })
      .eq("id", pending.id);
    return NextResponse.json({ ok: true, repeated_deposit: true });
  }

  // STEP 8 — Update pending row with the latest status
  const newStatus: NowPaymentsStatus = payload.payment_status;
  const updateData: Record<string, unknown> = {
    nowpayments_payment_id: payload.payment_id,
    status: newStatus,
    last_ipn_at: new Date().toISOString(),
    last_ipn_payload: payload as unknown as Record<string, unknown>,
  };

  // STEP 9 — On 'finished', credit via the splits engine
  if (newStatus === "finished") {
    const splitsResult = await createPaymentWithSplits({
      supabase,
      source_type: "tip",
      reader_id: pending.reader_id,
      creator_id: pending.creator_id,
      story_id: pending.story_id ?? null,
      gross: Number(pending.gross_usd),
      currency: "USD",
      ccbill_transaction_id: undefined, // not a CCBill payment
    });

    if (!splitsResult.ok) {
      console.error("[nowpayments-ipn] splits engine refused payment", {
        order_id: payload.order_id,
        error: splitsResult.error,
      });
      // Don't update pending to 'finished' — leave for manual review
      return NextResponse.json({ error: "splits failed" }, { status: 500 });
    }

    updateData.resulting_tip_id = splitsResult.payment_id;
  }

  await supabase
    .from("pending_crypto_payments")
    .update(updateData)
    .eq("id", pending.id);

  return NextResponse.json({ ok: true });
}
```

### Step 2: Verify TypeScript compiles

```bash
npx tsc --noEmit
```

Expected: No errors.

### Step 3: Commit

```bash
git add D:/Erovel/src/app/api/payments/nowpayments/ipn/route.ts
git commit -m "feat(crypto): POST /api/payments/nowpayments/ipn webhook handler

Verifies HMAC-SHA512 signature, dedups by payment_id, refuses to
auto-credit repeated deposits, and on 'finished' status calls the
splits engine to record the tip. Defensive throughout — no path
that could result in double credit or unverified credit.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Add "Pay with crypto" option to tip button

**Why:** The user-facing entry point. Adds a second payment option to the existing tip modal so users can choose card (CCBill, eventually) or crypto (NowPayments).

**Files:**
- Modify: `D:/Erovel/src/components/monetization/tip-button.tsx`

### Step 1: Add the crypto option to the existing tip flow

In `D:/Erovel/src/components/monetization/tip-button.tsx`, add a "Pay with crypto" button alongside the existing "Send" button. When clicked, it calls `/api/payments/nowpayments/create-invoice` and redirects to the returned `invoice_url`.

The exact integration depends on the current state of `tip-button.tsx` after the splits engine plan's Task 11 ships (which wires it through `createPaymentWithSplits`). The crypto option is **additional** — it doesn't replace the regular flow.

Pseudocode for the addition (apply to whatever the file looks like at execution time):

```typescript
async function handleCryptoPay() {
  const tipAmount = amount || parseFloat(customAmount);
  if (!tipAmount || tipAmount < 1) return;

  setSubmitting(true);
  try {
    const response = await fetch("/api/payments/nowpayments/create-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creator_id: creatorId,
        story_id: storyId,
        amount: tipAmount,
      }),
    });

    if (!response.ok) {
      setError("Failed to create crypto payment. Please try again.");
      setSubmitting(false);
      return;
    }

    const { invoice_url } = await response.json();
    // Redirect to NowPayments hosted checkout
    window.location.href = invoice_url;
  } catch {
    setError("Network error. Please try again.");
    setSubmitting(false);
  }
}
```

In the modal JSX, add the crypto option below the existing send button:

```tsx
<Button onClick={handleSend} className="w-full">
  Send {/* existing CCBill / direct path */}
</Button>

<div className="text-center text-xs text-muted">— or —</div>

<Button
  variant="secondary"
  onClick={handleCryptoPay}
  className="w-full"
  disabled={submitting}
>
  Pay with crypto
</Button>
```

### Step 2: Verify TypeScript compiles

```bash
npx tsc --noEmit
```

Expected: No errors.

### Step 3: Commit

```bash
git add D:/Erovel/src/components/monetization/tip-button.tsx
git commit -m "feat(crypto): add Pay with crypto option to tip button

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Payment success + cancel landing pages

**Why:** When NowPayments redirects the user back to Erovel after payment (or cancellation), they need a real page to land on. These pages can read the `?id=<order_id>` query param, look up the pending payment, and show the user a status.

**Files:**
- Create: `D:/Erovel/src/app/payments/success/page.tsx`
- Create: `D:/Erovel/src/app/payments/cancel/page.tsx`

### Step 1: Create the success page

Create `D:/Erovel/src/app/payments/success/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const params = useSearchParams();
  const orderId = params.get("id");
  const [status, setStatus] = useState<string>("checking");

  useEffect(() => {
    if (!orderId) return;
    const supabase = createClient();
    if (!supabase) return;

    async function check() {
      const { data } = await supabase
        .from("pending_crypto_payments")
        .select("status")
        .eq("order_id", orderId)
        .single();
      if (data) setStatus(data.status);
    }

    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  return (
    <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
      <h1 className="text-2xl font-bold">Payment Received</h1>
      <p className="text-muted">
        Thanks for your tip! Your payment is being processed.
      </p>
      <p className="text-sm text-muted">Status: {status}</p>
      <p className="text-xs text-muted">
        Crypto payments can take a few minutes to confirm on the blockchain.
        You can safely close this page — the tip will be credited automatically.
      </p>
      <Link href="/" className="text-accent hover:underline">
        Back to Erovel
      </Link>
    </div>
  );
}
```

### Step 2: Create the cancel page

Create `D:/Erovel/src/app/payments/cancel/page.tsx`:

```tsx
import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
      <h1 className="text-2xl font-bold">Payment Canceled</h1>
      <p className="text-muted">
        Your payment was canceled. No charges were made.
      </p>
      <Link href="/" className="text-accent hover:underline">
        Back to Erovel
      </Link>
    </div>
  );
}
```

### Step 3: Commit

```bash
git add D:/Erovel/src/app/payments/success/page.tsx D:/Erovel/src/app/payments/cancel/page.tsx
git commit -m "feat(crypto): payment success and cancel landing pages

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Configure NowPayments dashboard IPN URL

**Why:** Without telling NowPayments where to send webhooks, no payment confirmations arrive and tips never get credited.

**Files:** None — dashboard-only configuration.

### Steps

1. Log in to NowPayments dashboard
2. Settings → Payment Settings → Instant Payment Notifications
3. Set the IPN callback URL to: `https://erovel.com/api/payments/nowpayments/ipn`
4. Verify the IPN secret is set (generated earlier — should be in your `.env.local` already)
5. (Optional) Configure recurrent notifications: timeout 1 minute, retry count 3 — this gives Erovel three chances to acknowledge an IPN before NowPayments gives up
6. Save

**For local development:** use ngrok or similar tunnel to expose `localhost:3000/api/payments/nowpayments/ipn` to a public URL, then update the dashboard temporarily for testing.

---

## Task 12: End-to-end test with a real $1 payment

**Why:** Verifies the entire pipeline before any real customer money flows through.

### Steps

1. Start Erovel locally: `npm run dev`
2. Open Erovel as a logged-in test reader
3. Navigate to a creator profile and click "Tip"
4. Enter $1, click "Pay with crypto"
5. You should be redirected to NowPayments hosted checkout
6. Pick a coin (USDC on Polygon recommended for speed and cost)
7. Send $1 worth of the chosen coin from any source (Kraken, Newton, etc.)
8. Wait for NowPayments to confirm (usually 1-5 minutes for Polygon)
9. Verify:
   - Funds appear in NOW Wallet
   - Erovel receives the IPN webhook (check server logs)
   - The `pending_crypto_payments` row transitions to `finished`
   - A new row appears in `tips` with `splits` snapshot intact
   - The creator's earnings dashboard shows the new tip
10. If anything fails, check `splits_failed` table and server logs to diagnose

**This is the moment of truth.** If anything is wrong with signature verification, idempotency, or the splits integration, this test will surface it before real customers ever see it.

---

## Final verification checklist

- [ ] All Vitest tests pass (`npm test`)
- [ ] `npx tsc --noEmit` passes
- [ ] `supabase db reset` applies migrations cleanly from scratch
- [ ] `.env.local` is gitignored and never committed
- [ ] No API keys or secrets appear in any committed file
- [ ] End-to-end test completes successfully with a real $1 payment
- [ ] Server logs show no errors during the test
- [ ] `splits_failed` table is empty after the test
- [ ] Creator earnings dashboard reflects the new tip

## Rollout to production

1. Commit and push all changes.
2. Set production env vars in Vercel:
   - `NOWPAYMENTS_API_KEY`
   - `NOWPAYMENTS_IPN_SECRET`
   - `NOWPAYMENTS_API_BASE_URL=https://api.nowpayments.io/v1`
   - `NOWPAYMENTS_IPN_CALLBACK_URL=https://erovel.com/api/payments/nowpayments/ipn`
3. Apply the migration to prod via `supabase db push`
4. Deploy via the normal Vercel pipeline
5. Update NowPayments dashboard IPN URL from the ngrok dev URL to the production URL
6. Run the same end-to-end test against production with another $1 payment
7. Monitor server logs and `splits_failed` table for the first 24 hours

## Out of scope (future work)

- Crypto subscriptions (recurring billing) — separate plan, requires NowPayments' recurring API
- CCBill webhook handler — separate plan, parallel structure to this
- Crypto refund handling — IPN handler currently treats `refunded` as a status update only; future work would write a negative tip row to reverse the credit
- BTCPayServer self-hosted alternative — separate plan, would replace NowPayments as the resilient long-term option
- Customer-side wallet integration (instead of hosted checkout) — out of scope, hosted checkout is fine for the hedge use case
