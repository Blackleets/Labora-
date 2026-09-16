# Labora+ — E2E Test Runbook

## Estado de esta rama

Rama: `feat/labora-e2e-ready`

Objetivo: validar de punta a punta la experiencia de las dos partes principales de Labora+ sin tocar producción:

- Rider / autónomo
- Gestor / asesoría

La aplicación compila con TypeScript y Vite mediante GitHub Actions.

## Alcance de la prueba

Este MVP permite probar en un mismo navegador el flujo compartido Rider ↔ Gestor. Los estados se conservan en `localStorage`, por lo que al cambiar de perfil ambos lados ven el mismo conjunto de datos.

Esta rama NO representa todavía un sistema multiusuario de producción entre dispositivos distintos. Para eso harán falta autenticación real y persistencia remota.

## Prueba crítica A — Gestor solicita documentación

1. Abre Labora+.
2. Cambia al perfil **Gestor** desde el selector superior o lateral.
3. Entra en **Peticiones a Riders**.
4. Pulsa **Nuevo Requerimiento**.
5. Selecciona un Rider, escribe título, descripción, categoría y fecha límite.
6. Guarda la petición.
7. Confirma que aparece con estado **Pendiente**.

Resultado esperado: el requerimiento queda guardado y asociado al Rider elegido.

## Prueba crítica B — Rider responde con justificante

1. Cambia al perfil **Rider**.
2. Entra en **Avisos de mi Gestor**.
3. Localiza la petición creada en la prueba A.
4. Pulsa **Subir Justificante**.
5. Adjunta un archivo de prueba y añade una nota.
6. Envía la subsanación.

Resultado esperado: la petición cambia a **En Revisión del Gestor** y conserva nota/justificante.

## Prueba crítica C — Gestor valida

1. Cambia de nuevo al perfil **Gestor**.
2. Entra en **Peticiones a Riders** → **Enviados**.
3. Localiza la petición respondida.
4. Pulsa **Aprobar y Archivar**.

Resultado esperado: la petición pasa a **Resuelto / Auditado**.

## Prueba crítica D — Mensajería en ambas direcciones

1. Como **Rider**, abre **Mensajes con mi Gestor**.
2. Envía un mensaje al gestor asignado.
3. Cambia a **Gestor**.
4. Abre **Comunicaciones** y selecciona ese Rider.
5. Confirma que aparece el mensaje y responde.
6. Vuelve al perfil Rider y abre de nuevo la conversación.

Resultado esperado: ambos perfiles ven el mismo hilo y cada mensaje identifica remitente y destinatario.

## Prueba crítica E — Finanzas y revisión fiscal

### Rider

1. Abre **Gastos & Ingresos**.
2. Registra o revisa un gasto/ticket.
3. Abre **Modelos AEAT (130/303)**.
4. Comprueba que la vista carga sin errores y permite revisar el trimestre.

### Gestor

1. Cambia a **Gestor**.
2. Abre **Auditoría & Facturación**.
3. Revisa los gastos del Rider.
4. Abre **Modelos AEAT (130/303)**.

Resultado esperado: las dos vistas consumen el mismo estado fiscal de demostración y no rompen la navegación.

## Prueba crítica F — Persistencia local

1. Realiza al menos una petición, un mensaje o un cambio de estado.
2. Recarga la página.
3. Vuelve al mismo perfil.

Resultado esperado: el cambio continúa visible porque el MVP persiste los datos demo en `localStorage`.

## Criterios de PASS

La rama se considera lista para evaluación manual cuando:

- TypeScript pasa sin errores.
- `vite build` termina correctamente.
- Gestor puede crear una petición.
- Rider puede recibirla y enviar justificante.
- Gestor puede aprobarla.
- Rider y Gestor pueden intercambiar mensajes internos.
- El cambio de perfil no pierde el estado compartido.
- Modelos AEAT y finanzas cargan sin romper la aplicación.
- No se habilita ninguna acción que pretenda ser una presentación real ante AEAT.

## Límites conocidos antes de producción

- La autenticación actual es de demostración, no autenticación segura de producción.
- Los datos compartidos viven en el navegador; dos teléfonos distintos todavía no sincronizan entre sí.
- La mensajería es local al entorno demo; no es tiempo real entre dispositivos.
- El asistente Gemini funciona con fallback si no hay clave configurada; no debe colocarse una clave privada sensible directamente en el cliente.
- Los cálculos y textos fiscales deben tratarse como apoyo de preparación y validarse con normativa vigente y un profesional antes de uso real.

## Recomendación para probar

Usar esta rama y realizar las pruebas A → F en orden antes de fusionar a `main` o conectar un despliegue público.