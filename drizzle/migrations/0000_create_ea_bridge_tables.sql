-- FOXWANA EA bridge tables. Access is service-role only: EA routes verify an API key,
-- dashboard server functions verify the signed-in user, then use the service client.

create table public.ea_state (
  id int primary key default 1 check (id = 1),
  status text not null default 'disconnected' check (status in ('connected','disconnected','running','paused','error')),
  error_message text,
  account_login text,
  account_type text not null default 'demo' check (account_type in ('demo','live')),
  market text not null default 'XAUUSD',
  balance numeric,
  equity numeric,
  floating_pl numeric,
  daily_pl numeric,
  daily_pl_date date,
  mode text not null default 'demo' check (mode in ('demo','live')),
  last_heartbeat timestamptz,
  emergency_stop boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.ea_settings (
  id int primary key default 1 check (id = 1),
  risk_mode text not null default 'prop' check (risk_mode in ('prop','real')),
  prop_dd_daily_limit numeric not null default 5000,
  prop_risk_fraction numeric not null default 0.60,
  real_risk_percent numeric not null default 0.5,
  hard_max_risk_percent numeric not null default 1.0,
  max_daily_losses int not null default 2,
  daily_reset_time text not null default '00:00',
  be_coverage_percent numeric not null default 55,
  target_mode text not null default 'range' check (target_mode in ('range','1h_swing')),
  max_open_trades int not null default 1,
  sessions jsonb not null default '[{"key":"crt","label":"CRT (scanner-preserved)","enabled":false},{"key":"gold_0300","label":"03:00 Gold","enabled":true},{"key":"gold_1300","label":"13:00 Gold","enabled":true},{"key":"asian","label":"Asian Session","enabled":true}]'::jsonb,
  entry_models jsonb not null default '{"fvg":true,"order_block":true,"last_opposing_close":true}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.ea_positions (
  id uuid primary key default gen_random_uuid(),
  ticket text not null unique,
  symbol text not null,
  direction text not null check (direction in ('buy','sell')),
  lots numeric not null,
  entry_price numeric not null,
  stop_loss numeric,
  take_profit numeric,
  floating_pl numeric,
  strategy text not null,
  break_even boolean not null default false,
  opened_at timestamptz not null
);

create table public.ea_trades (
  id uuid primary key default gen_random_uuid(),
  ticket text not null,
  symbol text not null,
  direction text not null check (direction in ('buy','sell')),
  lots numeric not null,
  entry_price numeric not null,
  exit_price numeric,
  stop_loss numeric,
  take_profit numeric,
  pnl numeric,
  strategy text not null,
  result text check (result in ('win','loss','breakeven','unknown')),
  reason text,
  opened_at timestamptz not null,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.ea_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null default 'info' check (level in ('info','warn','error')),
  source text not null default 'ea',
  message text not null,
  context jsonb,
  created_at timestamptz not null default now()
);

create table public.ea_commands (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('start','pause','resume','emergency_stop','clear_emergency','apply_settings')),
  payload jsonb,
  status text not null default 'pending' check (status in ('pending','delivered','applied','failed')),
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  applied_at timestamptz
);

create index ea_logs_created_idx on public.ea_logs (created_at desc);
create index ea_trades_closed_idx on public.ea_trades (closed_at desc);
create index ea_commands_pending_idx on public.ea_commands (created_at) where status in ('pending','delivered');

insert into public.ea_state (id) values (1) on conflict (id) do nothing;
insert into public.ea_settings (id) values (1) on conflict (id) do nothing;

GRANT ALL ON public.ea_state TO service_role;
GRANT ALL ON public.ea_settings TO service_role;
GRANT ALL ON public.ea_positions TO service_role;
GRANT ALL ON public.ea_trades TO service_role;
GRANT ALL ON public.ea_logs TO service_role;
GRANT ALL ON public.ea_commands TO service_role;

ALTER TABLE public.ea_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ea_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ea_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ea_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ea_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ea_commands ENABLE ROW LEVEL SECURITY;
