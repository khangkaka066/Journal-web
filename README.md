# Trading Journal

A focused trading journal for recording executions, reviewing mistakes, and learning which setups and strategies actually work.

Built with **Next.js**, **Supabase**, **OpenRouter**, **Recharts**, and **Tailwind CSS**.

## Features

- Supabase email/password and Google authentication
- Trade entry form with automatic PnL and R-multiple calculation
- Structured setup checklist for CISD, iFVG, HTF PDA, absorption, exhaustion, and execution discipline
- Mistake tags and rule-break tags for cleaner learning analytics
- Screenshot upload to Supabase Storage
- Dashboard with equity curve, daily PnL heatmap, setup winrate, strategy wins, mistake patterns, and rule-break cost
- Weekly review page for current-week performance and next focus
- AI coach actions through OpenRouter for weekly review, trade debrief, mistake patterns, screenshot review, and study plans
- Daily 09:00 New York option flow report using CBOE delayed option chain snapshots and an optional AI trading plan

## Requirements

- Node.js 20+
- npm
- A Supabase project
- An OpenRouter API key for AI coach features. Users can add their own key in **Settings > AI settings**.
- A Vercel account for deployment

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local env file:

```bash
cp .env.local.example .env.local
```

3. Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=openai/gpt-4o-mini
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPTION_FLOW_CRON_SECRET=use-a-long-random-secret
OPTION_FLOW_SYMBOLS=SPY,QQQ
```

You can find Supabase values under **Project Settings > API**. Create the OpenRouter key in your OpenRouter dashboard. `OPENROUTER_API_KEY` is optional if you prefer adding the key inside the app Settings page on each browser.
`SUPABASE_SERVICE_ROLE_KEY` and `OPTION_FLOW_CRON_SECRET` are server-only values used by the option flow cron job.
The option flow AI plan runs inside the cron job, so it requires `OPENROUTER_API_KEY` in server environment variables.

4. Run the app:

```bash
npm run dev
```

Open the local URL shown in the terminal, usually:

```text
http://localhost:3000
```

## Supabase Setup

Open **Supabase SQL Editor** and run the migration files in order:

```text
supabase/migrations/0001_init.sql
supabase/migrations/0002_trade_checklist.sql
supabase/migrations/0003_mistake_rules.sql
supabase/migrations/0004_review_presets.sql
supabase/migrations/0005_ai_reviews.sql
supabase/migrations/0006_option_flow_reports.sql
supabase/migrations/0007_option_flow_inputs.sql
```

The migrations create:

- `profiles`
- `instruments`
- `trades`
- row-level security policies
- default instruments: `NQ`, `ES`, `MNQ`, `MES`, `SPY`, `QQQ`
- private `screenshots` storage bucket
- structured checklist, mistake tag, and rule-break fields
- synced review presets for checklist and tag customization
- saved AI reviews
- daily option flow reports
- user-supplied option flow levels and current spot for AI plans

## Auth Setup

In Supabase, go to **Authentication > URL Configuration**.

Add local redirect URL:

```text
http://localhost:3000/auth/callback
```

After deploying to Vercel, add your production callback URL:

```text
https://your-vercel-domain.vercel.app/auth/callback
```

If you want Google login, enable it in **Authentication > Providers > Google** and configure your Google Client ID and Client Secret.

## Vercel Deployment

1. Import the GitHub repository into Vercel.
2. Select **Next.js** as the framework preset.
3. Use these build settings:

```text
Build Command: next build
Install Command: npm install
Output Directory: leave empty
```

Do not type `Next.js default` into Output Directory. Leave it blank.

4. Add environment variables in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=openai/gpt-4o-mini
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPTION_FLOW_CRON_SECRET=use-a-long-random-secret
OPTION_FLOW_SYMBOLS=SPY,QQQ
```

`OPENROUTER_API_KEY` can be omitted from Vercel if users add their own key inside **Settings > AI settings**. Browser-saved keys are stored locally and sent only when an AI coach action runs.
`SUPABASE_SERVICE_ROLE_KEY` must stay server-only. Do not prefix it with `NEXT_PUBLIC_`.

5. Deploy.

6. Copy your Vercel domain and add this redirect URL in Supabase:

```text
https://your-vercel-domain.vercel.app/auth/callback
```

## How To Use The Journal

### 1. Add A Trade

Go to **Trades > New trade** and fill in:

