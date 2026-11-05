import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getSnapshot } from "@/lib/ea/dashboard.functions";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  loader: () => getSnapshot(),
  head: () => ({
    meta: [
      { title: "Dashboard — FOXWANA EA" },
      { name: "description", content: "View verified FOXWANA EA bridge status, open positions, and recent activity." },
      { property: "og:title", content: "Dashboard — FOXWANA EA" },
      { property: "og:description", content: "Verified FOXWANA EA bridge status and account activity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const snapshot = Route.useLoaderData();

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b pb-5">
          <div>
            <p className="text-sm font-semibold text-primary">FOXWANA EA</p>
            <h1 className="mt-1 text-2xl font-bold">Trading dashboard</h1>
          </div>
          <Link to="/" className="rounded-md border px-3 py-2 text-sm hover:bg-secondary">Chart scanner</Link>
        </header>

        {!snapshot ? (
          <section className="panel p-5" aria-live="polite">
            <h2 className="font-semibold">Bridge data unavailable</h2>
            <p className="mt-2 text-sm text-muted-foreground">No account status is being assumed. Check the EA bridge connection and try again.</p>
          </section>
        ) : (
          <>
            <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Account summary">
              <Summary label="EA status" value={snapshot.state.status} />
              <Summary label="Account mode" value={snapshot.state.account_type ?? "Unavailable"} />
              <Summary label="Market" value={snapshot.state.market || "Unavailable"} />
              <Summary label="Last heartbeat" value={formatDate(snapshot.state.last_heartbeat)} />
              <Summary label="Balance" value={formatMoney(snapshot.state.balance)} />
              <Summary label="Equity" value={formatMoney(snapshot.state.equity)} />
              <Summary label="Floating P/L" value={formatMoney(snapshot.state.floating_pl)} />
              <Summary label="Daily P/L" value={formatMoney(snapshot.state.daily_pl)} />
            </section>

            {snapshot.state.error_message && (
              <p className="mb-6 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {snapshot.state.error_message}
              </p>
            )}

            <section className="mb-8">
              <h2 className="mb-3 text-lg font-semibold">Open positions</h2>
              {snapshot.positions.length === 0 ? (
                <p className="panel p-4 text-sm text-muted-foreground">No open positions reported.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead className="bg-secondary text-muted-foreground">
                      <tr>{["Symbol", "Side", "Lots", "Entry", "Stop loss", "Take profit", "Floating P/L", "Strategy"].map((label) => <th key={label} className="px-3 py-2 font-medium">{label}</th>)}</tr>
                    </thead>
                    <tbody>
                      {snapshot.positions.map((position) => (
                        <tr key={position.id} className="border-t">
                          <td className="px-3 py-2 font-medium">{position.symbol}</td>
                          <td className="px-3 py-2">{position.direction.toUpperCase()}</td>
                          <td className="px-3 py-2 num">{position.lots}</td>
                          <td className="px-3 py-2 num">{formatPrice(position.entry_price)}</td>
                          <td className="px-3 py-2 num">{formatPrice(position.stop_loss)}</td>
                          <td className="px-3 py-2 num">{formatPrice(position.take_profit)}</td>
                          <td className="px-3 py-2 num">{formatMoney(position.floating_pl)}</td>
                          <td className="px-3 py-2">{position.strategy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold">Recent activity</h2>
              {snapshot.logs.length === 0 ? (
                <p className="panel p-4 text-sm text-muted-foreground">No activity reported.</p>
              ) : (
                <ol className="divide-y border-y">
                  {snapshot.logs.slice(0, 12).map((log) => (
                    <li key={log.id} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-3 text-sm">
                      <span><span className="mr-2 font-medium">{log.level.toUpperCase()}</span>{log.message}</span>
                      <time className="text-muted-foreground" dateTime={log.created_at}>{formatDate(log.created_at)}</time>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel min-w-0 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 break-words text-base font-semibold">{value}</p>
    </div>
  );
}

function formatMoney(value: number | null) {
  return value === null ? "Unavailable" : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPrice(value: number | null) {
  return value === null ? "—" : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 });
}

function formatDate(value: string | null) {
  if (!value) return "Unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unavailable" : date.toLocaleString();
}