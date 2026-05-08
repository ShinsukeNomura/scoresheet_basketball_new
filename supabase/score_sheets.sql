-- Supabase SQL editor で実行してください

create extension if not exists pgcrypto;

create table if not exists public.score_sheets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  game_date text,
  team_a_name text,
  team_b_name text,
  score_a integer not null default 0,
  score_b integer not null default 0,
  sheet_state jsonb not null,
  session_id text
);

alter table public.score_sheets enable row level security;

-- 読み書きはサーバー側の service_role 経由で行うため、通常ユーザーには許可しない
drop policy if exists "deny_select_score_sheets" on public.score_sheets;
drop policy if exists "deny_insert_score_sheets" on public.score_sheets;
create policy "deny_select_score_sheets"
  on public.score_sheets
  for select
  to anon, authenticated
  using (false);

create policy "deny_insert_score_sheets"
  on public.score_sheets
  for insert
  to anon, authenticated
  with check (false);

create index if not exists score_sheets_created_at_idx on public.score_sheets (created_at desc);
create index if not exists score_sheets_game_date_idx on public.score_sheets (game_date);
