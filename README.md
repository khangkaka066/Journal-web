# Trading Journal

Quantitative trading journal — Next.js + Supabase + Recharts.

## Setup

1. **Supabase**: open your project's SQL editor and run `supabase/migrations/0001_init.sql`.
   Then in Authentication → Providers, enable **Google** and add
   `http://localhost:3000/auth/callback` (and your production URL) to the redirect URLs.
2. **Env**: copy `.env.local.example` to `.env.local` and fill in your project URL and anon key
   (Supabase dashboard → Settings → API).
3. **Run**:

```bash
npm install
npm run dev        # http://localhost:3000
npx vitest run     # stats unit tests
```

## Structure

- `src/lib/stats.ts` — all metric math (pure, unit-tested)
- `src/lib/pnl.ts`, `src/lib/sessions.ts` — PnL auto-compute, session derivation
- `src/components/trades/trade-form.tsx` — fast-entry form (<30s, 6 required fields)
- `src/components/dashboard/` — stat tiles, equity curve, calendar heatmap
- `supabase/migrations/0001_init.sql` — schema, RLS, instrument seeds (NQ/ES/MNQ/MES/SPY/QQQ)
