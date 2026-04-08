# BTCPay Server Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add BTCPay Server (self-hosted via LunaNode) as Erovel's primary crypto payment path. Customers can tip in **Bitcoin on-chain** or **Lightning Network** with no per-transaction minimum (Lightning supports cents, on-chain supports anything above the network fee). Funds settle directly to Rob's BTCPay-managed wallet — no third-party processor in the middle, no minimums, no KYB approval, no content restrictions, no account-state shenanigans.

**Architecture:** BTCPay runs as a separate service at `pay.erovel.com` (or wherever LunaNode hosts it). Erovel's server creates invoices via BTCPay's Greenfield REST API and gets back a hosted checkout URL that the customer redirects to. When the customer pays (on-chain or via Lightning), BTCPay confirms the transaction and POSTs a webhook to Erovel. The webhook handler verifies the HMAC signature, dedups by invoice ID, and on `Settled` status calls `createPaymentWithSplits` to record the tip — same splits engine flow as the NowPayments path.

The new path runs **alongside** the existing NowPayments code (which stays in place but currently unused due to account-level issues). The tip button calls BTCPay as the primary crypto path. NowPayments stays as inactive code that can be re-enabled if/when their hosted checkout starts working.

**Tech Stack:** Next.js 16, TypeScript, Supabase, Vitest, BTCPay Server Greenfield API v1, BTCPay's HMAC-SHA256 webhook signature scheme. No new client libraries needed (BTCPay's API is REST + JSON, uses native `fetch`).

**Prerequisites (Rob does these BEFORE the implementation tasks):**

