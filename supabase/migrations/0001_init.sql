-- Trading Journal initial schema

-- profiles ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  timezone text not null default 'UTC',
  base_currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles select own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles insert own" on public.profiles
  for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- instruments ---------------------------------------------------------
create table public.instruments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade, -- null = global seed
  symbol text not null,
  point_value numeric not null default 1,
  tick_size numeric not null default 0.01,
  created_at timestamptz not null default now()
);

alter table public.instruments enable row level security;

create policy "instruments select global or own" on public.instruments
  for select using (user_id is null or auth.uid() = user_id);
create policy "instruments insert own" on public.instruments
  for insert with check (auth.uid() = user_id);
create policy "instruments update own" on public.instruments
  for update using (auth.uid() = user_id);
create policy "instruments delete own" on public.instruments
  for delete using (auth.uid() = user_id);

insert into public.instruments (symbol, point_value, tick_size) values
  ('NQ', 20, 0.25),
  ('ES', 50, 0.25),
  ('MNQ', 2, 0.25),
  ('MES', 5, 0.25),
  ('SPY', 1, 0.01),
  ('QQQ', 1, 0.01);

-- trades ---------------------------------------------------------------
create table public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  instrument_id uuid not null references public.instruments (id),
  direction text not null check (direction in ('long', 'short')),
  entry_price numeric not null,
  exit_price numeric not null,
  quantity numeric not null check (quantity > 0),
  entry_time timestamptz not null,
  exit_time timestamptz,
  fees numeric not null default 0,
  pnl numeric not null,
  pnl_overridden boolean not null default false,
  risk numeric check (risk > 0),
  r_multiple numeric,
  session text check (session in ('asia', 'london', 'new_york')),
  setup text,
  strategy text,
  confidence int check (confidence between 1 and 5),
  emotion_before text,
  emotion_after text,
  mistakes text,
  lessons text,
  mistake_tags text[] not null default '{}',
  rule_breaks text[] not null default '{}',
  trade_checklist jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  screenshot_urls text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trades_user_entry_idx on public.trades (user_id, entry_time desc);

alter table public.trades enable row level security;

create policy "trades select own" on public.trades
  for select using (auth.uid() = user_id);
create policy "trades insert own" on public.trades
  for insert with check (auth.uid() = user_id);
create policy "trades update own" on public.trades
  for update using (auth.uid() = user_id);
create policy "trades delete own" on public.trades
  for delete using (auth.uid() = user_id);

-- storage: screenshots bucket ------------------------------------------
insert into storage.buckets (id, name, public) values ('screenshots', 'screenshots', false);

create policy "screenshots read own" on storage.objects
  for select using (bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "screenshots insert own" on storage.objects
  for insert with check (bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "screenshots delete own" on storage.objects
  for delete using (bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text);
