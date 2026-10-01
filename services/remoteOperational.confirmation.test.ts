import { beforeEach, describe, expect, it, vi } from 'vitest';
import { syncOperationalSnapshot } from './remoteOperational';
import { UserRole } from '../types';

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), upload: vi.fn(), writes: [] as Array<{ table: string; rows: any }>, omitted: new Set<string>(), rejected: new Set<string>(), existingExpenses: [] as Array<{ id: string }> }));
vi.mock('./supabaseClient', () => ({ supabase: {
  auth: { getUser: mocks.getUser }, storage: { from: () => ({ upload: mocks.upload }) },
  from: (table: string) => {
    let rows: any; let writing = false; let id: string | undefined;
    const query: any = {
      select: () => query,
      eq: (key: string, value: string) => { if (key === 'id') id = value; return query; },
      insert: (value: any) => { writing = true; rows = value; return query; },
      upsert: (value: any) => { writing = true; rows = value; return query; },
      update: (value: any) => { writing = true; rows = value; return query; },
      then: (resolve: any, reject: any) => {
        if (!writing) return Promise.resolve({ data: table === 'expenses' ? mocks.existingExpenses : [], error: null }).then(resolve, reject);
        mocks.writes.push({ table, rows });
        return Promise.resolve({ data: mocks.omitted.has(table) ? [] : (Array.isArray(rows) ? rows : [rows]).map(row => ({ id: id || row.id })), error: mocks.rejected.has(table) ? new Error('database rejected') : null }).then(resolve, reject);
      }
    };
    return query;
  }
} }));
const actor = { id: 'A', role: UserRole.RIDER, name: 'QA', email: 'qa@example.invalid', platforms: [] };
const snapshot = (overrides = {}) => ({ currentUser: actor, users: [actor], incomes: [], expenses: [], documents: [], payments: [], requirements: [], declarations: [], ...overrides });
const document = { id: 'doc', userId: 'A', name: 'qa.pdf', type: 'Factura' as const, date: '2026-10-01', content: 'data:application/pdf;base64,AA==', mimeType: 'application/pdf' };
beforeEach(() => {
  mocks.getUser.mockReset().mockResolvedValue({ data: { user: { id: 'A' } }, error: null });
  mocks.upload.mockReset().mockResolvedValue({ data: {}, error: null });
  mocks.writes.length = 0; mocks.omitted.clear(); mocks.rejected.clear(); mocks.existingExpenses = [];
});

describe('actual remote write confirmation', () => {
  it('a failed Storage upload cannot become a saved document', async () => {
    mocks.upload.mockResolvedValueOnce({ data: null, error: new Error('storage rejected') });
    await expect(syncOperationalSnapshot(snapshot({ documents: [document] }))).rejects.toThrow('storage rejected');
    expect(mocks.writes).toHaveLength(0);
  });
  it.each(['documents', 'incomes', 'payments'])('rejects a successful response missing expected %s rows', async table => {
    mocks.omitted.add(table);
    const rows = table === 'documents' ? [{ ...document, content: undefined }] : table === 'incomes' ? [{ id: 'income', userId: 'A', date: '2026-10-01', platform: 'QA', amount: 1, retention: 0 }] : [{ id: 'payment', platform: 'QA', amount: 1, date: '2026-10-01', status: 'pending', estimated: true }];
    await expect(syncOperationalSnapshot(snapshot({ [table]: rows }))).rejects.toThrow('confirmar el guardado');
  });
  it('rejects a zero-row expense update, including silent authorization failures', async () => {
    mocks.existingExpenses = [{ id: 'expense' }]; mocks.omitted.add('expenses');
    await expect(syncOperationalSnapshot(snapshot({ expenses: [{ id: 'expense', userId: 'A', category: 'Otro', date: '2026-10-01', amount: 1 }] }))).rejects.toThrow('confirmar el guardado');
  });
  it('requires the expected actor before making any snapshot writes', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'B' } }, error: null });
    await expect(syncOperationalSnapshot(snapshot())).rejects.toThrow('sesión cambió'); expect(mocks.writes).toHaveLength(0);
  });
  it('does not report completion if the authenticated actor changed during the snapshot', async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: { id: 'A' } }, error: null }).mockResolvedValueOnce({ data: { user: { id: 'B' } }, error: null });
    await expect(syncOperationalSnapshot(snapshot())).rejects.toThrow('sesión cambió');
  });
  it('retry uses the same document ID and deterministic file path after a partial failure', async () => {
    mocks.rejected.add('documents'); await expect(syncOperationalSnapshot(snapshot({ documents: [document] }))).rejects.toThrow('database rejected');
    mocks.rejected.clear(); await syncOperationalSnapshot(snapshot({ documents: [document] }));
    const writes = mocks.writes.filter(write => write.table === 'documents');
    expect(writes.map(write => write.rows[0].id)).toEqual(['doc', 'doc']);
    expect(mocks.upload.mock.calls.map(call => call[0])).toEqual(['A/document_doc.pdf', 'A/document_doc.pdf']);
    expect(mocks.upload.mock.calls.every(call => call[2].upsert === true)).toBe(true);
  });
});