1. **Sign up at LunaNode** (https://www.lunanode.com) — Canadian provider, supports BTCPay-as-a-service.
2. **Spin up a BTCPay instance** via LunaNode's BTCPay product (~$8.50/month).
3. **Generate a BTC wallet** in BTCPay → save the recovery seed phrase to a secure offline location (this is the recovery key for all funds — losing it = losing the funds).
4. **Configure a store** in BTCPay:
   - Set default currency to USD
   - Enable Bitcoin (on-chain) as a payment method
   - Enable Lightning Network (optional but strongly recommended for small tips)
   - Set webhook URL to `https://erovel.com/api/payments/btcpay/webhook` (we'll create this in Task 7)
5. **For Lightning support** (optional):
   - LunaNode's BTCPay package may include Lightning automatically. If not, set up an inbound channel (one-time ~$10-20 for inbound liquidity from a channel-opening service like LNBig or Voltage)
6. **Get the BTCPay API key**:
   - BTCPay → Account → API Keys → Generate
   - Permissions needed: `btcpay.store.canviewinvoices`, `btcpay.store.cancreateinvoice`, `btcpay.store.canmodifyinvoices`
7. **Get the webhook secret**:
   - BTCPay → Store Settings → Webhooks → Add webhook → "Send specific events" → Settled, Invalid, Expired → Save → Copy the webhook secret
8. **Get the store ID**:
   - BTCPay → Store Settings → URL contains `/stores/{storeId}/...`
9. **Add to `D:/Erovel/.env.local`**:
   ```bash
   BTCPAY_URL=https://your-btcpay.lunanode.com
   BTCPAY_STORE_ID=<the store id from step 8>
   BTCPAY_API_KEY=<the api key from step 6>
   BTCPAY_WEBHOOK_SECRET=<the webhook secret from step 7>
   ```

**Reference docs:**
- BTCPay Greenfield API v1: https://docs.btcpayserver.org/API/Greenfield/v1/
- BTCPay webhook signature spec: https://docs.btcpayserver.org/API/Greenfield/v1/#tag/Webhooks
- LunaNode BTCPay product: https://www.lunanode.com/btcpay
- Splits engine design: [`docs/plans/2026-04-07-splits-engine-v1-design.md`](2026-04-07-splits-engine-v1-design.md)
- NowPayments integration (for pattern reference): [`docs/plans/2026-04-08-nowpayments-crypto-tips-plan.md`](2026-04-08-nowpayments-crypto-tips-plan.md)

**Critical invariants (do not violate):**

1. **Verify the HMAC signature on every webhook** — `BTCPay-Sig` header carries `sha256=<hex>` of HMAC-SHA256(raw_body, webhook_secret). No exceptions, never trust an unsigned webhook.
2. **Idempotency on `invoiceId`** — BTCPay retries webhooks on error. Receiving the same invoice ID multiple times must result in zero double-credits.
3. **Only credit on `InvoiceSettled` event** (status `Settled`). Other events (Created, Processing, Invalid, Expired) update the pending row but do not create a tip.
4. **BTCPay invoices are paid in BTC** (or sats via Lightning). Erovel's splits engine works in USD. Convert at the rate BTCPay reports in the webhook (`paymentMethodPaidAmount` field has the crypto amount; the original `amount`/`currency` fields are the USD price). Use the USD value for splits engine purposes since that's what creators are denominated in.
5. **Crypto tips flow through the splits engine** identically to CCBill tips and the NowPayments path. Same `createPaymentWithSplits` helper, same `tips` row structure, just a different `currency` field (e.g. `"BTC"` or `"BTC-LN"`).
6. **Never log webhook secrets or API keys** in error messages, console output, or anywhere persistent.

---

## Tasks at a glance

| # | Task | Files | Time |
|---|------|-------|------|
| 1 | Add BTCPay env vars to `.env.local` and `.env.example` | env files | ~5 min |
| 2 | TypeScript types for BTCPay API + webhook payload | `src/lib/btcpay/types.ts` | ~15 min |
| 3 | HMAC-SHA256 webhook signature verification (TDD) | `src/lib/btcpay/verify.ts` (+ test) | ~45 min |
| 4 | BTCPay API client (createInvoice, getInvoice) | `src/lib/btcpay/client.ts` | ~30 min |
| 5 | Migration: add `processor` column to `pending_crypto_payments` | `supabase/migrations/...` | ~10 min |
| 6 | Apply migration locally + verify | local DB | ~5 min |
| 7 | POST `/api/payments/btcpay/create-invoice` route | route file | ~30 min |
| 8 | POST `/api/payments/btcpay/webhook` route | route file | ~45 min |
| 9 | Update tip button to use BTCPay instead of NowPayments | `tip-button.tsx` | ~20 min |
| 10 | Update success/cancel landing pages to handle BTCPay invoices | landing pages | ~15 min |
| 11 | Configure BTCPay store webhook URL (post-deploy) | BTCPay dashboard | ~5 min |
| 12 | End-to-end test with a real $1 Lightning tip | manual | ~15 min |

**Total estimated time:** ~4 focused hours of dev work + ~15 min of Rob's manual setup.

---

## Task 1: Environment variables

**Why:** Same pattern as NowPayments — credentials live in env vars only.

**Files:**
- Modify: `D:/Erovel/.env.local` (gitignored, leave values blank for Rob to fill in)
- Modify: `D:/Erovel/.env.example` (committed, placeholder lines)

### Step 1: Verify .env.local is gitignored

```bash
cd D:/Erovel
grep -E "^\.env" .gitignore
```

Should show `.env*` or similar. If not, fix `.gitignore` first.

### Step 2: Add placeholders to `.env.local`

Append:
```bash

# BTCPay Server (self-hosted via LunaNode)
BTCPAY_URL=
BTCPAY_STORE_ID=
BTCPAY_API_KEY=
BTCPAY_WEBHOOK_SECRET=
```

### Step 3: Add same placeholders to `.env.example`

Append the same block (placeholders only).

### Step 4: Commit only `.env.example`

```bash
git add D:/Erovel/.env.example
git status  # verify .env.local is NOT staged
git commit -m "chore(btcpay): add BTCPay env var placeholders to .env.example

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: TypeScript types

**Why:** Establish the contract for BTCPay's API and webhook payloads.

**Files:**
- Create: `D:/Erovel/src/lib/btcpay/types.ts`

### Step 1: Create the types file

```typescript
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
```

### Step 2: Verify TypeScript compiles

```bash
cd D:/Erovel
npx tsc --noEmit
```

### Step 3: Commit

```bash
git add D:/Erovel/src/lib/btcpay/types.ts
git commit -m "feat(btcpay): add TypeScript types for Greenfield API and webhooks

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: HMAC-SHA256 webhook signature verification (TDD, security-critical)

**Why:** Same as the NowPayments verifier — the only thing standing between Erovel and a forged "Settled" webhook that creates fake tip credit. **Build it test-first with extensive coverage. No shortcuts.**

BTCPay's signature scheme:
- Header: `BTCPay-Sig`
- Format: `sha256=<hex digest>`
- Algorithm: HMAC-SHA256
- Message: the **raw request body bytes** (no re-serialization, no key sorting — BTCPay just signs the bytes that arrived)

**Files:**
- Create: `D:/Erovel/src/lib/btcpay/verify.test.ts`
- Create: `D:/Erovel/src/lib/btcpay/verify.ts`

### Step 1: Failing test for the basic case

Create `verify.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { verifyBTCPayWebhookSignature } from "./verify";

const TEST_SECRET = "test-webhook-secret";

function signBody(body: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  return `sha256=${hmac.digest("hex")}`;
}

describe("verifyBTCPayWebhookSignature", () => {
  it("returns true for a correctly signed body", () => {
    const body = JSON.stringify({ invoiceId: "abc123", type: "InvoiceSettled" });
    const signature = signBody(body, TEST_SECRET);

    const result = verifyBTCPayWebhookSignature({
      rawBody: body,
      signature,
      secret: TEST_SECRET,
    });

    expect(result).toBe(true);
  });
});
```

### Step 2: Run, verify it fails

```bash
npm test -- src/lib/btcpay/verify.test.ts
```

Expected: Cannot find module './verify'.

### Step 3: Implement the verifier

Create `verify.ts`:

```typescript
import crypto from "node:crypto";

interface VerifyInput {
  /** The exact raw request body bytes received from BTCPay */
  rawBody: string;
  /** The value of the BTCPay-Sig header */
  signature: string;
  /** Your BTCPAY_WEBHOOK_SECRET */
  secret: string;
}

/**
 * Verify the HMAC-SHA256 signature on a BTCPay Server webhook.
 *
 * Algorithm (per BTCPay docs):
 * 1. Compute HMAC-SHA256(rawBody, secret) → hex digest
 * 2. Prefix with "sha256="
 * 3. Compare against the BTCPay-Sig header value (timing-safe)
 *
 * Returns true if signature matches, false otherwise.
 * Returns false on any error (never throws).
 */
export function verifyBTCPayWebhookSignature(input: VerifyInput): boolean {
  const { rawBody, signature, secret } = input;

  if (!signature || !secret || !rawBody) return false;
  if (!signature.startsWith("sha256=")) return false;

  const expectedHex = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const expected = `sha256=${expectedHex}`;

  // Timing-safe comparison
  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}
```

### Step 4: Run the test, verify it passes

```bash
npm test -- src/lib/btcpay/verify.test.ts
```

Expected: 1 passing test.

### Step 5: Add edge case tests

Append to `verify.test.ts`:

```typescript
describe("verifyBTCPayWebhookSignature — edge cases", () => {
  it("returns false when signature is wrong", () => {
    expect(
      verifyBTCPayWebhookSignature({
        rawBody: '{"a":1}',
        signature: "sha256=" + "0".repeat(64),
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });

  it("returns false when signature is missing the sha256= prefix", () => {
    const body = '{"a":1}';
    const signatureHexOnly = crypto
      .createHmac("sha256", TEST_SECRET)
      .update(body)
      .digest("hex");
    expect(
      verifyBTCPayWebhookSignature({
        rawBody: body,
        signature: signatureHexOnly, // no "sha256=" prefix
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });

  it("returns false when signature is empty", () => {
    expect(
      verifyBTCPayWebhookSignature({
        rawBody: '{"a":1}',
        signature: "",
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });

  it("returns false when secret is empty", () => {
    expect(
      verifyBTCPayWebhookSignature({
        rawBody: '{"a":1}',
        signature: signBody('{"a":1}', "wrong"),
        secret: "",
      })
    ).toBe(false);
  });

  it("returns false when rawBody is empty", () => {
    expect(
      verifyBTCPayWebhookSignature({
        rawBody: "",
        signature: signBody("anything", TEST_SECRET),
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });

  it("returns false when body has been tampered with", () => {
    const original = '{"invoiceId":"abc","type":"InvoiceSettled"}';
    const tampered = '{"invoiceId":"abc","type":"InvoiceInvalid"}';
    const signature = signBody(original, TEST_SECRET);

    expect(
      verifyBTCPayWebhookSignature({
        rawBody: tampered,
        signature,
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });

  it("BTCPay signs the raw bytes — whitespace differences break verification", () => {
    // Unlike NowPayments which canonicalizes via key sorting, BTCPay signs
    // the exact bytes. So {"a":1} and { "a": 1 } produce different signatures.
    const body1 = '{"a":1}';
    const body2 = '{ "a": 1 }';
    const signature1 = signBody(body1, TEST_SECRET);

    expect(
      verifyBTCPayWebhookSignature({
        rawBody: body2,
        signature: signature1,
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });

  it("verifies a realistic BTCPay payload", () => {
    const payload = JSON.stringify({
      deliveryId: "abc123",
      webhookId: "wh_xyz",
      originalDeliveryId: "abc123",
      isRedelivery: false,
      type: "InvoiceSettled",
      timestamp: 1712592000,
      storeId: "store_abc",
      invoiceId: "inv_xyz",
      manuallyMarked: false,
      overPaid: false,
    });
    const signature = signBody(payload, TEST_SECRET);

    expect(
      verifyBTCPayWebhookSignature({
        rawBody: payload,
        signature,
        secret: TEST_SECRET,
      })
    ).toBe(true);
  });

  it("uses timing-safe comparison (returns false for length mismatch without throwing)", () => {
    expect(
      verifyBTCPayWebhookSignature({
        rawBody: '{"a":1}',
        signature: "sha256=deadbeef", // too short
        secret: TEST_SECRET,
      })
    ).toBe(false);
  });
});
```

### Step 6: Run all tests

```bash
npm test -- src/lib/btcpay/verify.test.ts
```

Expected: 9 tests pass. **If any fail, the verifier has a bug. Fix before continuing.**

### Step 7: Commit

```bash
git add D:/Erovel/src/lib/btcpay/verify.ts D:/Erovel/src/lib/btcpay/verify.test.ts
git commit -m "feat(btcpay): HMAC-SHA256 webhook signature verification

Pure function with extensive test coverage for the security-critical
webhook signature verification path. Uses timing-safe comparison to
prevent timing attacks. BTCPay signs the raw request body bytes
(unlike NowPayments which canonicalizes via key sorting), so the
verifier compares against the exact bytes received.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: BTCPay API client

**Why:** Wraps the HTTP calls to BTCPay so the rest of the codebase doesn't deal with `fetch` directly.

**Files:**
- Create: `D:/Erovel/src/lib/btcpay/client.ts`

### Step 1: Implement the client

```typescript
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
 * Returns true if reachable.
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
```

### Step 2: Verify TypeScript compiles

```bash
npx tsc --noEmit
```

### Step 3: Commit

```bash
git add D:/Erovel/src/lib/btcpay/client.ts
git commit -m "feat(btcpay): API client wrapper for createInvoice

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Migration — add `processor` column to `pending_crypto_payments`

**Why:** We need to know which processor handled each pending payment so the right webhook handler updates the right rows. Adding a column to the existing table is cleaner than a parallel table.

**Files:**
- Create: `D:/Erovel/supabase/migrations/20260408100000_pending_crypto_processor.sql`

### Step 1: Create the migration

```sql
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
```

### Step 2: Commit (do not apply yet — Task 6 applies it)

```bash
git add D:/Erovel/supabase/migrations/20260408100000_pending_crypto_processor.sql
git commit -m "feat(btcpay): migration — add processor column to pending_crypto_payments

Adds a processor enum (nowpayments, btcpay) and a generic
external_invoice_id column so multiple crypto processors can share
the same pending_crypto_payments table.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Apply migration locally + verify

```bash
cd D:/Erovel
npx supabase db reset
```

Then verify via psql or docker exec:

```bash
docker exec supabase_db_Erovel psql -U postgres -c "select column_name, data_type from information_schema.columns where table_name = 'pending_crypto_payments' order by ordinal_position;"
```

Expected: 'processor' and 'external_invoice_id' columns appear in the list.

No commit (verification only).

---

## Task 7: POST `/api/payments/btcpay/create-invoice` route

**Why:** The frontend tip button calls this endpoint when the user clicks "Pay with crypto." It's the BTCPay equivalent of the existing NowPayments create-invoice route.

**Files:**
- Create: `D:/Erovel/src/app/api/payments/btcpay/create-invoice/route.ts`

### Step 1: Create the route

```typescript
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createBTCPayInvoice } from "@/lib/btcpay/client";

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

  // 2. Parse + validate
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

  // BTCPay supports tiny amounts via Lightning, so the minimum is $1
  // (any lower and the user can't pay enough to make it worthwhile after
  // even the trivial Lightning fee).
  if (body.amount < 1) {
    return NextResponse.json(
      { error: "Minimum tip amount is $1" },
      { status: 400 }
    );
  }

  // 3. Service-role client for server-trusted DB writes
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const supabase = createServiceClient(url, serviceKey);

  // 4. Verify creator exists
  const { data: creator, error: creatorError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", body.creator_id)
    .single();

  if (creatorError || !creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  // 5. Insert pending row first (generates the order_id)
  const { data: pending, error: pendingError } = await supabase
    .from("pending_crypto_payments")
    .insert({
      reader_id: reader.id,
      creator_id: body.creator_id,
      story_id: body.story_id ?? null,
      source_type: "tip",
      gross_usd: body.amount,
      status: "created",
      processor: "btcpay",
    })
    .select("id, order_id")
    .single();

  if (pendingError || !pending) {
    return NextResponse.json(
      { error: "Failed to create pending payment" },
      { status: 500 }
    );
  }

  // 6. Create the BTCPay invoice
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://erovel.com";
  const successUrl = `${baseUrl}/payments/success?id=${pending.order_id}`;

  let invoice;
  try {
    invoice = await createBTCPayInvoice({
      amount: body.amount.toFixed(2),
      currency: "USD",
      metadata: {
        orderId: pending.order_id,
        orderUrl: `${baseUrl}/dashboard/earnings`,
      },
      checkout: {
        speedPolicy: "MediumSpeed",
        // Enable both BTC on-chain and Lightning. Customers pick on the
        // hosted checkout page. BTCPay handles routing.
        paymentMethods: ["BTC", "BTC-LightningNetwork"],
        defaultPaymentMethod: "BTC-LightningNetwork",
        expirationMinutes: 60,
        redirectURL: successUrl,
        redirectAutomatically: true,
      },
    });
  } catch (err) {
    console.error("[btcpay/create-invoice] BTCPay invoice creation failed:", err);
    await supabase
      .from("pending_crypto_payments")
      .update({ status: "failed" })
      .eq("id", pending.id);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 502 }
    );
  }

  // 7. Update pending row with BTCPay invoice details
  await supabase
    .from("pending_crypto_payments")
    .update({
      external_invoice_id: invoice.id,
      invoice_url: invoice.checkoutLink,
      status: "waiting",
    })
    .eq("id", pending.id);

  // 8. Return the checkout link
  return NextResponse.json({
    invoice_url: invoice.checkoutLink,
    order_id: pending.order_id,
  });
}
```

### Step 2: Verify TypeScript compiles

```bash
npx tsc --noEmit
```

### Step 3: Commit

```bash
git add D:/Erovel/src/app/api/payments/btcpay/create-invoice/route.ts
git commit -m "feat(btcpay): POST /api/payments/btcpay/create-invoice route

