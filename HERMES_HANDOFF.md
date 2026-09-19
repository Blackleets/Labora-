# LABORA+ — CANONICAL HANDOFF

Updated: 2026-09-19  
Repository: `Blackleets/Labora-`  
Default branch baseline before this closeout: `main@a226275636141b84c4c71b146e40b9e91c719a18`  
Working branch: `feat/labora-functional-closeout`  
Supabase project: `gggtriyvbusbpqohoukv`

## 0. Current status

The old PR #2 / PR #3 handoff is obsolete. Both were already merged to `main`.

The current branch is a **functional closeout**, not a redesign. Its purpose is to make the existing rider + gestoría product safer and more internally complete before visual redesign and external integration wiring.

Current CI validates two independent surfaces:

- React/Vite frontend: install + TypeScript + production build;
- Supabase Edge Functions: Deno typecheck for Stripe checkout, Stripe portal, Stripe webhook and Labora AI.

Latest verified closeout HEAD before this handoff update passed both CI jobs.

## 1. Product scope that is real now

### Rider / autónomo

- Supabase Auth account/session;
- onboarding preferences;
- profile + avatar;
- optional gestoría link by gestor email;
- work-session start/finish with optional odometer;
- registered income;
- imported income with original evidence and duplicate hash protection;
- expenses with receipts and review state;
- documents;
- models 130/303 workspace with explicit review state;
- gestor requests / rider responses;
- messages;
- platform/activity preferences;
- privacy mode and local appearance preferences.

### Gestoría

- manager identity/profile;
- linked-client portfolio;
- client income/expense review context;
- audited expense review;
- audited imported-income review;
- request creation/definition/review;
- tax declaration review and filing-record workflow;
- documents and messages.

## 2. Truth / safety guardrails

Do not:

- disable RLS;
- expose service-role, Stripe, Gemini or other secret keys in browser code;
- reintroduce fake bank OAuth;
- present platform preferences as API connections;
- infer universal VAT, IRPF or deductibility;
- label gestor review as AEAT filing;
- fabricate OCR values;
- allow public signup to create admin;
- add permissive RLS shortcuts such as `using (true)`;
- redesign core flows until functional closeout is merged.

Preserve:

- original evidence;
- SHA-256 exact duplicate protection;
- private storage;
- fail-closed OCR;
- fiscal-neutral defaults;
- explicit tax state transitions;
- role-scoped requirements;
- immutable message content;
- current green/ivory/terracotta identity until redesign phase.

## 3. Functional closeout changes

### AI moved server-side

Browser code no longer imports or initializes `@google/genai`.

The frontend keeps the existing service API but invokes authenticated Supabase Edge Function:

- `labora-ai`

Supported actions:

- receipt OCR;
- fiscal assistant;
- income extraction from text;
- income extraction from PDF/image;
- retention explanation.

The Edge Function:

- requires an authenticated Supabase user;
- reads `GEMINI_API_KEY` or `GOOGLE_API_KEY` only from server environment;
- never exposes the provider key to the browser;
- rejects unsupported/oversized payloads;
- uses strict non-hallucination extraction prompts;
- returns safe error codes and lets manual entry continue when AI is unavailable.

`labora-ai` is deployed to Supabase with `verify_jwt = true`.

If no Gemini server secret is configured, AI features must fail safely; manual money/receipt flows remain usable.

### Fiscal workspace corrections

- quarter selection starts from the actual current quarter, not hard-coded `3T 2026`;
- quarter choices are generated dynamically from current year + recorded declaration years;
- expense CSV export is scoped to the selected quarter;
- income CSV export is scoped to the selected quarter;
- a saved draft remains `requires_review`, not falsely `recorded`;
- negative working tax bases are preserved instead of being clamped to zero;
- tax amount remains unverified / zero until explicit review logic provides evidence.

### Client metrics correction

Gestoría client metrics no longer default unknown deductibility to 100%.

Unknown deductibility defaults to 0%, and open requirements count includes pending + submitted items.

### Anonymous Data API hardening

