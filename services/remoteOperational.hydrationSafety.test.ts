import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadRemoteOperationalData } from './remoteOperational';
import { operationalCacheFingerprint, scopedOperationalKey, writeOperationalCache } from './operationalCache';
import { StorageLike } from './safeStorage';

const mocks = vi.hoisted(() => ({
  rows: {} as Record<string, Record<string, unknown>[]>,
  getUser: vi.fn()
}));

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({ order: async () => ({ data: mocks.rows[table] || [], error: null }) })
    }),
    auth: { getUser: mocks.getUser }
  }
}));

const memoryStorage = (): StorageLike => {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); }
  };
};

const empty = () => ({ incomes: [], expenses: [], documents: [], payments: [], requirements: [], declarations: [] });

describe('remote hydration safety', () => {
  let storage: StorageLike;

  beforeEach(() => {
    storage = memoryStorage();
    vi.stubGlobal('localStorage', storage);
    mocks.rows = {};
    mocks.getUser.mockReset().mockResolvedValue({ data: { user: { id: 'rider-1' } }, error: null });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('preserves an income created locally while the remote request was unavailable', async () => {
    writeOperationalCache('rider-1', {
      ...empty(),
      incomes: [{ id: 'local-income', userId: 'rider-1', amount: 25 }]
    }, storage);
    const before = operationalCacheFingerprint('rider-1', storage);

    await expect(loadRemoteOperationalData([], 'rider-1', before)).rejects.toThrow('datos locales pendientes');
    expect(operationalCacheFingerprint('rider-1', storage)).toBe(before);
    expect(storage.getItem(scopedOperationalKey('labora_incomes', 'rider-1'))).toContain('local-income');
  });

  it('does not replace an expense edited while the remote request was in flight', async () => {
    writeOperationalCache('rider-1', {
      ...empty(),
      expenses: [{ id: 'expense-1', userId: 'rider-1', amount: 10 }]
    }, storage);
    const before = operationalCacheFingerprint('rider-1', storage);
    mocks.rows.expenses = [{ id: 'expense-1', user_id: 'rider-1', amount: 10 }];
    mocks.getUser.mockImplementationOnce(async () => {
      writeOperationalCache('rider-1', {
        ...empty(),
        expenses: [{ id: 'expense-1', userId: 'rider-1', amount: 20 }]
      }, storage);
      return { data: { user: { id: 'rider-1' } }, error: null };
    });

    await expect(loadRemoteOperationalData([], 'rider-1', before)).rejects.toThrow('datos locales pendientes');
    expect(storage.getItem(scopedOperationalKey('labora_expenses', 'rider-1'))).toContain('"amount":20');
  });

  it('preserves an existing expense edited offline before the app was reloaded', async () => {
    mocks.rows.expenses = [{ id: 'expense-1', user_id: 'rider-1', amount: 10 }];
    await loadRemoteOperationalData([], 'rider-1', operationalCacheFingerprint('rider-1', storage));

    writeOperationalCache('rider-1', {
      ...empty(),
      expenses: [{ id: 'expense-1', userId: 'rider-1', amount: 20 }]
    }, storage);
    const offlineFingerprint = operationalCacheFingerprint('rider-1', storage);

    await expect(loadRemoteOperationalData([], 'rider-1', offlineFingerprint)).rejects.toThrow('datos locales pendientes');
    expect(operationalCacheFingerprint('rider-1', storage)).toBe(offlineFingerprint);
    expect(storage.getItem(scopedOperationalKey('labora_expenses', 'rider-1'))).toContain('"amount":20');
  });

  it('can discard a former client row in a manager cache without blocking her workspace', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'manager-1' } }, error: null });
    writeOperationalCache('manager-1', {
      ...empty(),
      incomes: [{ id: 'former-client-income', userId: 'rider-2' }]
    }, storage);

    const result = await loadRemoteOperationalData([], 'manager-1', operationalCacheFingerprint('manager-1', storage));
    expect(result.cachePersisted).toBe(true);
    expect(storage.getItem(scopedOperationalKey('labora_incomes', 'manager-1'))).toBe('[]');
  });
});
