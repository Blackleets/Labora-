-- Universal worker profile. Keeps the database role `rider` for backward
-- compatibility while persisting the user's real work situation separately.

alter table public.profiles
  add column if not exists work_modes text[] not null default '{}',
  add column if not exists workplaces text[] not null default '{}',
  add column if not exists wants_manager boolean not null default false;

alter table public.profiles
  drop constraint if exists profiles_work_modes_valid;

alter table public.profiles
  add constraint profiles_work_modes_valid check (
    work_modes <@ array['employee','rider','self_employed','freelancer']::text[]
  );

grant update (work_modes, workplaces, wants_manager)
on table public.profiles to authenticated;

comment on column public.profiles.work_modes is
  'User-selected work situations; independent from authorization role.';

comment on column public.profiles.workplaces is
  'User-provided employers, clients or platforms; never implies a live integration.';
