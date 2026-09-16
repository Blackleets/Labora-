import { describe, expect, it } from 'vitest';
import { evidenceExtensionForMime, safeOriginalEvidenceFilename } from '../services/evidenceFiles';

describe('evidence file integrity', () => {
  it('keeps MIME and extension aligned', () => {
    expect(evidenceExtensionForMime('application/pdf')).toBe('pdf');
    expect(evidenceExtensionForMime('image/jpeg')).toBe('jpg');
    expect(evidenceExtensionForMime('image/png')).toBe('png');
    expect(evidenceExtensionForMime('image/webp')).toBe('webp');
  });

  it('fails closed for unsupported evidence MIME types', () => {
    expect(() => evidenceExtensionForMime('text/html')).toThrow(/no permitido/i);
  });

  it('preserves the user-facing base filename while normalizing the real extension', () => {
    expect(safeOriginalEvidenceFilename('Ticket Uber.WEBP', 'evidencia-2026-09-16', 'webp')).toBe('Ticket Uber.webp');
    expect(safeOriginalEvidenceFilename('factura/semana.pdf', 'fallback', 'pdf')).toBe('factura_semana.pdf');
  });

  it('uses a deterministic fallback when no original filename exists', () => {
    expect(safeOriginalEvidenceFilename(undefined, 'evidencia-2026-09-16', 'jpg')).toBe('evidencia-2026-09-16.jpg');
  });
});
