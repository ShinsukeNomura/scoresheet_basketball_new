-- 既に logs テーブルがある場合のみ実行（メモ一覧をアプリから読むため）
-- Supabase SQL Editor に貼り付けて実行

alter table public.logs enable row level security;

drop policy if exists "deny_select_logs" on public.logs;
drop policy if exists "anon_can_select_logs" on public.logs;

create policy "anon_can_select_logs"
  on public.logs
  for select
  to anon, authenticated
  using (true);
