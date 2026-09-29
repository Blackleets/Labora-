# Actualización — integridad de ingresos, 2026-09-29

- PR #69 fusionado: checkpoint y plan accesibles en main. CI run 36632093601 PASS.
- Rama activa: fix/income-import-validation. Calendario estricto en parser CSV/texto y guardado manual/importado; retención ilegible no se convierte en cero.
- Validación local: TypeScript, 200 pruebas, release:check 30/30, build, diff check PASS. Siete casos nuevos de calendario/retención.
- CI de esta rama y despliegue todavía pendientes; no afirmar producción ni UAT PASS.
- Siguiente: comprobar CI y publicar esta corrección; continuar inventario de gastos/documentos y probar flujos reales con ambos roles.
- Se mantienen diseño, Supabase/RLS y tombstones. Esta validación de interfaz no sustituye controles del servidor.

---

# Continuidad activa — 2026-09-29, 23:10 Europe/Madrid

## Identidad y mandato
Labora+, repositorio Blackleets/Labora-, producto https://blackleets.github.io/Labora-/.
Mantener el diseño actual; reforzar flujos reales de Trabajador, Gestoría y Admin. Usuario autoriza continuar mejoras y conservar continuidad si se interrumpe el chat.
Preservar Supabase/RLS, fiscalidad sin datos inventados, privacidad, aislamiento por usuario, borrado atómico y operational_deletion_tombstones. No añadir otro dashboard.
No guardar secretos ni contraseñas en checkpoints. PR #35 sigue sujeto a UAT dual real; no fusionarlo por inferencia.

## Evidencia confirmada en esta sesión
- PR #68 fusionado; main resultante fff6c1d6798f44b013a8fd188609634dddb6118c.
- Head validado 3c864fd93cfc82df9ce385730f7fc4521473bc61: CI run 36630948083 completed/success.
- Mejora: foco al abrir ambiente y retorno con Cerrar/Escape; pointerdown para cierre exterior; objetivos táctiles mayores y semántica de diálogo.
- Comprobaciones locales previas del mismo cambio: TypeScript, 193 tests, release:check 30/30, build y diff check PASS.
- Despliegue de #68 NO verificado todavía. Visual y UAT dual NO ejecutadas.
- Checkout local puede tener bdf639d (commit equivalente al publicado por connector). Fetch Git por shell falló por proxy; usar GitHub connector para leer versión canónica.

## Plan de ejecución y aceptación
| Orden | Trabajo | Evidencia necesaria | Estado |
|---|---|---|---|
| 1 | Cierre #68 y despliegue | CI PASS, merge confirmado, Pages PASS para SHA y revisión visual | CI/merge hechos; deploy/visual pendientes |
| 2 | Inventario de pantallas y controles | Ruta, rol, acción, resultado esperado, estado implementado/probado/desplegado | Pendiente |
| 3 | Trabajador: acceso, gasto/ticket, ingreso, documento, total, mensaje, recarga | Recorrido real; guardado confirmado y totales concordantes | Pendiente UAT |
| 4 | Gestoría: vínculo, cliente, revisión, petición, respuesta, deducibilidad, exportación | Dos cuentas reales y evidencia de ida/vuelta | Pendiente UAT |
| 5 | Seguridad entre cuentas, caché, archivos, desvinculación y borrado | Pruebas negativas servidor; sin acceso cruzado ni resurrección | Revisar cobertura y completar evidencia |
| 6 | Móvil y ambiente | 360/390/430px, teclado, navegación, safe area, reduced motion, persistencia | Pendiente visual |
| 7 | Rendimiento | Medición antes/después; CSS compilado conserva clases antes de retirar CDN | Pendiente |
| 8 | IA, Stripe y otras integraciones | Configuración real, manejo de errores y sandbox; sin promesas ficticias | Pendiente/configuración |
| 9 | UAT final y producción | Sin P0/P1 abiertos; ambos roles PASS; deploy exacto confirmado | Abierto |

Cada hallazgo: problema, evidencia, impacto P0/P1/P2/P3, solución mínima, validación y rollback. No clasificar controles por búsquedas de texto únicamente: trazar handler, servicio y autorización.
P0: exposición/pérdida de datos o resultados económicos incorrectos. P1: tarea principal bloqueada. P2: claridad/móvil/rendimiento. P3: decoración/opcionales.
Excluir por ahora: rediseño global, fiscalidad de países no verificada, integraciones ficticias, pagos reales sin sandbox UAT y nuevas dependencias sin necesidad.

## Punto exacto para continuar
1. Leer este archivo COMPLETO en GitHub y comprobar main/PRs actuales; el histórico inferior no sustituye este checkpoint.
2. Comprobar el deploy Pages de fff6c1d (o su sucesor) antes de declararlo publicado.
3. Empezar inventario por App.tsx, Sidebar y módulos de dinero; localizar acciones incompletas y resolver primero P0/P1 con cambio pequeño.
4. Si navegador solo muestra login, documentar el bloqueo: no inventar sesiones ni UAT PASS.
5. Actualizar este mismo handoff tras cada cambio sustancial con SHA, PR, CI/deploy y siguiente tarea; no crear otro sistema de memoria.

---

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
