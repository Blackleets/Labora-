# LABORA+ — CANONICAL HERMES HANDOFF

Updated: 2026-09-16
Repository: `Blackleets/Labora-`
Working branch: `feat/labora-e2e-ready`
Pull request: `#2`
Known-good app commit before this handoff document: `3a5d623ffb780a82220f0a90d4dd78ef7ab4118c`

## 0. Mission

Continue improving Labora+ as a real two-sided product for:

- Rider / autonomo: income, expenses, documents, fiscal workspace, requests, messages and profile.
- Gestoria / manager: linked-client portfolio, expense review, requests, documents, fiscal review and messages.

Do not turn it back into a demo, template, generic SaaS dashboard or fake integration showcase.

Primary product direction:

**calma premium + fiscal inteligente + humano**

Labora+ must feel distinctive, simple, trustworthy and mobile-first.

## 1. NON-NEGOTIABLE GUARDRAILS

Do NOT:

- disable Supabase RLS;
- add `service_role` or any secret key to the browser;
- add broad `using (true)` / `with check (true)` policies to make errors disappear;
- invent fiscal data, merchants, invoices, tickets, VAT, deductibility or filing status;
- reintroduce demo users, fake receipts, fake gestor clients or fake bank connections;
- claim AEAT validation when only the gestoria reviewed something;
- claim a bank, Uber, Glovo, etc. is connected when there is no real API/OAuth connection;
- expose one manager's clients to another manager;
- redesign from scratch screens that already work without evidence that the redesign solves a real UX problem;
- merge to `main` until real mobile QA passes.

Preserve:

- Supabase Auth;
- RLS isolation;
- private Storage;
- Realtime messaging / operational updates;
- Rider -> Gestoria linking model;
- OCR fail-closed behavior;
- SHA-256 duplicate blocking;
- fiscal-neutral defaults before explicit review;
- banking locked until regulated Open Banking integration exists;
- current visual identity.

## 2. CURRENT BLOCKER — FIX FIRST

### Repro

On Rider Profile / Settings, editing data such as vehicle plate and tapping **Guardar cambios** can surface:

`new row violates row-level security policy`

### Expected

A logged-in user must be able to update their own profile and identity image only.

### Investigate

Trace the complete path:

`components/Settings.tsx`
-> `updateRemoteProfile(...)`
-> Supabase `profiles`
-> any Storage write to `labora-identity`
-> local workspace hydration / session state

Verify:

1. `auth.uid()` is the same UUID as `currentUser.id`.
2. The browser is not carrying stale localStorage data from an old local/demo identity.
3. `profiles` UPDATE has both a SELECT policy and UPDATE `USING` + `WITH CHECK` that permit only `id = auth.uid()` for self updates.
4. Storage object ownership/path matches the authenticated user (`<uid>/...`).
5. No profile update accidentally changes protected relationship fields such as `manager_id`, `role` or another user's id.
6. Signup confirmation / recovered sessions cannot produce a local current user before the remote profile is valid.
7. Error messages shown to users are friendly; raw PostgreSQL/RLS text should be logged for diagnosis but not exposed as the primary UI message.

### Acceptance test

- Rider A updates own name/phone/NIF/plate/photo -> succeeds.
- Rider A cannot update Rider B.
- Manager A updates own manager profile/logo -> succeeds.
- Manager A cannot update Rider profile fields directly unless an explicit audited manager operation is designed for that field.
- Anonymous update fails.
- Reload / second device retains profile changes.
- RLS remains enabled.

## 3. CURRENT PRODUCT STATE

### Auth and collaboration

- Supabase email/password Auth is wired.
- Browser sessions persist and refresh.
- Rider can link a Gestoria by the Gestoria account email.
- Gestoria views are scoped to riders linked through `managerId` / backend relationship.
- Rider and Gestoria use separate sessions; role switching inside the normal app was removed.
- Messages use Supabase + Realtime.

### Identity

- Rider can upload a profile photo.
- Gestoria can upload a logo/image.
- Identity images use private Storage and signed URLs.
- Identity appears in navigation, clients and messages.

### Expenses / receipts

- Generic receipt scan supports image OCR.
- Fuel receipt flow was rebuilt mobile-first.
- Fuel mobile flow now starts with two explicit controls: **Tomar foto** and **Galeria**.
- Uploaded receipt remains visible as a thumbnail while confirming fields.
- Fuel station selection is compact; advanced details are optional/collapsible.
- Save action is sticky / easy to reach on mobile.
- OCR must never fabricate fields when unavailable or uncertain.
- OCR exposes confidence / review flags.
- Exact receipt duplicates are blocked with SHA-256.
- New expense/repostaje defaults must remain fiscal-neutral until review: `vatRate = 0`, `vatAmount = 0`, `deductiblePercentage = 0`, `pending_review`.

### Documents

- PDF, JPG, PNG and WebP supported.
- PDF multipage content is preserved.
- SHA-256 duplicate detection.
- Private Storage + RLS.
- Remote deletion must delete DB row + Storage object and must not resurrect on hydration.

### Fiscal

