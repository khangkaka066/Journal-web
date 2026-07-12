-- User supplied option-flow levels and current spot used by AI plans.

create table public.option_flow_inputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  symbol text not null default 'QQQ',
  spot_price numeric,
  raw_text text not null,
  levels jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index option_flow_inputs_user_created_idx on public.option_flow_inputs (user_id, created_at desc);
create index option_flow_inputs_symbol_created_idx on public.option_flow_inputs (symbol, created_at desc);

alter table public.option_flow_inputs enable row level security;

create policy "option flow inputs select own" on public.option_flow_inputs
  for select using (auth.uid() = user_id);
create policy "option flow inputs insert own" on public.option_flow_inputs
  for insert with check (auth.uid() = user_id);
create policy "option flow inputs update own" on public.option_flow_inputs
  for update using (auth.uid() = user_id);
create policy "option flow inputs delete own" on public.option_flow_inputs
  for delete using (auth.uid() = user_id);
