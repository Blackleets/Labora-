# Checkpoint activo — 2026-09-29 (Europe/Madrid)

Repositorio: Blackleets/Labora-. Base main@3aa41991.
Rama de cierre: fix/manager-privacy-and-request-badges.
Producto: https://blackleets.github.io/Labora-/
Supabase: gggtriyvbusbpqohoukv.

## Trabajo confirmado
- PR #63: avisos móviles sobre la navegación inferior.
- PR #64 fusionado: selector de ambiente visible en móvil, panel en portal, nieve/hojas/pétalos y sol/luna dentro del paisaje; respeta reduced-motion. CI web/Edge/Android PASS y Pages PASS.
- PR #65 fusionado: cola de trabajo real de Gestoría por cliente vinculado y todos los trimestres, priorizada por vencimientos/respuestas/revisiones. Deducibilidad explícita 0–100 sin 100% por defecto, conserva cero revisado. CI web/Edge/Android PASS y Pages run 36625344253 PASS.
- PR #66 fusionado: Vite deja de sustituir variables de navegador por GEMINI_API_KEY. Prueba negativa de build con clave ficticia falla antes y pasa después. CI web/Edge/Android PASS. No implica que se haya filtrado una clave real en producción.
- Cierre actual: ManagerDashboard respeta privacyMode al mostrar importes; navegación incluye submitted para gestor/admin y solo pendientes propias para trabajador. Cinco pruebas específicas de roles y privacidad.
- Validación local conjunta: TypeScript, 193 pruebas, release:check 30/30, build y git diff --check PASS.

## Cierre pendiente y siguiente trabajo
- Comprobar CI/deploy de la rama actual. Usar SHA exacta y no declarar el despliegue sin run PASS.
- UAT visual/dual real sin completar: el navegador público muestra login, no hay sesión autenticada disponible. No declarar UAT PASS ni fusionar PR #35 por asumir resultados.
- index.html todavía usa Tailwind CDN en runtime (advertencia observada en navegador). Próxima mejora de rendimiento: compilar CSS local conservando todas las clases y verificar visualmente antes de publicar.
- Stripe OFF hasta sandbox UAT; verificar secretos IA y protección de contraseñas en entorno real.
- Preservar RLS, fiscalidad sin tasas inventadas, secretos solo servidor, caché por usuario, borrado atómico y operational_deletion_tombstones.

El registro de 2026-09-27 siguiente es histórico; contrastar sus estados con este checkpoint y GitHub antes de actuar.

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