- Fiscal screens distinguish estimates from official filings.
- A manager should only be able to select linked riders.
- No fixed fake quarter should remain in active flows.
- Never label manager approval as AEAT validation.

### Banking

- NO real bank connection exists yet.
- Old mock connection behavior was removed/blocked.
- UI communicates future regulated PSD2 / Open Banking model.
- Labora+ must never request/store bank credentials.
- First future phase should be read-only balances/transactions with explicit consent; no payment initiation.

## 4. VISUAL SYSTEM

Current design direction:

- Deep green: `#214E3A`
- Secondary green: `#2F6B50`
- Fresh accent chosen during design pass: `#52AA83`
- Terracotta: `#D66C47`
- Amber: `#F1C56B`
- Ivory: `#F7F3EA`
- Ink: `#1E231F`

Use `#52AA83` as a living interaction/success/accent color, not as the only brand background. Deep green remains the trust/structure anchor. Terracotta is useful for physical capture/actions such as receipts/repostaje.

Avoid generic blue/purple SaaS styling.

Rider should feel calmer and simpler. Gestoria can be denser and more operational, while sharing the same brand language.

## 5. CONNECTION INVENTORY

### GitHub

- Repo: `Blackleets/Labora-`
- Branch: `feat/labora-e2e-ready`
- PR: `#2`
- CI: `.github/workflows/ci.yml`
- Required before considering merge: install + TypeScript + Vite build green.

### Supabase

- Project ref: `gggtriyvbusbpqohoukv`
- Region previously used: EU / London (`eu-west-2`).
- Core tables created: `profiles`, `incomes`, `expenses`, `requirements`, `messages`, `documents`, `tax_declarations`, `payments`.
- RLS enabled on operational tables.
- Private identity/doc storage used.
- Realtime used for messages and relevant operational updates.

Important hygiene improvement:

`services/supabaseClient.ts` currently contains the public Supabase URL + publishable browser key directly in source. The publishable key is not a service-role secret, but migrate configuration to Vite environment variables for deployment hygiene. Do NOT replace it with a secret/service-role key in the frontend.

Recommended env names:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### Gemini

`services/geminiService.ts` uses Gemini for OCR / assistance.

Current code has looked for variants such as:

- `VITE_GEMINI_API_KEY`
- `VITE_API_KEY`
- server/process equivalents in supported environments.

Current OCR model in the recent implementation: `gemini-2.5-flash`.

Rules:

- missing API key -> fail closed;
- model/API error -> no invented records;
- extracted data is suggestion/review input, not authoritative fiscal truth.

### Preview

Known-good mobile preview for the app commit immediately before this handoff doc:

`https://stackblitz.com/github/Blackleets/Labora-/tree/3a5d623ffb780a82220f0a90d4dd78ef7ab4118c?startScript=dev`

StackBlitz browser chrome is not part of Labora+ UI. Test the app viewport itself.

### Vercel / Render / Replit

- Do not assume Labora+ is already deployed to Vercel production.
- Previous isolated Render static-site creation attempts failed server-side and did not create a Labora service.
- Do not overwrite Genesis/Efesto or any unrelated service.
- Replit is not the canonical source of truth for Labora+.
- Canonical source of truth is GitHub branch + Supabase.

## 6. HERMES IMPROVEMENT PASS — AFTER RLS FIX

After fixing and testing the blocker, audit the whole app and return **recommendations first**, then implement only high-confidence improvements that preserve working behavior.

Review specifically:

### A. Mobile UX

- no horizontal overflow;
- no controls hidden under bottom nav;
- keyboard does not hide primary actions;
- camera/gallery upload works on Android/iOS browsers;
- modals/sheets use `100dvh` safely;
- sticky actions stay reachable;
- alerts/toasts do not cover critical controls;
- tap targets >= roughly 44px where practical;
- loading, empty, error and offline states are explicit.

### B. Product coherence

- one visual language across Login, Home, Money, Fiscal, Documents, Requests, Messages, Profile and Gestoria;
- fewer cards when hierarchy can replace boxes;
- no developer jargon exposed (`RLS`, bucket, feature flags, etc.) unless inside a diagnostic/admin context;
- no fake settings or dead controls;
- no role switcher in production UX;
- useful empty states guide the next action.

### C. Rider <-> Gestoria relationship

Current email-link method works conceptually but can improve.

Recommend a safer/better UX, for example:

- Gestoria generates invite code/link;
- Rider accepts the invite;
- pending / accepted / revoked relationship state;
- Gestoria cannot silently claim a Rider;
- Rider can see which Gestoria is linked;
- unlink/revoke flow requires explicit confirmation and preserves audit history.

Do not implement an insecure shortcut just for convenience.

### D. Documents and invoice workflow

Suggest improvements for:

- invoice vs simple receipt distinction;
- PDF upload and OCR extraction;
- multi-page OCR strategy;
- duplicate detection beyond exact hash (possible fuzzy duplicate warning without auto-deleting);
- original file preservation;
- extracted fields review screen;
- audit trail: uploaded -> OCR -> user confirmed -> gestoria reviewed -> correction requested -> approved;
- document search/filter by supplier, date, amount, status;
- export without claiming official filing.

