import { describe, it, expect, vi, beforeEach } from "vitest";
import { isFeatureEnabled, estimateDailySpendUsd, isWithinBudget } from "./guards";

describe("isFeatureEnabled", () => {
  const original = process.env.AI_STORY_WIZARD_ENABLED;
  beforeEach(() => {
    process.env.AI_STORY_WIZARD_ENABLED = original;
  });

  it("returns true when env is 'true'", () => {
    process.env.AI_STORY_WIZARD_ENABLED = "true";
    expect(isFeatureEnabled()).toBe(true);
  });

  it("returns false when env is 'false'", () => {
    process.env.AI_STORY_WIZARD_ENABLED = "false";
    expect(isFeatureEnabled()).toBe(false);
  });

  it("returns false when env is unset", () => {
    delete process.env.AI_STORY_WIZARD_ENABLED;
    expect(isFeatureEnabled()).toBe(false);
  });
});

describe("estimateDailySpendUsd", () => {
  it("sums tokens and applies the Gemini 2.5 Flash price", () => {
    // Gemini 2.5 Flash pricing (as of 2026-04): $0.30/M input, $2.50/M output
    const spend = estimateDailySpendUsd([
      { tokens_in: 1_000_000, tokens_out: 500_000 },
      { tokens_in: 500_000, tokens_out: 200_000 },
    ]);
    // (1.5M * 0.30 / 1M) + (0.7M * 2.50 / 1M) = 0.45 + 1.75 = 2.20
    expect(spend).toBeCloseTo(2.2, 2);
  });

  it("returns 0 for no rows", () => {
    expect(estimateDailySpendUsd([])).toBe(0);
  });
});

describe("isWithinBudget", () => {
  const original = process.env.AI_STORY_DAILY_BUDGET_USD;
  beforeEach(() => {
    process.env.AI_STORY_DAILY_BUDGET_USD = original;
  });

  it("returns true when spend is under the budget", () => {
    process.env.AI_STORY_DAILY_BUDGET_USD = "50";
    expect(isWithinBudget(25)).toBe(true);
  });

  it("returns false when spend has hit the budget", () => {
    process.env.AI_STORY_DAILY_BUDGET_USD = "50";
    expect(isWithinBudget(50)).toBe(false);
    expect(isWithinBudget(60)).toBe(false);
  });

  it("defaults to $50 budget when env is unset", () => {
    delete process.env.AI_STORY_DAILY_BUDGET_USD;
    expect(isWithinBudget(40)).toBe(true);
    expect(isWithinBudget(55)).toBe(false);
  });
});
