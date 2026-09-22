**Design QA — Labora+ Pasaporte Laboral**

**Evidence**

- Source visual truth (desktop): `/workspace/scratch/8aa2dcc22441/generated_images/exec-03be6ea5-4f46-403a-96a6-ce2ac23ddc19.png` — 1487 × 1058 px.
- Source visual truth (mobile): `/workspace/scratch/8aa2dcc22441/generated_images/exec-3d599a50-cd9a-4578-901b-3bf611574f52.png` — 853 × 1844 px.
- Rendered implementation: `http://terminal.local:4173/`, opened in the cloud browser at 1293 × 936 CSS px, device scale 1.
- Browser-rendered implementation screenshot: captured in the cloud-browser QA session on 2026-09-22; the authenticated dashboard could not be reached, so no valid same-state screenshot path exists.
- State reached: public sign-in screen. The selected source truth represents an authenticated worker dashboard.
- Primary interactions tested: sign-in tabs and fields were rendered and discoverable; authenticated navigation, country selection, Pasaporte Laboral, platform cards and global AI could not be exercised without a UAT account.
- Console errors checked: no visible rendering failure on the public sign-in state; authenticated console state remains unverified.
- Density normalization: not applicable because source and implementation could not be captured in the same authenticated state.

**Findings**

- [P0] Authenticated reference state is not available to visual QA
  Location: worker dashboard / Pasaporte Laboral.
  Evidence: both source visuals show the signed-in product, while the browser-rendered implementation stops at the sign-in screen. No test credential was available and QA must not create or bypass a real account.
  Impact: typography, spacing, responsive behavior, real brand marks, country selector and AI overlay cannot be compared visually against the selected design.
  Fix: provide a dedicated non-production UAT worker account or an approved isolated visual-test fixture, then capture desktop and mobile states and rerun this gate.

**Required fidelity surfaces**

- Fonts and typography: build uses Plus Jakarta Sans; authenticated hierarchy and wrapping are blocked from visual comparison.
- Spacing and layout rhythm: sign-in renders without obvious overflow at 1293 × 936; dashboard desktop/mobile comparison is blocked.
- Colors and visual tokens: public screen uses the intended moss, ivory and clay palette; authenticated token fidelity is blocked.
- Image quality and asset fidelity: brand resolver now prioritizes official inline marks and verified-domain favicons; rendered dashboard marks are blocked from inspection.
- Copy and content: technical implementation language was removed from worker-facing banking, integrations, income, risks and events surfaces; authenticated visual inspection is blocked.

**Full-view comparison evidence**

- The source visuals were resolved and their dimensions recorded.
- The implementation was opened in the required cloud browser, but only the public sign-in full view could be captured. A same-state full-view comparison is therefore invalid.

**Focused region comparison evidence**

- Not performed. The required Pasaporte Laboral, connected gestoría, work identities, company logos, country selector and AI launcher are all behind authentication.

**Comparison history**

- Iteration 1: build initially failed because the chosen Material Symbols asset was not present in the installed package. Replaced it with the available `wand_stars` symbol; typecheck and production build then passed.
- Iteration 2: automated copy scan found internal phrases such as “Sin API”, “simulado” and “nada se inventa” in user surfaces. Rewrote those states as concise product copy and repeated typecheck/build successfully.
- Remaining P0: no authenticated browser evidence; no visual fix can resolve the missing UAT access.

**Implementation Checklist**

- Supply an isolated UAT worker login or approved visual fixture.
- Capture dashboard at desktop and mobile breakpoints.
- Exercise country selector, global AI modal, integrations and bottom navigation.
- Check console errors in the authenticated state.
- Compare captures with both source visuals and resolve all P1/P2 drift.

**Follow-up Polish**

- Consider route-level code splitting to reduce the current large JavaScript bundle warning.

final result: blocked
