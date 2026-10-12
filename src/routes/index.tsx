import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, RefreshCw, X, ScanLine, AlertCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ResultView } from "@/components/ResultView";
import { scanChart } from "@/lib/scan.functions";
import { addScan, fileToDataUrl, loadSettings, validateFile, DEFAULT_SETTINGS, type Settings } from "@/lib/storage";
import type { Analysis, AnalysisMode } from "@/lib/foxwana/schema";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FOXWANA AI Scanner — Chart screenshot analysis" },
      { name: "description", content: "Upload an MT5 or TradingView screenshot and get a FOXWANA CRT analysis: BUY, SELL or WAIT." },
      { property: "og:title", content: "FOXWANA AI Scanner" },
      { property: "og:description", content: "Screenshot-based CRT chart analysis with strict rule checks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Scanner,
});

type Pick = { file: File; preview: string } | null;
type Done = { analysis: Analysis; mode: AnalysisMode; minRR: number; hasHtf: boolean; instrument: string; timeframe: string };

function Scanner() {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  const [main, setMain] = useState<Pick>(null);
  const [htf, setHtf] = useState<Pick>(null);
  const [mode, setMode] = useState<AnalysisMode>("crt");
  const [instrument, setInstrument] = useState("");
  const [market, setMarket] = useState("Forex");
  const [tf, setTf] = useState("");
  const [htfTf, setHtfTf] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [err, setErr] = useState<{ code: string; message: string } | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const busy = useRef(false);
  const scan = useServerFn(scanChart);

  useEffect(() => {
    const l = loadSettings();
    setS(l);
    setMode(l.mode);
    setMarket(l.market);
    setTf(l.timeframe);
    setHtfTf(l.htfTimeframe);
  }, []);

  function pick(set: (p: Pick) => void) {
    return (f: File | undefined) => {
      if (!f) return;
      const v = validateFile(f);
      if (v) {
        setErr({ code: "invalid_image", message: v });
        setState("error");
        return;
      }
      setErr(null);
      if (state === "error") setState("idle");
      set({ file: f, preview: URL.createObjectURL(f) });
    };
  }

  async function run() {
    if (!main || busy.current) return;
    busy.current = true;
    setState("loading");
    setErr(null);
    try {
      const [image, htfImage, thumb] = await Promise.all([
        fileToDataUrl(main.file),
        htf ? fileToDataUrl(htf.file) : Promise.resolve(null),
        fileToDataUrl(main.file, 360, 0.6),
      ]);
      const r = await scan({ data: { image, htfImage, mode, instrument, market, timeframe: tf, htfTimeframe: htfTf } });
      if (!r.ok) {
        setErr({ code: r.code, message: r.message });
        setState("error");
        return;
      }
      const d: Done = { analysis: r.analysis, mode, minRR: s.minRR, hasHtf: !!htf, instrument, timeframe: tf };
      addScan({
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        mode,
        instrument: r.analysis.instrument ?? instrument,
        timeframe: r.analysis.timeframe ?? tf,
        thumb,
        analysis: r.analysis,
        minRR: s.minRR,
        hasHtf: !!htf,
      });
      setDone(d);
      setState("done");
    } catch (e) {
      setErr({ code: "network", message: e instanceof Error ? e.message : "Network error. Please retry." });
      setState("error");
    } finally {
      busy.current = false;
    }
  }

  if (state === "done" && done) {
    return (
      <AppShell>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Scan result</h1>
          <button onClick={() => { setState("idle"); setDone(null); }} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-secondary">New scan</button>
        </div>
        <ResultView analysis={done.analysis} mode={done.mode} minRR={done.minRR} hasHtf={done.hasHtf} fallbackInstrument={done.instrument} fallbackTimeframe={done.timeframe} riskPercent={s.riskPercent} accountBalance={s.accountBalance} />
      </AppShell>
    );
  }

  const field = "w-full rounded-lg border bg-input/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <AppShell>
      <h1 className="text-2xl font-bold tracking-tight">Scan a chart</h1>
      <p className="mb-5 text-sm text-muted-foreground">Upload a screenshot from MT5 or TradingView. Make sure the price axis is visible.</p>

      <Drop label="Chart screenshot" value={main} onPick={pick(setMain)} onClear={() => setMain(null)} big />

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1">
        {(["crt", "general"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={cn("rounded-lg py-2 text-sm font-medium", mode === m ? "bg-background text-foreground" : "text-muted-foreground")}>
            {m === "crt" ? "FOXWANA CRT" : "General AI"}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <input className={field} placeholder="Instrument" value={instrument} onChange={(e) => setInstrument(e.target.value)} maxLength={40} />
        <select className={field} value={market} onChange={(e) => setMarket(e.target.value)}>
          {["Forex", "Indices", "Metals", "Crypto", "Stocks", "Commodities"].map((m) => <option key={m}>{m}</option>)}
        </select>
        <select className={field} value={tf} onChange={(e) => setTf(e.target.value)}>
          <option value="">Timeframe</option>
          {TFS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Optional — used when the AI cannot read them from the chart.</p>

      <details className="mt-4 panel p-3">
        <summary className="cursor-pointer text-sm font-medium">Higher-timeframe confirmation (optional)</summary>
        <div className="mt-3 space-y-2">
          <Drop label="HTF screenshot" value={htf} onPick={pick(setHtf)} onClear={() => setHtf(null)} />
          <select className={field} value={htfTf} onChange={(e) => setHtfTf(e.target.value)}>
            <option value="">HTF timeframe</option>
            {TFS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </details>

      {state === "error" && err && (
        <div className="mt-4 flex gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
          <div className="flex-1">
            <div className="font-medium">{err.code === "not_configured" ? "AI not configured" : err.code === "invalid_image" ? "Invalid image" : "Scan failed"}</div>
            <div className="text-muted-foreground">{err.message}</div>
          </div>
          {main && err.code !== "invalid_image" && err.code !== "not_configured" && (
            <button onClick={run} className="flex items-center gap-1 self-start text-primary"><RefreshCw className="h-4 w-4" />Retry</button>
          )}
        </div>
      )}

      <button
        onClick={run}
        disabled={!main || state === "loading"}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-lg font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
      >
        {state === "loading" ? <><Loader2 className="h-5 w-5 animate-spin" />Analysing chart…</> : <><ScanLine className="h-5 w-5" />Scan Chart</>}
      </button>
      {state === "loading" && <p className="mt-2 text-center text-xs text-muted-foreground">This usually takes 15–40 seconds.</p>}
    </AppShell>
  );
}

const TFS = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"];

function Drop({ label, value, onPick, onClear, big }: { label: string; value: Pick; onPick: (f: File | undefined) => void; onClear: () => void; big?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" aria-label={label} onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = ""; }} />
      {value ? (
        <div className="relative overflow-hidden rounded-2xl border bg-surface">
          <img src={value.preview} alt={label} className="max-h-80 w-full object-contain" />
          <div className="absolute right-2 top-2 flex gap-2">
            <button onClick={() => ref.current?.click()} className="rounded-lg bg-background/80 px-3 py-1.5 text-xs backdrop-blur">Replace</button>
            <button onClick={onClear} aria-label="Remove" className="rounded-lg bg-background/80 p-1.5 backdrop-blur"><X className="h-4 w-4" /></button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => ref.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); onPick(e.dataTransfer.files?.[0]); }}
          className={cn("flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-surface text-muted-foreground hover:border-primary/60 hover:text-foreground", big ? "h-56" : "h-28")}
        >
          <ImagePlus className="h-7 w-7" />
          <span className="text-sm">{label}</span>
          <span className="text-xs">PNG, JPG or WEBP · max 10 MB</span>
        </button>
      )}
    </div>
  );
}
