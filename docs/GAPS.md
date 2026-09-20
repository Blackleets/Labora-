# Labora+ — remaining gaps (honest)

Updated: 2026-09-20 (Europe/Paris). Branch: `main`. Linking RPCs **live** on Supabase `gggtriyvbusbpqohoukv`.

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
| Dual-account UAT **prep** | `docs/UAT_DUAL_ACCOUNT.md` + `npm run uat:dual` — checklist only, **not** PASS |
| Play Store **checklist** | `ANDROID.md` + `docs/PLAY_STORE_GATES.md` — shell **NOT Play-ready** |
| Billing prep (flag OFF) | `.env.example`; `VITE_BILLING_ENABLED=false`; BillingCard gated |
| Build / typecheck / vitest | Must stay green |
| Privacy / terms pages | **Merged PR #15** — `privacidad.html` / `terminos.html`; Login + Settings |

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
