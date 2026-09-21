# Supabase security advisors — Labora+

Project: `gggtriyvbusbpqohoukv`  
Checked: 2026-09-21 (Europe/Paris) via Supabase MCP `get_advisors` (type=`security`).

## Result (honest)

| Advisor | Level | Action this loop |
| --- | --- | --- |
| **Leaked Password Protection Disabled** (`auth_leaked_password_protection`) | WARN | **No migration fix** — Auth dashboard setting (HaveIBeenPwned). MCP cannot toggle Auth HIBP. Already tracked under Blocked on Lewis in `docs/GAPS.md` / `docs/AUTH_HIBP.md`. |
| RLS enabled, no policy (`operational_deletion_tombstones`) | INFO | **Intentional deny-all** — clients cannot read or write tombstones; `SECURITY DEFINER` triggers record them and reject stale recreation of deleted expenses, incomes and documents. |
| RLS / PUBLIC grant advisories | — | **None returned** this run. |

Remediation link from advisor: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## What we did **not** invent

- No PASS claim for adversarial RLS.
- No schema migration this loop — advisors did not list dangerous PUBLIC grants or missing RLS policies to revoke safely.
- Performance advisors were not requested this loop.

## Next (Lewis)

1. Enable Auth → Password → leaked-password protection when dashboard login works (hCaptcha / GitHub SSO historically blocked agents).
2. Re-run `get_advisors` after any DDL; fix only clear revoke/grant issues that do not break rider↔gestoría RPCs.
