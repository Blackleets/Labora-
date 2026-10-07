import { Capacitor, registerPlugin } from '@capacitor/core';

export type FileExportResult = { status: 'saved' | 'requested' | 'cancelled' };
interface NativeFileExport {
  save(options: { filename: string; mimeType: string; base64: string }): Promise<{ status: 'saved' | 'cancelled' }>;
}
const NativeExport = registerPlugin<NativeFileExport>('LaboraFileExport');
export const MAX_EXPORT_BYTES = 10 * 1024 * 1024;

/** Only generated CSV/PDF bytes cross the bridge. No URLs, sessions or storage credentials. */
export const exportFile = async (filename: string, blob: Blob): Promise<FileExportResult> => {
  const mimeType = blob.type.split(';')[0];
  const extension = mimeType === 'text/csv' ? '.csv' : mimeType === 'application/pdf' ? '.pdf' : '';
  if (!extension || !filename.toLowerCase().endsWith(extension) || !filename.trim()
    || filename.length > 180 || /[/\\\x00-\x1f\x7f]/.test(filename) || filename === extension) {
    throw new Error('Formato de exportación no válido.');
  }
  if (!blob.size || blob.size > MAX_EXPORT_BYTES) throw new Error('La exportación debe ocupar entre 1 byte y 10 MB.');

  if (Capacitor.getPlatform() === 'android') {
    if (!Capacitor.isPluginAvailable('LaboraFileExport')) throw new Error('Actualiza el APK para guardar archivos.');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    // Bounded chunks avoid argument-stack overflow on larger exports.
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 32768) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
    }
    const result = await NativeExport.save({ filename, mimeType, base64: btoa(binary) });
    if (result.status !== 'saved' && result.status !== 'cancelled') throw new Error('No se confirmó el guardado.');
    return result;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  try {
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    // Browsers cannot confirm that the user saved the file.
    return { status: 'requested' };
  } finally {
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

type ExportNotification = (type: 'success' | 'error' | 'info', message: string) => void;

/** No success for cancellation or failure; no sensitive native error strings in toasts. */
export const exportWithFeedback = async (
  action: () => Promise<FileExportResult>, notify: ExportNotification
): Promise<void> => {
  try {
    const result = await action();
    if (result.status === 'saved') notify('success', 'Archivo guardado en la ubicación elegida.');
    if (result.status === 'requested') notify('info', 'Descarga solicitada al navegador.');
  } catch {
    notify('error', 'No se pudo exportar el archivo. Reintenta; si usas Android, comprueba que el APK esté actualizado.');
  }
};
