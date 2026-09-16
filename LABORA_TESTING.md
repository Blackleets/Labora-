# Labora+ — Product QA Runbook

## Rama

`feat/labora-e2e-ready`

## Objetivo

Validar Labora+ con dos cuentas reales separadas:

- Autónomo / Rider
- Gestoría

La autenticación, perfiles, vínculo entre ambas partes, identidad, mensajería y sincronización operativa usan Supabase Auth, RLS, Storage y Realtime.

## 1. Crear Gestoría

1. Abre la preview.
2. Pulsa **Crear cuenta**.
3. Selecciona **Gestoría**.
4. Introduce nombre, correo y contraseña de al menos 8 caracteres.
5. En el segundo paso sube un logo o imagen del despacho.
6. Completa nombre comercial y, si aplica, número de colegiado.
7. Confirma el correo si Supabase lo solicita.
8. Inicia sesión.
9. En **Perfil y ajustes**, copia el correo de la gestoría que aparece en “Vincular clientes”.

Resultado esperado: la gestoría entra con su propia sesión y no tiene clientes hasta que un autónomo la vincule.

## 2. Crear Autónomo en otro navegador/dispositivo

1. Usa otro navegador, perfil incógnito o dispositivo.
2. Crea una cuenta **Autónomo**.
3. Sube una foto de perfil.
4. Completa matrícula si quieres.
5. Confirma el correo si se solicita e inicia sesión.
6. Abre **Perfil y ajustes**.
7. En **Mi gestoría**, introduce el correo de la cuenta Gestoría creada en el paso 1.
8. Pulsa **Vincular**.

Resultado esperado: el autónomo ve la gestoría vinculada y la gestoría ve a ese autónomo como cliente. Ninguna gestoría debe ver riders no vinculados.

## 3. Probar gastos y justificantes

1. Como Autónomo abre **Ingresos y gastos**.
2. Escanea una imagen de ticket o añade un gasto manual.
3. Guarda el movimiento.
4. Espera unos segundos o abre la app Gestoría.
5. Como Gestoría entra en **Auditoría** y selecciona el cliente.
6. Valida o solicita corrección.

Resultado esperado: el gasto se sincroniza mediante Supabase. El estado aprobado debe mostrarse como **Validado · Gestoría**, no como “AEAT”.

Los justificantes se almacenan en el bucket privado `labora-documents`; solo el propietario y su gestoría vinculada tienen acceso según RLS.

## 4. Probar peticiones

1. Como Gestoría crea una nueva petición para el cliente.
2. Como Autónomo abre **Avisos**.
3. Responde/sube el justificante disponible en el flujo actual.
4. Vuelve a Gestoría y revisa la petición.

Resultado esperado: ambas cuentas trabajan sobre el mismo registro remoto.

## 5. Probar mensajes en dos dispositivos

1. Como Autónomo abre **Mensajes** y escribe a su gestoría.
2. Mantén abierta la cuenta Gestoría en otro dispositivo.
3. Abre **Mensajes**.
4. Responde desde Gestoría.

Resultado esperado: la conversación se persiste en Supabase `messages` y Realtime refresca los cambios.

## 6. Probar identidad

Comprobar que foto/logo aparece en:

- header;
- menú lateral;
- navegación móvil en Perfil/Ajustes;
- Clientes;
- Mensajes.

Cambiar la imagen desde **Perfil y ajustes**, guardar y volver a entrar.

## 7. Bancos

La conexión bancaria real está deshabilitada actualmente.

Labora+ NO debe:

- pedir usuario o contraseña bancaria;
- mostrar una conexión ficticia como activa;
- simular movimientos de un banco real.

La UI debe indicar **Próximamente / Open Banking**. La futura integración deberá usar un proveedor regulado PSD2, consentimiento explícito y comenzar en modo de solo lectura.

## 8. Plataformas

En Delivery/Movilidad, “Añadir a mi actividad” significa únicamente clasificar qué plataforma usa el autónomo. No significa OAuth ni sincronización automática.

En Bancos/Pagos/Contabilidad los botones deben permanecer deshabilitados hasta que exista una API real.

## 9. Build

Antes de mergear deben pasar:

- `npm install`
- `npx tsc --noEmit`
- `npm run build`

## Límites que siguen abiertos

- Los logos de terceros se resuelven actualmente por dominio mediante un proveedor de logos/fallback; todavía no existe un paquete local auditado de brand assets oficiales para todas las marcas.
- El escáner de gastos acepta imágenes; soporte PDF/multipágina y detección de duplicados quedan para la siguiente iteración.
- No existe todavía una integración bancaria PSD2 real; está intencionadamente bloqueada.

## Regla de merge

No fusionar a `main` hasta completar el flujo Gestoría → Autónomo → vínculo → gasto/petición → mensaje desde dos sesiones separadas.