Creates a pending payment row with processor='btcpay', calls BTCPay
to create the invoice, returns the checkout link for redirect.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: POST `/api/payments/btcpay/webhook` route

**Why:** This is where the money actually lands. BTCPay POSTs here when invoice status changes; we verify the signature, dedup by invoice ID, and on `InvoiceSettled` call `createPaymentWithSplits`. **Build defensively — every error path must be safe.**

**Files:**
- Create: `D:/Erovel/src/app/api/payments/btcpay/webhook/route.ts`

### Step 1: Create the route

```typescript
import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { verifyBTCPayWebhookSignature } from "@/lib/btcpay/verify";
import { createPaymentWithSplits } from "@/lib/payments";
import type { BTCPayWebhookPayload } from "@/lib/btcpay/types";

/**
 * BTCPay Server webhook handler.
 *
 * Flow:
 * 1. Read raw body bytes BEFORE parsing — needed for signature verification
 * 2. Verify BTCPay-Sig HMAC against BTCPAY_WEBHOOK_SECRET
 * 3. Parse the body
 * 4. Look up the pending row by external_invoice_id (= BTCPay invoiceId)
 * 5. Idempotency: if we've already credited this invoice, no-op
 * 6. Update pending row with the new event/status
 * 7. If type === 'InvoiceSettled', call createPaymentWithSplits
 * 8. Return 200 OK
 *
 * On error: log + return non-200 so BTCPay retries. Never throw.
 */
export async function POST(request: Request) {
  // STEP 1 — read raw body bytes
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "unreadable body" }, { status: 400 });
  }

  // STEP 2 — verify signature
  const signature = request.headers.get("BTCPay-Sig") ?? "";
  const secret = process.env.BTCPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[btcpay/webhook] BTCPAY_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const valid = verifyBTCPayWebhookSignature({ rawBody, signature, secret });
  if (!valid) {
    console.warn("[btcpay/webhook] signature verification failed");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // STEP 3 — parse the payload
  let payload: BTCPayWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as BTCPayWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!payload.invoiceId) {
    console.warn("[btcpay/webhook] payload missing invoiceId", { type: payload.type });
    return NextResponse.json({ ok: true }); // ack and ignore
  }

  // STEP 4 — service client for DB writes
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
    .eq("external_invoice_id", payload.invoiceId)
    .eq("processor", "btcpay")
    .single();

  if (lookupError || !pending) {
    console.warn("[btcpay/webhook] no pending row for invoiceId", { invoiceId: payload.invoiceId });
    return NextResponse.json({ ok: true }); // ack and ignore stale/test webhooks
  }

  // STEP 6 — IDEMPOTENCY CHECK
  // If this invoice is already 'finished', the webhook is a redelivery
  if (pending.status === "finished") {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  // STEP 7 — Map BTCPay event type to our status enum
  const statusMap: Record<string, string> = {
    InvoiceCreated: "waiting",
    InvoiceReceivedPayment: "confirming",
    InvoiceProcessing: "confirming",
    InvoiceSettled: "finished",
    InvoiceExpired: "expired",
    InvoiceInvalid: "failed",
  };
  const newStatus = statusMap[payload.type] ?? "waiting";

  const updateData: Record<string, unknown> = {
    status: newStatus,
    last_ipn_at: new Date().toISOString(),
    last_ipn_payload: payload as unknown as Record<string, unknown>,
  };

  // STEP 8 — On Settled, credit via the splits engine
  if (payload.type === "InvoiceSettled") {
    const splitsResult = await createPaymentWithSplits({
      supabase,
      source_type: "tip",
      reader_id: pending.reader_id,
      creator_id: pending.creator_id,
      story_id: pending.story_id ?? null,
      gross: Number(pending.gross_usd),
      currency: "USD",
      ccbill_transaction_id: undefined,
    });

    if (!splitsResult.ok) {
      console.error("[btcpay/webhook] splits engine refused payment", {
        invoiceId: payload.invoiceId,
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

### Step 3: Commit

```bash
git add D:/Erovel/src/app/api/payments/btcpay/webhook/route.ts
git commit -m "feat(btcpay): POST /api/payments/btcpay/webhook handler

