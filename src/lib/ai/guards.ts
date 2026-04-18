// Gemini 2.5 Flash pricing as of 2026-04 (USD per million tokens)
// https://ai.google.dev/pricing
const PRICE_INPUT_PER_M = 0.30;
const PRICE_OUTPUT_PER_M = 2.50;

const DEFAULT_BUDGET_USD = 50;

export function isFeatureEnabled(): boolean {
  return (process.env.AI_STORY_WIZARD_ENABLED || "").toLowerCase() === "true";
}

export interface TokenUsageRow {
  tokens_in: number;
  tokens_out: number;
}

export function estimateDailySpendUsd(rows: TokenUsageRow[]): number {
  let inputTokens = 0;
  let outputTokens = 0;
  for (const row of rows) {
    inputTokens += row.tokens_in ?? 0;
    outputTokens += row.tokens_out ?? 0;
  }
  return (
    (inputTokens / 1_000_000) * PRICE_INPUT_PER_M +
    (outputTokens / 1_000_000) * PRICE_OUTPUT_PER_M
  );
}

export function isWithinBudget(spendUsd: number): boolean {
  const limit = Number(process.env.AI_STORY_DAILY_BUDGET_USD) || DEFAULT_BUDGET_USD;
  return spendUsd < limit;
}

/**
 * Sums today's generation spend from the DB and checks it against the budget.
 * Runs on every AI route call; if the budget's hit the route returns 503.
 */
export async function isDailySpendWithinBudget(
  supabase: import("@supabase/supabase-js").SupabaseClient
): Promise<{ withinBudget: boolean; spendUsd: number }> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("ai_generations")
    .select("tokens_in, tokens_out")
    .gt("created_at", startOfDay.toISOString());

  if (error) {
    throw new Error(`budget query failed: ${error.message}`);
  }

  const spendUsd = estimateDailySpendUsd(data ?? []);
  return { withinBudget: isWithinBudget(spendUsd), spendUsd };
}
