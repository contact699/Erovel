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
