# Labora+ — expansión global sin inventar datos

Fecha: 2026-09-27

## Principio

Labora+ puede admitir usuarios de muchos países antes de tener fiscalidad automatizada para todos ellos. **Seleccionar un país no equivale a afirmar que Labora+ conoce sus impuestos, tarifas de plataformas, bancos, seguridad social o reglas laborales.**

## Dos niveles de soporte

### 1. País configurado por compatibilidad

España, México y Estados Unidos conservan configuraciones legacy porque existen funcionalidades históricas que las referencian. Estas configuraciones **no habilitan cálculos automáticos** en el motor `pricingEngine`.

### 2. País `localization_only`

El usuario puede seleccionar el país y Labora+ puede usar su código ISO, nombre y moneda para perfil y presentación. Estos perfiles llevan deliberadamente:

- tarifas = 0;
- IVA/impuestos = 0;
- tramos fiscales vacíos;
- plataformas vacías;
- bancos vacíos;
- eventos/ciudades/benchmarks vacíos;
- asesor fiscal en estado «No configurado».

No se hereda información de España ni de ningún otro país.

## Gate para activar fiscalidad o pricing de un país

Antes de añadir un código a `VERIFIED_AUTOMATIC_CALCULATION_CODES` debe existir un pack versionado con:

1. fuentes primarias oficiales;
2. fecha de vigencia y jurisdicción exacta;
3. distinción entre autónomo, empleado y otros regímenes relevantes;
4. reglas de IVA/retenciones/seguridad social explícitas;
5. supuestos y casos no soportados visibles en UI;
6. tests de regresión con ejemplos documentados;
7. revisión humana antes de publicar;
8. estrategia de caducidad: al vencer la norma, el pack vuelve a fail-closed.

## UX global

- Las banderas se generan desde el ISO-2; no existe una lista manual limitada a ES/MX/US.
- El selector busca por nombre, código y moneda.
- La moneda puede usarse para presentación sin activar asesoramiento fiscal.
- Si no existe pack fiscal verificado, la app debe mostrar «no disponible» o remitir a fuentes oficiales/gestoría; nunca completar huecos con estimaciones inventadas.

## Siguiente fase

1. Extraer los datos legacy de `modules/country-config/types.ts` a packs versionados independientes.
2. Crear el primer `verified fiscal pack` empezando por España y solo con fuentes oficiales vigentes.
3. Internacionalizar las superficies principales por namespaces y persistir idioma por usuario.
4. Sustituir etiquetas españolas específicas (`NIF`, `IVA`, «gestoría») por vocabulario dependiente de jurisdicción cuando proceda.
5. Mantener fiscalidad de cada país detrás de capability flags y tests.

## Regla de producto

**Global primero en identidad, moneda, idioma y flujo de trabajo; fiscalidad solo cuando esté verificada.**
