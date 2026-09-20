# UAT dual-cuenta — Rider ↔ Gestoría (español)

**Estado:** checklist lista para Lewis. **No marcar PASS** sin ejecutar con dos cuentas reales.  
**Sin secretos de bot:** este documento no inventa resultados. CI solo prueba fail-closed / aislamiento de caché offline.

Rama: `main` · Linking RPCs **live**. Ver `scripts/uat-dual-smoke.md` y `npm run uat:dual`.

---

## Cuentas de prueba (agente · 2026-09-20)

| Rol | Correo | Notas |
| --- | --- | --- |
| Rider (A) | la cuenta ya existente en el proyecto | Perfil `rider` en live |
| Gestoría (B) | `leerenmos+gestoria-uat@gmail.com` | Creada para UAT; email confirmado en Auth; NIF `B12345674`; colegiado `COL-UAT-001` |

La contraseña de B se entregó a Lewis en chat (no se guarda en el repo). Si la pierdes: reset desde Supabase Auth o vuelve a pedirla al agente para regenerar.


## Preparación (Lewis)

1. Proyecto Supabase con URL + anon key en `.env.local` (no service_role en Vite).
2. Dos navegadores o perfiles (o un dispositivo + web): **Cuenta A = Rider**, **Cuenta B = Gestoría**.
3. Correos reales distintos; fotos/logos opcionales pero recomendados.
4. No uses la misma sesión / mismo `localStorage` sin cerrar sesión entre cuentas.

---

## A. Auth y perfiles

| # | Paso | Rider (A) | Gestoría (B) | Criterio PASS |
| --- | --- | --- | --- | --- |
| A1 | Registro / login | Crear cuenta rol Rider | Crear cuenta rol Gestoría | Ambas entran; roles correctos |
| A2 | Onboarding | Completar perfil + plataformas como **preferencia** | Completar gestoría (nombre/logo) | UI dice que plataforma ≠ OAuth conectado |
| A3 | Cerrar sesión | Logout limpio | Logout limpio | No quedan datos de la otra cuenta en pantalla |
| A4 | Re-login cruzado | Login A tras B (mismo browser) | Login B tras A | Mensajes / docs de la otra cuenta **no** aparecen en caché |

---

## B. Vinculación Rider ↔ Gestoría

| # | Paso | Quién | Criterio PASS |
| --- | --- | --- | --- |
| B1 | Gestoría copia su correo | B en **Perfil → Tus clientes** | Correo visible; sin invitaciones falsas |
| B2 | Autónomo vincula por correo | A en **Perfil → Tu gestoría** escribe el correo de B | Badge «Gestoría vinculada»; nombre/correo de B visibles |
| B3 | Cliente en lista | B | A aparece bajo **Tus clientes** (`managerId === B`) |
| B4 | Mensajes habilitados | A y B | Contactos de mensajería dejan de estar vacíos (ver sección C) |
| B5 | Rechazo honesto | A intenta correo de otro rider / inválido | Error claro; **no** se crea vínculo |
| B6 | Desvincular | A confirma desvínculo | `managerId` limpio; listas y mensajes vuelven al vacío honesto |
| B7 | RPC ausente | **Migración ya aplicada en live** (2026-09-20) | Error claro — **no** fingir éxito |
| B8 | Tercera cuenta | C | **No** ve datos de A ni B |

---

## C. Mensajería y aislamiento RLS

Contrato bidireccional y copy de UI: ver [`docs/MESSAGING.md`](./MESSAGING.md).

| # | Paso | Criterio PASS |
| --- | --- | --- |
| C1 | Rider envía mensaje a gestoría vinculada | Gestoría lo recibe; estado coherente |
| C2 | Gestoría responde | Rider lo ve; no se duplica como otro usuario |
| C3 | Intento de leer hilo ajeno (otra gestoría / rider) | Vacío o error RLS — **fail-closed** |
| C4 | Offline / error de red | Solo caché de la sesión actual (`labora_messages:<userId>`); nunca la clave legacy `labora_messages` |
| C5 | Marcar leído | Solo el destinatario legítimo; RPC `mark_message_read` respeta RLS |

---

## D. Documentos (storage privado)

| # | Paso | Criterio PASS |
| --- | --- | --- |
| D1 | Rider sube justificante / PDF | Aparece en sus documentos; bucket privado |
| D2 | Gestoría vinculada revisa | Puede ver/validar lo del rider vinculado |
| D3 | Gestoría no vinculada | **No** descarga ni lista docs ajenos |
| D4 | Hash duplicado | Mismo ticket exacto se bloquea (si aplica OCR/hash) |

---

## E. Peticiones / requirements de gestoría

| # | Paso | Criterio PASS |
| --- | --- | --- |
| E1 | Gestoría crea petición al rider | Rider la ve en widget / bandeja |
| E2 | Rider responde o adjunta | Gestoría ve actualización |
| E3 | Rider de otra gestoría | No ve la petición |

---

## F. Banca y billing (honestidad de producto)

| # | Paso | Criterio PASS |
| --- | --- | --- |
| F1 | Pestaña Banca (rider) | Copy: **Open Banking próximamente** / sin «conectado» |
| F2 | Intentar conectar banco | Flujo fail-closed; sin OAuth falso ni saldos inventados |
| F3 | Labora+ Pro | Con `VITE_BILLING_ENABLED=false` la tarjeta Pro **no** aparece |

---

## G. Firma de Lewis (manual)

```
Fecha (Europe/Paris): _______________
Entorno (Supabase project / URL): _______________
Rider email: _______________
Gestoría email: _______________

[ ] A Auth  [ ] B Vínculo  [ ] C Mensajes/RLS  [ ] D Docs  [ ] E Peticiones  [ ] F Banca/Billing

PASS global: SÍ / NO
Notas / bugs:
_______________________________________________
```

**No fusionar a `main` solo porque el checklist existe.** PASS requiere esta firma.
