# Marcas de tickets

La marca se deriva del campo `merchant` para presentación y filtrado, sin alterar el nombre guardado, categoría, IVA, deducibilidad ni estado de revisión. La captura de repostaje conserva el comercio completo leído por OCR, incluida la ubicación/razón social; el usuario debe confirmarlo.

- 17 identidades locales: Repsol, Cepsa, Moeve, BP, Shell, Galp, Petroprix, Plenoil, Plenergy, Ballenoil, Carrefour, Alcampo/Auchan, McDonald's, Burger King, KFC, Starbucks y Taco Bell.
- Moeve/Cepsa y Plenergy/Plenoil comparten filtro, conservando su imagen histórica según el nombre. Sucursales de una marca se agrupan; comercios desconocidos conservan agrupación por su nombre. Sin comercio tiene una opción explícita.
- Coincidencias por palabras completas con normalización de acentos/puntuación. Marcas de familias distintas en el mismo nombre son ambiguas y no se identifican. No se consulta ninguna API de logos con nombres de tickets. No se infiere marca desde notas ni categoría.
- Filtros combinables con búsqueda, cliente, fecha, categoría y estado; opciones construidas exclusivamente desde gastos ya cargados y acotados al rol/fechas. No amplían acceso a datos.
- Imágenes incluidas en web, Pages y Android. Ante error se conserva el icono de categoría o unas iniciales; una identidad nueva reinicia el estado de imagen por clave React.
- Plataformas: Glovo, Uber, Uber Eats, Just Eat, Cabify y Bolt tienen respaldos locales verificables; se elimina el pictograma inventado de Bolt Food. Se conserva el catálogo y la cadena inline/CDN/local/favicon/iniciales; no se añaden conexiones OAuth.

## Procedencia

`public/brand/asset-provenance.json` registra fuente, tipo, hash SHA-256 y versión de Simple Icons cuando corresponde. Activos oficiales copiados sin modificar; BP y Ballenoil usan iconos publicados por sus aplicaciones oficiales. Simple Icons 16.33.0 conserva geometría upstream y su color de marca (CC0; las marcas pertenecen a sus titulares). No implica asociación ni aprobación.

La galería pública `merchant-logos-preview.html` permite revisar estos archivos sin entrar en una cuenta. Es un catálogo sin tickets ni datos de usuarios; no acredita el recorrido real autenticado.

## Aceptación pendiente en cuenta real

1. Crear/abrir gastos con comercio reconocido y desconocido; comprobar nombre original, foto e importe tras recargar.
2. Filtrar por una marca, combinar categoría/estado/cliente, limpiar filtros y comprobar el contador.
3. Leer un ticket real de combustible y confirmar que ubicación/razón social se conserva.
4. Repetir desde la Gestoría vinculada y verificar aislamiento con una cuenta ajena.
5. Revisar a 360/390/430px y en Samsung físico; comprobar logos en el APK sin conexión a servicios de logos.

Rollback: revertir el PR frontend. No requiere migración, cambio de RLS ni despliegue de Edge Functions.
