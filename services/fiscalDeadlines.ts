/**
 * Plazos oficiales AEAT (España) para los modelos trimestrales 130 y 303.
 *
 * Fuente única: Agencia Tributaria — «Plazos de presentación de autoliquidaciones
 * con domiciliación bancaria», calendario del contribuyente 2026:
 * https://sede.agenciatributaria.gob.es/Sede/ayuda/calendario-contribuyente/calendario-contribuyente-2026/plazos-presentacion-autoliquidaciones-domiciliacion-bancaria.html
 *
 * Solo se incluyen fechas publicadas por la AEAT. No se calculan fechas futuras:
 * si el último día es inhábil la AEAT traslada el plazo, y eso depende de su
 * calendario anual. Periodos sin fecha publicada devuelven `verified: false`.
 * México: pendiente de fuente oficial SAT — no se muestran fechas.
 */

export const AEAT_CALENDAR_SOURCE_URL =
  'https://sede.agenciatributaria.gob.es/Sede/ayuda/calendario-contribuyente/calendario-contribuyente-2026/plazos-presentacion-autoliquidaciones-domiciliacion-bancaria.html';

export interface QuarterlyDeadline {
  /** Periodo declarado, p. ej. «3T 2026». */
  quarter: string;
  models: Array<'130' | '303'>;
  /** Primer día de presentación (YYYY-MM-DD). */
  opensOn: string;
  /** Último día para presentar con domiciliación bancaria (YYYY-MM-DD). */
  directDebitUntil: string;
  /** Último día del plazo general de presentación (YYYY-MM-DD). */
  filingUntil: string;
}

/** Fechas copiadas literalmente de la tabla AEAT 2026 (modelos 130 y 303, obligación trimestral). */
export const AEAT_130_303_DEADLINES: readonly QuarterlyDeadline[] = [
  { quarter: '4T 2025', models: ['130', '303'], opensOn: '2026-01-01', directDebitUntil: '2026-01-27', filingUntil: '2026-01-30' },
  { quarter: '1T 2026', models: ['130', '303'], opensOn: '2026-04-01', directDebitUntil: '2026-04-15', filingUntil: '2026-04-20' },
  { quarter: '2T 2026', models: ['130', '303'], opensOn: '2026-07-01', directDebitUntil: '2026-07-15', filingUntil: '2026-07-20' },
  { quarter: '3T 2026', models: ['130', '303'], opensOn: '2026-10-01', directDebitUntil: '2026-10-15', filingUntil: '2026-10-20' }
];

export type DeadlinePhase = 'upcoming' | 'open' | 'direct_debit_closed';

export type NextDeadlineResult =
  | { verified: true; deadline: QuarterlyDeadline; phase: DeadlinePhase; daysToFilingEnd: number; daysToDirectDebitEnd: number }
  | { verified: false; quarter: string; reason: 'not_published' | 'country_pending' };

const pad = (value: number) => String(value).padStart(2, '0');

/** Fecha local YYYY-MM-DD (sin UTC, para no cambiar de día cerca de medianoche). */
export const toLocalDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const dayNumber = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return Math.round(Date.UTC(year, month - 1, day) / 86_400_000);
};

export const daysBetween = (fromKey: string, toKey: string) => dayNumber(toKey) - dayNumber(fromKey);

/**
 * Trimestre cuyo plazo general (regla: 1–20 abr/jul/oct, 1–30 ene) es el siguiente.
 * Solo sirve como etiqueta cuando la fecha exacta aún no está publicada.
 */
export const quarterDueAfter = (todayKey: string): string => {
  const [year, month, day] = todayKey.split('-').map(Number);
  const currentQuarter = Math.floor((month - 1) / 3) + 1;
  const isFilingMonth = (month - 1) % 3 === 0;
  const generalLastDay = month === 1 ? 30 : 20;
  if (isFilingMonth && day <= generalLastDay) {
    return currentQuarter === 1 ? `4T ${year - 1}` : `${currentQuarter - 1}T ${year}`;
  }
  return `${currentQuarter}T ${year}`;
};

/**
 * Próximo plazo 130/303 respecto a `today`. Devuelve `verified: false` si la AEAT
 * no ha publicado aún la fecha en la tabla incluida o si el país no es España.
 */
export const getNextAeatDeadline = (today: Date, countryCode: string): NextDeadlineResult => {
  const todayKey = toLocalDateKey(today);
  if (countryCode !== 'ES') {
    return { verified: false, quarter: '', reason: 'country_pending' };
  }

  const next = AEAT_130_303_DEADLINES.find((deadline) => deadline.filingUntil >= todayKey);
  if (!next) {
    return { verified: false, quarter: quarterDueAfter(todayKey), reason: 'not_published' };
  }

  const phase: DeadlinePhase = todayKey < next.opensOn
    ? 'upcoming'
    : todayKey <= next.directDebitUntil
      ? 'open'
      : 'direct_debit_closed';

  return {
    verified: true,
    deadline: next,
    phase,
    daysToFilingEnd: daysBetween(todayKey, next.filingUntil),
    daysToDirectDebitEnd: daysBetween(todayKey, next.directDebitUntil)
  };
};

const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** «20 de octubre de 2026» */
export const formatDateEs = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return `${day} de ${MONTHS_ES[month - 1]} de ${year}`;
};
