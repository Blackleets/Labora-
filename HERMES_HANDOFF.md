# LABORA+ — CANONICAL HANDOFF

Updated: 2026-09-18  
Repository: `Blackleets/Labora-`  
Working branch: `feat/labora-e2e-ready`  
Pull request: `#2`  
Known-good code HEAD before this handoff update: `13f96caf91ce7d546c17d536d9ed6a3c6983a53e`  
Supabase project: `gggtriyvbusbpqohoukv`

## 0. Current status

**DO NOT MERGE YET.**

GitHub Actions at `13f96caf...` are green for install, TypeScript and Vite build.

PR #2 currently reports:

- base: `main`
- head: `feat/labora-e2e-ready`
- mergeable: `false`
- mergeable_state: `dirty`

This means the branch contains working changes but must be reconciled with `main` before merge. Do not force-merge or discard branch changes.

## 1. Mission

Continue Labora+ as a real two-sided product for:

- Rider / autónomo: jornada, ingresos, gastos, documentos, fiscal workspace, requests, messages and profile.
- Gestoría: linked-client portfolio, evidence review, requests, documents, fiscal review and messages.

Product direction:

**calma premium + fiscal inteligente + humano**

No demos, fake integrations, fake bank connections, invented fiscal truth or silent data rewriting.

## 2. Non-negotiable guardrails

Do NOT:

- disable Supabase RLS;
- put service-role/secret keys in the browser;
- use permissive `using (true)` / `with check (true)` policies as a shortcut;
- reintroduce fake OAuth or bank callbacks;
- infer VAT/deductibility universally from a photo or category;
- mark manager review as AEAT validation;
- fabricate OCR values;
- create public signup paths to admin;
- merge while PR #2 is dirty.

Preserve:

- Supabase Auth;
- private Storage;
- RLS isolation;
- Realtime collaboration;
- SHA-256 duplicate protection;
- original evidence preservation;
- OCR fail-closed;
- fiscal-neutral defaults pending review;
- current premium green/ivory/terracotta identity.

## 3. What is now implemented and proven

### Income evidence chain

Imported settlement/document income can now carry:

- `source_document_id`
- `source_hash`
- preserved original document
- per-user SHA-256 duplicate protection
- same-user document ownership enforcement

The original settlement is retained as evidence and linked to imported income rows.

### Gestoría income review

Imported incomes now support audited review metadata:

- `reviewed_by`
- `reviewed_at`
- `review_note`

Manager review uses a narrow RPC. Rider self-review was tested and blocked.

### Jornada Labora

Work sessions now use controlled RPCs instead of direct browser mutation.

Implemented:

- start/finish work session
- optional odometer start/end
- km completed
- €/h gross
- €/km gross
- registered fuel cost
- income minus registered fuel

These labels intentionally do **not** claim full net profit.

Direct work-session insert/update paths were removed from normal browser permissions.

### Economic truth vs fiscal truth

Economic cash and fiscal deductibility are separated.

- real expense amount affects operating net even while fiscal review is pending;
- deductible expense amount is tracked separately;
- losses can appear as negative values;
- no `Math.max(0, net)` hiding losses;
- UI uses labels such as `Gastos reales` and `Neto operativo`.

### Sync observability

Remote sync failures now surface a throttled user-safe message while logging internal diagnostic codes such as:

- `LABORA_SYNC_HYDRATE_FAILED`
- `LABORA_SYNC_WRITE_FAILED`
- `LABORA_SYNC_REALTIME_REFRESH_FAILED`

No receipt/NIF content is intentionally placed in those messages.

### Honest onboarding

The old onboarding that visually pretended to:

- connect delivery platforms,
- connect banks,
- use PSD2,
- calculate IRPF,
- detect IAE,

was removed.

The onboarding now stores real preferences only:

- country
- platforms used
- banks used

Selecting a platform/bank explicitly does **not** mean it is connected.

Preferences and onboarding state persist in Supabase.

### Fake banking removed

The legacy fake bank OAuth flow containing a fake authorization code was neutralized.

Current banking UX is locked and truthfully states:

- no real bank integration exists yet;
- no credentials should be entered into Labora+;
- future connection must use regulated Open Banking/PSD2;
- first phase should be read-only.

### Profile privilege escalation closed

This was a real security issue and is now closed.

Before hardening, an authenticated user had overly broad profile UPDATE privileges and public signup metadata could request `admin`.

Now:

- public signup may create only `rider` or `manager`;
- `admin` cannot be assigned through signup metadata;
- authenticated browser users cannot directly update:
  - `role`
  - `manager_id`
  - `email`
  - `id`
- allowed profile fields use column-level UPDATE grants.

Adversarial tests confirmed:

- normal self profile update: allowed;
- `role='admin'`: blocked;
- direct `manager_id` change: blocked;
- direct email change: blocked.

### Expense review integrity

Expense facts and gestor review fields are now separated.

Rider can edit factual fields such as:

