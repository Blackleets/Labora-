# Draft PR #1 — foundation note

**PR:** https://github.com/Blackleets/Labora-/pull/1  
**Title:** Labora+ production foundation: truth, security and fiscal integrity  
**State:** open **draft** (do **not** merge)  
**Head:** `feat/labora-production-foundation` · **Base:** `main` (as of draft open)  
**Reviewed:** 2026-09-20 (Europe/Paris)

## Verdict

**Recommend close.** Current `main` has moved far ahead (premium UI #11, messaging #12, gestoría signup #13, billing prep, Android shell, ordered operational migrations from mid-September). Merging the draft would be a destructive reverse-merge of an alternate tree (~6.5k+/22k− historically) that is **diverged** from today’s `main`.

Do **not** merge. Do **not** force-rebase onto `main` without a deliberate salvage plan from Lewis.

## Why close (superseded)

- Auth / signup / RLS / messaging / profile column security already evolved on `main` via later migrations and PRs.
- Draft’s “remove demo routes / truth-first OCR” intent is largely absorbed or replaced by fail-closed product honesty on `main`.
- Registration policy on `main` is NIF + colegiado (PR #13), not the draft’s advisor-trust self-promotion model.
- CI, lockfile, and Capacitor Android shell landed outside the draft.

## Salvageable pieces (cherry-pick later if wanted)

Only if Lewis still wants them as **incremental** PRs onto current `main` (not a wholesale revive):

| Area | Draft paths | Note |
| --- | --- | --- |
| Spain 2026 fiscal policy / engine | `services/fiscalPolicyES2026.ts`, `services/fiscalEngine.ts`, tests | Review against current tax UI before porting |
| Market profiles / fail-closed currency | `modules/country-config/marketProfiles.ts` | Useful if multi-market still a goal |
| Advisor trust / verification | `modules/trust/*`, `components/AdvisorTrustPanel.tsx`, `AdvisorVerificationCenter.tsx` | Needs admin workflow; don’t ship self-`verified` |
| Evidence helpers | `services/evidenceFiles.ts` | Align with current document storage |
| Ordered baseline migrations `2026091609*` | `supabase/migrations/20260916090000_*.sql` … `907` | **Conflict** with live project history — never apply blindly; diff against applied remote |

## Explicitly out of scope for revive

- Replacing current `main` UI / messaging / signup.
- Claiming the draft’s Supabase project work was applied (PR body: no existing project modified).
- Merging while draft.

## Action for Lewis

1. Close PR #1 with a comment pointing here.  
2. If fiscal/trust pieces are needed, open **new** small PRs cherry-picking from `feat/labora-production-foundation` onto latest `main`.  
3. Keep draft branch around only as reference until salvage is done or abandoned.
