import { describe, expect, it } from "vitest";
import { breakEvenTrigger, entryGate, propRiskAmount, realRiskAmount, tradeResult } from "./logic";

describe("propRiskAmount", () => {
  it("risks 60% of the remaining daily drawdown allowance", () => {
    expect(propRiskAmount({ balance: 10_000, dailyPnL: 0, propDdDailyLimit: 5_000, fraction: 0.6, hardMaxPercent: 1 })).toBe(3_000);
  });

  it("shrinks with losses already taken today", () => {
    // 5000 limit, 1200 lost -> remaining 3800 -> 60% = 2280
    expect(propRiskAmount({ balance: 10_000, dailyPnL: -1_200, propDdDailyLimit: 5_000, fraction: 0.6, hardMaxPercent: 1 })).toBe(2_280);
  });

  it("never risks beyond the hard safety cap", () => {
    expect(propRiskAmount({ balance: 10_000, dailyPnL: 0, propDdDailyLimit: 50_000, fraction: 0.6, hardMaxPercent: 1 })).toBe(100);
  });

  it("never goes negative when the daily allowance is exhausted", () => {
    expect(propRiskAmount({ balance: 10_000, dailyPnL: -6_000, propDdDailyLimit: 5_000, fraction: 0.6, hardMaxPercent: 1 })).toBe(0);
  });
});

describe("realRiskAmount", () => {
  it("uses the independently configured real-account percent", () => {
    expect(realRiskAmount({ balance: 10_000, realRiskPercent: 0.5, hardMaxPercent: 1 })).toBe(50);
  });

  it("is capped by the hard safety limit", () => {
    expect(realRiskAmount({ balance: 10_000, realRiskPercent: 5, hardMaxPercent: 1 })).toBe(100);
  });
});

describe("breakEvenTrigger", () => {
  it("moves to break-even after 55% of the distance to target (buy)", () => {
    expect(breakEvenTrigger(2_400, 2_500, 55)).toBeCloseTo(2_455);
  });

  it("works for sell setups where the target is below entry", () => {
    expect(breakEvenTrigger(2_500, 2_400, 55)).toBeCloseTo(2_445);
  });
});

describe("entryGate", () => {
  const base = {
    connectionStatus: "running" as const,
    emergencyStop: false,
    lossesToday: 0,
    maxDailyLosses: 2,
    openTrades: 0,
    maxOpenTrades: 1,
    strategyEnabled: true,
  };

  it("allows entries when healthy", () => {
    expect(entryGate(base)).toEqual({ ok: true });
  });

  it("blocks entries while disconnected or in error", () => {
    expect(entryGate({ ...base, connectionStatus: "disconnected" })).toEqual({ ok: false, reason: "MT5 bridge disconnected" });
    expect(entryGate({ ...base, connectionStatus: "error" })).toEqual({ ok: false, reason: "EA reported an error" });
  });

  it("blocks entries under emergency stop", () => {
    expect(entryGate({ ...base, emergencyStop: true })).toEqual({ ok: false, reason: "Emergency stop active" });
  });

  it("stops opening new trades after two losses", () => {
    expect(entryGate({ ...base, lossesToday: 2 })).toEqual({ ok: false, reason: "Daily loss limit reached" });
    expect(entryGate({ ...base, lossesToday: 1 })).toEqual({ ok: true });
  });

  it("respects the open-trade limit", () => {
    expect(entryGate({ ...base, openTrades: 1 })).toEqual({ ok: false, reason: "Max open trades reached" });
  });
});

describe("tradeResult", () => {
  it("buckets pnl", () => {
    expect(tradeResult(10)).toBe("win");
    expect(tradeResult(-10)).toBe("loss");
    expect(tradeResult(0)).toBe("breakeven");
    expect(tradeResult(null)).toBe("unknown");
  });
});
