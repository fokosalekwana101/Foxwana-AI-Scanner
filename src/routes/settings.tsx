import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { clearHistory, DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from "@/lib/storage";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — FOXWANA AI Scanner" },
      { name: "description", content: "Default analysis mode, market, timeframe and risk preferences." },
      { property: "og:title", content: "Settings — FOXWANA" },
      { property: "og:description", content: "Configure your FOXWANA scanner defaults." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

const TFS = ["", "M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"];

function SettingsPage() {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  const [msg, setMsg] = useState("");
  useEffect(() => setS(loadSettings()), []);
  const up = (p: Partial<Settings>) => { const n = { ...s, ...p }; setS(n); saveSettings(n); setMsg("Saved"); };
  const field = "w-full rounded-lg border bg-input/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <AppShell>
      <h1 className="mb-5 text-2xl font-bold tracking-tight">Settings</h1>
      <div className="panel space-y-4 p-4">
        <Row label="Default analysis mode">
          <select className={field} value={s.mode} onChange={(e) => up({ mode: e.target.value as Settings["mode"] })}>
            <option value="crt">FOXWANA CRT</option>
            <option value="general">General AI Analysis</option>
          </select>
        </Row>
        <Row label="Preferred market">
          <select className={field} value={s.market} onChange={(e) => up({ market: e.target.value })}>
            {["Forex", "Indices", "Metals", "Crypto", "Stocks", "Commodities"].map((m) => <option key={m}>{m}</option>)}
          </select>
        </Row>
        <Row label="Preferred timeframe">
          <select className={field} value={s.timeframe} onChange={(e) => up({ timeframe: e.target.value })}>
            {TFS.map((t) => <option key={t} value={t}>{t || "None"}</option>)}
          </select>
        </Row>
        <Row label="Confirmation timeframe (optional)">
          <select className={field} value={s.htfTimeframe} onChange={(e) => up({ htfTimeframe: e.target.value })}>
            {TFS.map((t) => <option key={t} value={t}>{t || "None"}</option>)}
          </select>
        </Row>
        <Row label="Risk per trade (%)">
          <input type="number" min={0.1} max={10} step={0.1} className={field} value={s.riskPercent} onChange={(e) => up({ riskPercent: Math.min(10, Math.max(0.1, +e.target.value || 1)) })} />
        </Row>
        <Row label="Account balance (optional)">
          <input type="number" min={0} className={field} value={s.accountBalance ?? ""} placeholder="Used only to show risk amount" onChange={(e) => up({ accountBalance: e.target.value ? Math.max(0, +e.target.value) : null })} />
        </Row>
        <Row label="Minimum risk-to-reward">
          <input type="number" min={1} max={5} step={0.1} className={field} value={s.minRR} onChange={(e) => up({ minRR: Math.min(5, Math.max(1, +e.target.value || 1.5)) })} />
        </Row>
        <p className="text-xs text-muted-foreground">Risk settings only inform calculations. FOXWANA never places trades. {msg}</p>
      </div>

      <div className="panel mt-4 p-4">
        <h2 className="font-semibold">Data</h2>
        <p className="mb-3 text-sm text-muted-foreground">History and settings are stored only in this browser — not in the cloud. Full screenshots are never saved; only a small preview.</p>
        <button onClick={() => { if (confirm("Delete all scan history?")) { clearHistory(); setMsg("History cleared"); } }} className="rounded-lg border border-destructive/50 px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
          Clear history
        </button>
      </div>
    </AppShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
