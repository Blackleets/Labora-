-- Applied to Supabase project gggtriyvbusbpqohoukv on 2026-09-18.
-- Minimal rider work-session tracking. No GPS/location data is stored.

create table if not exists public.work_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  start_odometer_km numeric,
  end_odometer_km numeric,
  notes text,
  created_at timestamptz not null default now(),
  constraint work_sessions_time_order check (ended_at is null or ended_at >= started_at),
  constraint work_sessions_odometer_order check (
    start_odometer_km is null or end_odometer_km is null or end_odometer_km >= start_odometer_km
  )
);

create unique index if not exists work_sessions_one_active_per_user
  on public.work_sessions(user_id)
  where ended_at is null;

alter table public.work_sessions enable row level security;

drop policy if exists work_sessions_select_self on public.work_sessions;
create policy work_sessions_select_self
on public.work_sessions for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists work_sessions_insert_self on public.work_sessions;
create policy work_sessions_insert_self
on public.work_sessions for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists work_sessions_update_self on public.work_sessions;
create policy work_sessions_update_self
on public.work_sessions for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists work_sessions_delete_self on public.work_sessions;
create policy work_sessions_delete_self
on public.work_sessions for delete to authenticated
using (user_id = (select auth.uid()));
