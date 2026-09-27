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

## Update 2026-09-27 (Labora+ Empresa → next agent)

Merged to `main` this session (all CI green, Pages redeployed):
- #36 Gestoría quarterly CSV export (formula-injection safe), AEAT 130/303 deadline card (official 2026 dates; 4T 2026 pending AEAT 2027 calendar), filters on gastos/ingresos, Dashboard hooks fix.
- #37 Optional **Registro de pedidos** module (toggle in Ajustes → Módulos; owner-only RLS on `delivery_orders` + `user_module_settings`; gestoría has no access). Migration `20260927095323 labora_delivery_orders_module`.
- #38 `docs/LEGAL_PLAY_ORDER_BUBBLE.md` — legal/Play review (Glovo riders ES are employees; Play restricts notification access). Needs lawyer review before release.
- #39 Android floating bubble (Play flavour, manual only) + `labs` flavour with opt-in Uber notification prefill. **Never tested on a device.** Lewis said: no APK work for now, improve product first.
- #40 Pedidos analytics tab, weekly summary and weekly goal.
- #41 Shift history + monthly km log with user-entered cost per km.
- #42 Own CSV import with column mapping + reconciliation with manual log.
- #43 Bulk receipt upload with SHA-256 duplicate check.

Open:
- **PR #44** (`feat/export-trimestral-pdf`): PDF quarterly pack for gestoría. CI green, mergeable, not yet reviewed/merged.
- Draft **PR #35** untouched; must wait for dual UAT. Live DB has migration `20260922212049 labora_universal_worker_profile` not in `main` (likely from #35) — review before merging.

Still Lewis-only: dual UAT, Gemini key, Play Console, Stripe (billing flag OFF), HIBP toggle, lawyer review/DPIA for notification assist.
