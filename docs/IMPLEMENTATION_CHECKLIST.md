# Implementation checklist — Labora+ (honest)

Updated: 2026-09-20 (Europe/Paris). Feature work may live on unmerged branches; this file tracks **done vs blocked**.

## Done (no invented data)

| Item | State |
| --- | --- |
| Anti-fiction ops | Orphan Hot Zones / Delivery / LiveMap / demandEngine / ModulesCenter **removed** from tree; OperationsHub stays fail-closed without product branding of demand maps |
| Photo → expense | Rider scan / repostaje keeps image; clear loading; `AI_NOT_CONFIGURED` → «IA no configurada» + manual path |
| Gestor auditoría | MoneyHub expenses lists linked clients; approve / reject / % deducible UI; empty states |
| Multi-country profile | `profiles.country_code` on Supabase; registration uses CountrySelector (no hardcode `ES`); CountryContext hydrates from profile when logged in |
| TaxOverview ES | IRPF / IVA / AEAT copy (estimativo, no presentación) |
| TaxOverview MX | Régimen slots marked **pendiente de datos oficiales** — **no invented rates** |
| Docs | This checklist + `HOW_TO_TEST_AUTONOMO_GESTORIA.md` |
| CI | `tsc` + vitest must stay green on the feature branch |
| Agent-safe polish (BASE_URL legal, currency/country, dark remaps, audit ticket/%, platform letter accents, account-deletion honesty) | Done on `feat/agent-safe-polish-pass` — no secrets / OCR / tax fiction |
| Agent-safe loop 2 (hub CSS vars, Messages dark empty/soft-grid, soft currency, legal relative `/Labora-/`) | Done on `agent/loop2-dark-currency-legal` — billing flag still OFF |
| Agent-safe loop 3 (Settings/Onboarding/Documents tokens, ManagerDashboard `.labora-status-*`, toolkit shadows) | Done on `agent/loop3-settings-docs-chips` — no secrets / invented features |
| Agent-safe loop 4 (GestorRequirements/Expense/Login/Tax/Income + banking·payroll fail-closed shells) | Done on `agent/loop4-cream-tokens` — billing flag still OFF |
| Agent-safe loop 5 (Sidebar/Dashboard/modals/Education/chat/Movements + KPI/Risk/Events/Ops/Policy shells) | Done on `agent/loop5-cream-tokens` — billing flag still OFF |

## Blocked / external (secrets or official data)

| Item | Why blocked |
| --- | --- |
| **Gemini / OCR** | Server secret `GEMINI_API_KEY` / `GOOGLE_API_KEY` on edge function — without it, OCR fails closed («IA no configurada») |
| **Official tax tables (MX/other)** | Need verified SAT (or local authority) sources before showing rates — product shows pending slots only |
| **Dual-account UAT PASS** | Checklist in `UAT_DUAL_ACCOUNT.md`; Lewis must run and sign — agent does not invent PASS |
| **Stripe** | Secrets + Price IDs deferred; `VITE_BILLING_ENABLED` stays false |
| **Auth HIBP** | Dashboard toggle deferred (`docs/AUTH_HIBP.md`) |
| **GitHub Pages live rebuild** | Workflow `pages.yml` builds `main` with base `/Labora-/`. Pages must be enabled on the repo; redeploy from **main tip** (not unmerged feature) via push to main (workflow-only chore) or `workflow_dispatch` after workflow is on main |
| **Platform OAuth / Open Banking** | Preferencias only / fail-closed — not faked |
| **Play Store** | External gates (`ANDROID.md`) |

## Explicit non-goals this pass

- No fake OCR providers
- No fake tax rates
- No merge of feature pack into `main` without Lewis review
- No secrets in the repo or client `VITE_*` for Gemini/Stripe
