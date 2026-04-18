import type { SupabaseClient } from "@supabase/supabase-js";
import type { GenerationKind } from "./schemas";

export const DAILY_LIMIT = 100;

export interface RateLimitResult {
  allowed: boolean;
  used: number;
  remaining: number;
  resetAt: string;
}

/**
 * Counts how many chapter-class generations a user has done in the last 24h
 * and compares to DAILY_LIMIT. "plan" generations don't count — they're
 * one-shot per story and cheap.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<RateLimitResult> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("ai_generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("kind", ["chapter", "regenerate"])
    .gt("created_at", since);

  if (error) {
    throw new Error(`rate-limit query failed: ${error.message}`);
  }

  const used = count ?? 0;
  const remaining = Math.max(0, DAILY_LIMIT - used);
  const resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return { allowed: used < DAILY_LIMIT, used, remaining, resetAt };
}

export interface RecordGenerationInput {
  userId: string;
  kind: GenerationKind;
  storyId: string | null;
  chapterId: string | null;
  model: string;
  tokensIn: number;
  tokensOut: number;
}

export async function recordGeneration(
  supabase: SupabaseClient,
  input: RecordGenerationInput
): Promise<void> {
  const { error } = await supabase.from("ai_generations").insert({
    user_id: input.userId,
    kind: input.kind,
    story_id: input.storyId,
    chapter_id: input.chapterId,
    model: input.model,
    tokens_in: input.tokensIn,
    tokens_out: input.tokensOut,
  });
  if (error) {
    throw new Error(`ai_generations insert failed: ${error.message}`);
  }
}