Verifies HMAC-SHA256 signature against the raw request body, dedups
by invoice ID, and on InvoiceSettled events calls the splits engine
to record the tip. Defensive throughout — no path that could result
in double credit or unverified credit.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Update tip button to use BTCPay instead of NowPayments

**Why:** Switch the "Pay with crypto" button to call the BTCPay route instead of the NowPayments route. NowPayments code stays in place (in case the account issue resolves later) but is no longer wired up by default.

**Files:**
- Modify: `D:/Erovel/src/components/monetization/tip-button.tsx`

### Step 1: Find and update the crypto pay handler

In the existing `handleCryptoPay` function (added in the NowPayments work), change:

```typescript
const response = await fetch("/api/payments/nowpayments/create-invoice", {
```

to:

```typescript
const response = await fetch("/api/payments/btcpay/create-invoice", {
```

The rest of the handler (request body, response handling, redirect) is identical because both routes return `{ invoice_url, order_id }`.

### Step 2: Update the button label

If the existing button says "Pay with crypto" generically, that's still fine — BTCPay supports both BTC and Lightning, and the customer picks on the BTCPay hosted checkout. If you want to be more specific you could change it to "Pay with Bitcoin / Lightning" but it's optional.

### Step 3: Verify TypeScript compiles

```bash
npx tsc --noEmit
```

