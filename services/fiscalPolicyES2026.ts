export const FISCAL_POLICY_ES_2026 = {
  id: 'es-2026-v1',
  countryCode: 'ES',
  taxYear: 2026,
  verifiedAt: '2026-09-16',
  authority: 'Agencia Estatal de Administración Tributaria (AEAT)',
  sources: {
    model130: [
      'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G601.shtml',
      'https://sede.agenciatributaria.gob.es/Sede/impuestos-tasas/impuesto-sobre-renta-personas-fisicas/modelo-130-irpf______esionales-estimacion-directa-fraccionado_/instrucciones.html',
      'https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/guia-practica-cumplimentacion-modelo-censal-036/capitulo-07-irpf-is-irnr/irpf-modelo-036/pagos-fraccionados-irpf-actividades-economicas-propias.html',
    ],
    model303: [
      'https://sede.agenciatributaria.gob.es/Sede/empresarios-individuales-profesionales/contribuyentes-modulos/modelo-303.html',
      'https://sede.agenciatributaria.gob.es/Sede/iva/pre-303.html',
    ],
    vehicleVat: [
      'https://sede.agenciatributaria.gob.es/Sede/iva/que-iva-soportado-puedo-deducir/que-puedo-deducir.html',
    ],
  },
  model130: {
    standardPositiveNetRate: 0.20,
    requiredBeforeFinalAmount: [
      'Confirmar que la actividad está obligada a presentar Modelo 130.',
      'Confirmar régimen de estimación directa y circunstancias especiales.',
      'Registrar pagos fraccionados positivos de trimestres anteriores del mismo ejercicio.',
      'Registrar retenciones e ingresos a cuenta acumulados hasta fin del trimestre.',
      'Conocer territorio fiscal/circunstancias que puedan alterar el porcentaje aplicable.',
    ],
  },
  model303: {
    requiredBeforeFinalAmount: [
      'Registrar bases y cuotas de IVA repercutido del trimestre.',
      'Registrar IVA soportado con evidencia y revisión suficiente.',
      'Confirmar régimen de IVA y operaciones con tratamiento especial.',
      'Incorporar compensaciones, regularizaciones u otros ajustes que correspondan.',
    ],
  },
  vehicleVat: {
    rule: 'No asumir deducción automática del 100% para turismos, ciclomotores o motocicletas. La AEAT describe una presunción general del 50% salvo prueba de mayor afectación o supuestos específicos.',
  },
} as const;

export type FiscalPolicyES2026 = typeof FISCAL_POLICY_ES_2026;
