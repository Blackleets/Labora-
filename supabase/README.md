# Labora+ Supabase

This directory uses the ordered migration chain in `supabase/migrations/` as the only source of truth for the database.

## Important

- Do not apply a standalone `schema.sql` snapshot. It was removed because it could drift behind later security migrations.
- Use a dedicated Labora+ Supabase project. Do not reuse another production or internal project.
- Apply migrations in filename order.
- Keep service-role keys and provider API secrets out of the Vite client. The frontend only receives the public Supabase URL and publishable key.
- After applying migrations, review Supabase Security Advisor and Performance Advisor before real-user testing.

## Current migration chain

1. `20260916090000_baseline_schema.sql`
2. `20260916090100_advisor_trust.sql`
3. `20260916090200_market_currency_guard.sql`
4. `20260916090300_security_hardening.sql`
5. `20260916090400_signup_country_integrity.sql`
6. `20260916090500_financial_actor_defaults.sql`
7. `20260916090600_requirement_state_machine.sql`
8. `20260916090700_expense_deductibility_review.sql`

## Minimum UAT before merging to main

Use two independent accounts: one worker and one advisor.

Validate signup/email confirmation, workspace bootstrap, invitation acceptance, consent-scoped client access, private evidence upload, expense review, explicit deductibility assessment for Spain, requirement submission with evidence, advisor approval, messaging/read state, link revocation, and negative RLS cases where one account attempts to access another unrelated workspace.

The production invariants remain:

- No evidence -> no verified fact.
- No verified filing evidence -> no filed state.
- No real integration -> no connected claim.
- Unsupported market -> no borrowed tax rules.
