# Labora+ · release readiness · 2026-09-21

## Verdict

**Not ready for public production.** The codebase is suitable for the next controlled UAT, with external launch blockers listed below.

## Passed evidence

- TypeScript passed.
- Vitest passed: 16 files, 80 tests.
- Production Vite build passed.
- UAT repository preparation: `PREP_STATUS=ready`; this is not a dual-account PASS.
- Public browser surface rendered: login, signup role selection and Privacy navigation exercised.
- Tailwind moved from runtime CDN to the local production build.
- Plus Jakarta Sans and Leaflet are bundled locally.
- Vite no longer exposes a `GEMINI_API_KEY` define to browser code.
- Stripe Checkout and Portal CORS now require configured allowed origins.
- Live anonymous Supabase boundary passed for profiles, messages, documents, requirements, billing, webhook events, private document/identity buckets and the manager-unlink RPC.
- Route tool no longer fabricates random coordinates or calls the result an optimized live route; it is explicitly a manual estimate.

## Blocking evidence

1. Authenticated visual QA: requires the dedicated rider and gestor UAT sessions.
2. Dual-account UAT: requires real login, linking, messaging, document, requirement and isolation evidence plus `docs/UAT_DUAL_ACCOUNT_RESULT.json`.
3. Stripe sandbox: server secrets, product/price IDs, webhook endpoint and Checkout/Portal test evidence are unavailable; billing stays disabled.
4. Legal: operator identity, privacy contact, retention periods, controller/processor contract model and professional validation are missing.
5. Production publication: this branch/commit has not been pushed or deployed and no production smoke evidence exists.

## Rollback boundaries

- Editorial design checkpoint: commit `054c4e0`.
- Production hardening checkpoint: commit created after this report.
- Billing remains fail-closed behind `VITE_BILLING_ENABLED=false`.
- No live subscription or external publication was activated.

## Commands

```bash
npm run verify:release
npm run security:anon-live
npm run readiness
```

`npm run readiness` intentionally exits non-zero while material blockers remain.
