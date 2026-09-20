# Labora+ — remaining gaps (honest)

Updated: 2026-09-20 (Europe/Paris). Branch: `feat/labora-millionaire-design`. **Do not merge** until product gates say so.

## Done without secrets (this / recent agent passes)

| Item | Notes |
| --- | --- |
| Premium UI / brand on PR #11 branch | Parchment / forest / clay; logos; meadow login |
| Banking UI honesty | Copy: **Open Banking próximamente**; no «conectado» sin adapter real; `bankAdapter` / `bankApi` fail-closed |
| Automated fail-closed tests | Messaging per-user cache isolation; bank refuse; billing flag default off |
| Dual-account UAT **prep** | `android-shell/docs/UAT_DUAL_ACCOUNT.md` + `npm run uat:dual` — checklist only, **not** PASS |
| Play Store **checklist** | `ANDROID.md` + `docs/PLAY_STORE_GATES.md` — shell marked **NOT Play-ready** |
| Billing prep (flag OFF) | `.env.example` documents Stripe/Gemini server secrets; `VITE_BILLING_ENABLED=false`; BillingCard gated |
| Build / vitest | Must stay green on branch |

## Blocked on Lewis

| Gap | State |
| --- | --- |
| **PR #11** merge | OPEN — **DO NOT MERGE** until Lewis says so |
| **Dual-account UAT sign-off** | Checklist ready; needs two real accounts + Lewis signature |
| **Stripe secrets + Price IDs** | Supabase Function secrets; sandbox checkout/webhook/portal UAT |
| **Gemini / OCR API key** | Server secret only (`GEMINI_API_KEY` / `GOOGLE_API_KEY`) |
| **`VITE_BILLING_ENABLED=true`** | Only after sandbox UAT passes |
| **Play Console / keystore / Data safety / screenshots / privacy URL** | External; shell is not Play-ready |
| **Live Open Banking (PSD2)** | Provider + legal — not faked |
| **Platform OAuth** (Uber, Glovo, …) | Catalog / preference only — no fake Connect |
| **Adversarial RLS on live Supabase** | Needs Lewis’s project + dual sessions |

## Logos (reference)

| Source | Brands |
| --- | --- |
| Simple Icons CDN (verified 200) | glovo, uber, ubereats, justeat, deliveroo, paypal, stripe, revolut, square, quickbooks, xero, wise, n26, chase, wellsfargo, lyft |
| Local geometric SVG (CDN absent / fail) | glovo, uber, uber_eats, just_eat, cabify, bolt, bolt_food |
| Google favicon → Clearbit → Lucide | stuart, paack, catcher, banorte, holded, amazon_flex, rappi, didi*, wolt, freenow, qonto, bbva_*, santander_es |

## Product honesty

- Spanish UI preserved.
- “En mi actividad” = profile preference, **not** connected OAuth.
- Banking remains Open Banking / próximamente — fail-closed.
- Do not invent UAT PASS or Play-ready claims.
