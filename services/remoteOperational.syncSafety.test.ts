import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '../types';
import { syncOperationalSnapshot } from './remoteOperational';

const mocks = vi.hoisted(() => ({
  deleted: vi.fn(),
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
        delete: mocks.deleted
      };
    }
  }
}));

describe('syncOperationalSnapshot safety', () => {
  beforeEach(() => {
    mocks.deleted.mockClear();
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
});
