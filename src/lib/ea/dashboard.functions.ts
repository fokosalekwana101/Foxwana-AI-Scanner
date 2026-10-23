import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Dashboard server functions for the FOXWANA EA bridge.
 * Every function verifies the signed-in user via requireSupabaseAuth, then
 * reads/writes through the service client (the ea_* tables are locked to
 * service_role by RLS — trade data must never be publicly readable).
 */

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export interface EaPosition {
  id: string;
  ticket: string;
  symbol: string;
  direction: "buy" | "sell";
  lots: number;
  entry_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  floating_pl: number | null;
  strategy: string;
  break_even: boolean;
  opened_at: string;
}

export interface EaTrade {
  id: string;
  ticket: string;
  symbol: string;
  direction: "buy" | "sell";
  lots: number;
  entry_price: number;
  exit_price: number | null;
  pnl: number | null;
  strategy: string;
  result: "win" | "loss" | "breakeven" | "unknown" | null;
  reason: string | null;
  opened_at: string;
  closed_at: string | null;
}

export interface EaLog {
  id: string;
  level: "info" | "warn" | "error";
  source: string;
  message: string;
  created_at: string;
}

export interface EaState {
  status: "connected" | "disconnected" | "running" | "paused" | "error";
  error_message: string | null;
  account_login: string | null;
  account_type: "demo" | "live";
  market: string;
  balance: number | null;
  equity: number | null;
  floating_pl: number | null;
  daily_pl: number | null;
  mode: "demo" | "live";
  last_heartbeat: string | null;
  emergency_stop: boolean;
}

export interface EaSettings {
  risk_mode: "prop" | "real";
  prop_dd_daily_limit: number;
  prop_risk_fraction: number;
  real_risk_percent: number;
  hard_max_risk_percent: number;
  max_daily_losses: number;
  daily_reset_time: string;
  be_coverage_percent: number;
  target_mode: "range" | "1h_swing";
  max_open_trades: number;
  sessions: { key: string; label: string; enabled: boolean }[];
  entry_models: { fvg: boolean; order_block: boolean; last_opposing_close: boolean };
}

export interface Snapshot {
  state: EaState;
  positions: EaPosition[];
  trades: EaTrade[];
  logs: EaLog[];
  settings: EaSettings;
}

export const getSnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<Snapshot | null> => {
    const db = await admin();
    const [stateRes, settingsRes, posRes, tradeRes, logRes] = await Promise.all([
      db.from("ea_state").select("*").eq("id", 1).maybeSingle(),
      db.from("ea_settings").select("*").eq("id", 1).maybeSingle(),
      db.from("ea_positions").select("*").order("opened_at", { ascending: true }),
      db.from("ea_trades").select("*").order("closed_at", { ascending: false, nullsFirst: false }).limit(30),
      db.from("ea_logs").select("*").order("created_at", { ascending: false }).limit(40),
    ]);
    if (stateRes.error || settingsRes.error || posRes.error || tradeRes.error || logRes.error) {
      console.error("EA snapshot query failed", { stateRes: stateRes.error, settingsRes: settingsRes.error, posRes: posRes.error, tradeRes: tradeRes.error, logRes: logRes.error });
      return null;
    }
    if (!stateRes.data || !settingsRes.data) return null;
    const state = stateRes.data as unknown as EaState;
    const settings = {
      ...(settingsRes.data as unknown as EaSettings),
      sessions: (settingsRes.data.sessions ?? []) as unknown as EaSettings["sessions"],
      entry_models: settingsRes.data.entry_models as unknown as EaSettings["entry_models"],
    };
    return {
      state,
      settings,
      positions: (posRes.data ?? []) as unknown as EaPosition[],
      trades: (tradeRes.data ?? []) as unknown as EaTrade[],
      logs: (logRes.data ?? []) as unknown as EaLog[],
    };
  });

export const getLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<EaLog[]> => {
    const db = await admin();
    const { data, error } = await db.from("ea_logs").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) {
      console.error("EA logs query failed", error);
      return [];
    }
    return (data ?? []) as unknown as EaLog[];
  });

export const getTrades = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<EaTrade[]> => {
    const db = await admin();
    const { data, error } = await db.from("ea_trades").select("*").order("closed_at", { ascending: false, nullsFirst: false }).limit(200);
    if (error) {
      console.error("EA trades query failed", error);
      return [];
    }
    return (data ?? []) as unknown as EaTrade[];
  });

const settingsInput = z.object({
  risk_mode: z.enum(["prop", "real"]),
  prop_dd_daily_limit: z.number().positive().max(1_000_000),
  prop_risk_fraction: z.number().min(0.05).max(1),
  real_risk_percent: z.number().min(0.01).max(10),
  hard_max_risk_percent: z.number().min(0.05).max(10),
  max_daily_losses: z.number().int().min(1).max(20),
  daily_reset_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  be_coverage_percent: z.number().min(1).max(99),
  target_mode: z.enum(["range", "1h_swing"]),
  max_open_trades: z.number().int().min(1).max(10),
  sessions: z.array(z.object({ key: z.string().max(40), label: z.string().max(60), enabled: z.boolean() })).max(12),
  entry_models: z.object({
    fvg: z.boolean(),
    order_block: z.boolean(),
    last_opposing_close: z.boolean(),
  }),
});

export type SettingsInput = z.infer<typeof settingsInput>;

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => settingsInput.parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin();
    const { error } = await db
      .from("ea_settings")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) return { ok: false as const, message: error.message };
    await db.from("ea_logs").insert({
      level: "info",
      source: "dashboard",
      message: "EA settings updated",
      context: { by: context.userId, risk_mode: data.risk_mode },
    });
    return { ok: true as const };
  });

const commandKind = z.enum(["start", "pause", "resume", "emergency_stop", "clear_emergency"]);

export const sendCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => commandKind.parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin();
    if (data === "emergency_stop") {
      // Emergency stop must take effect even if the EA is offline: flip the state flag now.
      await db.from("ea_state").update({ emergency_stop: true, updated_at: new Date().toISOString() }).eq("id", 1);
    }
    if (data === "clear_emergency") {
      await db.from("ea_state").update({ emergency_stop: false, updated_at: new Date().toISOString() }).eq("id", 1);
    }
    const { error } = await db.from("ea_commands").insert({ kind: data });
    if (error) return { ok: false as const, message: error.message };
    await db.from("ea_logs").insert({
      level: "info",
      source: "dashboard",
      message: `Command queued: ${data}`,
      context: { by: context.userId },
    });
    return { ok: true as const };
  });
