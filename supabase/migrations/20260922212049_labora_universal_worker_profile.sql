-- Synced from the live Supabase project migration history.
-- This file restores repository reproducibility for the migration that is already
-- applied on project gggtriyvbusbpqohoukv as 20260922212049.
--
-- Universal worker profile: a person may work as an employee, rider,
-- self-employed worker, freelancer, or a combination of these modes.

alter table public.profiles
  add column if not exists work_modes text[] not null default '{}'::text[],
  add column if not exists workplaces text[] not null default '{}'::text[],
  add column if not exists wants_manager boolean not null default false;

alter table public.profiles
  drop constraint if exists profiles_work_modes_valid;

alter table public.profiles
  add constraint profiles_work_modes_valid
  check (work_modes <@ array['employee'::text, 'rider'::text, 'self_employed'::text, 'freelancer'::text]);

-- These are self-service profile preferences. RLS still limits rows; column grants
-- make the intended fields writable without exposing privileged relationship fields
-- such as manager_id or role.
grant select (work_modes, workplaces, wants_manager) on public.profiles to authenticated;
grant update (work_modes, workplaces, wants_manager) on public.profiles to authenticated;
