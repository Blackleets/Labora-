# Labora+ — plan de cierre y lanzamiento

Fecha: 2026-10-01, Europe/Madrid. Solicitud de Lewis: plan exhaustivo para dejar la app lista, manteniendo el diseño actual.

## Veredicto y alcance

**No lista todavía para lanzamiento público general.** Hay producto implementado y publicado, pero faltan pruebas reales de recorridos, recuperación, persistencia y aislamiento. Los checks verdes no sustituyen esas pruebas.

Objetivo inicial propuesto: beta web de Trabajador, Gestoría y Admin con ingresos, gastos, archivo privado, peticiones, mensajes y exportación. España como primera jurisdicción fiscal revisada. País/moneda no equivalen a fiscalidad disponible. Empleados y actividades mixtas deben recibir una experiencia apropiada, sin aplicar automáticamente modelos de autónomos.

Tres cierres independientes:

1. **Beta funcional:** recorridos y aislamiento probados; recuperación de acceso; guardado y fallos claros; móvil utilizable; soporte y recuperación de datos disponibles.
2. **Producto de pago:** lo anterior + Pro definido, Stripe probado en sandbox, suscripción autorizada en servidor y límites/costes controlados.
3. **Android distribuible:** beta funcional + artefacto firmado, prueba física y gates de tienda vigentes verificados al preparar el envío.

La beta puede funcionar con entrada manual si OCR no está habilitado. No anunciar lectura automática, cobro, presentación tributaria, banca o conexiones de plataformas hasta verificar cada capacidad.

## Baseline comprobada

- Repositorio Blackleets/Labora-, main@cc87dc34f80108b105385f886d9f90cbef8c1923.
- CI main 36907456997 y Pages 36907457045: completed/success para ese SHA. Última suite local: 225 pruebas / 36 archivos; TypeScript, build y 30 controles estructurales PASS.
- PR #75 publicado: se retira la capa parcial de los heroes y la textura SVG negra. Login se comparó visualmente antes/después; Inicio móvil autenticado sigue sin probarse.
- PR #74 publicado: ficha administrativa dentro de la app. Backend admin-overview v3 ACTIVE, verify_jwt=true. Metadata administrativa; mensajes y archivos siguen sujetos a los permisos del actor.
- Edge Functions activas: labora-ai v2; checkout, portal, webhook y delete-account v1; admin-overview v3. ACTIVE no prueba configuración de proveedores ni recorrido funcional.
- Security Advisor consultado hoy: un WARN, Leaked Password Protection Disabled. Remediación: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . Verificar capacidad/plan de Auth antes de elegir la configuración soportada; documentar cualquier dependencia.
- PR #35 sigue open/draft. Su gate exige UAT real Rider + Gestoría. Después habrá que comparar su rama antigua con main; no fusionar cambios ya incorporados ni resolver conflictos descartando hardening.
- No hay prueba real cerrada de UAT dual, aislamiento entre cuentas, beta móvil, OCR, Stripe ni publicación Android.

## Hallazgos que ordenan el trabajo

1. `DataContext.addDocument` inserta estado local y muestra «Documento guardado». `RemoteSyncBridge` sincroniza después, con debounce de 700 ms, y puede fallar. Hay protección de caché, pero falta un estado visible por operación que distinga preparación local de confirmación remota. Revisar también gastos, ingresos, auditoría y peticiones que muestran éxito antes de persistir.
2. No se encontró flujo `resetPasswordForEmail` / `PASSWORD_RECOVERY` ni equivalente de recuperación en el código de la app. Implementar y probar el recorrido de recuperación, incluidos redirects de Pages y retorno móvil, tras consultar documentación vigente.
3. `Documents.handleFileSelect` realiza varios awaits y luego actualiza estado. Cerrar/Cancelar solo cierran el modal. Reproducir lecturas tardías, reemplazo y cambio de sesión antes de corregir; es una superficie de auditoría, no un incidente de datos demostrado.
4. La UAT existente debe ampliarse con ingresos, gastos, auditoría, exportación, cancelación, borrado, Admin y estados de red. No usar una checklist antigua como evidencia de funcionalidades recientes.
5. `GAPS.md`, `IMPLEMENTATION_CHECKLIST.md` y otros documentos mezclan estados históricos. Consolidar evidencia actual y corregir instrucciones que sugieran compartir contraseñas en chat. Secrets y credenciales van solo por mecanismos seguros.

