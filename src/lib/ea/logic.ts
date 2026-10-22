/**
 * FOXWANA EA pure decision helpers — no IO, no provider, unit-tested.
 * The MQL5 EA implements the same rules locally; these mirror them for the
 * dashboard and future backend validation.
 */

export interface PropRiskInput {
  /** Account equity/balance in account currency. */
  balance: number;
  /** Signed P/L realised today (losses negative). */
  dailyPnL: number;
  /** Prop-firm daily drawdown allowance (max loss before breach), account currency. */
  propDdDailyLimit: number;
  /** Fraction of the remaining daily allowance to risk (default 60%). */
  fraction: number;
  /** Hard safety cap as percent of balance. */
  hardMaxPercent: number;
}

/** 60% of the remaining daily drawdown allowance, subject to the hard cap. */
export function propRiskAmount(i: PropRiskInput): number {
  const remaining = Math.max(0, i.propDdDailyLimit + Math.min(0, i.dailyPnL));
  const raw = remaining * i.fraction;
  const cap = (Math.max(0, i.balance) * i.hardMaxPercent) / 100;
  return Math.max(0, Math.min(raw, cap));
}

export interface RealRiskInput {
  balance: number;
  realRiskPercent: number;
  hardMaxPercent: number;
}

/** Independently configurable real-account risk, still under the hard cap. */
export function realRiskAmount(i: RealRiskInput): number {
  const raw = (Math.max(0, i.balance) * i.realRiskPercent) / 100;
  const cap = (Math.max(0, i.balance) * i.hardMaxPercent) / 100;
  return Math.max(0, Math.min(raw, cap));
}

/** Price level at which the stop moves to break-even (55% of distance to target by default). */
export function breakEvenTrigger(entry: number, target: number, coveragePercent: number): number {
  return entry + ((target - entry) * coveragePercent) / 100;
}

export interface EntryGate {
  connectionStatus: "connected" | "disconnected" | "running" | "paused" | "error";
  emergencyStop: boolean;
  lossesToday: number;
  maxDailyLosses: number;
  openTrades: number;
  maxOpenTrades: number;
  strategyEnabled: boolean;
}

export type EntryVerdict = { ok: true } | { ok: false; reason: string };

/** Central gate for opening new trades. Never returns ok when status is not verified healthy. */
export function entryGate(g: EntryGate): EntryVerdict {
  if (g.connectionStatus === "disconnected" || g.connectionStatus === "error") {
    return { ok: false, reason: g.connectionStatus === "error" ? "EA reported an error" : "MT5 bridge disconnected" };
  }
  if (g.emergencyStop) return { ok: false, reason: "Emergency stop active" };
  if (!g.strategyEnabled) return { ok: false, reason: "Strategy disabled" };
  if (g.lossesToday >= g.maxDailyLosses) return { ok: false, reason: "Daily loss limit reached" };
  if (g.openTrades >= g.maxOpenTrades) return { ok: false, reason: "Max open trades reached" };
  return { ok: true };
}

/** Trade result bucket for the daily loss counter and history display. */
export function tradeResult(pnl: number | null): "win" | "loss" | "breakeven" | "unknown" {
  if (pnl == null) return "unknown";
  if (pnl > 0) return "win";
  if (pnl < 0) return "loss";
  return "breakeven";
}
