# Registro de pedidos (módulo opcional)

**Estado:** en `main` desde 2026-09-27. Solo autónomos. **Desactivado por defecto.**

## Qué es
El rider apunta a mano cada pedido (plataforma, importe, aceptado/rechazado + motivo, km, nota, hora).
Labora+ **no** usa APIs de plataformas, **no** lee notificaciones ni la pantalla (Accessibility) y **no**
automatiza cuentas de Uber/Glovo/Just Eat. Eso mantiene la cuenta del rider fuera de riesgo.

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

## Datos y privacidad
- Tablas `public.delivery_orders` y `public.user_module_settings` (migración `20260927095323_labora_delivery_orders_module`).
- **RLS owner-only** (select/insert/update/delete con `user_id = auth.uid()`). **La gestoría no tiene acceso**, ni lectura. Sin `anon`.
- La preferencia del módulo está en `user_module_settings` (owner-only) y **no** en `profiles`, porque `profiles` es legible por la gestoría vinculada.
- Sin analítica ni telemetría. Nada se comparte con Labora+ ni con terceros.
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
