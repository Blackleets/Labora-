import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prepareDocumentFile } from './documentPreparation';

let readers: FakeReader[] = [];
class FakeReader {
  result: string | ArrayBuffer | null = null; error: Error | null = null;
  onload: (() => void) | null = null; onerror: (() => void) | null = null; onabort: (() => void) | null = null;
  abort = vi.fn(() => this.onabort?.());
  readAsDataURL = vi.fn(() => readers.push(this));
  complete(value = 'data:application/pdf;base64,AA==') { this.result = value; this.onload?.(); }
}
const file = (overrides = {}) => ({ name: 'qa.pdf', type: 'application/pdf', size: 1, arrayBuffer: vi.fn(async () => new Uint8Array([1]).buffer), ...overrides } as unknown as File);
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
beforeEach(() => {
  readers = []; vi.stubGlobal('FileReader', FakeReader);
  vi.stubGlobal('crypto', { subtle: { digest: vi.fn(async () => new Uint8Array([10, 255]).buffer) } });
});
afterEach(() => vi.unstubAllGlobals());

describe('document preparation with cancellation', () => {
  it('prepares the original file and its hash', async () => {
    const run = prepareDocumentFile(file(), new AbortController().signal, () => false); await flush(); readers[0].complete();
    expect(await run).toMatchObject({ name: 'qa.pdf', mimeType: 'application/pdf', sizeBytes: 1, contentHash: '0aff', dataUrl: 'data:application/pdf;base64,AA==' });
  });
  it('ignores a slow arrayBuffer completion after cancellation', async () => {
    let complete!: (v: ArrayBuffer) => void; const pending = new Promise<ArrayBuffer>(r => { complete = r; });
    const controller = new AbortController(); const run = prepareDocumentFile(file({ arrayBuffer: () => pending }), controller.signal, () => false);
    controller.abort(); complete(new ArrayBuffer(1)); expect(await run).toBeNull(); expect(readers).toHaveLength(0);
  });
  it('aborts FileReader and cannot deliver a late result', async () => {
    const controller = new AbortController(); const run = prepareDocumentFile(file(), controller.signal, () => false);
    await flush(); const reader = readers[0]; controller.abort(); reader.complete();
    expect(await run).toBeNull(); expect(reader.abort).toHaveBeenCalledOnce(); expect(reader.onload).toBeNull();
  });
  it('rejects duplicates before reading the data URL', async () => {
    await expect(prepareDocumentFile(file(), new AbortController().signal, () => true)).rejects.toThrow('ya existe');
    expect(readers).toHaveLength(0);
  });
  it.each([{ type: 'text/plain' }, { size: 16 * 1024 * 1024 }])('rejects invalid files before starting an async read: %j', async override => {
    const input = file(override);
    await expect(prepareDocumentFile(input, new AbortController().signal, () => false)).rejects.toThrow();
    expect(input.arrayBuffer).not.toHaveBeenCalled();
  });
  it('surfaces a read error without returning a prepared attachment', async () => {
    const run = prepareDocumentFile(file(), new AbortController().signal, () => false); const rejection = expect(run).rejects.toThrow('read failed');
    await flush(); readers[0].error = new Error('read failed'); readers[0].onerror?.(); await rejection;
  });
});
