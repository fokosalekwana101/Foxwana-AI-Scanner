import { describe, it, expect } from "vitest";
import { evaluate, riskReward } from "./rules";
import type { Analysis } from "./schema";

function base(): Analysis {
  return {
    image_valid: true,
    image_issue: null,
    instrument: "EURUSD",
    timeframe: "H1",
    identification_confidence: "high",
    price_scale_visible: true,
    price_readability: "clear",
    current_price: 1.085,
    bias: "bullish",
    crt: { range_high: 1.09, range_low: 1.08, reference_candle: "H4" },
    checks: [
      { key: "crt_range", status: "pass", observation: "" },
      { key: "liquidity_sweep", status: "pass", observation: "" },
      { key: "reclaim_rejection", status: "pass", observation: "" },
      { key: "market_structure", status: "pass", observation: "" },
    ],
    proposed: { direction: "buy", entry_low: 1.082, entry_high: 1.083, stop_loss: 1.079, tp1: 1.088, tp2: 1.095 },
    supporting: [],
    conflicting: [],
    missing_info: [],
    invalidation: null,
    summary: "",
  };
}

describe("FOXWANA rules", () => {
  it("computes risk-to-reward", () => {
    expect(riskReward(100, 90, 120)).toBe(2);
  });
  it("valid CRT buy returns BUY with CRT high as target", () => {
    const r = evaluate(base(), "crt");
    expect(r.decision).toBe("BUY");
    expect(r.levels?.crtTarget).toBe(1.09);
  });
  it("unreadable prices force WAIT", () => {
    const a = base();
    a.price_readability = "partial";
    expect(evaluate(a, "crt").decision).toBe("WAIT");
  });
  it("missing liquidity sweep forces WAIT in CRT mode", () => {
    const a = base();
    a.checks[1]!.status = "unverified";
    expect(evaluate(a, "crt").decision).toBe("WAIT");
  });
  it("stop inside CRT range forces WAIT", () => {
    const a = base();
    a.proposed.stop_loss = 1.081;
    expect(evaluate(a, "crt").decision).toBe("WAIT");
  });
  it("R:R below 1.5 forces WAIT", () => {
    const a = base();
    a.proposed.tp1 = 1.084; // rr ≈ 0.43
    expect(evaluate(a, "crt").decision).toBe("WAIT");
  });
  it("direction against bias forces WAIT", () => {
    const a = base();
    a.bias = "bearish";
    expect(evaluate(a, "crt").decision).toBe("WAIT");
  });
});
