-- Applied to Supabase project gggtriyvbusbpqohoukv on 2026-09-19.
-- Defense in depth: unauthenticated clients do not need direct Data API access
-- to operational Labora+ tables. RLS remains enabled and unchanged.

revoke all privileges on table public.profiles from anon;
revoke all privileges on table public.incomes from anon;
revoke all privileges on table public.expenses from anon;
revoke all privileges on table public.requirements from anon;
revoke all privileges on table public.messages from anon;
revoke all privileges on table public.documents from anon;
revoke all privileges on table public.tax_declarations from anon;
revoke all privileges on table public.payments from anon;
revoke all privileges on table public.work_sessions from anon;
revoke all privileges on table public.billing_accounts from anon;
revoke all privileges on table public.stripe_webhook_events from anon;