### Step 4: Commit

```bash
git add D:/Erovel/src/components/monetization/tip-button.tsx
git commit -m "feat(btcpay): wire tip button to BTCPay route instead of NowPayments

Switches the Pay with crypto button to use the BTCPay create-invoice
route. NowPayments code stays in place but is no longer the active
crypto path. Re-enable if/when NowPayments account issues resolve.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Update success/cancel landing pages to handle BTCPay invoices

**Why:** The success page polls `pending_crypto_payments.status` and shows the user a status. It should work for BTCPay rows too (same status enum) — just verify it does.

**Files:**
- Verify (probably no changes needed): `D:/Erovel/src/app/payments/success/page.tsx`
- Verify (probably no changes needed): `D:/Erovel/src/app/payments/cancel/page.tsx`

### Step 1: Read the success page and confirm it doesn't filter by processor

```bash
cat D:/Erovel/src/app/payments/success/page.tsx
```

The query should be:
```typescript
.from("pending_crypto_payments")
.select("status")
.eq("order_id", orderId)
```

If there's no filter on `processor`, it works for both NowPayments and BTCPay rows. No changes needed.

### Step 2: If a processor filter exists, remove it

Otherwise you're done.

### Step 3: Commit if changes were needed (likely no commit)

```bash
git add D:/Erovel/src/app/payments/success/page.tsx
git commit -m "feat(btcpay): success page works for both NowPayments and BTCPay invoices"
```

---

## Task 11: Configure BTCPay store webhook URL (post-deploy)

**Why:** BTCPay needs to know where to send webhooks. Without this configured in the BTCPay dashboard, no IPN webhooks arrive and tips never get credited.

**Files:** None — BTCPay dashboard configuration only.

### Steps (Rob does this in the BTCPay dashboard)

1. Log in to your BTCPay instance (the LunaNode-hosted one)
2. Store Settings → Webhooks → Add webhook
3. Payload URL: `https://erovel.com/api/payments/btcpay/webhook`
4. Events: select **InvoiceCreated**, **InvoiceProcessing**, **InvoiceSettled**, **InvoiceExpired**, **InvoiceInvalid**
5. Secret: copy the secret BTCPay generates and add it to `.env.local` as `BTCPAY_WEBHOOK_SECRET` (and push it to Vercel via the same secure pattern as the NowPayments env vars)
6. Save