- amount
- date
- category
- merchant
- receipt
- notes
- fuel details

Rider cannot directly control review fields:

- `status`
- `gestor_notes`
- `deductible_percentage`

On INSERT, DB forces:

- `status = pending_review`
- `deductible_percentage = 0`
- no gestor note

If a rider edits a previously reviewed expense, DB automatically resets it to:

- `pending_review`
- deductible 0
- gestor note cleared

A narrow gestor RPC performs expense review.

Tested behavior:

- self-inserting `approved + 100%` became `pending_review + 0%`;
- editing an approved expense amount reset review state correctly.

## 4. Security advisor

Supabase Security Advisor is clean except for:

**Leaked Password Protection Disabled**

This is an Auth project setting and was not changed from the available connector because no safe configuration operation was exposed.

Do not claim it is enabled until verified in Supabase Auth settings.

## 5. Immediate next work

### Priority 1 — Requirements / Peticiones integrity

Current DB policy still allows both participants to UPDATE the whole requirement row.

Desired model:

**Manager owns request definition**
- manager_id
- rider_id
- title
- description
- category
- deadline
- quarter

**Rider owns response**
- submission_notes
- submission_url
- transition pending -> submitted

**Manager owns review**
- transition submitted -> approved / correction state as designed

Rider must never be able to rewrite manager/rider ids, title or deadline through a direct Supabase call.

Implement narrow RPCs and column/trigger protections analogous to expense review integrity.

### Priority 2 — Tax declarations integrity

Audit `tax_declarations` UPDATE/INSERT permissions.

Do not allow a rider or manager to silently rewrite official-looking filing facts outside an explicit state machine.

Recommended direction:

- draft data
- gestor review
- filed only with explicit filing evidence/reference
- immutable/audited transition metadata

Never equate `reviewed_by_gestor` with filed at AEAT.

### Priority 3 — Messages mutation surface

Current recipient UPDATE policy should be reduced to read-state metadata only.

Recipient should not be able to rewrite:

- sender
- recipient
- body
- attachment identity

Use a narrow `mark_message_read` operation.

## 6. PR conflict reconciliation

PR #2 currently has merge conflicts with `main`.

Before merge:

1. inspect the exact conflicting files;
2. preserve security migrations and hardened branch behavior;
3. integrate only legitimate newer main changes;
4. do not resolve by taking `ours` or `theirs` wholesale;
5. run install + typecheck + build;
6. rerun Supabase security/adversarial tests;
7. verify the resulting PR becomes mergeable.

Do not merge simply to get rid of the dirty state.

## 7. Important migrations added in this hardening pass

Recent branch migrations include:

- income evidence linkage
- income manager review
- work-session RPC hardening
- private RPC wrappers
- profile preferences
- onboarding state
- profile column security
- expense review integrity

Treat GitHub migration files and the live Supabase project together as the source of truth.

## 8. Data truth rules

- Original evidence must remain traceable.
- Hash duplicate blocking is exact duplicate protection, not semantic/fuzzy duplicate detection.
- OCR is extraction assistance, not authoritative truth.
- An uploaded ticket is not automatically deductible.
- A gestor review is not an AEAT filing.
- Economic spending and fiscal deductibility are separate concepts.
- No external service is “connected” until real API/OAuth authorization exists.

## 9. Visual identity

Keep:

- Deep green `#214E3A`
- Secondary green `#2F6B50`
- Fresh accent `#52AA83`
- Terracotta `#D66C47`
- Amber `#F1C56B`
- Ivory `#F7F3EA`
- Ink `#1E231F`

Avoid generic blue/purple SaaS redesigns.

## 10. Start instruction for the next chat / agent

Use this exactly:

```text
Continue Labora+ from the canonical repository state.

Repository: Blackleets/Labora-
Branch: feat/labora-e2e-ready
PR: #2
Supabase project: gggtriyvbusbpqohoukv

FIRST:
Read HERMES_HANDOFF.md completely and inspect the current PR HEAD/CI before changing anything.

Do not merge to main.
Do not disable RLS.
Do not reintroduce fake integrations or fiscal assumptions.
Preserve all existing security hardening.

Continue from Priority 1:
harden Requirements/Peticiones so the rider can only submit a response and the manager can only manage/review requests through narrow audited operations.

Then harden tax_declarations and message read-state mutations.

Also inspect PR #2 merge conflicts with main, but do not resolve them by discarding hardened branch changes.

Keep CI green and prove security behavior with rollback/adversarial tests before claiming completion.
```

## 11. Definition of ready-for-merge

Do not approve merge until all are true:

- PR no longer dirty/conflicted;
- CI green on reconciled HEAD;
- profile escalation remains blocked;
- expense self-approval remains blocked;
- requirements participant fields are role-scoped;
- declaration filing state is auditable;
- message body/sender cannot be rewritten by recipient;
- RLS/Storage remain enabled/private;
- mobile primary flows have real-device QA;
- no fake bank/API connection exists;
- Supabase security advisor reviewed again.
