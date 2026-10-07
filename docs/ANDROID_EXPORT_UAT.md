# Exportación de archivos — web y Android

Actualizado: 2026-10-07. Alcance: CSV de gastos, ingresos, trimestre, pedidos, km y jornadas; PDF trimestral. Conserva datos, filtros y formatos. Los adjuntos privados de Documents conservan su recorrido existente; este cambio no valida su descarga nativa.

## Contrato

- Web: enlace Blob y mensaje «Descarga solicitada al navegador». El navegador no proporciona confirmación de guardado.
- Android play/labs: plugin local LaboraFileExport → ACTION_CREATE_DOCUMENT → escribir/cerrar el stream → estado saved. La ubicación la elige el usuario. Cancelar devuelve cancelled sin mensaje de éxito/error.
- Se valida nombre, extensión/MIME CSV o PDF, Base64 y límite de 10 MiB. Bridge solo recibe bytes generados y nombre/tipo: nunca URL privada, JWT, credenciales o fetch nativo.
- Una operación nativa cada vez; una segunda recibe error visible. Error al abrir/escribir/cerrar no confirma guardado. Se intenta eliminar únicamente el archivo nuevo incompleto que creó el selector; un proveedor puede rechazar esa limpieza.
- Payload en memoria; se elimina Base64 de la llamada guardada. Si el proceso se pierde antes de guardar, no se reconstruye el archivo ni se afirma éxito: repetir la exportación.
- Sin permisos READ/WRITE_EXTERNAL_STORAGE, MANAGE_EXTERNAL_STORAGE ni acceso persistente a carpetas. Un APK anterior sin el plugin requiere actualizarlo.

## Evidencia automatizada

- 20 pruebas web/bridge: bytes UTF-8/BOM, PDF real con cabecera/EOF, espera de confirmación, cancelación, errores, plugin ausente, respuesta inválida, tamaño/formato y limpieza Blob web.
- 9 pruebas JVM: validación nativa y escritura real a streams, incluido fallo de write/close y proveedor nulo. CI compila y ejecuta ambas variantes Android, además de lint.
- Estas pruebas no equivalen a aceptación con un proveedor SAF o un Samsung físico.

## Prueba física pendiente

En APK del SHA de este PR, con datos QA controlados:

1. Exportar gastos/ingresos/PDF trimestral como Trabajador y pack CSV/PDF de un cliente vinculado como Gestoría. Elegir Descargas y comprobar nombre, contenido, BOM/acentos y filas/totales iguales a la pantalla/trimestre.
2. Abrir el CSV/PDF desde Files fuera de Labora+. Probar también exportación de pedidos, km y jornadas si están habilitados.
3. Cancelar el selector: seguir en Labora+, sin mensaje de guardado. Reintentar y guardar.
4. Repetir un nombre: el selector crea otro archivo, sin sobreescribir uno previo. Nunca usar un expediente real para pruebas de fallo.
5. Abrir selector y rotar/poner app en segundo plano. Probar recreación de actividad: si se pierde el payload, mostrar error y permitir reintentar, sin éxito falso.
6. Probar proveedor no disponible/sin espacio: no confirmar guardado; revisar si dejó salida parcial y si la limpieza pudo quitarla. Probar segundo toque durante una exportación.
7. Web: solicitar CSV/PDF; comprobar archivo descargado y mensaje «solicitada», incluidos reintento y error. Ninguna prueba de descarga da por validado el aislamiento de la consulta original.

Registrar fecha, SHA, variante, dispositivo/proveedor, caso y PASS/FAIL sin contenido personal. El cierre de UAT dual, correo de recuperación, descargas de adjuntos, firma/AAB y Play Console sigue independiente.

Referencias: https://developer.android.com/training/data-storage/shared/documents-files y https://capacitorjs.com/docs/plugins/android.
