# Checkpoint activo — 2026-09-29, frontera de secretos

Repo Blackleets/Labora-. Base main@7cf174e9 (PR #65 fusionado).
Rama: fix/frontend-secret-boundary.

- PR #64 y #65 fusionados; ambas ramas pasaron CI web/Edge/Android. Despliegue Pages de #65: run 36625344253 PASS.
- Nuevo endurecimiento: Vite ya no carga todas las variables del entorno ni sustituye process.env.API_KEY / process.env.GEMINI_API_KEY en código del navegador.
- Prueba negativa real: build de un fixture con GEMINI_API_KEY ficticia. Antes del cambio la clave aparecía en el JS; después no aparece. No se inspeccionaron ni publicaron secretos reales y no se demuestra una filtración previa en producción.
- Validación local: TypeScript, 188 pruebas, release:check 30/30, build y diff --check PASS.
- UAT dual/visual privada pendiente: navegador disponible en login sin sesión autenticada. No declarar PASS ni fusionar PR #35 por asumir resultados.
- Próximo trabajo respaldado por código: index.html sigue usando Tailwind CDN en runtime; ManagerDashboard no consume privacyMode y el badge de peticiones de App.tsx todavía omite submitted. Corregir con pruebas específicas antes de afirmar cierre de esos flujos.
- Mantener RLS, fiscalidad sin datos inventados, secretos solo servidor, borrado atómico, tombstones y Stripe OFF hasta sandbox UAT.

Registro previo (histórico):

---

# Checkpoint activo — 2026-09-29, continuación Gestoría

Repositorio Blackleets/Labora-. Base main@c5ff7d57 (PR #64 fusionado).
Rama: feat/manager-priority-queue.

- PR #64: CI web, Edge Functions y Android PASS; GitHub Pages run 36624408479 PASS. Navegador público muestra login; no hay sesión autenticada disponible para UAT.
- Nuevo trabajo: cola por cliente vinculado, priorizada por peticiones vencidas, respuestas recibidas y revisiones pendientes; acceso a auditoría, ingresos y peticiones reales.
- La cola incluye todos los trimestres y no cuenta needs_fix como revisión nueva del gestor (espera al trabajador).
- Peticiones submitted ya cuentan como abiertas en el pulso de cartera.
- Revisión fiscal: desaparece el 100% preseleccionado; aprobación exige porcentaje explícito 0–100; cero confirmado se conserva; entrada inválida no se recorta silenciosamente.
- Validación local: TypeScript, 187 pruebas, release:check 30/30, build y diff --check PASS.
- Próximo paso: CI y despliegue de esta rama, luego UAT autenticada real Trabajador/Gestoría. No fusionar PR #35 ni declarar UAT PASS sin evidencia.
- Invariantes: Supabase/RLS, secretos solo servidor, sin tasas fiscales inventadas, caché por usuario, borrado atómico y tombstones. Stripe continúa deshabilitado hasta sandbox UAT.

Registro previo (histórico):

---

# Checkpoint activo — 2026-09-29 (Europe/Madrid)

Repositorio: Blackleets/Labora-. Base comprobada: main@aa9b325.
Rama de esta corrección: fix/mobile-seasonal-atmosphere.

## Continuación exacta
- PR #63 fusionado: avisos móviles sobre navegación inferior.
- PR #62 fusionado: actividad reciente real del trabajador.
- PR #61 fusionado: cobertura administrativa por país en lugar del mapa defectuoso.
- Esta corrección recupera el selector de ambiente en móvil, coloca su panel en un portal fuera de la cabecera y añade nieve ligera, hojas, pétalos, sol y luna dentro del paisaje existente.
- Respeta reduced-motion y no intercepta controles ni formularios.
- Baseline: typecheck, 180 tests, 30 comprobaciones estructurales y build pasaron.
- Pendiente: UAT real autenticada en móvil con Trabajador y Gestoría; no hay evidencia suficiente para declarar la app 100% lista.
- Stripe sigue deshabilitado hasta sandbox UAT; secretos de IA y protección de contraseñas requieren verificar configuración real.
- Preservar Supabase/RLS, fiscalidad sin tasas inventadas, caché por usuario, borrado atómico y operational_deletion_tombstones.
- Próximo paso: comprobar CI de esta rama y el despliegue; verificar selector y flujos duales sobre sesiones autorizadas. No crear cuentas ni inventar UAT PASS.

La información anterior siguiente es histórica; contrastar estados con GitHub antes de actuar.

---

# Labora+ — handoff para el siguiente agente

**Fecha:** 2026-09-27 (Europe/Paris) · anterior 2026-09-20  
**Repo:** `Blackleets/Labora-` · tip `main` (verificar `git log -1`)  
**Producto live:** https://blackleets.github.io/Labora-/  
**Supabase:** `gggtriyvbusbpqohoukv`  
**Usuario:** Lewis Renteria · respuestas en **español** · sin Cloud Agents (usar `gh` + checkout local) · **no inventar** features/APIs/datos

## Norte duro
Solo producto real. Fácil para autónomo y gestoría. Fail-closed: sin Open Banking/OAuth inventados, sin flota/zonas/KPIs fake, sin UAT PASS ni Play-ready inventados.

## Estado (agent-safe: HECHO en main)
- Auth, registro gestoría (NIF+colegiado), autónomos abiertos
- Vínculo autónomo↔gestoría (UI Ajustes + RPCs live `link_manager_by_email` / `unlink_own_manager`)
- Dinero: gastos (foto/OCR fail-closed), ingresos (CSV local), **borrar** gastos/ingresos/docs/liquidaciones (cascada con confirm)
- Multi-país: `profiles.country_code`, Login selector, TaxOverview ES vs MX pendiente tasas oficiales
- Dark mode tokens, logos Simple Icons embebidos, legales con `BASE_URL`
- Mensajería + offline fail-closed; a11y forms; Pages desde `main` (`/Labora-/`)
- Docs: `GAPS.md`, `HOW_TO_TEST_AUTONOMO_GESTORIA.md`, `IMPLEMENTATION_CHECKLIST.md`, `RLS_ADVISORS.md`, `AUTH_HIBP.md`, `UAT_DUAL_ACCOUNT.md`
- **2026-09-27:** export CSV trimestral por cliente (gestoría), tarjeta plazos AEAT 130/303 (tabla oficial 2026, 4T 2026 pendiente), filtros en Gastos/Ingresos, trimestre + estado en Auditoría del gestor, fix hooks Dashboard
- **Registro de pedidos** (módulo opcional, owner-only, gestoría sin acceso): `docs/ORDER_LOG.md`, migración `20260927095323_labora_delivery_orders_module`
- CI: GitHub Actions build + edge-functions
- Billing: `VITE_BILLING_ENABLED=false`

## Bloqueado en Lewis (no inventar)
1. UAT dual firmado (checklist; cuenta gestoría UAT: `leerenmos+gestoria-uat@gmail.com`)
2. `GEMINI_API_KEY` / `GOOGLE_API_KEY` en edge `labora-ai`
3. Play Console / keystore / Data safety / capturas
4. Stripe secrets + Price IDs
5. Auth HIBP (dashboard; advisors solo WARN leaked passwords)
6. Open Banking PSD2 + OAuth Uber (contratos) — Glovo sin API pública equivalente

## PR #35 (draft, Blackleets)
Rediseño móvil + migraciones tombstones. **No tocar ni fusionar** hasta UAT dual real; tocará `Dashboard.tsx` (conflicto trivial: una línea `<FiscalDeadlineCard />` + fix de hooks).

## Próximas ideas (agent-safe)
- Subida múltiple de tickets (dedupe por hash ya existe)
- Versión PDF del pack trimestral
- Añadir 4T 2026 cuando la AEAT publique el calendario 2027

## Cómo seguir
1. `git pull` main; leer `docs/GAPS.md` + este handoff
2. No reabrir sweeps de tokens crema salvo bug reportado
3. Bugs de UAT → PR pequeño, CI verde, squash-merge, Pages `workflow_dispatch`
4. Secrets: nunca en repo; pedir a Lewis vía canal seguro

## Cuentas / notas
- Gestoría UAT creada; Lewis debe cambiar password si aún es la de prueba
- No marcar UAT PASS sin dos sesiones reales

**Créditos:** Lewis pidió cerrar este agente (agotados). Siguiente agente retoma desde aquí.