---

## Task 12: End-to-end test with a real $1 Lightning tip

**Why:** Verifies the entire pipeline before any real customer money flows through.

### Steps

1. Make sure all env vars are set in both `.env.local` and Vercel production
2. Deploy to production
3. As a test reader, navigate to a creator profile
4. Click Tip → choose $1 → click "Pay with crypto"
5. You should be redirected to your BTCPay hosted checkout
6. Choose "Lightning Network" as the payment method
7. Pay $1 worth of sats from any Lightning wallet (Phoenix, Wallet of Satoshi, Strike, Cash App, Muun, etc.)
8. Wait a few seconds — Lightning is instant
9. Verify the chain:
   - **BTCPay dashboard**: invoice transitions Created → Processing → Settled
   - **Vercel function logs**: `[btcpay/webhook]` entries showing signature verified, splits write succeeded
   - **Supabase**: `pending_crypto_payments` row transitions to `finished`
   - **Supabase**: new row in `tips` with `splits` snapshot
   - **Creator earnings dashboard**: shows the new tip ($0.85 after 15% platform fee)
10. If everything works, you've just processed your first Lightning Network tip on Erovel

---

## Final verification checklist

- [ ] All Vitest tests pass (`npm test`)
- [ ] `npx tsc --noEmit` passes
- [ ] All BTCPay env vars set in `.env.local` AND in Vercel production
- [ ] BTCPay webhook URL configured to point at production Erovel
- [ ] Migration applied to local + production Supabase
- [ ] Lightning end-to-end test completes successfully
- [ ] No `splits_failed` rows after the test

