# Play Store gates — Labora+ Android shell

**Estado: NOT Play-ready.** El proyecto Capacitor (`android/`, id `app.labora.plus`) es un shell nativo alrededor de la web app. No subir a producción hasta completar todo lo de abajo.

## Remaining gates (Lewis / release owner)

| Gate | Estado | Notas |
| --- | --- | --- |
| Keystore / App signing | ❌ | Generar upload key; guardar fuera del repo |
| Play Console app listing | ❌ | Crear app, ficha ES/EN, categoría |
| Data safety form | ❌ | Auth, storage, posible billing — declarar honestamente |
| Privacy policy URL | 🟡 | `privacidad.html` in app; needs public HTTPS URL when hosting |
| Privacy policy URL | ❌ | URL pública accesible |
| Store screenshots / feature graphic | ❌ | Dispositivo real + branding actual |
| Content rating questionnaire | ❌ | |
| Dual-account mobile UAT | ❌ | Ver `docs/UAT_DUAL_ACCOUNT.md` |
| Stripe sandbox UAT (si Pro) | ❌ | Luego `VITE_BILLING_ENABLED` |
| Adversarial RLS on live Supabase | ❌ | |
| Internal testing track | ❌ | Solo después de lo anterior |
| Production track | ❌ | |

## Explicit non-claims

- Shell ≠ release de Play.
- No Play Billing: Pro usa Stripe Checkout/Portal.
- No Open Banking live.
- No inventar PASS de UAT.
