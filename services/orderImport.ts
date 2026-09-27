/**
 * Importación de pedidos desde un CSV exportado por el propio rider
 * (p. ej. «Descargar tus datos» de Uber o una respuesta RGPD de Glovo).
 *
 * Los nombres de columna de esas exportaciones no están documentados públicamente,
 * así que no se asume ningún formato: el rider elige qué columna es la fecha, el
 * importe, los km y el estado. Las sugerencias automáticas solo miran el nombre
 * de la cabecera y siempre se pueden cambiar.
 */
import { normalizePlatformKey, type OrderLogEntry, type OrderStatus } from './orderLog';

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 20000;

export interface ParsedCsv {
  header: string[];
  rows: string[][];
  delimiter: string;
}

const detectDelimiter = (firstLine: string) => {
  const candidates = [',', ';', '\t'];
  let best = ',';
  let bestCount = -1;
  for (const candidate of candidates) {
    let count = 0;
    let quoted = false;
    for (const char of firstLine) {
      if (char === '"') quoted = !quoted;
      else if (!quoted && char === candidate) count += 1;
    }
    if (count > bestCount) { best = candidate; bestCount = count; }
  }
  return best;
};

/** CSV con comillas, BOM, CRLF y separador , ; o tabulador. */
export const parseCsv = (input: string): ParsedCsv => {
  const text = input.replace(/^\uFEFF/, '');
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const delimiter = detectDelimiter(firstLine);
  const records: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') { cell += '"'; index += 1; } else quoted = false;
      } else cell += char;
      continue;
    }
    if (char === '"' && cell === '') quoted = true;
    else if (char === delimiter) { row.push(cell); cell = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell);
      records.push(row);
      row = [];
      cell = '';
    } else cell += char;
  }
  if (cell !== '' || row.length) { row.push(cell); records.push(row); }
  const nonEmpty = records.filter((record) => record.some((value) => value.trim() !== ''));
  const [header = [], ...rows] = nonEmpty;
  return { header: header.map((value) => value.trim()), rows, delimiter };
};

export type DateFormat = 'iso' | 'dmy' | 'mdy';
export type KmUnit = 'km' | 'mi';
export type StatusChoice = OrderStatus | 'skip';

export interface ColumnMapping {
  date: number | null;
  /** Columna de hora separada (opcional). */
  time: number | null;
  amount: number | null;
  km: number | null;
  status: number | null;
  /** Columna de plataforma (opcional). Si es null, se usa `fixedPlatform`. */
  platform: number | null;
}

const HEADER_HINTS: Record<keyof ColumnMapping, RegExp> = {
  date: /(fecha|date|timestamp|begin|start|inicio|request|pickup|recogida|created|dia\b|day\b)/i,
  time: /^(hora|time)$/i,
  amount: /(importe|amount|fare|earning|ganancia|ganado|pago|payout|payment|total|precio|price|net)/i,
  km: /(km|distan|kilomet|mile|milla)/i,
  status: /(estado|status|state|resultado|result)/i,
  platform: /(plataforma|platform|app|servicio|service|product)/i
};

/** Sugerencia por nombre de cabecera. Solo una pista: el rider la revisa. */
export const suggestMapping = (header: string[]): ColumnMapping => {
  const used = new Set<number>();
  const pick = (key: keyof ColumnMapping) => {
    const index = header.findIndex((name, position) => !used.has(position) && HEADER_HINTS[key].test(name));
    if (index < 0) return null;
    used.add(index);
    return index;
  };
  const time = pick('time');
  const date = pick('date');
  const status = pick('status');
  const km = pick('km');
  const amount = pick('amount');
  const platform = pick('platform');
  return { date, time, amount, km, status, platform };
};

const ACCEPTED_HINT = /(complet|entregad|deliver|finish|termin|accept|acept|done|success|paid|pagad)/i;
const REJECTED_HINT = /(reject|rechaz|declin|denied|deneg)/i;

/** Sugerencia para un valor de estado. Lo desconocido (p. ej. «cancelado») se ignora por defecto. */
export const suggestStatus = (value: string): StatusChoice => {
  if (REJECTED_HINT.test(value)) return 'rejected';
  if (ACCEPTED_HINT.test(value)) return 'accepted';
  return 'skip';
};

export const distinctValues = (rows: string[][], column: number, limit = 30) => {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = (row[column] || '').trim();
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([value, count]) => ({ value, count }));
};

const DATE_PARTS = /^(\d{1,4})[/.-](\d{1,2})[/.-](\d{1,4})(?:[ T,]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]\.?m\.?)?)?/i;

