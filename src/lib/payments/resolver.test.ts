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

    // 0.50 fixed → 1.50 platform (15% of GROSS) → 8.00 residual
    expect(result.find(e => e.basis === "fixed")?.amount).toBe(0.5);
    expect(result.find(e => e.payee_id === PLATFORM_PAYEE_ID)?.amount).toBe(1.5);
    expect(result.find(e => e.basis === "residual")?.amount).toBe(8.0);
    expect(result.reduce((s, e) => s + e.amount, 0)).toBe(10.0);
  });

  it("handles refund (negative gross) symmetrically with no rules", () => {
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

  it("handles refund symmetrically with fixed rule (C3 fix)", () => {
    // Original tip: $10 with $0.50 fixed fee → [+0.50 fee, +1.50 platform, +8.00 creator]
    // Refund: -$10 with same rules → [-0.50 fee, -1.50 platform, -8.00 creator]
    const rules = [
      makeRule({ payee_id: "fee-payee", basis_fixed: 0.5, priority: 0 }),
    ];
    const result = resolveSplits({
      gross: -10.0,
      rules,
      residualPayeeId: CREATOR_PAYEE_ID,
      platformPayeeId: PLATFORM_PAYEE_ID,
      platformFeePct: 15,
    });

    expect(result.find(e => e.basis === "fixed")?.amount).toBe(-0.5);
    expect(result.find(e => e.payee_id === PLATFORM_PAYEE_ID)?.amount).toBe(-1.5);
    expect(result.find(e => e.basis === "residual")?.amount).toBe(-8.0);
    expect(result.reduce((s, e) => s + e.amount, 0)).toBe(-10.0);
  });

  it("residual absorbs sub-cent rounding without losing pennies", () => {
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

  it("multi-tier: priority lower applies first (Maxi vertical example)", () => {
    // priority 0: platform 70%
    // priority 10: external 5% (5% of remaining 30% = 1.5% of gross)
    // priority 20: residual (contractor, 28.5% of gross)
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

    const sum = result.reduce((s, e) => s + e.amount, 0);
    expect(sum).toBe(10.0);
    expect(result.find(e => e.payee_id === PLATFORM_PAYEE_ID)?.amount).toBe(7.0);
  });

  it("preserves exact sum across many awkward grosses", () => {
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

  it("throws on malformed rule (both basis_pct and basis_fixed set) (I2 fix)", () => {
    const rules = [
      makeRule({
        payee_id: "bad-payee",
        basis_pct: 50,
        basis_fixed: 2,
      }),
    ];

    expect(() =>
      resolveSplits({
        gross: 10.0,
        rules,
        residualPayeeId: CREATOR_PAYEE_ID,
        platformPayeeId: PLATFORM_PAYEE_ID,
        platformFeePct: 15,
      })
    ).toThrow(/both basis_pct and basis_fixed/);
  });

  it("throws on malformed rule (neither basis_pct nor basis_fixed) (I2 fix)", () => {
    const rules = [
      makeRule({
        payee_id: "bad-payee",
        basis_pct: null,
        basis_fixed: null,
      }),
    ];

    expect(() =>
      resolveSplits({
        gross: 10.0,
        rules,
        residualPayeeId: CREATOR_PAYEE_ID,
        platformPayeeId: PLATFORM_PAYEE_ID,
        platformFeePct: 15,
      })
    ).toThrow(/neither basis_pct nor basis_fixed/);
  });
});