### E. Fiscal safety

Audit every calculation and label.

- Keep estimates clearly marked.
- Do not infer deductibility from category/photo alone.
- Avoid a universal 21% VAT assumption.
- Do not mark anything as filed unless a real filing reference/evidence is stored.
- Consider an explicit `fiscal_review` object/version instead of mutating raw expense facts.

### F. Security

Audit:

- RLS table policies;
- Storage policies;
- profile update surface;
- manager/rider isolation;
- Realtime subscriptions;
- signed URL lifetime/refresh;
- XSS / untrusted text display;
- file MIME/size validation;
- localStorage use and stale-session behavior;
- Gemini/browser API key exposure and whether OCR should move server-side before production;
- rate limiting / abuse protection needed before launch.

Do not weaken controls to get green tests.

### G. Observability

Recommend a small production-ready error model:

- user-friendly error messages;
- internal error codes;
- correlation/request id where useful;
- minimal client error logging with no receipts/NIF/email contents in plaintext logs;
- health/readiness view for development only, not normal Rider UI.

## 7. REQUIRED OUTPUT FROM HERMES

At the end, return exactly these sections:

1. `ROOT CAUSE OF RLS BUG`
2. `FIX APPLIED`
3. `DATABASE / RLS CHANGES`
4. `FILES CHANGED`
5. `TESTS RUN`
6. `SECURITY CHECK`
7. `MOBILE QA RESULTS`
8. `WHAT IS NOW PROVEN`
9. `WHAT REMAINS UNVERIFIED`
10. `TOP 10 IMPROVEMENT SUGGESTIONS` ordered by impact/risk reduction
11. `NEXT 3 IMPLEMENTATIONS` with rationale
12. `HANDOFF BACK TO CHATGPT`

Do not claim a test passed unless it was actually run.

## 8. COPY/PASTE MASTER INSTRUCTION FOR HERMES

```text
LABORA+ — HERMES PRODUCT + SECURITY + MOBILE HARDENING PASS

Work directly on:
Repository: Blackleets/Labora-
Branch: feat/labora-e2e-ready
PR: #2

FIRST ACTION:
Read HERMES_HANDOFF.md completely before modifying anything.
Then inspect the latest PR state and current branch HEAD.

PRIORITY ZERO:
Reproduce and fix the Profile save error:
"new row violates row-level security policy"

Do NOT disable RLS, do NOT add service_role to the browser, do NOT add permissive policies as a shortcut.
Prove that Rider can update only their own profile and Gestoria can update only its own profile/logo.
Check auth.uid() vs currentUser.id, stale localStorage/session hydration, profiles SELECT/UPDATE policies, Storage object ownership and any protected fields included in the update payload.
Replace raw database errors in normal UX with a useful Spanish error while preserving diagnostic logging.

AFTER THE BUG IS FIXED:
Act as Principal Product Engineer, Mobile UX Engineer, Supabase Security Engineer, Data Engineer and Adversarial Reviewer.
Audit the entire Labora+ product before making broad changes.

Preserve:
- Supabase Auth
- RLS isolation
- private Storage
- Realtime collaboration
- Rider -> Gestoria relationship model
- OCR fail-closed
- SHA-256 exact duplicate protection
- fiscal-neutral new expenses before review
- no fake AEAT validation
- banking locked until regulated Open Banking exists
- current Labora+ visual identity
- working functionality

Never add demo data or fake integrations.
Never claim an external service is connected without a real API/OAuth connection.
Never optimize appearance at the cost of security or truthfulness.

Design direction:
calma premium + fiscal inteligente + humano
Deep green #214E3A
Secondary green #2F6B50
Fresh accent #52AA83
Terracotta #D66C47
Amber #F1C56B
Ivory #F7F3EA
Ink #1E231F
Avoid generic blue/purple SaaS dashboards.

Audit and improve:
- mobile layout and keyboard behavior
- ticket camera/gallery flow
- onboarding/login
- Rider home
- Gestoria portfolio
- expenses/income/fiscal/documents
- requests/messages
- profile/identity
- empty/loading/error/offline states
- accessibility
- relationship/invite UX
- invoice/document lifecycle
- RLS/Storage/session safety
- Realtime behavior
- observability

Before changing architecture, give a short diagnosis of the highest-value issues you found.
Implement only improvements that are high-confidence and testable.
Keep CI green.
Do not merge to main.

At completion return:
ROOT CAUSE OF RLS BUG
FIX APPLIED
DATABASE / RLS CHANGES
FILES CHANGED
TESTS RUN
SECURITY CHECK
MOBILE QA RESULTS
WHAT IS NOW PROVEN
WHAT REMAINS UNVERIFIED
TOP 10 IMPROVEMENT SUGGESTIONS
NEXT 3 IMPLEMENTATIONS
HANDOFF BACK TO CHATGPT
```

## 9. RETURN PLAN

When Hermes finishes, do NOT merge automatically.

Bring its final report back to ChatGPT and ask:

`Audita lo que hizo Hermes en Labora+. Verifica GitHub, Supabase, RLS, CI y diferencias reales antes de aprobar merge.`

That second independent pass is intentional.
