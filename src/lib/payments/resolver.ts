import type { SplitEntry, SplitRule } from "@/lib/types";

export interface ResolveSplitsInput {
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
 *      For refunds (gross < 0), fixed amounts are negated to preserve symmetry.
 *   2. Apply pct rules (priority asc) against current remainder.
 *   3. Apply platform fee against gross UNLESS an explicit rule already
 *      names the platform payee.
 *   4. Residual payee absorbs whatever's left, computed as
 *      round2(gross - sumOfNonResidual) to preserve the invariant by
 *      construction (no accumulated rounding drift).
 *
 * INVARIANT: snapshot.reduce((s, e) => s + e.amount, 0) === gross (exactly,
 * to the penny). Enforced both by construction and by an assertion at the end.
 *
 * Throws on malformed rules (both basis_pct and basis_fixed set).
 */
export function resolveSplits(input: ResolveSplitsInput): SplitEntry[] {
  const { gross, rules, residualPayeeId, platformPayeeId, platformFeePct } = input;

  // Validate rules first — fail loudly on malformed input
  for (const rule of rules) {
    if (rule.basis_pct !== null && rule.basis_fixed !== null) {
      throw new Error(
        `Splits resolver: rule ${rule.id} has both basis_pct and basis_fixed set`
      );
    }
    if (rule.basis_pct === null && rule.basis_fixed === null) {
      throw new Error(
        `Splits resolver: rule ${rule.id} has neither basis_pct nor basis_fixed set`
      );
    }
  }

  const snapshot: SplitEntry[] = [];
  let remaining = gross;
  const isRefund = gross < 0;

  // Sort by priority asc. Array.prototype.sort is stable in modern engines,
  // so equal-priority rules retain input order.
  const sorted = [...rules].sort((a, b) => a.priority - b.priority);

  // Step 1: fixed rules (negate for refunds to preserve symmetry)
  for (const rule of sorted) {
    if (rule.basis_fixed === null) continue;
    const signedFixed = isRefund ? -rule.basis_fixed : rule.basis_fixed;
    const amount = round2(signedFixed);
    snapshot.push({ payee_id: rule.payee_id, amount, basis: "fixed" });
    remaining = round2(remaining - amount);
  }

  // Step 2: pct rules (against remainder, not gross)
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

  // Step 3: platform fee (only if not already explicit, and only if > 0)
  const platformAlreadyInRules = rules.some(r => r.payee_id === platformPayeeId);
  if (!platformAlreadyInRules && platformFeePct > 0) {
    // Platform fee is computed against gross (which is negative for refunds,
    // naturally producing a negative platform fee — symmetric)
    const amount = round2(gross * (platformFeePct / 100));
    snapshot.push({
      payee_id: platformPayeeId,
      amount,
      basis: "pct",
      pct: platformFeePct,
    });
  }

  // Step 4: residual — computed subtractively from gross to guarantee
  // sum-equals-gross by construction (no accumulated rounding drift)
  const nonResidualSum = snapshot.reduce((s, e) => s + e.amount, 0);
  snapshot.push({
    payee_id: residualPayeeId,
    amount: round2(gross - nonResidualSum),
    basis: "residual",
  });

  // Defensive invariant check — should be impossible to fail given the
  // construction above, but money handling deserves the assertion
  const sum = snapshot.reduce((s, e) => s + e.amount, 0);
  if (Math.abs(sum - gross) > 0.001) {
    throw new Error(
      `Splits resolver invariant violation: sum ${sum} != gross ${gross}`
    );
  }

  return snapshot;
}

/**
 * Round to two decimal places. Uses Math.sign so the function is symmetric
 * for negatives (i.e. round2(-x) === -round2(x)), preserving refund symmetry.
 */
function round2(n: number): number {
  if (n === 0) return 0;
  return Math.sign(n) * Math.round(Math.abs(n) * 100) / 100;
}
