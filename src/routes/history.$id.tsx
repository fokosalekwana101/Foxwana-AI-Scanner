import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ResultView } from "@/components/ResultView";
import { deleteScan, loadHistory, loadSettings, type ScanRecord } from "@/lib/storage";

export const Route = createFileRoute("/history/$id")({
  head: () => ({
    meta: [
      { title: "Saved scan — FOXWANA AI Scanner" },
      { name: "description", content: "A saved FOXWANA chart screenshot analysis." },
      { property: "og:title", content: "Saved scan — FOXWANA" },
      { property: "og:description", content: "A saved chart analysis." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ScanDetail,
});

function ScanDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [rec, setRec] = useState<ScanRecord | null | undefined>(undefined);
  const [risk, setRisk] = useState<{ p: number; b: number | null }>({ p: 1, b: null });
  useEffect(() => {
    setRec(loadHistory().find((r) => r.id === id) ?? null);
    const s = loadSettings();
    setRisk({ p: s.riskPercent, b: s.accountBalance });
  }, [id]);

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <Link to="/history" className="text-sm text-muted-foreground hover:text-foreground">← History</Link>
        {rec && <button onClick={() => { deleteScan(rec.id); nav({ to: "/history" }); }} className="text-sm text-destructive">Delete</button>}
      </div>
      {rec === null && <div className="panel p-8 text-center text-sm text-muted-foreground">Scan not found.</div>}
      {rec && (
        <>
          <p className="mb-3 text-xs text-muted-foreground">Scanned {new Date(rec.createdAt).toLocaleString()} from an uploaded screenshot.</p>
          <img src={rec.thumb} alt="Chart thumbnail" className="mb-4 max-h-48 rounded-xl border object-contain" />
          <ResultView analysis={rec.analysis} mode={rec.mode} minRR={rec.minRR} hasHtf={rec.hasHtf} fallbackInstrument={rec.instrument} fallbackTimeframe={rec.timeframe} riskPercent={risk.p} accountBalance={risk.b} />
        </>
      )}
    </AppShell>
  );
}
