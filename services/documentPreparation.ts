export type PreparedDocumentFile = {
  name: string; dataUrl: string; mimeType: string; sizeBytes: number; contentHash: string;
};

const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_BYTES = 15 * 1024 * 1024;

const readDataUrl = (file: File, signal: AbortSignal) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  const cleanup = () => { signal.removeEventListener('abort', abort); reader.onload = null; reader.onerror = null; reader.onabort = null; };
  const abort = () => { cleanup(); reader.abort(); reject(new DOMException('Lectura cancelada.', 'AbortError')); };
  reader.onload = () => {
    const result = reader.result;
    cleanup();
    typeof result === 'string' ? resolve(result) : reject(new Error('No se pudo leer el archivo.'));
  };
  reader.onerror = () => { const error = reader.error; cleanup(); reject(error || new Error('No se pudo leer el archivo.')); };
  reader.onabort = () => { cleanup(); reject(new DOMException('Lectura cancelada.', 'AbortError')); };
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) { abort(); return; }
  reader.readAsDataURL(file);
});

export const prepareDocumentFile = async (file: File, signal: AbortSignal, isDuplicate: (hash: string) => boolean): Promise<PreparedDocumentFile | null> => {
  if (signal.aborted) return null;
  if (!ALLOWED_TYPES.has(file.type)) throw new Error('Formato no admitido. Usa PDF, JPG, PNG o WebP.');
  if (file.size > MAX_FILE_BYTES) throw new Error('El archivo supera el límite de 15 MB.');
  const buffer = await file.arrayBuffer();
  if (signal.aborted) return null;
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  if (signal.aborted) return null;
  const contentHash = Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
  if (isDuplicate(contentHash)) throw new Error('Este archivo ya existe en tu expediente.');
  try {
    const dataUrl = await readDataUrl(file, signal);
    return signal.aborted ? null : { name: file.name, dataUrl, mimeType: file.type, sizeBytes: file.size, contentHash };
  } catch (error) {
    if (signal.aborted) return null;
    throw error;
  }
};
