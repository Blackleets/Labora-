# Labora+ — remaining gaps (honest)

Updated: 2026-09-20 (Europe/Paris). Branch: `main` (+ PR `feat/gestoria-link-and-docs`).

## Merged on main (no longer blocked)

| Item | Notes |
| --- | --- |
| **PR #11** premium UI / brand | Merged — parchment / forest / clay; logos; meadow login |
| **PR #12** messaging clarity | Merged — rider↔gestoría hub titles, badges, eligibility, `docs/MESSAGING.md` |
| **PR #13** gestoría signup | Merged — NIF + colegiado required (`docs/REGISTRATION.md`) |
| Autónomo ↔ gestoría **linking UI** | Settings: **Tu gestoría** / **Tus clientes**; link by email; unlink with confirm |
| Linking RPCs (repo) | Migration `20260920141000_labora_gestoria_link_rpcs.sql` — must be **applied** on live Supabase |

## Done without secrets (agent-safe)

| Item | Notes |
| --- | --- |
| Banking UI honesty | Copy: **Open Banking próximamente**; fail-closed adapters |
| Fail-closed vitest | Messaging cache isolation; bank refuse; billing flag default off; gestoría link helpers |
| Dual-account UAT **prep** | `docs/UAT_DUAL_ACCOUNT.md` + `npm run uat:dual` — checklist only, **not** PASS |
| Play Store **checklist** | `ANDROID.md` + `docs/PLAY_STORE_GATES.md` — shell **NOT Play-ready** |
| Billing prep (flag OFF) | `.env.example`; `VITE_BILLING_ENABLED=false`; BillingCard gated |
| Build / typecheck / vitest | Must stay green |

## Linking — what works / what needs Lewis

| Capability | State |
| --- | --- |
| Rider UI: show linked gestoría or email form | Works in Settings (`Tu gestoría`) |
| Manager UI: share email + list linked clients | Works in Settings (`Tus clientes`) — no fake invites |
| Client validation (role=manager/admin only) | Pure helpers + RPC reject riders / self |
| Set / clear `profiles.manager_id` | **Only via RPC** — column is **not** in authenticated UPDATE grant |
| RPC applied on live project | **Lewis must run** migration (or confirm already present) |
| Direct `.update({ manager_id })` from Vite | **Cannot** — by design (column security) |

## Blocked on Lewis

| Gap | State |
| --- | --- |
| **Dual-account UAT sign-off** | Checklist ready; needs two real accounts + Lewis signature |
| **Apply gestoría link RPCs** on live Supabase | Migration in repo; confirm execute |
| **Stripe secrets + Price IDs** | Supabase Function secrets; sandbox checkout/webhook/portal UAT |
| **Gemini / OCR API key** | Server secret only (`GEMINI_API_KEY` / `GOOGLE_API_KEY`) |
| **`VITE_BILLING_ENABLED=true`** | Only after sandbox UAT passes |
| **Play Console / keystore / Data safety / screenshots / privacy URL** | External; shell is not Play-ready |
| **Live Open Banking (PSD2)** | Provider + legal — not faked |
| **Platform OAuth** (Uber, Glovo, …) | Catalog / preference only — no fake Connect |
| **Adversarial RLS on live Supabase** | Needs Lewis’s project + dual sessions |

## Draft PR #1 (foundation)

See [`docs/FOUNDATION_DRAFT.md`](./FOUNDATION_DRAFT.md). **Do not merge** the draft. Recommendation: **close** as superseded by current `main`; cherry-pick only if fiscal/trust/migration pieces are still wanted.

## Product honesty

- Spanish UI preserved.
- “En mi actividad” = profile preference, **not** connected OAuth.
- Banking remains Open Banking / próximamente — fail-closed.
- Linking is email + `manager_id` RPC — **not** OAuth, **not** invite codes unless already in schema.
- Do not invent UAT PASS or Play-ready claims.
