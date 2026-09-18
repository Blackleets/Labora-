# LABORA+ — ASTRA HANDOFF

Updated: 2026-09-18
Repository: `Blackleets/Labora-`
Canonical working branch: `feat/labora-e2e-ready`
Pull request: #2
Supabase project: `gggtriyvbusbpqohoukv`

## Mission

Turn Labora+ into a trustworthy, mobile-first operating system for riders/autónomos:
- know what was earned;
- know what was spent;
- know how many hours were worked;
- keep evidence and documents organized;
- prepare clean information for gestoría;
- never invent fiscal facts or fake external integrations.

Product promise:
**“Labora+ te ayuda a saber cuánto ganas de verdad y a mantener tu actividad bajo control.”**

Do not rebuild from scratch. Preserve the current visual identity:
- deep green #214E3A
- secondary green #2F6B50
- fresh accent #52AA83
- terracotta #D66C47
- amber #F1C56B
- ivory #F7F3EA
- ink #1E231F

## Current verified state

### GitHub / CI
- Branch: `feat/labora-e2e-ready`
- Do NOT merge to `main` yet.
- CI runs TypeScript + Vite build.
- Head before this handoff: `3d10a2a459200aba775f1f0bd04b520b0c1eeef8`
- CI for that head: SUCCESS.

### Profile / RLS hardening
Resolved the previous profile-save blocker:
- profile UPDATE is authenticated/self-only;
- client profile writes are bound to the actual Supabase auth user;
- identity uploads use the authenticated user id;
- raw PostgreSQL/RLS errors are not shown as primary user-facing messages;
- Storage read policies now inspect `storage.objects.name` instead of accidentally reading the profile `name` column.

Verified with rollback-only SQL:
- authenticated rider can access/update own profile;
- another authenticated UUID cannot update that rider profile;
- no test rows were left behind.

### Expense truth
New/imported expenses now fail closed:
- VAT rate default: 0
- VAT amount default: 0
- deductible percentage default: 0
- status: pending_review
- OCR needs review by default

No universal 21% VAT or 100% deductibility may be reintroduced.

### Income provenance / Data Hub foundation
`public.incomes` now supports:
- source_type: manual | text_import | document_import | api_sync | bank_import
- source_reference
- external_id
- confidence
- needs_review
- imported_at

There is a partial unique index on:
`(user_id, source_type, external_id)`
when `external_id` is present.

This is the adapter boundary for future Uber/other APIs, document imports and regulated Open Banking. Never label an integration as connected unless a real API/OAuth flow exists.

### Income import
Current rider income flow supports:
- manual entry;
- pasted-text extraction with Gemini;
- PDF/JPG/PNG/WebP settlement extraction with Gemini;
- explicit review screen before saving AI-extracted rows;
- provenance and pending-review state on imported rows.

Strict rule:
**AI proposes; user confirms; only then persist.**

### Jornada Labora
`public.work_sessions` exists with RLS and:
- started_at
- ended_at
- optional start/end odometer
- one active session per user

Dashboard supports:
- start work session;
- finish work session;
- persistence in Supabase;
- hours worked today;
- registered income today;
- gross registered €/hour.

The UI explicitly says this is NOT yet net profit and currently uses no GPS/location tracking.

### Fiscal safety
Removed the generic:
- net yield × 20% = IRPF
- gross income × 21% = output VAT

Generated Model 130/303 workspaces now use:
`calculationState = requires_review`
and show **Por revisar** instead of pretending a tax liability is known.

Recorded tax declarations loaded from Supabase use:
`calculationState = recorded`.

Do not reintroduce generic tax percentages without a verified rule engine, jurisdiction, taxpayer context and evidence.

## Supabase migrations added on 2026-09-18

Applied remotely and tracked in GitHub:
- `labora_fix_storage_profile_expense_defaults`
- `labora_income_provenance`
- `labora_work_sessions`

Tracked files:
- `supabase/migrations/20260918120000_labora_fix_storage_profile_expense_defaults.sql`
- `supabase/migrations/20260918121500_labora_income_provenance.sql`
- `supabase/migrations/20260918123000_labora_work_sessions.sql`

## Security status

RLS remains enabled.

Supabase Security Advisor currently reports one warning:
- leaked-password protection is disabled.

Do not weaken RLS to make tests pass.
Do not put a service-role key in the browser.
Do not store banking credentials.
Do not trust AI/OCR output as fiscal truth.

Performance Advisor reports unused indexes. The database currently has very little traffic, so do NOT remove indexes merely because they have not yet been exercised.

## Still unverified

Do NOT claim these are proven yet:
- real two-account Rider + Gestoría UAT on physical mobile devices;
- real identity image upload after the Storage-policy fix;
- real multi-page settlement PDF extraction across multiple platform formats;
- any live Uber/Glovo platform API;
- regulated Open Banking;
- Google Play production packaging/release;
- tax liability calculations for a real taxpayer;
- net €/hour after allocating vehicle, fuel, maintenance and tax costs.

## Highest-value next implementations

### 1. Real mobile UAT — blocker before merge
Use two separate real accounts:
- Rider A
- Gestoría B

Verify:
- login/logout/session recovery;
- profile update;
- identity upload;
- rider-to-gestoría relationship;
- expense upload + review;
- PDF/image document upload;
- income manual/text/document import;
- Jornada start/stop and persistence;
- RLS isolation across accounts.

Do not merge #2 until this passes.

### 2. Settlement evidence lifecycle
Improve income imports so a document-origin row can reference the original private document:
- preserve original file;
- hash it;
- link income rows to evidence;
- prevent duplicate imports;
- allow “OCR proposed → user confirmed → gestor reviewed”.

Do not persist only an AI-generated number with no evidence trail when a source document exists.

### 3. Real profitability engine
Extend Jornada Labora with:
- start/end odometer;
- km worked;
- registered income for period;
- fuel and vehicle costs;
- gross €/h;
- gross €/km;
- cost €/km;
- operating profit before tax.

Keep tax estimates separate until the fiscal engine has verified rules.

## After UAT

Only after mobile UAT passes:
1. clean deployment environment variables;
2. prepare production PWA/Android packaging;
3. Play Store closed testing;
4. subscription/paywall experiment;
5. onboarding optimized around the core promise.

## Guardrails for Astra

- Audit before modifying.
- No fake data.
- No fake bank/platform connections.
- No tax/legal claims without evidence.
- No redesign from scratch.
- No broad RLS policies.
- No service-role in frontend.
- No automatic AI persistence without review.
- No merge to main until UAT passes.
- Keep CI green after every atomic change.
- Preserve the current branch as the source of truth.

## Completion report format

Return:
1. WHAT YOU INSPECTED
2. WHAT YOU CHANGED
3. DATABASE CHANGES
4. FILES CHANGED
5. TESTS ACTUALLY RUN
6. SECURITY RESULT
7. MOBILE UAT RESULT
8. WHAT IS PROVEN
9. WHAT REMAINS UNVERIFIED
10. NEXT SINGLE HIGHEST-VALUE ACTION
