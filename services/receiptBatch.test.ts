import { describe, expect, it } from 'vitest';
import { MAX_BATCH_FILES, classifyBatch, draftAmount, precheckFile, sha256Hex, validateDraft } from './receiptBatch';

const file = (hash: string | undefined, over: Partial<{ type: string; size: number; name: string }> = {}) => ({ name: 'a.jpg', size: 1000, type: 'image/jpeg', hash, ...over });

describe('receiptBatch', () => {
  it('flags duplicates against saved receipts and inside the batch', () => {
    const statuses = classifyBatch([file('h1'), file('h2'), file('h1'), file('h3'), file(undefined, { type: 'application/pdf' }), file('h4', { size: 13 * 1024 * 1024 })], new Set(['h3']));
    expect(statuses).toEqual(['ready', 'ready', 'duplicate_batch', 'duplicate_existing', 'bad_type', 'too_big']);
  });

  it('enforces the batch limits', () => {
    const many = Array.from({ length: MAX_BATCH_FILES + 1 }, (_, index) => file(`h${index}`));
    expect(classifyBatch(many, new Set()).at(-1)).toBe('over_limit');
    expect(precheckFile({ type: 'image/png', size: 10 }, 0, 80 * 1024 * 1024)).toBe('over_limit');
    expect(precheckFile({ type: 'image/png', size: 10 }, 0, 0)).toBeNull();
  });

  it('validates drafts like the manual form', () => {
    const ok = { date: '2026-09-20', amount: '12,40', category: 'Gasolina', merchant: '' };
    expect(validateDraft(ok, '2026-09-27')).toBeNull();
    expect(draftAmount(ok)).toBe(12.4);
    expect(validateDraft({ ...ok, amount: '' }, '2026-09-27')).toMatch(/importe/);
    expect(validateDraft({ ...ok, amount: '0' }, '2026-09-27')).toMatch(/importe/);
    expect(validateDraft({ ...ok, date: '' }, '2026-09-27')).toMatch(/fecha/);
    expect(validateDraft({ ...ok, date: '2026-09-28' }, '2026-09-27')).toMatch(/futura/);
    expect(validateDraft({ ...ok, category: '' }, '2026-09-27')).toMatch(/categoría/);
  });

  it('hashes bytes with SHA-256', async () => {
    expect(await sha256Hex(new TextEncoder().encode('abc').buffer as ArrayBuffer)).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});
