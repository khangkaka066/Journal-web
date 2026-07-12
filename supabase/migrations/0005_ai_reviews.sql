-- Saved AI coach outputs for trade and weekly study review.
create table if not exists public.ai_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  trade_id uuid references public.trades (id) on delete cascade,
  mode text not null,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_reviews_user_created_idx
  on public.ai_reviews (user_id, created_at desc);

create index if not exists ai_reviews_trade_idx
  on public.ai_reviews (trade_id, created_at desc);

alter table public.ai_reviews enable row level security;

create policy "ai reviews select own" on public.ai_reviews
  for select using (auth.uid() = user_id);
create policy "ai reviews insert own" on public.ai_reviews
  for insert with check (auth.uid() = user_id);
create policy "ai reviews delete own" on public.ai_reviews
  for delete using (auth.uid() = user_id);