/** Formato de fecha más probable según las muestras; `ambiguous` si podría ser día/mes o mes/día. */
export const detectDateFormat = (samples: string[]): { format: DateFormat; ambiguous: boolean } => {
  let dmy = false;
  let mdy = false;
  let iso = false;
  for (const sample of samples) {
    const match = sample.trim().match(DATE_PARTS);
    if (!match) continue;
    if (match[1].length === 4) { iso = true; continue; }
    if (Number(match[1]) > 12) dmy = true;
    if (Number(match[2]) > 12) mdy = true;
  }
  if (iso && !dmy && !mdy) return { format: 'iso', ambiguous: false };
  if (dmy && !mdy) return { format: 'dmy', ambiguous: false };
  if (mdy && !dmy) return { format: 'mdy', ambiguous: false };
  return { format: 'dmy', ambiguous: true };
};

/** Fecha/hora local. Si el texto trae zona (Z o ±hh:mm) se respeta. */
export const parseDateTime = (dateRaw: string, timeRaw: string | undefined, format: DateFormat): Date | null => {
  const raw = `${dateRaw.trim()}${timeRaw && timeRaw.trim() ? ` ${timeRaw.trim()}` : ''}`;
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?\s*(Z|[+-]\d{2}:?\d{2})$/i.test(raw) || /\s(UTC|GMT)$/i.test(raw)) {
    const date = new Date(raw.replace(/\s*(UTC|GMT)$/i, 'Z').replace(/\s+(?=[+-]\d{2}:?\d{2}$|Z$)/i, '').replace(' ', 'T'));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const match = raw.match(DATE_PARTS);
  if (!match) return null;
  let year: number;
  let month: number;
  let day: number;
  if (match[1].length === 4 || format === 'iso') {
    [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else if (format === 'dmy') {
    [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else {
    [month, day, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  }
  if (year < 100) year += 2000;
  let hours = match[4] ? Number(match[4]) : 12;
  const minutes = match[5] ? Number(match[5]) : 0;
  const seconds = match[6] ? Number(match[6]) : 0;
  const meridiem = match[7]?.toLowerCase().replace(/\./g, '');
  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  if (month < 1 || month > 12 || day < 1 || day > 31 || hours > 23 || minutes > 59) return null;
  const date = new Date(year, month - 1, day, hours, minutes, seconds);
  if (date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
};

/** Importe en formato español o inglés («1.234,56», «1,234.56», «€4.50», «4,5 EUR»). */
export const parseAmount = (raw: string): number | null => {
  let cleaned = raw.trim().replace(/[€$£]|EUR|USD|GBP/gi, '').replace(/\s/g, '');
  if (!cleaned) return null;
  const negative = /^-|^\(.*\)$/.test(cleaned);
  cleaned = cleaned.replace(/^[-+(]|\)$/g, '');
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  if (lastComma >= 0 && lastDot >= 0) {
    cleaned = lastComma > lastDot ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned.replace(/,/g, '');
  } else if (lastComma >= 0) {
    cleaned = cleaned.replace(/,/g, (_, offset: number) => (offset === lastComma ? '.' : ''));
  }
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return negative ? -value : value;
};

export const MILES_TO_KM = 1.609344;

export interface ImportOptions {
  dateFormat: DateFormat;
  kmUnit: KmUnit;
  fixedPlatform: string;
  /** Valor de estado → elección. Sin columna de estado, todo cuenta como aceptado. */
  statusMap: Record<string, StatusChoice>;
  now?: Date;
}

export interface ImportCandidate {
  /** Número de línea en el archivo (1 = cabecera). */
  line: number;
  platform: string;
  occurredAt: string;
  status: OrderStatus;
  amount?: number;
  km?: number;
  cells: string[];
}

export interface ImportIssue { line: number; message: string }

export interface ImportBuild {
  candidates: ImportCandidate[];
  errors: ImportIssue[];
  /** Filas con un estado marcado como «ignorar». */
  skipped: number;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

export const buildImportRows = (parsed: ParsedCsv, mapping: ColumnMapping, options: ImportOptions): ImportBuild => {
  const candidates: ImportCandidate[] = [];
  const errors: ImportIssue[] = [];
  let skipped = 0;
  const now = options.now || new Date();
  if (mapping.date === null) return { candidates, errors: [{ line: 1, message: 'Elige la columna de fecha.' }], skipped };
  parsed.rows.slice(0, MAX_IMPORT_ROWS).forEach((cells, index) => {
    const line = index + 2;
    const cell = (column: number | null) => (column === null ? '' : (cells[column] || '').trim());
    let status: OrderStatus = 'accepted';
    if (mapping.status !== null) {
      const choice = options.statusMap[cell(mapping.status)] ?? 'skip';
      if (choice === 'skip') { skipped += 1; return; }
      status = choice;
    }
    const platform = (mapping.platform !== null ? cell(mapping.platform) : '') || options.fixedPlatform.trim();
    if (!platform) { errors.push({ line, message: 'Sin plataforma.' }); return; }
    if (platform.length > 60) { errors.push({ line, message: 'Nombre de plataforma demasiado largo.' }); return; }
    const date = parseDateTime(cell(mapping.date), mapping.time !== null ? cell(mapping.time) : undefined, options.dateFormat);
    if (!date) { errors.push({ line, message: `Fecha no reconocida: «${cell(mapping.date).slice(0, 40)}».` }); return; }
    if (date.getTime() > now.getTime() + 10 * 60_000) { errors.push({ line, message: 'Fecha en el futuro.' }); return; }
    let amount: number | undefined;
    if (mapping.amount !== null && cell(mapping.amount) !== '') {
      const parsedAmount = parseAmount(cell(mapping.amount));
      if (parsedAmount === null) { errors.push({ line, message: `Importe no reconocido: «${cell(mapping.amount).slice(0, 20)}».` }); return; }
      if (parsedAmount < 0 || parsedAmount > 10000) { errors.push({ line, message: 'Importe negativo o mayor de 10.000 (ajustes, propinas negativas…): no se importa.' }); return; }
      amount = round2(parsedAmount);
    }
    if (status === 'accepted' && amount === undefined) { errors.push({ line, message: 'Pedido aceptado sin importe.' }); return; }
    let km: number | undefined;
    if (mapping.km !== null && cell(mapping.km) !== '') {
      const parsedKm = parseAmount(cell(mapping.km));
      if (parsedKm === null) { errors.push({ line, message: `Distancia no reconocida: «${cell(mapping.km).slice(0, 20)}».` }); return; }
      const value = options.kmUnit === 'mi' ? parsedKm * MILES_TO_KM : parsedKm;
      if (value < 0 || value > 1000) { errors.push({ line, message: 'Distancia fuera de rango (0–1.000 km).' }); return; }
      km = Math.round(value * 100) / 100;
    }
    candidates.push({ line, platform, occurredAt: date.toISOString(), status, amount, km, cells });
  });
  if (parsed.rows.length > MAX_IMPORT_ROWS) errors.push({ line: MAX_IMPORT_ROWS + 2, message: `Solo se leen las primeras ${MAX_IMPORT_ROWS} filas.` });
  return { candidates, errors, skipped };
};

const toHex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');

/** Huella SHA-256 de la fila original + plataforma: la misma fila no se importa dos veces. */
export const importRef = async (candidate: ImportCandidate) => {
  const payload = `${normalizePlatformKey(candidate.platform)}\u001f${candidate.cells.map((value) => value.trim()).join('\u001f')}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  return toHex(digest);
};

export interface ReconcileMatch { candidate: ImportCandidate; existing: OrderLogEntry; minutesApart: number }

export interface ReconcileResult {
  fresh: ImportCandidate[];
  /** Ya importadas antes (misma huella). */
  alreadyImported: ImportCandidate[];
  /** Coinciden con un pedido apuntado a mano (misma plataforma, estado e importe, ±tolerancia). */
  manualMatches: ReconcileMatch[];
}

/**
 * Cruza las filas del CSV con tu registro. Cada pedido manual casa como mucho con una fila
 * (la más cercana en el tiempo). No borra ni cambia nada: solo propone.
 */
export const reconcileImport = (
  candidates: ImportCandidate[],
  refs: string[],
  existing: OrderLogEntry[],
  toleranceMinutes = 10
): ReconcileResult => {
  const knownRefs = new Set(existing.map((order) => order.importRef).filter(Boolean));
  const manual = existing.filter((order) => order.source !== 'import');
  const usedManual = new Set<string>();
  const seenRefs = new Set<string>();
  const result: ReconcileResult = { fresh: [], alreadyImported: [], manualMatches: [] };
  candidates.forEach((candidate, index) => {
    const ref = refs[index];
    if (knownRefs.has(ref) || seenRefs.has(ref)) { result.alreadyImported.push(candidate); return; }
    seenRefs.add(ref);
    const time = new Date(candidate.occurredAt).getTime();
    const key = normalizePlatformKey(candidate.platform);
    let best: { order: OrderLogEntry; diff: number } | null = null;
    for (const order of manual) {
      if (usedManual.has(order.id) || order.status !== candidate.status || normalizePlatformKey(order.platform) !== key) continue;
      if (candidate.amount !== undefined && order.amount !== undefined && Math.abs(candidate.amount - order.amount) > 0.01) continue;
      const diff = Math.abs(new Date(order.occurredAt).getTime() - time) / 60_000;
      if (diff > toleranceMinutes) continue;
      if (!best || diff < best.diff) best = { order, diff };
    }
    if (best) {
      usedManual.add(best.order.id);
      result.manualMatches.push({ candidate, existing: best.order, minutesApart: Math.round(best.diff) });
    } else {
      result.fresh.push(candidate);
    }
  });
  return result;
};
