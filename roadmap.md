# FOXWANA EA — build roadmap

Spec: `user-uploads://FOXWANA_EA_-_Dashboard_and_MT5_Integration_pasted.md` (dashboard + MT5 integration, small stages, preserve CRT scanner).

## Stage 1 — Dashboard + integration foundation (current)
- [x] Resolve duplicate root route and fix auth redirect targets
- [x] Lovable Cloud enabled, email/password auth enabled
- [x] Database: ea_state, ea_settings, ea_positions, ea_trades, ea_logs, ea_commands
- [x] Auth pages (/auth sign-in/up, /reset-password) + protected route layout
- [x] EA API: /api/public/ea/heartbeat, /logs, /commands, /settings (API-key verified)
- [x] Dashboard: status, strategies, positions, P/L, chart, logs, settings, emergency stop
- [x] MT5 EA source (MQL5) + connection spec
- [x] Teddy-bear logo + branding
- [x] EA_API_KEY secret requested

## Stage 2 — Later (not started)
- [ ] Live MT5 verification once the user compiles/attaches the EA
- [ ] Performance analytics depth (per-strategy breakdowns, equity curve from closed trades)
- [ ] Additional markets (disabled by default)
- [ ] Per-user EA bridges (v1 is a single-owner global bridge)
