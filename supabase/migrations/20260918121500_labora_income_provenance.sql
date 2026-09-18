-- Applied to Supabase project gggtriyvbusbpqohoukv on 2026-09-18.
-- Adds explicit provenance for income records so Labora+ can distinguish
-- manual entries, text/document imports, future API syncs and bank imports.

alter table public.incomes
  add column if not exists source_type text not null default 'manual'
    check (source_type in ('manual','text_import','document_import','api_sync','bank_import')),
  add column if not exists source_reference text,
  add column if not exists external_id text,
  add column if not exists confidence numeric
    check (confidence is null or (confidence >= 0 and confidence <= 1)),
  add column if not exists needs_review boolean not null default true,
  add column if not exists imported_at timestamptz not null default now();

create unique index if not exists incomes_user_source_external_unique
  on public.incomes (user_id, source_type, external_id)
  where external_id is not null;