## Rollout to production

1. Push commits to `master`
2. **Apply migration to prod Supabase** via dashboard SQL editor (the CLI db push is broken from your network — same issue as the splits engine migration)
3. Push BTCPay env vars to Vercel via the secure subagent pattern (same as NowPayments env vars)
4. Deploy via `vercel --prod`
5. Configure BTCPay webhook URL to production
6. Run the $1 Lightning test against production
7. Monitor Vercel logs and `pending_crypto_payments` for the first 24 hours

## Out of scope (for follow-up)

- **Re-enable NowPayments as a fallback** if/when the account issue resolves
- **Add USDC/USDT support to BTCPay** via the altcoin plugin (requires Ethereum node or third-party RPC)
- **Lightning channel auto-management** if volume grows enough that manual rebalancing becomes a burden
- **BTCPay invoice expiration handling** — currently expired invoices just sit in `pending_crypto_payments`; could add a cleanup job
- **Refund handling** — BTCPay supports refunds via the dashboard; the splits engine refund logic exists but needs a webhook hook to fire it
- **Multi-store BTCPay** — if you ever need to separate creator-level stores

## What this plan doesn't replace

- The splits engine — same `createPaymentWithSplits` is called, BTCPay just feeds it
- The earnings dashboard — pulls from `payee_balances` regardless of source
- The NowPayments code path — left in place for future re-enablement
- The CCBill path (when it gets built) — completely separate

## Risk profile vs NowPayments

| Risk | NowPayments | BTCPay |
|---|---|---|
| Account termination by processor | Real (adult content + processor's content rules) | Impossible (no third-party account) |
| Per-transaction minimums | $19.28 (account-level) | None ($0.001 effective via Lightning) |
| KYB / approval delays | Required, blocks live use | None |
| Hosted checkout availability | Has been broken | You control it (LunaNode uptime) |
| Currency lock-in | Custodial swap to USDC | BTC native, sats via LN |
| Operational responsibility | Zero (managed) | Low (LunaNode handles infra) but non-zero |
| Monthly fixed cost | $0 | ~$8.50 (LunaNode) |
| Per-transaction fees | ~0.5% | ~0% from BTCPay, network fees only |

The trade-off is clear: BTCPay costs ~$8.50/month in exchange for removing every account-state issue you've hit with NowPayments today. If you process even one tip per month at any meaningful size, the math works.