## Trabajo ordenado y definición de terminado

| ID / prioridad | Resultado y superficies | Dependencias | Prueba de aceptación | Responsable / contención |
| --- | --- | --- | --- | --- |
| L01 / P0 | Estado real de guardado en DataContext, RemoteSyncBridge, remoteOperational y formularios. Distinguir pendiente local, sincronizando, confirmado y error; reintento sin duplicados; preservar archivo y formulario. Revisar cancelación/reemplazo/session races en Documents. | Baseline actual; reproducir fallos. | Red lenta, offline, error de Storage/BD, recarga inmediata, doble toque, dos pestañas y cambio de usuario. Solo confirmación remota se presenta como guardado en nube. Ninguna pérdida silenciosa ni operación tardía aplicada a otro actor. | Codex implementa y verifica. PR pequeño por contrato; conservar cache/recibos/tombstones; revert si falla aislamiento. |
| L02 / P0 | Recuperación de contraseña y ciclo de cuenta: Login, authWorkspace, callbacks y Settings. Registro, confirmación cuando esté configurada, sesión expirada, logout y onboarding persistente. Protección de contraseñas filtradas y límites de abuso revisados. | Configuración Auth y correo/redirects verificados; documentación vigente. | Correo de recuperación real; enlace válido, vencido y reutilizado; nueva sesión; mensajes sin enumerar cuentas; logout elimina datos visibles. Probar Rider y Gestoría. | Codex programa/prueba; Lewis aporta acceso seguro cuando sea necesario. Cambios Auth trazables y reversibles. |
| L03 / P0 | UAT principal completa con A Trabajador, B Gestoría vinculada y C ajena. Ampliar docs/UAT_DUAL_ACCOUNT.md. | L01/L02; sesiones autorizadas. Puede empezar ya como diagnóstico. | A registra gasto con ticket, ingreso y PDF; recarga y abre en otro dispositivo. B encuentra el cliente, revisa, solicita corrección; A responde; mensajes bidireccionales; CSV y PDF coinciden con datos y periodo. C no ve nada ajeno. | Codex ejecuta lo que permita el acceso; Lewis valida la experiencia. Datos QA claramente identificados; evidencia sin NIF, archivos reales ni credenciales. |
| L04 / P0 | Aislamiento live y ciclo de borrado: RLS, Storage, RPCs, caché y tombstones; permisos Admin explícitos. | L03 + cuentas y registros QA; no ampliar permisos para probar. | Intentos por ID ajeno; archivos privados; actor no admin rechazado; cambio de cuenta limpio; desvínculo impide nuevas lecturas/descargas. Medir vigencia residual de URLs ya firmadas. Borrado atómico de liquidación e ingresos; pestaña antigua no resucita filas; account deletion con cuenta desechable autorizada. | Codex prueba boundaries; destrucción irreversible solo con autorización específica. Revert de PR/migración compatible; restauración ensayada fuera de producción. |
| L05 / P0 | Experiencia coherente por rol y actividad. Dashboard, ManagerDashboard, AdminUserDetail, PeopleHub, Onboarding, Settings, MoneyHub. | L03/L04 para permiso real. | Trabajador ve su expediente; Gestoría su cartera ordenada; Admin ficha y retorno/filtros. Empleado no recibe obligaciones de autónomo por defecto; rider opcional conserva jornadas/pedidos. Rutas, vacíos, errores y botones funcionan. | Codex. Preservar identidad actual; cambios por flujo, sin rediseño global. |
| L06 / P0 | Aceptación móvil y accesibilidad: App, Sidebar, CSS, modales, formularios, iluminación y privacidad. | L01 + recorridos existentes; sesiones reales. | 360/390/430 px y escritorio; Samsung S25 físico. Sin corte oscuro ni hueco bajo nav; teclado no tapa Guardar; scroll/modal/safe area correctos. Foco, contraste, controles táctiles, zoom y reduced-motion. Verificar cada preset de luz en claro/oscuro. | Codex automatiza/inspecciona cuando sea posible; Lewis confirma dispositivo físico. Capturas comparables; no declarar PASS desde JSX. |
| L07 / P0 | Fiscalidad y exportaciones trazables: cálculo, quarterExport/Pdf, fiscalDeadlines, country capabilities. | L03/L05; fuentes oficiales vigentes para cada regla publicada. | Casos documentados de ingresos/gastos/retenciones/deducibilidad; aprobado/pending/rejected coherentes; cambio de trimestre y año; igualdad CSV/PDF/UI y límites de redondeo. Revisar calendario 2027 cuando exista. País sin pack no hereda impuestos de ES. | Codex prepara tests y trazabilidad; revisión humana fiscal para reglas publicadas. Packs versionados, alcance visible y apagado al vencer; no asumir tasas. |
| L08 / P1 condicional | OCR/IA real: labora-ai, geminiService, captura de gasto y lote de tickets. | Secret de proveedor solo servidor; coste/límites definidos. | PDF/ticket conocido y adverso; extraer importe/fecha/comercio para revisión humana. Timeout, cuota, documento ilegible, duplicado y proveedor no configurado conservan entrada manual. Ninguna aprobación fiscal automática. | Codex integra/verifica; Lewis facilita configuración segura si falta. Deshabilitar capacidad sin bloquear archivo manual. |
| L09 / P0 para lanzamiento público | Operación, privacidad y soporte. Logs sin datos sensibles; correlación de errores; copia y restauración de BD + archivos; retención, baja y exportación de cuenta; páginas legales acordes al producto real; canal de soporte. | L01/L04; inventario de datos/proveedores. | Recuperación de un expediente QA en entorno aislado; fallo visible con reintento; aviso de incidencia útil; privacidad/condiciones accesibles desde móvil; borrado y retenciones documentados. Revisar tratamiento de archivos fiscales y finalidad por rol. | Codex prepara controles/runbook; Lewis define responsable/canal/condiciones de negocio; revisión especializada cuando corresponda. No hacer afirmaciones de cumplimiento desde una plantilla. |
| L10 / P1 | Rendimiento y sostenibilidad: bundle, Tailwind CDN, listas, carga de archivos, consultas, cuotas y coste IA/Storage. | L06 para conservar apariencia; medir antes de cambiar. | Medir arranque, interacción, consultas y coste con volúmenes QA pequeños/medianos/grandes y red móvil. CSS compilado solo con comparación visual; lazy load/paginación cuando exista bottleneck. Umbrales de alerta y límites de tamaño/uso probados. | Codex. Sin nuevas dependencias/planes de pago sin necesidad medida; comparación antes/después y rollback. |
| L11 / P0 para cobrar | Pro real: beneficios/límites por rol, Price IDs, checkout/portal/webhook, derechos de suscripción en servidor y comunicación de precios. | Beta funcional + L09/L10 + configuración Stripe sandbox. | Alta, cancelación, renovación, pago fallido, webhook repetido/tardío, firma inválida; privilegios no dependen de bandera UI. Conciliar estado proveedor/BD. | Codex construye/prueba; Lewis define oferta y configuración comercial. Billing OFF hasta PASS; sin cobros reales de prueba. |
| L12 / P0 para tienda | Android: Capacitor, firma fuera del repo, build de release, permisos mínimos, callback Auth, selector/cámara/descargas, ficha y declaraciones de datos. | Beta funcional; L11 solo si Pro en Android; verificar políticas de tienda vigentes. | AAB firmado en pista interna; prueba física de login/recuperación, ticket, PDF, teclados, navegación y baja. Revisar política de cobro aplicable antes de elegir el canal Android. | Codex prepara artefactos/checks; Lewis conserva claves y cuenta de tienda. Publicación de producción es un gate aparte; APK debug no basta. |

