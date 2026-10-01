# Continuidad activa — guardado operativo confirmado, 2026-10-01 (UTC)

- Mandato de Lewis: ejecutar el primer bloque del plan de salida (PR #76, borrador), empezando por sincronización fiable y cancelación de documentos.
- Base main@cc87dc34f80108b105385f886d9f90cbef8c1923; rama fix/reliable-operational-save. PR #75 (sombra móvil) ya fusionado: CI 36907163136 y 36907456997 success; Pages 36907457045 success. Sustituye los pendientes de entrega del checkpoint anterior, sin afirmar visual de Inicio autenticado.
- El expediente muestra checking/pending/syncing/synced/error/blocked. El botón Reintentar vuelve a intentar la hidratación/escritura; las notificaciones de mutaciones locales ya no anuncian guardado remoto. Solo la respuesta de todas las escrituras y su recibo local permiten confirmar el snapshot actual del actor actual.
- Escrituras propias en expenses/documents/incomes/payments solicitan IDs guardados mediante select('id') y rechazan confirmaciones incompletas. auth.getUser verifica el actor antes y después del lote. Las RPCs existentes, roles, RLS, Storage, grants, tombstones y estados fiscales se conservan. Sin migraciones ni despliegue de Edge Functions.
- Documents aborta/invalida lecturas al cancelar, cerrar, desmontarse, cambiar de archivo o de cuenta/rol. Un resultado antiguo no prepara un archivo nuevo ni borra el indicador de lectura de otro. Ante fallo local de Guardar, archivo, nombre y formulario se conservan.
- Cerrar sesión desde Sidebar/Ajustes avisa si hay cambios operativos pendientes; beforeunload solicita el aviso del navegador. No garantiza recuperación ante cierre forzado del sistema ni durabilidad offline de archivos que excedan la cuota de localStorage. Mantener sesión y reintentar antes de salir.
- Los lotes no son una transacción global: un fallo puede dejar escrituras parciales. El reintento mantiene IDs y rutas de archivo deterministas; no se confirma el lote fallido. El estado se limita al expediente operativo, no acredita mensajería/pedidos/perfil ni proveedores IA/Stripe.
- Validación local: 260 tests / 41 archivos PASS (35 nuevos); TypeScript PASS; release:check 30/30 PASS; build PASS (aviso existente de chunk >500KB); diff check PASS. Pruebas negativas cubren escritura lenta/rechazada, fila ausente, fallo Storage/recibo, cambio de actor/revisión/pestaña, reintento tras fallo parcial y handlers/effects de Documents/RemoteSyncBridge.
- Las pruebas de componentes usan un harness de hooks en Node; NO equivalen a React DOM, visual móvil ni UAT autenticada. Pendiente ejecutar UAT dual + cuenta ajena real, documento grande/cuota, recarga/descarga, reintento de red y móvil físico. PR #35 conserva su gate explícito.
- CI/merge/Pages pendientes al guardar este checkpoint. Consultar el PR de esta rama y sus SHAs/runs para evidencia final. Rollback: revert del PR; no requiere cambios de backend.
- Siguiente bloque funcional del plan: recuperación real de contraseña (L02), sin marcar L01 aceptado en live hasta el recorrido anterior. Billing permanece OFF y Android no se considera listo para Play.

---

# Continuidad activa — sombra de Inicio móvil, 2026-10-01 (Europe/Madrid)

- Solicitud de Lewis: corregir la franja/sombra visible en Inicio móvil y seguir mejorando la app con el diseño actual.
- Base main@c7cce00fb9c284f88d0ea3fc773d05e7e9f8fcf8; rama fix/mobile-home-atmosphere.
- Diagnóstico respaldado por captura y código: AtmosphericPanel ocupaba solo el 55% inferior del hero Rider (52% Gestoría), con un borde superior duro. Su rectángulo de grain no declaraba fill (negro por defecto) y feBlend conservaba SourceGraphic, generando un velo oscuro con opacity 0.55 y multiply.
- Corrección: los dos heroes conservan su fondo CSS continuo .labora-hero, tema y contenido; se elimina el SVG parcial superpuesto. AtmosphericPanel conserva paisaje/luces/estaciones en Login y elimina el grain SVG negro redundante; Login ya tiene textura CSS labora-film-grain.
- Cambio solo decorativo, sin modificar datos, navegación, cálculos, RLS ni autenticación. Rollback por revert del PR.
- Validación local: 225 pruebas / 36 archivos PASS; TypeScript PASS; release:check 30/30 PASS; build PASS (aviso previo de chunk >500KB); diff check PASS. Sin pruebas que repliquen el cambio decorativo.
- Este navegador abre Login, sin sesión autenticada; la revisión real de Inicio a 360/390/430px y en el móvil de Lewis sigue pendiente. No afirmar UAT móvil PASS por checks de código.
- CI/merge/Pages: pendientes al guardar el checkpoint; consultar el PR asociado y su SHA exacto para evidencia final.
- Cierre anterior verificado: PR #74 fusionado, ficha administrativa en main@c7cce00fb9c284f88d0ea3fc773d05e7e9f8fcf8; CI feature 36784348965 y Pages 36784684822 success. admin-overview v3 ACTIVE con verify_jwt=true y respuesta anónima 401 sin datos. El checkpoint inferior era previo al despliegue y sus pendientes de entrega quedan sustituidos por este registro.
- Próxima aceptación: visual móvil autenticada (Inicio + Gestoría + ficha admin), recorrido UAT dual real y auditoría de cancelación asíncrona de Documents.tsx. PR #35 conserva su gate de UAT dual y no se fusiona por esta corrección.

---

# Trabajo activo — ficha administrativa, 2026-10-01 (Europe/Paris)

- Solicitud de Lewis: seleccionar un usuario y ver su ficha dentro de Labora+, conservar menú/diseño y volver al directorio con búsqueda/filtros.
- Base main@04ec42d34af9cc4b5c33ea37237ea0a0a99523e4; rama feat/admin-user-record.
- Diagnóstico: AdminDashboard mostraba flechas sin handlers; Usuarios visibles abría PeopleHub (solo cartera vinculada). Admin usa ahora el directorio protegido; Gestoría conserva PeopleHub y su cartera.
- Ficha: perfil/vínculo, ingresos, gastos, documentos, peticiones, fiscalidad, actividad y clientes vinculados; 25 filas por página y conteos reales. Clientes vinculados abren su propia ficha. No se calculan nuevos impuestos ni totales parciales presentados como globales.
- Backend admin-overview añade action=user-detail: auth.getUser + rol actual en profiles antes de cualquier lectura de destino, UUID/sección/página validados, consultas acotadas al usuario. No modifica RLS, grants, tombstones ni estados fiscales.
- Mensajes se consultan mediante el cliente del actor (RLS solo participantes). Archivos: metadata administrativa; lectura y URL firmada de 60 s mediante cliente del actor y RLS de documentos/Storage. No se firma con service_role ni se devuelven rutas privadas en la ficha.
- Interfaz: botones de fila accesibles, foco en ficha y retorno, paginación, vacío/error/reintento; respuestas antiguas invalidadas al cambiar usuario, sección o actor; privacidad de importes y moneda del perfil elegido.
- Baseline: 200 tests + TypeScript PASS. Cambio: 225 tests (25 nuevos), TypeScript, build, release:check 30/30 y diff check PASS.
- Deno local bloqueado por conexión a registry.npmjs.org; CI ahora incluye deno check de admin-overview (incluye helper importado). CI y despliegue pendientes al guardar este checkpoint: verificar PR/head exactos antes de afirmar publicado.
- Visual autenticada NO ejecutada. Prueba aislada de layout intentada con datos QA temporales fuera del repo, pero navegador devuelve ERR_BLOCKED_BY_CLIENT para localhost. No se añadieron fixtures ni accesos de prueba a producción.
- Próximo: CI verde; desplegar admin-overview con ambos archivos y verify_jwt=true; comprobar versión y rechazo sin sesión; merge y Pages del SHA exacto. Después abrir Administración → Usuarios → cuenta, recorrer pestañas y retorno en desktop/móvil con sesión real. PR #35 conserva gate de UAT dual y no se fusiona por esta mejora.
- Rollback: revert del PR frontend/backend y redeploy de admin-overview v2 guardado en el histórico Git de la base. No aplicar migraciones ni relajar acceso para conseguir una captura.

---

# Continuidad activa — 2026-09-30 (Europe/Paris)

## Identidad y mandato
Labora+, repositorio Blackleets/Labora-, producto https://blackleets.github.io/Labora-/.
Mantener el diseño actual y reforzar los flujos reales de Trabajador, Gestoría y Admin.
Preservar Supabase/RLS, aislamiento por usuario, privacidad, fiscalidad sin datos inventados, borrado atómico y operational_deletion_tombstones.
No añadir otro dashboard ni guardar secretos, contraseñas o sesiones en checkpoints.

## Baseline y cierre verificados
- PRs #70 (calendario/retención de ingresos) y #71 (adjunto reemplazado y conservación del formulario ante error) ya fusionados.
- Baseline main@13c99cae868054197ad68d3f3f8b3f6b4be25b44: CI 36682271080 y Pages 36682271065 completed/success.
- PR #72 revisado y fusionado por squash. Head 2169291e8c484cf2e2d373d81bd917db3500313d: CI 36682248880 success en build, Edge Functions y Android; sin hilos de revisión.
- Main resultante e7b8793f3fa14ca6272fb504801c73dd27ed047d. Único cambio de producto de #72: modules/core/hubs/MoneyHub.tsx, cinco pestañas en grid de dos columnas móvil, controles con min-height 44px y aria-pressed; distribución flexible desde sm. Handlers y alcance por rol conservados.
- Pages 36778359154 completed/success para ese SHA: corrección publicada.
- CI main 36778359099: build (typecheck, tests, release:check, build) y edge-functions success; Android aún in_progress al tomar este checkpoint. Consultar el run antes de afirmar CI global main PASS.
- Inspección visual pública: login carga en https://blackleets.github.io/Labora-/. Este navegador no tiene sesión autenticada; MoneyHub visual y UAT dual NO ejecutados.
- No afirmar que el espacio vacío bajo la navegación móvil está resuelto: requiere reproducir el viewport autenticado.
- Supabase Security Advisor leído en live: único aviso devuelto, Leaked Password Protection Disabled. No se modificó configuración Auth. Referencia: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.
- Edge Functions activas en live: labora-ai v2, checkout v1, billing portal v1, stripe-webhook v1, delete-account v1 y admin-overview v2. Su estado ACTIVE NO demuestra secretos configurados ni éxito del recorrido funcional.
- PR #35 sigue open/draft, feat/labora-approved-reference-ui. Gate explícito de su descripción: UAT real Rider + Gestoría antes de fusionar. No se fusionó.

## Qué falta y orden de aceptación
| Prioridad | Trabajo | Evidencia mínima | Estado |
|---|---|---|---|
| 1 | Recorrido real Trabajador → Gestoría | Login/roles; vínculo; gasto/ticket, ingreso y documento; recarga; revisión de importes/deducibilidad explícita; petición y respuesta; mensajes; exportación CSV/PDF del trimestre | UAT pendiente |
| 1 | Aislamiento y borrado en servidor | Cuenta ajena sin acceso; cambio de sesión sin caché cruzada; desvínculo retira acceso; documento/liquidación e ingresos asociados borrados atómicamente; pestaña antigua no resucita filas | Cobertura automatizada existente; evidencia live pendiente |
| 2 | Reproducción móvil | 360/390/430px; todas las pestañas visibles y accionables; espacio vacío, teclado, modales, navegación inferior y safe area; ambiente y reduced-motion | #72 publicado; visual autenticada pendiente |
| 2 | IA/OCR real | Confirmar configuración solo servidor y probar un justificante conocido; error claro cuando falla; entrada manual conservada | Función ACTIVE; secreto/resultado sin verificar |
| 2 | Seguridad Auth | Habilitar y verificar protección de contraseñas filtradas mediante configuración soportada | Aviso live confirmado; pendiente |
| 3 | Cobro Pro | Configuración Stripe sandbox, Price IDs, checkout + webhook + portal, estado de suscripción coherente | Billing OFF hasta UAT sandbox |
| 3 | Rendimiento | Medir antes/después; sustituir Tailwind CDN por CSS compilado solo tras demostrar conservación visual de clases | Pendiente |
| 3 | Publicación Android | Play Console, firma, Data safety y capturas; debug APK/CI no equivalen a Play-ready | Pendiente externo |

No cerrar el gate #35 porque existan tests o checklist. La prueba autenticada de dos roles y la evidencia negativa de permisos son necesarias.
Banca PSD2, OAuth de plataformas y canales push/email/WhatsApp permanecen dependientes de integración real; no fingir conexiones ni ampliar fiscalidad internacional con tasas supuestas.

## Punto exacto para continuar
1. Leer este checkpoint y HERMES_HANDOFF.md (histórico de arquitectura), verificar main/PRs/runs actuales.
2. Consultar CI 36778359099; Pages del cambio #72 ya fue verificado.
3. Abrir producto y ejecutar docs/UAT_DUAL_ACCOUNT.md con dos sesiones reales. No pedir ni guardar contraseñas en chat o repo; usar el mecanismo seguro de autenticación disponible.
4. Reproducir el espacio vacío móvil y recorrer cada handler antes de corregir. MoneyHub enlaza con ExpenseTracker, IncomeTracker, TaxOverview, Documents y BankingConnect; el último no aparece para Gestoría/Admin.
5. En Documents.tsx revisar también cancelación/cierre durante lectura asíncrona de archivo y cambio de sesión; hay awaits en handleFileSelect y Cerrar/Cancelar actualmente solo cierran el modal. Esto es una superficie de auditoría, no una reproducción ni un bug corregido.
6. Resolver primero pérdidas/exposición de datos o tareas principales bloqueadas mediante PR pequeño. Mantener diseño y contratos; rollback por revert del cambio.
7. Actualizar este mismo handoff con SHA, PR, validación, despliegue y siguiente tarea tras cada avance sustancial.

## Registro histórico
Las notas inferiores son históricas; los estados de rama, despliegue y siguiente tarea se sustituyen por el checkpoint superior.

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
