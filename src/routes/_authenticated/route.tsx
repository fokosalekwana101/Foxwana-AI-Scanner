import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";

// Managed protected-route gate: client-only session check (the session lives in
// browser storage, so this layout runs without SSR to avoid redirect loops).
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
