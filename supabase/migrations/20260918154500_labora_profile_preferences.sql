-- Applied to Supabase project gggtriyvbusbpqohoukv on 2026-09-18.
-- Persists user-selected platform/bank preferences without claiming live integrations.

alter table public.profiles
  add column if not exists platforms text[] not null default '{}',
  add column if not exists banks text[] not null default '{}';
