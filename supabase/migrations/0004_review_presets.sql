-- Per-user review presets for configurable checklist, mistake tags, and rules.
create table if not exists public.review_presets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  checklist jsonb not null default '{}'::jsonb,
  mistake_tags text[] not null default '{}',
  rule_breaks text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.review_presets enable row level security;

create policy "review presets select own" on public.review_presets
  for select using (auth.uid() = user_id);
create policy "review presets insert own" on public.review_presets
  for insert with check (auth.uid() = user_id);
create policy "review presets update own" on public.review_presets
  for update using (auth.uid() = user_id);
create policy "review presets delete own" on public.review_presets
  for delete using (auth.uid() = user_id);
