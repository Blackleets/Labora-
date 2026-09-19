# Labora+

Labora+ organiza la actividad de autónomos y su relación con gestorías: ingresos, gastos, justificantes, modelos fiscales, peticiones y mensajería.

**Versión actual:** `0.1.0-rc.1` (release candidate web).  
**Store Android / Play:** shell Capacitor en `android/` (`app.labora.plus`) — **no** es un release de Play. Ver `ANDROID.md` para gates y build local.

## Arranque local

Requisitos: Node.js 22+.

```bash
cp .env.example .env.local
# Rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm ci
npm run dev
```

Checks:

```bash
npm run typecheck   # o: npx tsc --noEmit
npm test
npm run build
```

## Estado del producto (honesto)

Ya en `main`:

- Auth Supabase + RLS
- Perfil, documentos (storage privado + hash), peticiones gestor, mensajería
- Modelos fiscales con máquina de estados (borrador → revisado → presentado)
- Jornadas vía RPC
- Ingresos/gastos con procedencia; sin sync falso de plataformas
- Banca / Open Banking: **fail-closed** (sin tokens ni saldos inventados)
- Billing Stripe Pro: código + edge functions listos; UI **apagada** hasta `VITE_BILLING_ENABLED=true` tras UAT sandbox
- CI: install + typecheck + unit tests + build + Deno edge functions

Pendiente externo / UAT:

- Dual-cuenta real (rider + gestoría) en dispositivo
- Secrets Stripe + Gemini en Supabase (nunca `VITE_*` de secretos)
- Adversarial RLS en el proyecto Supabase live
- Empaquetado Play Store **después** de pasar esos gates

## Integraciones externas

Labora+ distingue **preferencia de plataforma** vs **integración API real**.

- Delivery/movilidad: se puede marcar actividad; no implica OAuth/sync
- Bancos: bloqueados hasta PSD2 regulado
- Pagos/contabilidad de terceros: catálogo, no conectados
- Labora+ Pro: Stripe Checkout + Portal + webhook; sin auto-concesión desde el cliente

## Seguridad

Buckets `labora-identity` y `labora-documents` privados. Tablas operativas con RLS. El cliente no usa `service_role`.


## Android (pre-Play)

Shell Capacitor listo en el repo. **No subir a Play** hasta completar los gates de `ANDROID.md`.

```bash
npm ci
npm run cap:sync
npm run cap:open
```

## QA

Ver `LABORA_TESTING.md` para el plan dual-cuenta. No marques PASS sin ejecutarlo.
