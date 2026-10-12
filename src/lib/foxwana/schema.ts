import { z } from "zod";

/** Evidence check keys the AI must report on. The rule engine decides which are required. */
export const CHECK_KEYS = [
  "crt_range",
  "liquidity_sweep",
  "reclaim_rejection",
  "market_structure",
  "fvg",
  "order_block",
  "htf_alignment",
  "reaction_area",
] as const;
export type CheckKey = (typeof CHECK_KEYS)[number];

export const CHECK_LABELS: Record<CheckKey, string> = {
  crt_range: "CRT range identified",
  liquidity_sweep: "Liquidity sweep",
  reclaim_rejection: "Rejection / reclaim",
  market_structure: "Market structure",
  fvg: "Fair value gap",
  order_block: "Order block",
  htf_alignment: "Higher-timeframe alignment",
  reaction_area: "Meaningful reaction area",
};

const num = z.number().finite().nullable();

export const analysisSchema = z.object({
  image_valid: z.boolean(),
  image_issue: z.string().nullable(),
  instrument: z.string().nullable(),
  timeframe: z.string().nullable(),
  identification_confidence: z.enum(["high", "medium", "low", "none"]),
  price_scale_visible: z.boolean(),
  price_readability: z.enum(["clear", "partial", "unreadable"]),
  current_price: num,
  bias: z.enum(["bullish", "bearish", "neutral"]),
  crt: z.object({
    range_high: num,
    range_low: num,
    reference_candle: z.string().nullable(),
  }),
  checks: z.array(
    z.object({
      key: z.enum(CHECK_KEYS),
      status: z.enum(["pass", "fail", "unverified"]),
      observation: z.string(),
    }),
  ),
  proposed: z.object({
    direction: z.enum(["buy", "sell", "none"]),
    entry_low: num,
    entry_high: num,
    stop_loss: num,
    tp1: num,
    tp2: num,
  }),
  supporting: z.array(z.string()),
  conflicting: z.array(z.string()),
  missing_info: z.array(z.string()),
  invalidation: z.string().nullable(),
  summary: z.string(),
});

export type Analysis = z.infer<typeof analysisSchema>;

const nNum = { type: ["number", "null"] };
const nStr = { type: ["string", "null"] };
const strArr = { type: "array", items: { type: "string" } };
function obj(properties: Record<string, unknown>) {
  return { type: "object", properties, required: Object.keys(properties), additionalProperties: false };
}

/** Strict JSON schema sent to the model (mirrors analysisSchema). */
export const analysisJsonSchema = obj({
  image_valid: { type: "boolean" },
  image_issue: nStr,
  instrument: nStr,
  timeframe: nStr,
  identification_confidence: { type: "string", enum: ["high", "medium", "low", "none"] },
  price_scale_visible: { type: "boolean" },
  price_readability: { type: "string", enum: ["clear", "partial", "unreadable"] },
  current_price: nNum,
  bias: { type: "string", enum: ["bullish", "bearish", "neutral"] },
  crt: obj({ range_high: nNum, range_low: nNum, reference_candle: nStr }),
  checks: {
    type: "array",
    items: obj({
      key: { type: "string", enum: [...CHECK_KEYS] },
      status: { type: "string", enum: ["pass", "fail", "unverified"] },
      observation: { type: "string" },
    }),
  },
  proposed: obj({
    direction: { type: "string", enum: ["buy", "sell", "none"] },
    entry_low: nNum,
    entry_high: nNum,
    stop_loss: nNum,
    tp1: nNum,
    tp2: nNum,
  }),
  supporting: strArr,
  conflicting: strArr,
  missing_info: strArr,
  invalidation: nStr,
  summary: { type: "string" },
});

export type AnalysisMode = "crt" | "general";

export interface ScanContext {
  mode: AnalysisMode;
  instrument: string;
  market: string;
  timeframe: string;
  htfTimeframe: string;
  hasHtf: boolean;
}
