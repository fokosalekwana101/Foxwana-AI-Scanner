import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { analysisSchema, analysisJsonSchema, type Analysis } from "./foxwana/schema";
import { buildInstructions } from "./foxwana/prompt";

const MAX_DATAURL = 8 * 1024 * 1024; // ~6MB binary
const dataUrl = z
  .string()
  .max(MAX_DATAURL, "Image too large")
  .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, "Unsupported image type");

const input = z.object({
  image: dataUrl,
  htfImage: dataUrl.nullable(),
  mode: z.enum(["crt", "general"]),
  instrument: z.string().max(40),
  market: z.string().max(40),
  timeframe: z.string().max(20),
  htfTimeframe: z.string().max(20),
});

export type ScanResponse =
  | { ok: true; analysis: Analysis }
  | { ok: false; code: string; message: string };

// Best-effort per-instance rate limit.
const hits = new Map<string, number[]>();
function limited(key: string, max = 8, windowMs = 60_000) {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) return true;
  arr.push(now);
  hits.set(key, arr);
  return false;
}

export const scanChart = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data }): Promise<ScanResponse> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false, code: "not_configured", message: "AI not configured." };

    const ip = getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for") ?? "anon";
    if (limited(ip)) return { ok: false, code: "rate_limited", message: "Scan limit reached. Please wait a minute." };

    const { streamJsonResponse, GatewayError } = await import("./ai/gateway.server");
    const content: Record<string, unknown>[] = [
      { type: "input_text", text: "Primary chart (analysis timeframe):" },
      { type: "input_image", image_url: data.image },
    ];
    if (data.htfImage) {
      content.push({ type: "input_text", text: "Higher-timeframe confirmation chart:" });
      content.push({ type: "input_image", image_url: data.htfImage });
    }

    try {
      const text = await streamJsonResponse({
        apiKey,
        instructions: buildInstructions({ ...data, hasHtf: !!data.htfImage }),
        content,
        schemaName: "foxwana_analysis",
        schema: analysisJsonSchema,
      });
      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        return { ok: false, code: "invalid_response", message: "The AI returned an unreadable result. Please retry." };
      }
      const parsed = analysisSchema.safeParse(raw);
      if (!parsed.success) {
        console.error("Schema validation failed", parsed.error.issues.slice(0, 5));
        return { ok: false, code: "invalid_response", message: "The AI result failed validation. Please retry." };
      }
      return { ok: true, analysis: parsed.data };
    } catch (e) {
      if (e instanceof GatewayError) return { ok: false, code: e.code, message: e.message };
      console.error(e);
      return { ok: false, code: "upstream", message: "Something went wrong. Please retry." };
    }
  });
