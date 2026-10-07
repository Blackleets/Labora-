import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportFile, exportWithFeedback, MAX_EXPORT_BYTES } from './fileExport';
import { downloadCsv } from './quarterExport';
import { buildQuarterPdfModel, downloadQuarterPdf } from './quarterPdf';

const native = vi.hoisted(() => ({ platform: 'android', available: true, save: vi.fn() }));
vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => native.platform, isPluginAvailable: () => native.available },
  registerPlugin: () => ({ save: native.save })
}));
const csv = () => new Blob(['Comercio;Importe\nCafé;1,50'], { type: 'text/csv;charset=utf-8' });

beforeEach(() => {
  native.platform = 'android';
  native.available = true;
  native.save.mockReset().mockResolvedValue({ status: 'saved' });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('generated file exports', () => {
  it('passes exact UTF-8 bytes, MIME and filename without URLs or credentials to Android', async () => {
    expect(await exportFile('café.csv', csv())).toEqual({ status: 'saved' });
    const options = native.save.mock.calls[0][0];
    expect(options).toEqual({ filename: 'café.csv', mimeType: 'text/csv', base64: Buffer.from(await csv().arrayBuffer()).toString('base64') });
  });

  it('awaits the native write and does not notify while it is pending', async () => {
    let resolve!: (value: { status: 'saved' }) => void;
    native.save.mockReturnValue(new Promise(r => { resolve = r; }));
    const notify = vi.fn();
    const task = exportWithFeedback(() => exportFile('datos.csv', csv()), notify);
    await vi.waitFor(() => expect(native.save).toHaveBeenCalled());
    expect(notify).not.toHaveBeenCalled();
    resolve({ status: 'saved' });
    await task;
    expect(notify).toHaveBeenCalledWith('success', 'Archivo guardado en la ubicación elegida.');
  });

  it('treats cancellation as no success or error', async () => {
    native.save.mockResolvedValue({ status: 'cancelled' });
    const notify = vi.fn();
    await exportWithFeedback(() => exportFile('datos.csv', csv()), notify);
    expect(notify).not.toHaveBeenCalled();
  });

  it.each(['export_write_failed', 'export_busy', 'export_interrupted', 'sensitive provider URI'])('reports failures without claiming success or leaking native details: %s', async message => {
    native.save.mockRejectedValue(new Error(message));
    const notify = vi.fn();
    await exportWithFeedback(() => exportFile('datos.csv', csv()), notify);
    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify.mock.calls[0][0]).toBe('error');
    expect(notify.mock.calls[0][1]).not.toContain(message);
  });

  it('fails closed on an older APK, rather than using an unsupported blob link', async () => {
    native.available = false;
    await expect(exportFile('datos.csv', csv())).rejects.toThrow('APK');
    expect(native.save).not.toHaveBeenCalled();
  });

  it('rejects an unconfirmed result from the bridge', async () => {
    native.save.mockResolvedValue({ status: 'unknown' });
    await expect(exportFile('datos.csv', csv())).rejects.toThrow('confirmó');
  });

  it.each(['../datos.csv', 'a\\datos.csv', 'a\n.csv', '.csv', 'datos.pdf', 'x'.repeat(181) + '.csv'])('rejects invalid or mismatched filenames: %s', async filename => {
    await expect(exportFile(filename, csv())).rejects.toThrow();
    expect(native.save).not.toHaveBeenCalled();
  });

  it('rejects unsupported content and bounds the bridge memory', async () => {
    await expect(exportFile('data.html', new Blob(['html'], { type: 'text/html' }))).rejects.toThrow();
    await expect(exportFile('data.csv', new Blob([], { type: 'text/csv' }))).rejects.toThrow();
    await expect(exportFile('data.csv', new Blob([new Uint8Array(MAX_EXPORT_BYTES + 1)], { type: 'text/csv' }))).rejects.toThrow('10 MB');
    expect(native.save).not.toHaveBeenCalled();
  });

  it('exports actual CSV including BOM and UTF-8 without changing its format', async () => {
    await downloadCsv('datos.csv', [['Comercio', 'Importe'], ['Café', '1,50']]);
    const bytes = Buffer.from(native.save.mock.calls[0][0].base64, 'base64');
    expect(bytes.subarray(0, 3).toString('hex')).toBe('efbbbf');
    expect(bytes.toString('utf8')).toContain('Café');
  });

  it('exports actual jsPDF bytes through the same native path', async () => {
    const model = buildQuarterPdfModel({ name: 'QA' }, '3T 2026', [], [], new Date('2026-09-30T12:00:00Z'));
    await downloadQuarterPdf(model, 'trimestre.pdf');
    const options = native.save.mock.calls[0][0];
    expect(options.mimeType).toBe('application/pdf');
    const pdf = Buffer.from(options.base64, 'base64').toString('latin1');
    expect(pdf.startsWith('%PDF-')).toBe(true);
    expect(pdf).toContain('%%EOF');
  });

  it('requests a web download, removes the anchor and later revokes its object URL', async () => {
    native.platform = 'web';
    vi.useFakeTimers();
    const anchor = { href: '', download: '', click: vi.fn(), remove: vi.fn() };
    const appendChild = vi.fn();
    vi.stubGlobal('document', { createElement: () => anchor, body: { appendChild } });
    vi.stubGlobal('window', { setTimeout });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:qa');
    const revoke = vi.spyOn(URL, 'revokeObjectURL');
    const notify = vi.fn();
    await exportWithFeedback(() => exportFile('datos.csv', csv()), notify);
    expect(anchor.download).toBe('datos.csv');
    expect(anchor.click).toHaveBeenCalled();
    expect(anchor.remove).toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith('info', 'Descarga solicitada al navegador.');
    expect(native.save).not.toHaveBeenCalled();
    expect(revoke).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revoke).toHaveBeenCalledWith('blob:qa');
  });

  it('cleans up a web URL and reports error if the browser download throws', async () => {
    native.platform = 'web';
    vi.useFakeTimers();
    const remove = vi.fn();
    vi.stubGlobal('document', { createElement: () => ({ click: () => { throw new Error('blocked'); }, remove }), body: { appendChild: vi.fn() } });
    vi.stubGlobal('window', { setTimeout });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:qa');
    const revoke = vi.spyOn(URL, 'revokeObjectURL');
    const notify = vi.fn();
    await exportWithFeedback(() => exportFile('datos.csv', csv()), notify);
    expect(notify.mock.calls[0][0]).toBe('error');
    expect(remove).toHaveBeenCalled();
    vi.runAllTimers();
    expect(revoke).toHaveBeenCalledWith('blob:qa');
  });
});
