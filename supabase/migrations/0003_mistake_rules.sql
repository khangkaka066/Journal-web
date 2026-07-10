-- Structured review fields for cleaner analytics.

alter table public.trades
  add column if not exists mistake_tags text[] not null default '{}',
  add column if not exists rule_breaks text[] not null default '{}';