Live Supabase migration applied:

`20260919075952_labora_revoke_anon_operational_access`

The `anon` role now has no direct table privileges on Labora+ operational tables.

RLS remains enabled and unchanged.

Verified after migration:

- zero `anon` table grants on the operational tables;
- Security Advisor still shows only the existing Auth setting warning:
  `Leaked Password Protection Disabled`.

### CI expansion

CI now checks both browser and backend code.

Do not remove the Deno checks or re-expand Vite TypeScript over `supabase/functions`; they are separate runtimes.

## 4. Existing hardening that remains mandatory

Already implemented and live:

- profile privilege escalation prevention;
- public signup cannot request admin;
- expense facts separated from gestor review fields;
- rider cannot self-approve expenses or assign deductibility;
- editing reviewed expense resets review state;
- income evidence linkage + duplicate hash;
- manager income review;
- work-session RPC hardening;
- Requirements/Peticiones role/state machine;
- tax declaration `draft -> reviewed_by_gestor -> filed_with_tax_agency` state machine;
- filing reference/evidence requirement;
- filed declarations immutable;
- message sender/recipient/body immutable;
- recipient may only mark own message read;
- private operational storage;
- Realtime collaboration;
- truthful integration labels.

## 5. External wiring intentionally not claimed complete

These are **not bugs to fake around**. They belong to the wiring phase after functional closeout / redesign:

### Stripe Pro

Code and Edge Functions exist, but keep billing UI disabled until real sandbox configuration is verified.

Required server-side configuration includes Stripe secret, price IDs, webhook secret and Labora app URL.

Do not enable `VITE_BILLING_ENABLED=true` before end-to-end sandbox checkout + webhook + portal UAT passes.

### Gemini

`labora-ai` is ready and deployed. It requires a server-side Gemini secret to produce AI results.

Never add a `VITE_GEMINI_API_KEY`.

### Banking / PSD2

No real provider is connected yet.

Keep banking read-only/locked and truthful until a regulated Open Banking provider is selected and real OAuth/API authorization is implemented.

### Delivery platform APIs

Platform selection is a user preference, not a live API connection.

Keep it that way until real provider authorization exists.

### Notifications

Push/email/WhatsApp channels are not live yet. Do not expose fake notification toggles.

## 6. Remaining launch/UAT items

Before public launch, still verify with real accounts:

1. rider account signup/login/email confirmation;
2. manager account signup/login;
3. rider links manager by manager email;
4. rider adds income + expense + document;
5. manager sees linked records;
6. manager reviews expense/income;
7. manager creates request;
8. rider submits request;
9. manager approves request;
10. rider/manager message exchange + read-state;
11. model draft -> manager review -> filing reference;
12. mobile UAT on two real accounts;
13. Stripe sandbox only when billing wiring is intentionally enabled;
14. re-check Supabase Security Advisor.

Current non-code security setting still pending:

- enable Supabase Auth Leaked Password Protection in project settings and verify it.

## 7. Next phase after this branch is merged

The user's intended sequence is:

1. finish functional app;
2. redesign/polish UX;
3. wire external services that require real provider credentials/contracts.

Therefore the next design pass should **not** change authority models, data truth, RLS or state machines.

Redesign may change layout, typography, hierarchy and interaction polish while preserving the wired core.

## 8. Start instruction for next agent

```text
Continue Labora+ from current main.

Repository: Blackleets/Labora-
Supabase project: gggtriyvbusbpqohoukv

Read HERMES_HANDOFF.md first.

The functional closeout moved AI server-side, fixed fiscal quarter/export truth,
expanded CI to Deno Edge Functions, and revoked anonymous operational table access.

Do not reintroduce browser API secrets, fake integrations, universal fiscal assumptions,
or permissive RLS.

If functional closeout is already merged and CI is green, begin the redesign phase
without weakening the existing authority/state/security model.

External wiring (Stripe sandbox, Gemini server secret, PSD2 banking, delivery APIs,
notification channels) must remain truthful and disabled until real credentials and UAT exist.
```
