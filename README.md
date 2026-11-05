# FOXWANA EA — AI Chart Scanner & Trading Dashboard

FOXWANA is a mobile-first web app for gold (XAUUSD) traders. You upload a chart screenshot, AI describes what is on it, and a fixed rule engine decides **BUY**, **SELL** or **WAIT**. A private dashboard is the start of a link to a MetaTrader 5 Expert Advisor.

**Live app:** https://tradeframe-insight-guide.lovable.app

> ⚠️ This is not financial advice. FOXWANA never makes up prices, never fakes live trading, and never shows "Connected" unless an MT5 bridge has been verified. Run on a demo account first.

---

## Features

### AI Chart Scanner (public, `/`)
- Upload, preview, replace or remove a chart screenshot (works well on phones).
- Two analysis modes:
  - **FOXWANA CRT**: Candle Range Theory strategy (kept separate from the other strategies).
  - **General AI**: a general read of price action.
- Optional higher-timeframe screenshot for confirmation.
- Manual instrument/timeframe overrides.
- The AI only **reports observations** as validated JSON. The deterministic rule engine (`src/lib/foxwana/rules.ts`) makes the final call, so decisions can be tested and don't depend on the AI provider.
- Returns WAIT when the setup is unclear or not complete.

### History & Settings (`/history`, `/settings`)
- Past scans are saved in your browser (only thumbnails, never full images).
- Scanner preferences are saved on your device.

### EA Dashboard (private, `/dashboard`)
- Email + password sign-in (`/auth`, `/reset-password`).
- Shows real EA bridge snapshot data only, and labels anything missing as unavailable.
- Backend tables hold EA state/settings, positions, trades, logs and queued commands. Access is service-role only, with row-level security.

## Trading rules (built into the EA logic)
- Trades gold only during the SAST trading sessions.
- Needs the full setup sequence before an entry.
- Stops trading for the day after **2 losses**.
- Moves the stop to **break-even at 55%** of the way to target.
- Prop-firm risk: at most **60% of the remaining daily drawdown**.
- Demo mode first.

Rule logic and tests: `src/lib/ea/logic.ts`, `src/lib/foxwana/rules.ts`.

## Tech stack
- TanStack Start (React 19, Vite) on edge runtime
- Tailwind CSS v4 + shadcn/ui
- Lovable Cloud (database + auth)
- Lovable AI Gateway for chart vision analysis (keys stay on the server)
- Vitest for tests

## Project structure
```text
src/
  routes/            pages (scanner, history, settings, auth, dashboard)
  lib/foxwana/       AI prompt, output schema, rule engine (+ tests)
  lib/ea/            EA risk & entry-gate logic, dashboard server functions (+ tests)
  lib/ai/            server-side AI gateway client
  lib/scan.functions.ts  scan server function
  lib/storage.ts     local history/settings
```

## Getting started
```sh
git clone <this-repository-url>
cd <repository-name>
npm install
npm run dev      # start dev server
npm test         # run tests
npm run build    # production build
```
Environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`) are in `.env`. AI and bridge secrets live only on the server.

## Roadmap
- [ ] MT5 HTTP bridge endpoints, protected by a shared `EA_API_KEY`
- [ ] MQL5 Expert Advisor source code
- [ ] Live bridge connection check on the dashboard
- [ ] Fix the EA risk-cap test fixture

## Built with Lovable
Edit this project in the [Lovable editor](https://lovable.dev/projects/0d7b6bac-23bc-4c66-991a-389cb366db28). Changes sync both ways with the connected GitHub repository.
