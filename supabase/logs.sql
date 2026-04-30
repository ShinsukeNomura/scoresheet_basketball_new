-- Supabase SQL editor で実行してください

create extension if not exists pgcrypto;

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null,
  screen text,
  team text check (team in ('A', 'B') or team is null),
  payload jsonb not null default '{}'::jsonb,
  session_id text,
  user_id uuid
);

alter table public.logs enable row level security;

-- 匿名ユーザーに insert のみ許可
drop policy if exists "anon_can_insert_logs" on public.logs;
create policy "anon_can_insert_logs"
  on public.logs
  for insert
  to anon, authenticated
  with check (true);

-- 読み取りは無効（保存専用）
drop policy if exists "deny_select_logs" on public.logs;
drop policy if exists "anon_can_select_logs" on public.logs;
create policy "deny_select_logs"
  on public.logs
  for select
  to anon, authenticated
  using (false);

create index if not exists logs_created_at_idx on public.logs (created_at desc);
create index if not exists logs_event_type_idx on public.logs (event_type);
create index if not exists logs_session_id_idx on public.logs (session_id);
