import type { SplitEntry, SplitRule } from "@/lib/types";

interface ResolveSplitsInput {
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
 *   2. Apply pct rules (priority asc) against current remainder.
 *   3. Apply platform fee against gross UNLESS an explicit rule already
 *      names the platform payee.
 *   4. Residual payee absorbs whatever's left.
 *
 * Negative gross (refunds) negate every entry symmetrically.
 *
 * INVARIANT: snapshot.reduce((s, e) => s + e.amount, 0) === gross
 *            (within 0.01 tolerance for floating point, then snapped to gross)
 */
export function resolveSplits(input: ResolveSplitsInput): SplitEntry[] {
  const { gross, rules, residualPayeeId, platformPayeeId, platformFeePct } = input;

  const snapshot: SplitEntry[] = [];
  let remaining = gross;

  // Sort by priority asc, then by basis (fixed before pct within a priority)
  const sorted = [...rules].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.basis_fixed !== null && b.basis_fixed === null) return -1;
    if (a.basis_fixed === null && b.basis_fixed !== null) return 1;
    return 0;
  });

  // Step 1: fixed rules
  for (const rule of sorted) {
    if (rule.basis_fixed === null) continue;
    const amount = round2(rule.basis_fixed);
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

  // Step 3: platform fee (only if not already explicit)
  const platformAlreadyInRules = rules.some(r => r.payee_id === platformPayeeId);
  if (!platformAlreadyInRules && platformFeePct > 0) {
    const amount = round2(gross * (platformFeePct / 100));
    snapshot.push({
      payee_id: platformPayeeId,
      amount,
      basis: "pct",
      pct: platformFeePct,
    });
    remaining = round2(remaining - amount);
  }

  // Step 4: residual
  snapshot.push({
    payee_id: residualPayeeId,
    amount: round2(remaining),
    basis: "residual",
  });

  // Invariant check
  const sum = snapshot.reduce((s, e) => s + e.amount, 0);
  if (Math.abs(sum - gross) > 0.005) {
    throw new Error(
      `Splits resolver invariant violation: sum ${sum} != gross ${gross}`
    );
  }

  return snapshot;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