## Ruta crítica y checkpoints

1. **CP1 — datos y acceso:** L01/L02. Punto de salida: ningún éxito remoto falso, recuperación funcional y cancelaciones sin respuestas tardías.
2. **CP2 — expediente completo:** L03/L04/L05/L07. Punto de salida: trabajador y gestoría completan el mismo expediente, cifras/exportaciones coinciden y la cuenta ajena queda excluida.
3. **CP3 — beta usable:** L06/L09 + mínimos de L10; L08 si se anuncia IA. Punto de salida: evidencia móvil física, fallos recuperables, soporte, permisos y recuperación de datos.
4. **CP4 — cobrar:** L11. Solo después de beta y sandbox.
5. **CP5 — distribuir Android:** L12. No obliga a retrasar una beta web ya aceptada.

UAT puede empezar antes de CP1 para encontrar fallos; su cierre se hace sobre la versión final candidata. No hay fechas prometidas: primero reproducir y medir los bloqueos. Cada slice recibe PR pequeño, checks proporcionales, evidencia del SHA desplegado y un checkpoint.

Trabajo independiente posible: recopilar casos UAT y matriz móvil; preparar fixtures fiscales documentados; revisar runbook/coste y documentación. No editar en paralelo el contrato de sincronización ni las mismas migraciones. Un único integrador valida el conjunto.

