/**
 * FOXWANA rule engine. Pure, deterministic and independent of the AI provider.
 * The AI only reports observations; these rules decide BUY / SELL / WAIT.
 */
import type { Analysis, AnalysisMode, CheckKey } from "./schema";

export interface RuleConfig {
  minRR: number;
  requiredChecks: Record<AnalysisMode, CheckKey[]>;
}

export const DEFAULT_RULES: RuleConfig = {
  minRR: 1.5,
  requiredChecks: {
    crt: ["crt_range", "liquidity_sweep", "reclaim_rejection", "market_structure"],
    general: ["market_structure"],
  },
};

export type Decision = "BUY" | "SELL" | "WAIT";
export type Strength = "strong" | "moderate" | "weak" | "none";

export interface RuleResult {
  rule: string;
  passed: boolean;
  detail: string;
}

export interface Levels {
  entryLow: number;
  entryHigh: number;
  entryMid: number;
  stopLoss: number;
  tp1: number;
  tp2: number | null;
  crtTarget: number | null;
  rr1: number;
  rr2: number | null;
  rrCrt: number | null;
}

export interface Evaluation {
  decision: Decision;
  strength: Strength;
  rules: RuleResult[];
  levels: Levels | null;
  failedReasons: string[];
}

export function riskReward(entry: number, stop: number, target: number): number {
  const risk = Math.abs(entry - stop);
  if (risk === 0) return 0;
  return Math.abs(target - entry) / risk;
}

export function evaluate(a: Analysis, mode: AnalysisMode, cfg: RuleConfig = DEFAULT_RULES, hasHtf = false): Evaluation {
  const rules: RuleResult[] = [];
  const add = (rule: string, passed: boolean, detail: string) => rules.push({ rule, passed, detail });

  add("Readable chart", a.image_valid, a.image_valid ? "Chart recognised" : a.image_issue ?? "Image is not a usable chart");
  add(
    "Price scale readable",
    a.price_scale_visible && a.price_readability === "clear",
    a.price_readability === "clear" ? "Prices readable" : "Prices could not be read reliably",
  );

  const statusOf = (k: CheckKey) => a.checks.find((c) => c.key === k)?.status ?? "unverified";
  for (const k of cfg.requiredChecks[mode]) {
    const s = statusOf(k);
    add(`Required: ${k}`, s === "pass", s === "pass" ? "Observed" : s === "fail" ? "Failed" : "Could not be verified");
  }
  if (hasHtf) {
    const s = statusOf("htf_alignment");
    add("Higher timeframe not conflicting", s !== "fail", s === "fail" ? "HTF conflicts with setup" : "No HTF conflict");
  }

  const p = a.proposed;
  const dir = p.direction;
  add("Direction proposed", dir !== "none", dir === "none" ? "No directional setup" : `Proposed ${dir}`);
  const biasOk = (dir === "buy" && a.bias === "bullish") || (dir === "sell" && a.bias === "bearish");
  if (dir !== "none") add("Direction matches bias", biasOk, `Bias is ${a.bias}`);

  let levels: Levels | null = null;
  const have = p.entry_low != null && p.entry_high != null && p.stop_loss != null && p.tp1 != null;
  if (dir !== "none") add("All levels readable", have, have ? "Entry, stop and TP1 supplied" : "Missing price levels");

  if (dir !== "none" && have) {
    const entryLow = Math.min(p.entry_low!, p.entry_high!);
    const entryHigh = Math.max(p.entry_low!, p.entry_high!);
    const entryMid = (entryLow + entryHigh) / 2;
    const sl = p.stop_loss!;
    const tp1 = p.tp1!;
    const isBuy = dir === "buy";
    const geometry = isBuy ? sl < entryLow && tp1 > entryHigh : sl > entryHigh && tp1 < entryLow;
    add("Stop and target on correct sides", geometry, geometry ? "Geometry valid" : "Stop/target placement inconsistent");

    const { range_high: hi, range_low: lo } = a.crt;
    let crtTarget: number | null = null;
    if (mode === "crt") {
      const rangeOk = hi != null && lo != null && hi > lo;
      add("CRT boundaries readable", rangeOk, rangeOk ? `Range ${lo} – ${hi}` : "CRT high/low not readable");
      if (rangeOk) {
        crtTarget = isBuy ? hi! : lo!;
        const slBeyond = isBuy ? sl <= lo! : sl >= hi!;
        add("Stop beyond CRT invalidation", slBeyond, slBeyond ? "Stop beyond swept boundary" : "Stop inside the CRT range");
        const inRange = entryMid > lo! && entryMid < hi!;
        add("Entry back inside range", inRange, inRange ? "Entry inside reclaimed range" : "Entry outside CRT range");
      }
    }

    const rr1 = riskReward(entryMid, sl, tp1);
    const tp2 = p.tp2 ?? null;
    const tp2Ok = tp2 != null && (isBuy ? tp2 > tp1 : tp2 < tp1);
    const rr2 = tp2Ok ? riskReward(entryMid, sl, tp2!) : null;
    const rrCrt = crtTarget != null && (isBuy ? crtTarget > entryHigh : crtTarget < entryLow) ? riskReward(entryMid, sl, crtTarget) : null;
    add(`Risk-to-reward ≥ ${cfg.minRR}`, rr1 >= cfg.minRR, `TP1 R:R ${rr1.toFixed(2)}`);
    levels = { entryLow, entryHigh, entryMid, stopLoss: sl, tp1, tp2: tp2Ok ? tp2 : null, crtTarget: rrCrt != null ? crtTarget : null, rr1, rr2, rrCrt };
  }

  const failed = rules.filter((r) => !r.passed);
  const decision: Decision = failed.length === 0 && levels ? (dir === "buy" ? "BUY" : "SELL") : "WAIT";

  let strength: Strength = "none";
  if (decision !== "WAIT") {
    const optional = a.checks.filter((c) => !cfg.requiredChecks[mode].includes(c.key));
    const passes = optional.filter((c) => c.status === "pass").length;
    const fails = optional.filter((c) => c.status === "fail").length + a.conflicting.length;
    const score = passes - fails;
    strength = score >= 3 ? "strong" : score >= 1 ? "moderate" : "weak";
  }

  return { decision, strength, rules, levels: decision === "WAIT" ? levels : levels, failedReasons: failed.map((r) => `${r.rule}: ${r.detail}`) };
}
