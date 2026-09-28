import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteRemoteDocument, deleteRemoteExpense, deleteRemoteIncome } from './remoteOperational';

const mocks = vi.hoisted(() => ({
  existing: { data: { id: 'item-1', receipt_url: 'owner/receipt.jpg', content: 'owner/document.pdf' } as Record<string, unknown> | null },
  deleted: { data: [] as { id: string }[] },
  remove: vi.fn(),
  rpc: vi.fn()
}));

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mocks.existing.data, error: null }) }) }),
      delete: () => ({ eq: () => ({ select: async () => ({ data: mocks.deleted.data, error: null }) }) })
    }),
    rpc: mocks.rpc,
    storage: { from: () => ({ remove: mocks.remove }) }
  }
}));

describe('owner delete safety', () => {
  beforeEach(() => {
    mocks.existing.data = { id: 'item-1', receipt_url: 'owner/receipt.jpg', content: 'owner/document.pdf' };
    mocks.deleted.data = [];
    mocks.remove.mockReset().mockResolvedValue({ error: null });
    mocks.rpc.mockReset().mockResolvedValue({ error: null });
  });

  it.each([
    ['expense', deleteRemoteExpense],
    ['income', deleteRemoteIncome]
  ])('does not claim a %s was deleted if RLS rejected it without an error', async (_label, deleteRemote) => {
    await expect(deleteRemote('item-1')).rejects.toThrow('No se pudo confirmar');
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('deletes a document and its linked incomes through the atomic owner RPC', async () => {
    await deleteRemoteDocument('item-1');
    expect(mocks.rpc).toHaveBeenCalledWith('delete_own_document_with_linked_incomes', { p_document_id: 'item-1' });
    expect(mocks.remove).toHaveBeenCalledWith(['owner/document.pdf']);
  });

  it('does not remove document storage when the atomic RPC fails', async () => {
    mocks.rpc.mockResolvedValue({ error: new Error('Not authorized') });
    await expect(deleteRemoteDocument('item-1')).rejects.toThrow('Not authorized');
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('removes an expense receipt only after its database row is confirmed deleted', async () => {
    mocks.deleted.data = [{ id: 'item-1' }];
    await deleteRemoteExpense('item-1');
    expect(mocks.remove).toHaveBeenCalledWith(['owner/receipt.jpg']);
  });

  it('allows removing a local-only row that never reached the database', async () => {
    mocks.existing.data = null;
    await expect(deleteRemoteExpense('item-1')).resolves.toBeUndefined();
    await expect(deleteRemoteIncome('item-1')).resolves.toBeUndefined();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});
