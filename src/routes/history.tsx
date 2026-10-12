import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { deleteScan, loadHistory, type ScanRecord } from "@/lib/storage";
import { evaluate, DEFAULT_RULES } from "@/lib/foxwana/rules";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Scan history — FOXWANA AI Scanner" },
      { name: "description", content: "Reopen or delete your previous FOXWANA chart scans." },
      { property: "og:title", content: "Scan history — FOXWANA" },
      { property: "og:description", content: "Your previous screenshot analyses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const [list, setList] = useState<ScanRecord[]>([]);
  useEffect(() => setList(loadHistory()), []);

  return (
    <AppShell>
      <h1 className="text-2xl font-bold tracking-tight">History</h1>
      <p className="mb-5 text-sm text-muted-foreground">Saved only in this browser on this device. Analyses of uploaded screenshots — not live market data.</p>
      {list.length === 0 ? (
        <div className="panel p-8 text-center text-sm text-muted-foreground">No scans yet.</div>
      ) : (
        <ul className="space-y-2">
          {list.map((r) => {
            const d = evaluate(r.analysis, r.mode, { ...DEFAULT_RULES, minRR: r.minRR }, r.hasHtf).decision;
            return (
              <li key={r.id} className="panel flex items-center gap-3 p-2">
                <Link to="/history/$id" params={{ id: r.id }} className="flex flex-1 items-center gap-3">
                  <img src={r.thumb} alt="" className="h-14 w-20 rounded-md object-cover" />
                  <div className="flex-1">
                    <div className="font-medium">{r.instrument || "Unknown"} <span className="text-muted-foreground">· {r.timeframe || "—"}</span></div>
                    <div className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()} · {r.mode === "crt" ? "CRT" : "General"}</div>
                  </div>
                  <span className={cn("rounded-md px-2 py-1 text-xs font-bold", d === "BUY" ? "bg-bull/15 text-bull" : d === "SELL" ? "bg-bear/15 text-bear" : "bg-wait/15 text-wait")}>{d}</span>
                </Link>
                <button aria-label="Delete scan" onClick={() => { deleteScan(r.id); setList(loadHistory()); }} className="p-2 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
