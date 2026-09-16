const EXTENSION_BY_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const evidenceExtensionForMime = (mimeType: string): string => {
  const normalized = mimeType.trim().toLowerCase();
  const extension = EXTENSION_BY_MIME[normalized];
  if (!extension) throw new Error(`Tipo de archivo no permitido: ${mimeType || 'desconocido'}.`);
  return extension;
};

export const safeOriginalEvidenceFilename = (
  originalFilename: string | undefined,
  fallbackBase: string,
  extension: string,
): string => {
  const clean = (originalFilename || '')
    .trim()
    .replace(/[\\/\0<>:"|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .slice(0, 180);

  if (!clean) return `${fallbackBase}.${extension}`;

  const dot = clean.lastIndexOf('.');
  const base = (dot > 0 ? clean.slice(0, dot) : clean).trim().slice(0, 160) || fallbackBase;
  return `${base}.${extension}`;
};
