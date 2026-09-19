# Labora+ Android shell (Capacitor)

This folder is a **native shell** around the Labora+ web app. It is **not** a Play Store release.

## What exists
- Capacitor Android project (`android/`)
- App id: `app.labora.plus`
- Sync from Vite `dist/` via `npm run cap:sync`

## What is NOT done
- Play Console listing, signing key, store screenshots, Data safety form
- Production Stripe / push notifications / Play Billing (Labora+ Pro uses Stripe, not Play Billing)
- Dual-account mobile UAT sign-off
- Live adversarial RLS verification on the production Supabase project

## Local build (developer machine with Android Studio)
```bash
npm ci
cp .env.example .env.local   # fill real anon keys
npm run cap:sync
npm run cap:open             # opens Android Studio
```
Then generate a debug APK from Android Studio. Do **not** upload to Play until the release gates in README are green.

## Release gate order
1. Web CI green on `main`
2. Dual-account UAT pass
3. Stripe sandbox UAT (if enabling Pro)
4. Security pass (cross-user RLS)
5. Mobile UAT on a real device
6. Only then: Play internal testing track