## Matriz mínima de evidencia

Cada caso registra ID, fecha, SHA, entorno/dispositivo, rol pseudonimizado, pasos, resultado esperado/observado, prueba o traza redactada y PASS/FAIL/NO VERIFICADO. Separar pruebas unitarias, integración real, visual y aceptación del usuario.

- Positivos: crear → guardar remoto → recargar → ver desde rol permitido → revisar → exportar.
- Negativos: ID ajeno, rol incorrecto, desvínculo, expiración, red caída, duplicado, archivo inválido, cancelación y pestaña antigua.
- Estados: vacío, carga, pendiente local, confirmado, error y reintento.
- Release: CI exacta, Pages exacta, funciones/migraciones requeridas, smoke real y rollback disponible.

No publicar evidencia con contraseñas, tokens, correos privados, NIF, tickets financieros o rutas firmadas. Datos QA no se presentan como usuarios ni actividad real del producto.

## Decisiones y dependencias del fundador

- Confirmar mediante el uso qué flujos sirven a trabajadores, gestoría y admin; conservar el diseño actual como referencia.
- Acceso seguro a sesiones reales para pruebas: el agente puede ejecutar la UAT si cuenta con ellas; no pedir contraseñas en chat.
- Configuración de proveedor OCR y Stripe por canal seguro, solo si esas capacidades entran en el lanzamiento.
- Oferta comercial, límites, responsable de soporte y decisiones de tratamiento/retención de datos.
- Cuenta de tienda, firma y envío Android cuando esa fase toque. No bloquean el trabajo de código ni la beta web.

## Funciones posteriores que no bloquean el núcleo

Banca PSD2, OAuth de plataformas, demanda/mapas de reparto, flotas, nóminas completas, IA fiscal mundial, agregados de pedidos y canales externos de alertas. Cada una exige integración, fuente o contrato propio. Las superficies no disponibles deben orientar al siguiente paso útil o quedar fuera de la navegación principal.

## Gate final

Beta funcional aceptada cuando todos los P0 de su alcance tienen evidencia PASS, no hay defectos críticos/altos abiertos, se conserva el hardening y Lewis puede repetir los recorridos esenciales sin ayuda. Lo opcional queda explícitamente acotado. Cobro y Android tienen su propio gate.

Tras la UAT, revisar #35 contra main: reconciliar únicamente diferencias aún útiles, ejecutar CI y probar el resultado integrado. La antigüedad o existencia del PR no obliga a fusionarlo.

## Próxima acción concreta

Reproducir L01: archivo PDF, red lenta/error, cierre durante lectura, reemplazo, recarga y cambio de cuenta. Registrar qué llega a BD/Storage y qué muestra la app. Implementar después el cambio mínimo que haga coincidir el estado visible con el estado real. L02 se prepara sobre su contrato Auth separado. Este turno entrega el plan; no modifica producción.
