-- Applied to Supabase project gggtriyvbusbpqohoukv on 2026-09-18.
-- Explicit client deny policy for internal Stripe webhook idempotency records.

create policy stripe_webhook_events_deny_clients
on public.stripe_webhook_events
for all
to anon, authenticated
using (false)
with check (false);
