import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetOperationalWriteCoordinatorForTest } from './operationalWriteCoordinator';

const mocked = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
  rpc: vi.fn(),
  remove: vi.fn()
}));

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: mocked.maybeSingle }))
      }))
    })),
    rpc: mocked.rpc,
    storage: { from: vi.fn(() => ({ remove: mocked.remove })) }
  }
}));

import { deleteRemoteDocumentWithLinkedIncomes } from './remoteOperational';

describe('remote document cascade delete', () => {
  beforeEach(() => {
    resetOperationalWriteCoordinatorForTest();
    mocked.maybeSingle.mockReset();
    mocked.rpc.mockReset();
    mocked.remove.mockReset();
  });

  it('reconciles a lost RPC response when the document is already gone', async () => {
    mocked.maybeSingle
      .mockResolvedValueOnce({ data: { content: null }, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    mocked.rpc.mockResolvedValue({ error: new Error('network response lost') });

    await expect(deleteRemoteDocumentWithLinkedIncomes('doc-1')).resolves.toBeUndefined();
    expect(mocked.maybeSingle).toHaveBeenCalledTimes(2);
  });

  it('keeps the failure when remote state cannot confirm deletion', async () => {
    const failure = new Error('network response lost');
    mocked.maybeSingle
      .mockResolvedValueOnce({ data: { content: null }, error: null })
      .mockResolvedValueOnce({ data: { id: 'doc-1' }, error: null });
    mocked.rpc.mockResolvedValue({ error: failure });

    await expect(deleteRemoteDocumentWithLinkedIncomes('doc-1')).rejects.toBe(failure);
  });
});
