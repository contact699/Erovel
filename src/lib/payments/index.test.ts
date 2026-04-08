import { describe, it, expect } from "vitest";
import { computePaymentSnapshot } from "./index";

const PLATFORM_PAYEE_ID = "platform-id";
const CREATOR_PAYEE_ID = "creator-id";

describe("computePaymentSnapshot", () => {
  it("returns snapshot for a tip with no rules", () => {
    const result = computePaymentSnapshot({
      gross: 10.0,
      rules: [],
      residualPayeeId: CREATOR_PAYEE_ID,
      platformPayeeId: PLATFORM_PAYEE_ID,
      platformFeePct: 0,
    });

    expect(result).toEqual([
      { payee_id: CREATOR_PAYEE_ID, amount: 10.0, basis: "residual" },
    ]);
  });
});
