import { CheckCircle2, XCircle, HelpCircle, AlertTriangle } from "lucide-react";
import { evaluate, DEFAULT_RULES } from "@/lib/foxwana/rules";
import { CHECK_LABELS, CHECK_KEYS, type Analysis, type AnalysisMode } from "@/lib/foxwana/schema";
import { cn } from "@/lib/utils";

interface Props {
  analysis: Analysis;
  mode: AnalysisMode;
  minRR: number;
  hasHtf: boolean;
  fallbackInstrument: string;
  fallbackTimeframe: string;
  riskPercent?: number;
  accountBalance?: number | null;
}

const fmt = (n: number | null | undefined) => (n == null ? "—" : String(+n.toFixed(6)));

export function ResultView(p: Props) {
  const a = p.analysis;
  const ev = evaluate(a, p.mode, { ...DEFAULT_RULES, minRR: p.minRR }, p.hasHtf);
  const tone = ev.decision === "BUY" ? "text-bull border-bull/40 bg-bull/10" : ev.decision === "SELL" ? "text-bear border-bear/40 bg-bear/10" : "text-wait border-wait/40 bg-wait/10";
  const L = ev.levels;
  const riskAmt = p.accountBalance && p.riskPercent ? (p.accountBalance * p.riskPercent) / 100 : null;

  return (
    <div className="space-y-4">
      <div className={cn("rounded-2xl border p-5", tone)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest opacity-80">Decision</div>
            <div className="text-4xl font-bold tracking-tight">{ev.decision === "WAIT" ? "WAIT" : ev.decision}</div>
            {ev.decision === "WAIT" && <div className="text-sm opacity-90">No valid setup on this chart</div>}
          </div>
          <div className="text-right text-sm text-foreground">
            <div className="font-semibold">{a.instrument ?? (p.fallbackInstrument || "Unknown instrument")}</div>
            <div className="text-muted-foreground">{a.timeframe ?? (p.fallbackTimeframe || "Unknown TF")} · {p.mode === "crt" ? "FOXWANA CRT" : "General"}</div>
            <div className="text-xs text-muted-foreground">ID confidence: {a.identification_confidence}</div>
          </div>
        </div>
        {ev.decision !== "WAIT" && (
          <p className="mt-3 text-sm text-foreground">
            Setup strength: <b className="capitalize">{ev.strength}</b>
            <span className="text-muted-foreground"> — a qualitative rating, not a win probability.</span>
          </p>
        )}
      </div>

      <p className="text-sm text-muted-foreground">{a.summary}</p>

      {L && (
        <section className="panel p-4">
          <h3 className="mb-3 text-sm font-semibold">{ev.decision === "WAIT" ? "Proposed levels (rejected)" : "Trade levels"}</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <Lv k="Entry zone" v={`${fmt(L.entryLow)} – ${fmt(L.entryHigh)}`} />
            <Lv k="Stop-loss" v={fmt(L.stopLoss)} cls="text-bear" />
            <Lv k="TP1" v={`${fmt(L.tp1)} · ${L.rr1.toFixed(2)}R`} cls="text-bull" />
            <Lv k="TP2" v={L.tp2 != null ? `${fmt(L.tp2)} · ${L.rr2!.toFixed(2)}R` : "—"} cls="text-bull" />
            <Lv k="CRT target" v={L.crtTarget != null ? `${fmt(L.crtTarget)} · ${L.rrCrt!.toFixed(2)}R` : "—"} />
            <Lv k="Risk amount" v={riskAmt ? `${riskAmt.toFixed(2)} (${p.riskPercent}%)` : `${p.riskPercent ?? 1}% of account`} />
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">Prices are read from your screenshot by AI — verify them on your platform before acting.</p>
        </section>
      )}

      <section className="panel p-4">
        <h3 className="mb-3 text-sm font-semibold">Evidence checklist <span className="font-normal text-muted-foreground">(AI-observed)</span></h3>
        <ul className="space-y-2">
          {CHECK_KEYS.map((k) => {
            const c = a.checks.find((x) => x.key === k);
            const s = c?.status ?? "unverified";
            const Icon = s === "pass" ? CheckCircle2 : s === "fail" ? XCircle : HelpCircle;
            return (
              <li key={k} className="flex gap-3 text-sm">
                <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", s === "pass" ? "text-bull" : s === "fail" ? "text-bear" : "text-muted-foreground")} />
                <div>
                  <div className="font-medium">{CHECK_LABELS[k]}</div>
                  {c?.observation && <div className="text-muted-foreground">{c.observation}</div>}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel p-4">
        <h3 className="mb-3 text-sm font-semibold">FOXWANA rules <span className="font-normal text-muted-foreground">(rule-verified)</span></h3>
        <ul className="space-y-1.5 text-sm">
          {ev.rules.map((r, i) => (
            <li key={i} className="flex items-start gap-2">
              {r.passed ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-bull" /> : <XCircle className="mt-0.5 h-4 w-4 text-bear" />}
              <span>{r.rule.replace(/^Required: (.*)$/, (_, k) => `Required: ${CHECK_LABELS[k as keyof typeof CHECK_LABELS] ?? k}`)} <span className="text-muted-foreground">— {r.detail}</span></span>
            </li>
          ))}
        </ul>
      </section>

      <List title="Supporting evidence" items={a.supporting} />
      <List title="Conflicting evidence" items={a.conflicting} warn />
      <List title="Missing information" items={a.missing_info} />
      {a.invalidation && (
        <section className="panel p-4 text-sm">
          <h3 className="mb-1 font-semibold">Invalidation</h3>
          <p className="text-muted-foreground">{a.invalidation}</p>
        </section>
      )}
      <p className="text-center text-xs text-muted-foreground">Analysis of an uploaded screenshot only — no live market data or news. Not financial advice.</p>
    </div>
  );
}

function Lv({ k, v, cls }: { k: string; v: string; cls?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className={cn("num", cls)}>{v}</dd>
    </div>
  );
}

function List({ title, items, warn }: { title: string; items: string[]; warn?: boolean }) {
  if (!items.length) return null;
  return (
    <section className="panel p-4 text-sm">
      <h3 className="mb-2 flex items-center gap-2 font-semibold">{warn && <AlertTriangle className="h-4 w-4 text-wait" />}{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-muted-foreground">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </section>
  );
}
