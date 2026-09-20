# Labora+ Android shell (Capacitor)

This folder is a **native shell** around the Labora+ web app. It is **NOT Play Store ready** and must not be uploaded as a production release.

App id: `app.labora.plus` · Sync: Vite `dist/` → `npm run cap:sync`

## What exists

- Capacitor Android project (`android/`)
- Debug/local build path via Android Studio
- Same product honesty as web: banking fail-closed, billing gated, no fake platform OAuth

## Remaining Play gates (honest)

See also `docs/PLAY_STORE_GATES.md`.

| Gate | Done? |
| --- | --- |
| Upload keystore / Play App Signing | ❌ Lewis |
| Play Console listing (ES) | ❌ Lewis |
| Data safety form | ❌ Lewis |
| Privacy policy URL (live) | ❌ Lewis |
| Store screenshots + feature graphic | ❌ Lewis |
| Content rating | ❌ Lewis |
| Dual-account UAT on device | ❌ Lewis — `docs/UAT_DUAL_ACCOUNT.md` |
| Stripe sandbox UAT (if enabling Pro) | ❌ Lewis + secrets |
| Cross-user RLS adversarial pass (live project) | ❌ Lewis |
| Internal testing track | ❌ only after above |

## What is NOT claimed

- Not a Play release candidate
- No production Stripe / push / Play Billing
- No live Open Banking
- Dual-account mobile UAT not signed off

## Local build (developer machine with Android Studio)

```bash
npm ci
cp .env.example .env.local   # fill real anon keys — never commit secrets
npm run cap:sync
npm run cap:open             # opens Android Studio
```

Generate a **debug** APK from Android Studio. Do **not** upload to Play until every gate above is green.

## Release gate order

1. Web CI green on the release branch / `main` when product allows merge
2. Dual-account UAT pass (signed by Lewis)
3. Stripe sandbox UAT (if enabling Pro)
4. Security pass (cross-user RLS)
5. Mobile UAT on a real device
6. Only then: Play **internal testing** track
7. Production track last
