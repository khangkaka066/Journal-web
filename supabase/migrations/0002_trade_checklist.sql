-- Structured trade checklist for setup review and later analytics.

alter table public.trades
  add column if not exists trade_checklist jsonb not null default '{}'::jsonb;
