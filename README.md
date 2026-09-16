# Labora+

Labora+ organiza la actividad de autónomos y su relación con gestorías: ingresos, gastos, justificantes, modelos fiscales, peticiones y mensajería.

## Estado actual

La rama `feat/labora-e2e-ready` conecta:

- Supabase Auth para sesiones reales;
- RLS para aislamiento de datos;
- vínculo Autónomo ↔ Gestoría por correo;
- Storage privado para identidad y justificantes;
- Realtime para mensajes y cambios operativos;
- carga de foto para autónomos y logo/imagen para gestorías.

## Integraciones externas

Labora+ diferencia entre **usar una plataforma** y **tener una integración API real**.

- Delivery/Movilidad: una plataforma puede añadirse al perfil para clasificar actividad; esto no implica sincronización automática.
- Bancos: la conexión real permanece deshabilitada hasta integrar un proveedor Open Banking regulado PSD2. Labora+ no debe pedir ni guardar contraseñas bancarias.
- Pagos/Contabilidad: permanecen como catálogo hasta disponer de OAuth/API real.
- Logos de terceros: actualmente se resuelven por dominio y no se consideran todavía un paquete auditado de assets oficiales. Para afirmar que un logo es oficial debe verificarse y almacenarse desde el brand kit correspondiente.

## Seguridad

Los buckets `labora-identity` y `labora-documents` son privados. Las tablas operativas utilizan Row Level Security. El Security Advisor de Supabase no reporta avisos en el estado actual del esquema.

## QA

Consulta `LABORA_TESTING.md` para probar el flujo completo con dos cuentas y dispositivos separados.
