# Labora+ — remaining gaps (honest)

Updated: 2026-09-20 (Europe/Paris). Branch: `main` (+ loop 7 UAT prep / a11y). **Cream-token sweeps stopped.** Linking RPCs **live** on Supabase `gggtriyvbusbpqohoukv`. Security advisors: see `docs/RLS_ADVISORS.md` (HIBP WARN still Lewis — dashboard login blocked).

## Merged on main (no longer blocked)

| Item | Notes |
| --- | --- |
| **PR #11** premium UI / brand | Merged — parchment / forest / clay; logos; meadow login |
| **PR #12** messaging clarity | Merged — rider↔gestoría hub titles, badges, eligibility, `docs/MESSAGING.md` |
| **PR #13** gestoría signup | Merged — NIF + colegiado required (`docs/REGISTRATION.md`) |
| Autónomo ↔ gestoría **linking UI** | Settings: **Tu gestoría** / **Tus clientes**; link by email; unlink with confirm |
| Linking RPCs (live) | Applied on Supabase + synced in repo |

## Done without secrets (agent-safe)

| Item | Notes |
| --- | --- |
| Banking UI honesty | Copy: **Open Banking próximamente**; fail-closed adapters |
| Fail-closed vitest | Messaging cache isolation; bank refuse; billing flag default off; gestoría link helpers |
| Dual-account UAT **prep** | `docs/UAT_DUAL_ACCOUNT.md` + `npm run uat:dual` — checklist + `PREP_STATUS` machine-check; **not** PASS |
| Play Store **checklist** | `ANDROID.md` + `docs/PLAY_STORE_GATES.md` — shell **NOT Play-ready** |
| Billing prep (flag OFF) | `.env.example`; `VITE_BILLING_ENABLED=false`; BillingCard gated |
| Build / typecheck / vitest | Must stay green |
| Privacy / terms pages | **Merged PR #15** — `privacidad.html` / `terminos.html`; Login + Settings |
| Income import without APIs | Parser local CSV/líneas Glovo·Uber (sin Gemini); banca/plataformas apuntan a Ingresos |
| Anti-fiction pass (Risks/Events/KPIs/ModulesCenter) | Fail-closed unavailable shells; Login copy sin «demo»; `money-incomes` deep-link; payrollEngine marcado no-prod |
| No enterprise demo org | `OrganizationContext` stays null; payroll/policies fail-closed without fake employees |
| Anti-fiction delivery / hot zones | Orphan HotZones/Delivery/LiveMap/demandEngine/ModulesCenter **removed**; OperationsHub fail-closed |
| Agent-safe polish pass | BASE_URL legal links; currency from CountryContext in money UIs; dark cream remaps; ManagerDashboard Ver ticket + % deducible; platform letter accents; honest account-deletion entry |
| Agent-safe loop 2 (hub CSS vars, Messages empty/soft-grid dark, soft currency toolkit/billing labels, legal relative HTML) | Dark remaps + `var(--labora-*)` on Messages/Money/Catalog/People/Dashboard leftovers; billing flag still OFF |
| Agent-safe loop 3 (Settings/Onboarding/Documents cream→tokens, ManagerDashboard status chips, toolkit soft shadow) | `var(--labora-*)` + `.labora-status-*` theme chips; RiderToolkit shadows; billing flag still OFF |
| Agent-safe loop 4 (GestorRequirements/Expense/Login/Tax/Income + banking·payroll shells cream→tokens) | Remaining parchment hex → `var(--labora-*)`; requirements/expense/income badges → `.labora-status-*`; meadow Login sky gradients kept; billing flag still OFF |
| Agent-safe loop 5 (Sidebar/Dashboard/GasStation/TaxDeclarations/Education/Identity/FiscalChat/Movements + ProDashboard·Risk·Events·Ops·Policy shells) | Cream/parchment chrome → `var(--labora-*)`; fail-closed shells theme-safe; Education/FiscalChat/Movements blue accents kept; billing flag still OFF |
| Agent-safe loop 6 (AutomationHub + FeatureFlagSettings cream→tokens; advisors; legal withBaseUrl vitest) | Hub/flags → `var(--labora-*)`; `docs/RLS_ADVISORS.md` (HIBP WARN only); legal href vitest; `dark_mode_force` copy honest (local/in-memory); billing flag still OFF |
| Agent-safe loop 7 (UAT dual prep + Login/Settings a11y) | `npm run uat:dual` machine prep (`PREP_STATUS`); explicit self-link / not_manager vitest; labels, `role=switch`, `role=alert`, focus-visible on Login + gestoría link; **cream sweeps stopped**; HIBP still Lewis; billing OFF |

## Linking — what works / what needs Lewis

| Capability | State |
| --- | --- |
| Rider UI: show linked gestoría or email form | Works in Settings (`Tu gestoría`) |
| Manager UI: share email + list linked clients | Works in Settings (`Tus clientes`) — no fake invites |
| Client validation (role=manager/admin only) | Pure helpers + RPC reject riders / self |
| Set / clear `profiles.manager_id` | **Only via RPC** — column is **not** in authenticated UPDATE grant |
| RPC applied on live project | **Applied** 2026-09-20 (`labora_gestoria_link_rpcs` + grants harden) |
| Direct `.update({ manager_id })` from Vite | **Cannot** — by design (column security) |

## Blocked on Lewis

| Gap | State |
| --- | --- |
| **Dual-account UAT sign-off** | Checklist ready; **gestoría UAT account created** — Lewis runs checklist + signature |
| **Apply gestoría link RPCs** on live Supabase | **Done** — `link_manager_by_email` + `unlink_own_manager` live |
| **Stripe secrets + Price IDs** | **Deferred** (Lewis: sin acceso Stripe por ahora) |
| **Gemini / OCR API key** | Server secret only (`GEMINI_API_KEY` / `GOOGLE_API_KEY`) |
| **`VITE_BILLING_ENABLED=true`** | Only after sandbox UAT passes |
| **Play Console / keystore / Data safety / screenshots / privacy URL** | External; shell is not Play-ready |
| **Live Open Banking (PSD2)** | Provider + legal — not faked |
| **Platform OAuth** (Uber, Glovo, …) | Catalog / preference only — no fake Connect |
| **Adversarial RLS on live Supabase** | Needs Lewis’s project + dual sessions |
| **Auth leaked-password protection** | **Deferred** — dashboard login blocked (hCaptcha / GitHub SSO 500); MCP cannot toggle Auth HIBP; enable later in Auth → Password |

## Draft PR #1 (foundation)

**Closed** 2026-09-20 as superseded by current `main`. See [`docs/FOUNDATION_DRAFT.md`](./FOUNDATION_DRAFT.md) only if cherry-picking fiscal/trust pieces.

## Product honesty

- Spanish UI preserved.
- “En mi actividad” = profile preference, **not** connected OAuth.
- Banking remains Open Banking / próximamente — fail-closed.
- Linking is email + `manager_id` RPC — **not** OAuth, **not** invite codes unless already in schema.
- Do not invent UAT PASS or Play-ready claims.
- RiskMonitor / EventsView / ProDashboard / ModulesCenter: unavailable or marked blocked — no fake weather, calendar success, or KPI seeds.
- Orphan delivery / hot-zones fiction files removed from tree; OperationsHub remains an honest unavailable shell.
