-- Defensive financial actor defaults.
-- Modern Labora+ clients send created_by explicitly. These defaults protect
-- older/partial clients from failing NOT NULL inserts while RLS still requires
-- the authenticated caller to own the row.

alter table public.incomes
  alter column created_by set default auth.uid();

alter table public.platform_payouts
  alter column created_by set default auth.uid();

alter table public.expenses
  alter column created_by set default auth.uid();

comment on column public.platform_payouts.created_by is
  'Authenticated actor that created the payout record. Client sends it explicitly; auth.uid() is a defensive default.';
