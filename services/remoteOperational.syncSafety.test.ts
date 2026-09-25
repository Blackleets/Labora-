import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '../types';
import { syncOperationalSnapshot } from './remoteOperational';

const mocks = vi.hoisted(() => ({
  deleted: vi.fn(),
  paymentsUpsert: vi.fn(),
  requestedTables: [] as string[]
}));

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: (table: string) => {
      mocks.requestedTables.push(table);
      return {
        select: () => table === 'expenses'
          ? { eq: async () => ({ data: [{ id: 'remote-expense' }], error: null }) }
          : Promise.resolve({ data: [], error: null }),
        upsert: table === 'payments' ? mocks.paymentsUpsert : vi.fn(),
        delete: mocks.deleted
      };
    }
  }
}));

describe('syncOperationalSnapshot safety', () => {
  beforeEach(() => {
    mocks.deleted.mockClear();
    mocks.paymentsUpsert.mockReset().mockResolvedValue({ error: null });
    mocks.requestedTables.length = 0;
  });

  it('does not delete remote rows when the local cache is empty', async () => {
    const currentUser = {
      id: 'rider-1',
      name: 'Rider',
      email: 'rider@example.test',
      role: UserRole.RIDER,
      platforms: []
    };

    await syncOperationalSnapshot({
      currentUser,
      users: [currentUser],
      incomes: [],
      expenses: [],
      documents: [],
      payments: [],
      requirements: [],
      declarations: []
    });

    expect(mocks.requestedTables).toContain('expenses');
    expect(mocks.deleted).not.toHaveBeenCalled();
  });

  it('reports a rejected payment save instead of claiming sync success', async () => {
    const currentUser = {
      id: 'rider-1',
      name: 'Rider',
      email: 'rider@example.test',
      role: UserRole.RIDER,
      platforms: []
    };
    const databaseError = new Error('payments insert rejected');
    mocks.paymentsUpsert.mockResolvedValue({ error: databaseError });

    await expect(syncOperationalSnapshot({
      currentUser,
      users: [currentUser],
      incomes: [],
      expenses: [],
      documents: [],
      payments: [{ id: 'payment-1', platform: 'Uber Eats', amount: 25, date: '2026-09-23', status: 'pending', estimated: true }],
      requirements: [],
      declarations: []
    })).rejects.toThrow('payments insert rejected');

    expect(mocks.paymentsUpsert).toHaveBeenCalledOnce();
  });
});
