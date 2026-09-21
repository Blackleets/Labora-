# Labora+ Pro — Stripe launch checklist

Status: code + Supabase billing foundation implemented. Keep billing disabled in the frontend until Stripe sandbox configuration passes end-to-end.

## Product defaults

- Product: `Labora+ Pro`
- Suggested display defaults currently in UI:
  - monthly: `9,99 €/mes`
  - annual: `89,90 €/año`
- These labels are not authoritative Stripe prices. The real recurring Price objects in Stripe are the billing source of truth.

## Stripe objects required

Create one Stripe Product and two recurring Prices:

- monthly recurring EUR price
- annual recurring EUR price

Do not hardcode secret keys or Stripe customer/subscription IDs in the browser.

## Supabase Edge Function secrets

Configure these as server-side Supabase secrets, never as `VITE_*` variables:

- `STRIPE_SECRET_KEY` (or `STRIPE_API_KEY`)
- `STRIPE_WEBHOOK_SECRET` (or `STRIPE_WEBHOOK_SIGNING_SECRET`)
- `STRIPE_PRO_MONTHLY_PRICE_ID`
- `STRIPE_PRO_ANNUAL_PRICE_ID`
- `LABORA_APP_URL`
- `LABORA_ALLOWED_ORIGINS` (comma-separated web/native origins; never use `*`)

Supabase provides `SUPABASE_URL`, `SUPABASE_ANON_KEY` / publishable key and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions.

## Webhook

Endpoint:

`https://gggtriyvbusbpqohoukv.supabase.co/functions/v1/stripe-webhook`

Subscribe at minimum to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

The webhook is intentionally deployed with JWT verification disabled because Stripe cannot send a Supabase user JWT. The function verifies the Stripe signature before processing the raw body.

## Frontend launch flags

Only after sandbox checkout + webhook + portal tests pass:

- `VITE_BILLING_ENABLED=true`
- optional `VITE_LABORA_PRO_MONTHLY_LABEL`
- optional `VITE_LABORA_PRO_ANNUAL_LABEL`

Until `VITE_BILLING_ENABLED=true`, the Pro card remains hidden and existing product behavior is preserved.

## Security model

- Browser users may SELECT only their own `billing_accounts` row.
- Browser users cannot INSERT/UPDATE/DELETE billing state.
- Pro is active only when the server-backed entitlement reports:
  - plan = `pro`
  - Stripe subscription status = `active` or `trialing`
  - current period has not expired
- Stripe webhook events are stored for idempotency but are inaccessible to browser roles.
- Checkout and customer-portal functions require a valid Supabase JWT.
- Stripe webhook requires a valid Stripe signature.

## Required sandbox UAT before enabling billing

1. Free user sees no Pro entitlement.
2. Direct browser attempt to set `plan='pro'` is blocked.
3. Monthly checkout succeeds in Stripe sandbox.
4. Webhook upgrades the matching Labora+ user, not another user.
5. Annual checkout succeeds.
6. Subscription cancellation updates the entitlement.
7. Customer Portal opens only for the authenticated Stripe customer.
8. Duplicate webhook delivery is idempotent.
9. Failed/invalid webhook signatures return HTTP 400.
10. No Stripe secret appears in frontend source or network payloads.

Do not switch Stripe to live mode until this passes.

## Bot / agent policy

- Do **not** enable `VITE_BILLING_ENABLED` without Lewis confirming sandbox UAT.
- Do **not** request or write real Stripe / Gemini secrets into the repo.
- Secrets live only in Supabase Function secrets (and Lewis’s password manager).
