import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteRemoteDocument, deleteRemoteExpense, deleteRemoteIncome } from './remoteOperational';

const mocks = vi.hoisted(() => ({
  existing: { data: { id: 'item-1', receipt_url: 'owner/receipt.jpg', content: 'owner/document.pdf' } as Record<string, unknown> | null },
  deleted: { data: [] as { id: string }[] },
  remove: vi.fn()
}));

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mocks.existing.data, error: null }) }) }),
      delete: () => ({ eq: () => ({ select: async () => ({ data: mocks.deleted.data, error: null }) }) })
    }),
    storage: { from: () => ({ remove: mocks.remove }) }
  }
}));

describe('owner delete confirmation', () => {
  beforeEach(() => {
    mocks.existing.data = { id: 'item-1', receipt_url: 'owner/receipt.jpg', content: 'owner/document.pdf' };
    mocks.deleted.data = [];
    mocks.remove.mockReset().mockResolvedValue({ error: null });
  });

  it.each([
    ['expense', deleteRemoteExpense],
    ['income', deleteRemoteIncome],
    ['document', deleteRemoteDocument]
  ])('does not claim a %s was deleted if RLS rejected the delete without an error', async (_label, deleteRemote) => {
    await expect(deleteRemote('item-1')).rejects.toThrow('No se pudo confirmar');
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('removes an expense receipt only after its database row is confirmed deleted', async () => {
    mocks.deleted.data = [{ id: 'item-1' }];
    await deleteRemoteExpense('item-1');
    expect(mocks.remove).toHaveBeenCalledWith(['owner/receipt.jpg']);
  });

  it('allows removing a local-only expense that has not reached the database', async () => {
    mocks.existing.data = null;
    await deleteRemoteExpense('item-1');
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});
