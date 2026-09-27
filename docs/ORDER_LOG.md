# Registro de pedidos (módulo opcional)

**Estado:** en `main` desde 2026-09-27. Solo autónomos. **Desactivado por defecto.**

## Qué es
El rider apunta a mano cada pedido (plataforma, importe, aceptado/rechazado + motivo, km, nota, hora).
Labora+ **no** usa APIs de plataformas, **no** lee la pantalla (sin AccessibilityService, sin capturas) y **no**
automatiza cuentas de Uber/Glovo/Just Eat. La lectura de notificaciones existe **solo en el flavour Android «labs»**
(fuera de Play), como opción explícita y desactivada por defecto. Revisión legal y de Play: `docs/LEGAL_PLAY_ORDER_BUBBLE.md`.

## Dónde
- **Ajustes → Módulos → Registro de pedidos** (switch). Apagado = oculto en menú, Inicio y ruta.
- Menú lateral «Pedidos», acceso «Nuevo pedido» en Inicio.

## Funciones
- Alta rápida: chips grandes de plataforma (tu actividad + Uber Eats / Glovo / Just Eat + «Otra…»), «Repetir última», Aceptado/Rechazado, importe, motivo de rechazo (Muy lejos · Paga poco · Zona · Otro), km/nota/hora opcionales (hora = ahora, editable).
- **Jornada** (reutiliza `work_sessions`): Iniciar/Terminar → €/hora. Sin GPS.
- **Hoy**: aceptados, rechazados, % aceptación, € ganado (solo aceptados), km, €/km, €/hora, gastos de hoy (de Gastos) y **neto estimado antes de impuestos**.
- **Objetivo diario** opcional con barra de progreso.
- Gráficos: últimos 7 días / últimas 6 semanas.
- **Mes**: totales, por plataforma, por día (con rechazados y motivos), editar/borrar (solo propietario), **CSV** (helpers anti-fórmulas de #36).
- **Pasar a ingresos** (día o mes): un ingreso por día+plataforma (`sourceType=manual`, `needsReview=true`), pedidos marcados con `converted_income_id` para no contar dos veces. Aviso si ya hay liquidación importada ese mes; comparación «apuntado vs. liquidado» por plataforma.

## Burbuja flotante (solo app Android)
Pedidos → **Burbuja flotante (Android)**. En la web: «solo disponible en la app de Android» (una web no puede dibujar sobre otras apps).

- Plugin nativo Capacitor `LaboraBubble` (`android/app/src/main/java/app/labora/plus/bubble/`).
- `BubbleService`: foreground service `specialUse` con notificación fija «Jornada activa». Acciones:
  **«+ Aceptado»** (respuesta en línea: escribes el importe en la propia notificación; si hay borrador se sugiere su importe),
  **«+ Rechazado»** (rechazo rápido con la última plataforma) y **«Parar»**. Funcionan aunque la burbuja esté oculta
  (p. ej. si una app usa `HIDE_OVERLAY_WINDOWS`).
- Burbuja (`SYSTEM_ALERT_WINDOW`, `TYPE_APPLICATION_OVERLAY`): arrastrable, se pega al borde, muestra aceptados y € de hoy.
  Al tocarla abre un panel nativo: plataformas (solo texto, **sin logos**), importe, km, Aceptado/Rechazado, motivos, Guardar.
- Salvaguardas (LEGAL §2.3/§5.0): se inicia solo por acción del rider (botón o «Iniciar jornada» con la opción marcada);
  **«Terminar jornada» siempre la para**; **auto-parada tras 30 min sin interacción**; `START_NOT_STICKY` (el sistema no la
  rearranca en segundo plano); la burbuja se muestra **antes** de `startForeground` (regla de Android 15) y si el arranque en
  primer plano falla se retira y se para; apagar el módulo o cerrar sesión la paran. Antes de abrir el ajuste de superposición
  se muestra la pantalla explicativa («Continuar a Ajustes» / «Ahora no»).
- Guardado: `POST /rest/v1/delivery_orders` con el **JWT de la sesión del rider** (el web lo pasa al plugin; se guarda en
  `EncryptedSharedPreferences`). Solo access token: **no** se guarda refresh token ni existe service key. `user_id` lo pone
  la BD (`auth.uid()`), RLS owner-only. `id` uuid generado en el móvil → reintentos idempotentes (409 = ya estaba).
- Sin red o sesión caducada: **cola cifrada** en el móvil; se sube al volver la red, al guardar otro pedido o al abrir Labora+
  (que renueva la sesión y la pasa al plugin). Solo con la sesión del mismo usuario que lo guardó. «Pedidos» se recarga al subir.
- **Nunca**: AccessibilityService, capturas de pantalla, pulsar/aceptar ofertas, interactuar con las apps de las plataformas.

## Flavours Android: `play` y `labs`
| | `play` (Google Play) | `labs` (fuera de Play) |
|---|---|---|
| applicationId | `app.labora.plus` | `app.labora.plus.labs` («Labora+ Labs») |
| Burbuja + registro manual | Sí | Sí |
| `NotificationListenerService` | **No** (ni manifiesto ni código; CI lo comprueba con `aapt2` y en el dex) | Sí, `android:enabled="false"` hasta el consentimiento |

No hay flag remoto: el listener solo existe en el código fuente `android/app/src/labs/`. Build: `./gradlew assemblePlayDebug assembleLabsDebug`.

## Asistente de notificaciones (solo `labs`, opt-in, desactivado por defecto)
Decisión explícita de Lewis (27-09-2026), aceptando el riesgo.

- Lista blanca (paquetes verificados en Google Play el 27-09-2026): **por defecto solo** `com.ubercab.driver` (Uber Driver, app de
  repartidores de Uber Eats). **Glovo** (`com.logistics.rider.glovo`, `com.glovoapp.courier`) solo si el rider lo activa aparte, tras un
  aviso extra: en España los riders de Glovo son asalariados y sus normas de uso califican como falta muy grave usar su información
  para otros fines (posible despido disciplinario).
- Cualquier paquete fuera de la lista se descarta **antes** de leer extras. Solo se leen `EXTRA_TITLE` y `EXTRA_BIG_TEXT`/`EXTRA_TEXT`,
  se parsean en el dispositivo (`OfferParser`) y **se descartan en el acto**: el texto no se guarda en disco, no va a Logcat
  (no hay llamadas a `Log` en el listener), ni a crash reports, ni a la red.
- `OfferParser` saca importe (€) y km solo si son inequívocos; si hay varios valores sin palabra clave («total», «ganancia»…) o
  ninguno, deja el campo vacío. Tests con cadenas **sintéticas** `[MUESTRA]`; el formato real de las notificaciones no está verificado.
- El borrador (importe/km) vive **solo en memoria** 10 min; el rider revisa, elige Aceptado/Rechazado y pulsa Guardar. **Solo se suben
  los campos confirmados.** Nunca acepta ni rechaza por el rider; no responde, pulsa, descarta ni modifica notificaciones.
- Divulgación destacada (LEGAL §5.1) inmediatamente antes de abrir Ajustes; «Acepto, abrir ajustes» / «No, gracias»; atrás, fuera o
  Escape = no. Revocar: «Desactivar» (deshabilita el componente y borra borradores) + enlace a Acceso a notificaciones.
- Sideload en Android 13+: el usuario debe permitir «ajustes restringidos» en Información de la app para conceder el acceso.
- Pendiente antes de distribuir `labs`: EIPD/DPIA (LEGAL §3.1), cláusulas de privacidad (§5.2), verificación de desarrollador.

## Google Play (flavour `play`)
- FGS `specialUse`: el valor de `PROPERTY_SPECIAL_USE_FGS_SUBTYPE` del manifiesto es el de LEGAL §5.3; usar el texto de declaración,
  el impacto si se aplaza/interrumpe y el guion de vídeo de §5.3/§5.5.
- `SYSTEM_ALERT_WINDOW`: pantalla explicativa previa y `ACTION_MANAGE_OVERLAY_PERMISSION`; la función se anuncia en la ficha.
- Data safety: tabla de LEGAL §5.4 (importes/decisiones confirmados = recogidos, opcionales, no compartidos).
- Si algún día el listener va a Play (v1.1, solo Uber, pista cerrada) hace falta la divulgación, ficha actualizada y la EIPD; si Play
  lo rechaza, se queda en `labs`.

## Datos y privacidad
- Tablas `public.delivery_orders` y `public.user_module_settings` (migración `20260927095323_labora_delivery_orders_module`).
- **RLS owner-only** (select/insert/update/delete con `user_id = auth.uid()`). **La gestoría no tiene acceso**, ni lectura. Sin `anon`.
- La preferencia del módulo está en `user_module_settings` (owner-only) y **no** en `profiles`, porque `profiles` es legible por la gestoría vinculada.
- Sin analítica ni telemetría. Nada se comparte con Labora+ ni con terceros.
- En Android, la sesión (access token) y la cola offline se guardan cifradas (EncryptedSharedPreferences, `security-crypto` 1.1.0-alpha06; API marcada como obsoleta por Google pero funcional; migrar a Keystore + DataStore más adelante).
- Si el rider borra un ingreso creado desde pedidos, esos pedidos vuelven a estar disponibles para pasar.

## Futuro (NO construido): insights agregados con consentimiento
Posible opción **opt-in explícita** (desactivada por defecto, revocable en cualquier momento) para contribuir datos
**agregados y anonimizados** (p. ej. €/hora medio por ciudad y franja) y ver comparativas. Requisitos antes de construir:
base jurídica = consentimiento (RGPD art. 6.1.a / 7), minimización, agregación con umbral mínimo (k-anonimato),
sin identificadores ni ubicación precisa, DPIA, texto claro en la política de privacidad, y borrado al revocar.
Hoy **no** se recoge nada para Labora+.

## Investigación (fuentes públicas leídas el 2026-09-27)
Ver descripción del PR #37. Resumen: GigU y Para funcionan leyendo la pantalla/credenciales de la plataforma
(riesgo de cuenta; Para dejó de funcionar con DoorDash); Gridwise y Solo enlazan cuentas y agregan datos de la
comunidad; Stride es un tracker manual con start/stop. Adoptamos solo patrones honestos sin API: registro manual
rápido, jornada start/stop con €/h, €/km, neto tras gastos, motivos de rechazo, objetivo diario y tendencias semanales.
