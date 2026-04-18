import { describe, it, expect, vi } from "vitest";
import { checkRateLimit, recordGeneration, DAILY_LIMIT } from "./rate-limit";

function makeMockClient(usageCount: number) {
  const gt = vi.fn().mockResolvedValue({ count: usageCount, error: null });
  const inFn = vi.fn().mockReturnValue({ gt });
  const eq = vi.fn().mockReturnValue({ in: inFn });
  const select = vi.fn().mockReturnValue({ eq });
  const insert = vi.fn().mockResolvedValue({ error: null });
  return {
    from: vi.fn().mockReturnValue({ select, insert }),
  } as unknown as import("@supabase/supabase-js").SupabaseClient;
}

describe("checkRateLimit", () => {
  it("returns allowed=true when under the daily limit", async () => {
    const supabase = makeMockClient(5);
    const result = await checkRateLimit(supabase, "user-1");
    expect(result.allowed).toBe(true);
    expect(result.used).toBe(5);
    expect(result.remaining).toBe(DAILY_LIMIT - 5);
  });

  it("returns allowed=false when at the daily limit", async () => {
    const supabase = makeMockClient(DAILY_LIMIT);
    const result = await checkRateLimit(supabase, "user-1");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("returns allowed=false when over the daily limit", async () => {
    const supabase = makeMockClient(DAILY_LIMIT + 10);
    const result = await checkRateLimit(supabase, "user-1");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("queries the ai_generations table", async () => {
    const supabase = makeMockClient(0);
    await checkRateLimit(supabase, "user-1");
    expect(vi.mocked(supabase.from)).toHaveBeenCalledWith("ai_generations");
  });
});

describe("recordGeneration", () => {
  it("inserts an ai_generations row with the given kind and token counts", async () => {
    const supabase = makeMockClient(0);
    await recordGeneration(supabase, {
      userId: "user-1",
      kind: "chapter",
      storyId: "story-1",
      chapterId: null,
      model: "gemini-2.5-flash",
      tokensIn: 1000,
      tokensOut: 2000,
    });

    const from = vi.mocked(supabase.from);
    expect(from).toHaveBeenCalledWith("ai_generations");
    const insert = vi.mocked(from.mock.results[0].value.insert);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        kind: "chapter",
        story_id: "story-1",
        chapter_id: null,
        model: "gemini-2.5-flash",
        tokens_in: 1000,
        tokens_out: 2000,
      })
    );
  });
});
