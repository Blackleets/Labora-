-- Applied to Supabase project gggtriyvbusbpqohoukv on 2026-09-18.
-- New accounts must complete onboarding once; existing accounts keep their current completed state.

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;

update public.profiles
set onboarding_completed = true
where onboarding_completed = false;
