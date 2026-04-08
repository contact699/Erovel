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