- instrument
- direction
- entry price
- exit price
- quantity
- entry time

The app calculates PnL automatically.

### 2. Complete The Setup Checklist

Use the checklist to tag what the trade had:

- entry model: `CISD`, `iFVG`, `FVG mitigation`, `Liquidity sweep`
- context: `HTF PDA`, `Premium/discount`, `Draw on liquidity`
- confirmation: `Absorption`, `Exhaustion`, `Displacement`, `MSS/BOS`
- execution: `Planned entry`, `Stop at invalidation`, `Target liquidity`, `No chase`
- review: `Followed plan`, `Screenshot saved`, `Mistake tagged`, `Lesson written`

This makes later analytics more useful than plain notes.

### 3. Tag Mistakes And Rule Breaks

Use **Mistake tags** for what went wrong:

```text
Chased entry
Late entry
No HTF PDA
Moved stop
Early exit
Revenge trade
```

Use **Rule breaks** for broken process rules:

```text
No invalidation
No 2R available
Outside killzone
Against HTF bias
Entered before confirmation
Held past plan
```

These fields power the dashboard's mistake and rule-break statistics.

### 4. Upload Screenshots

Attach chart screenshots in the trade form. They are stored in the private Supabase `screenshots` bucket.

### 5. Review The Dashboard

The dashboard shows:

- total PnL
- winrate
- profit factor
- expectancy
- equity curve
- daily PnL heatmap
- best setup by winrate
- strategy with the most wins
- most repeated mistake
- costliest rule break

Use this to identify what to repeat and what to remove.

### 6. Do A Weekly Review

Open:

```text
/weekly
```

The weekly review shows:

- current-week stats
- review coverage
- screenshot count
- top mistake or rule break to focus on
- setup, strategy, mistake, and rule-break insights for the week

### 7. Read The Option Flow Report

Open:

```text
/option-flow
```

The report is generated by Vercel Cron once per weekday. On the Vercel Hobby plan, cron jobs are limited to once per day and can run within the scheduled hour, so the default `vercel.json` uses `0 13 * * 1-5`. That is around 09:00 New York during daylight saving time and around 08:00 New York during standard time.

The report shows:

- aggregate put/call volume ratio
- estimated call and put premium
- net premium bias
- top volume contracts
- unusual volume versus open interest
- key strikes by volume, open interest, and premium estimate
- AI trading plan using `docs/option_flow_knowledge.md`, the CBOE snapshot, and configured QQQ levels
- a form where you can paste QQQ levels and current QQQ price before the next cron run

This uses delayed CBOE option chain snapshots, not tick-by-tick order flow. Use it as a study and backtesting context layer.
The AI plan is educational and should be reviewed as conditional if-then scenarios, not financial advice.

## Recommended Journaling Workflow

After every trade:

1. Log the trade immediately.
2. Complete the setup checklist.
3. Add mistake tags and rule breaks if any rule was violated.
4. Upload at least one chart screenshot.
5. Write one short lesson.

At the end of the week:

1. Open the weekly review page.
2. Identify the most expensive rule break.
3. Identify the highest winrate setup.
4. Choose one behavior to improve next week.

## Scripts

```bash
npm run dev      # start local dev server
npm run build    # production build
npm run lint     # lint code
npx vitest run   # run unit tests
```

## Project Structure

```text
src/app/                         Next.js App Router pages
src/app/(app)/dashboard/          Dashboard
src/app/(app)/trades/             Trade list, new trade, edit trade
src/app/(app)/weekly/             Weekly review
src/app/(app)/option-flow/        Daily option flow report
src/app/api/cron/option-flow/     Vercel Cron report generator
src/components/trades/            Trade form and table
src/components/dashboard/         Charts, stat tiles, learning insights
src/lib/option-flow/              CBOE fetcher and report builder
src/lib/stats.ts                  Dashboard and learning analytics
src/lib/pnl.ts                    PnL and R-multiple calculation
src/lib/sessions.ts               Session derivation
src/lib/supabase/                 Supabase clients and middleware helpers
supabase/migrations/              Database migrations
```

## Notes

- Do not commit `.env.local`.
- Do not use the Supabase `service_role` key in the browser or Vercel public env vars.
- Use only the Supabase publishable/anon key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Protect `/api/cron/option-flow` with `OPTION_FLOW_CRON_SECRET` or Vercel `CRON_SECRET`.
