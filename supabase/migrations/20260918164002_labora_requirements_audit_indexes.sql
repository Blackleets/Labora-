-- Applied to Supabase project gggtriyvbusbpqohoukv on 2026-09-18.
-- Adds covering indexes for requirement audit foreign keys flagged by the performance advisor.

create index if not exists requirements_submitted_by_idx
  on public.requirements(submitted_by)
  where submitted_by is not null;

create index if not exists requirements_reviewed_by_idx
  on public.requirements(reviewed_by)
  where reviewed_by is not null;
