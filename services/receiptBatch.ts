/**
 * Subida de varios tickets a la vez: validación y anti-duplicados por SHA-256.
 * El mismo archivo exacto no se registra dos veces (ni contra lo ya guardado ni dentro del lote).
 * La base de datos tiene además un índice único (user_id, receipt_hash) como red de seguridad.
 */
export const RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_RECEIPT_BYTES = 12 * 1024 * 1024;
export const MAX_BATCH_FILES = 20;
export const MAX_BATCH_BYTES = 80 * 1024 * 1024;

export type BatchFileStatus = 'ready' | 'duplicate_existing' | 'duplicate_batch' | 'bad_type' | 'too_big' | 'over_limit';

export interface BatchFileInfo {
  name: string;
  size: number;
  type: string;
  /** SHA-256 en hex; undefined si no se calculó (tipo/tamaño no válido). */
  hash?: string;
}

export const BATCH_STATUS_LABELS: Record<BatchFileStatus, string> = {
  ready: 'Listo',
  duplicate_existing: 'Ya registrado: este ticket exacto ya está en tus gastos',
  duplicate_batch: 'Repetido en esta selección',
  bad_type: 'Formato no admitido (usa JPG, PNG o WebP; los PDF van en Documentos)',
  too_big: 'Supera 12 MB',
  over_limit: `Máximo ${MAX_BATCH_FILES} tickets o 80 MB por lote`
};

/** Pre-validación sin leer el contenido (tipo, tamaño y límite del lote). */
export const precheckFile = (file: Pick<BatchFileInfo, 'type' | 'size'>, index: number, bytesBefore: number): BatchFileStatus | null => {
  if (index >= MAX_BATCH_FILES || bytesBefore + file.size > MAX_BATCH_BYTES) return 'over_limit';
  if (!RECEIPT_TYPES.includes(file.type)) return 'bad_type';
  if (file.size > MAX_RECEIPT_BYTES) return 'too_big';
  return null;
};

/** Estado de cada archivo tras calcular su huella. */
export const classifyBatch = (files: BatchFileInfo[], existingHashes: Set<string>): BatchFileStatus[] => {
  const seen = new Set<string>();
  let bytes = 0;
  return files.map((file, index) => {
    const pre = precheckFile(file, index, bytes);
    bytes += file.size;
    if (pre) return pre;
    if (!file.hash) return 'bad_type';
    if (existingHashes.has(file.hash)) return 'duplicate_existing';
    if (seen.has(file.hash)) return 'duplicate_batch';
    seen.add(file.hash);
    return 'ready';
  });
};

export interface BatchDraft {
  date: string;
  amount: string;
  category: string;
  merchant: string;
}

const parseAmount = (raw: string) => {
  const value = Number(raw.trim().replace(/\s|€/g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : Number.NaN;
};

/** Error de un borrador o null si se puede guardar. Mismos requisitos que el alta manual. */
export const validateDraft = (draft: BatchDraft, todayKey: string): string | null => {
  const amount = parseAmount(draft.amount);
  if (!draft.amount.trim() || !Number.isFinite(amount) || amount <= 0) return 'Falta el importe.';
  if (amount > 100000) return 'Importe demasiado alto.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) return 'Falta la fecha.';
  if (draft.date > todayKey) return 'La fecha no puede ser futura.';
  if (!draft.category) return 'Falta la categoría.';
  return null;
};

export const draftAmount = (draft: BatchDraft) => Math.round(parseAmount(draft.amount) * 100) / 100;

export const sha256Hex = async (buffer: ArrayBuffer) => {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};
