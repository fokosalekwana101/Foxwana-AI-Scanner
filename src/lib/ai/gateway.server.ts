/** Lovable AI Gateway provider (Responses API, streamed). Server-only. */
const GATEWAY = "https://ai.gateway.lovable.dev/v1/responses";
export const VISION_MODEL = "openai/gpt-6-astra";

export class GatewayError extends Error {
  constructor(public code: "not_configured" | "rate_limited" | "credits" | "denied" | "refused" | "bad_request" | "upstream", message: string) {
    super(message);
  }
}

export async function streamJsonResponse(opts: {
  apiKey: string;
  instructions: string;
  content: Record<string, unknown>[];
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<string> {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": opts.apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: VISION_MODEL,
      instructions: opts.instructions,
      input: [{ role: "user", content: opts.content }],
      stream: true,
      store: false,
      reasoning: { effort: "medium", summary: "auto" },
      include: ["reasoning.encrypted_content"],
      text: { format: { type: "json_schema", name: opts.schemaName, strict: true, schema: opts.schema } },
    }),
  });

  if (!res.ok || !res.body) {
    let msg = "";
    try {
      const j = (await res.json()) as { message?: string; error?: { message?: string } };
      msg = j.message ?? j.error?.message ?? "";
    } catch {
      /* ignore */
    }
    console.error("AI gateway error", res.status, msg);
    if (res.status === 401) throw new GatewayError("not_configured", "AI is not configured.");
    if (res.status === 429) throw new GatewayError("rate_limited", "Too many scans right now. Please wait a minute and retry.");
    if (res.status === 402) throw new GatewayError("credits", msg || "AI credits are exhausted for this workspace.");
    if (res.status === 403) throw new GatewayError("denied", msg || "The AI provider denied this request.");
    if (res.status === 400) throw new GatewayError("bad_request", "The AI could not process this image.");
    throw new GatewayError("upstream", "The AI service is temporarily unavailable. Please retry.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let text = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        let ev: { type?: string; delta?: string; response?: { error?: { message?: string } }; message?: string };
        try {
          ev = JSON.parse(data);
        } catch {
          continue;
        }
        if (ev.type === "response.output_text.delta" && ev.delta) text += ev.delta;
        else if (ev.type === "response.refusal.delta" || ev.type === "response.refusal.done")
          throw new GatewayError("refused", "The AI declined to analyse this image.");
        else if (ev.type === "response.failed" || ev.type === "error") {
          console.error("AI stream failure", data);
          throw new GatewayError("upstream", "The AI analysis failed. Please retry.");
        }
      }
    }
  }
  if (!text.trim()) throw new GatewayError("upstream", "The AI returned an empty result. Please retry.");
  return text;
}
