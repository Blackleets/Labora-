# Labora+ · QA visual y funcional

Commit objetivo: `7d2abe9764f97ad9d855e356f79739994f97b9ca`

## Dirección visual

Paleta maestra:
- Verde firma: `#214E3A`
- Verde secundario: `#2F6B50`
- Terracota: `#D66C47`
- Ámbar: `#F1C56B`
- Marfil: `#F7F3EA`
- Tinta: `#1E231F`

Objetivo: una app calmada, premium y humana, diferenciada de los dashboards SaaS azules y de interfaces fiscales saturadas.

## QA Rider

1. Crear cuenta Rider con foto.
2. Confirmar que el login/registro se adapta a móvil sin scroll horizontal.
3. Revisar Inicio: hero verde, acciones rápidas, métricas y avisos.
4. Abrir menú lateral y comprobar agrupación de navegación.
5. Probar navegación inferior en móvil y estado activo.
6. Subir ticket real y revisar OCR, confianza y campos dudosos.
7. Repetir el mismo ticket exacto: debe bloquear duplicado.
8. Subir PDF multipágina y repetirlo: debe bloquear duplicado.
9. Vincular Rider a una Gestoría por correo.
10. Confirmar mensajes y peticiones entre ambas cuentas.

## QA Gestoría

1. Crear cuenta Gestoría con logo.
2. Vincular un Rider.
3. Revisar Resumen: cartera, pendientes y cliente activo.
4. Buscar cliente y cambiar cliente activo.
5. Validar/corregir un gasto.
6. Crear petición y confirmar recepción en Rider.
7. Revisar Modelos sin confundir cálculos estimativos con presentación AEAT.
8. Confirmar que solo aparecen clientes vinculados mediante `managerId`.

## Seguridad y verdad de producto

- No pedir ni almacenar credenciales bancarias.
- Banca permanece bloqueada hasta Open Banking PSD2 real.
- No simular conexiones de plataformas.
- No fabricar datos OCR si Gemini no está disponible.
- No marcar un gasto como AEAT solo porque la gestoría lo haya validado.
- Foto/logo y documentos permanecen en buckets privados.
- RLS debe aislar Rider y Gestoría correctamente.

## Criterio de merge

No fusionar a `main` hasta completar QA móvil con dos cuentas reales y confirmar que no hay desbordes, botones muertos, datos simulados ni aislamiento roto entre usuarios.
