import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isFeatureEnabled, isDailySpendWithinBudget } from "./guards";
import { checkRateLimit } from "./rate-limit";

/**
 * Single gate used by every /api/ai/story/* POST route.
 * Runs in order: feature-flag, auth, verified, daily budget, per-user rate-limit.
 * Returns either a ready-to-use admin client + userId, or an NextResponse
 * the caller should return directly.
 */
export async function requireAiAccess(opts: { checkRateLimit: boolean } = { checkRateLimit: true }): Promise<
  | { ok: true; supabase: SupabaseClient; userId: string; remaining: number }
  | { ok: false; response: NextResponse }
> {
  if (!isFeatureEnabled()) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "AI wizard is currently disabled" },
        { status: 503 }
      ),
    };
  }

  const authSupabase = await createServerSupabaseClient();
  if (!authSupabase) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      ),
    };
  }

  const {
    data: { user },
  } = await authSupabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile } = await authSupabase
    .from("profiles")
    .select("is_verified, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Profile missing" }, { status: 404 }),
    };
  }
  if (!profile.is_verified) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Get verified to use AI writing" },
        { status: 403 }
      ),
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not configured" }, { status: 503 }),
    };
  }
  const admin = createClient(url, serviceKey);

  const budget = await isDailySpendWithinBudget(admin);
  if (!budget.withinBudget) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "AI writing is temporarily disabled — daily budget reached. Resets at 00:00 UTC.",
          spendUsd: budget.spendUsd,
        },
        { status: 503 }
      ),
    };
  }

  if (opts.checkRateLimit) {
    const rl = await checkRateLimit(admin, user.id);
    if (!rl.allowed) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: `Daily generation limit reached (${rl.used}/100). Resets at ${rl.resetAt}.`,
            used: rl.used,
            remaining: rl.remaining,
            resetAt: rl.resetAt,
          },
          { status: 429, headers: { "x-ratelimit-reset": rl.resetAt } }
        ),
      };
    }
    return { ok: true, supabase: admin, userId: user.id, remaining: rl.remaining };
  }

  return { ok: true, supabase: admin, userId: user.id, remaining: -1 };
}
