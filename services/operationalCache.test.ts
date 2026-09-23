import { describe, expect, it } from 'vitest';
import { StorageLike } from './safeStorage';
import {
  canResumeHydratedCache,
  operationalCacheFingerprint,
  scopedOperationalKey,
  writeOperationalCache
} from './operationalCache';

const memoryStorage = (): StorageLike => {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); }
  };
};

const emptyPayload = () => ({
  incomes: [],
  expenses: [],
  documents: [],
  payments: [],
  requirements: [],
  declarations: []
});

describe('operationalCache', () => {
  it('detects remote hydration changes on the scoped account keys', () => {
    const storage = memoryStorage();
    const before = operationalCacheFingerprint('rider-1', storage);

    writeOperationalCache('rider-1', {
      ...emptyPayload(),
      incomes: [{ id: 'income-1', amount: 25 }]
    }, storage);

    expect(operationalCacheFingerprint('rider-1', storage)).not.toBe(before);
  });

  it('keeps Rider and Gestoría caches isolated', () => {
    const storage = memoryStorage();
    writeOperationalCache('rider-1', { ...emptyPayload(), incomes: [{ id: 'rider-income' }] }, storage);
    writeOperationalCache('manager-1', { ...emptyPayload(), incomes: [{ id: 'manager-view' }] }, storage);

    expect(storage.getItem(scopedOperationalKey('labora_incomes', 'rider-1'))).toContain('rider-income');
    expect(storage.getItem(scopedOperationalKey('labora_incomes', 'manager-1'))).toContain('manager-view');
  });

  it('never resumes from a stale receipt, missing keys, or a different account', () => {
    const storage = memoryStorage();
    expect(writeOperationalCache('rider-1', emptyPayload(), storage)).toBe(true);
    const receipt = operationalCacheFingerprint('rider-1', storage);

    expect(canResumeHydratedCache('rider-1', receipt, storage)).toBe(true);
    expect(canResumeHydratedCache('manager-1', receipt, storage)).toBe(false);
    writeOperationalCache('rider-1', { ...emptyPayload(), incomes: [{ id: 'newer-income' }] }, storage);
    expect(canResumeHydratedCache('rider-1', receipt, storage)).toBe(false);
    storage.removeItem(scopedOperationalKey('labora_incomes', 'rider-1'));
    expect(canResumeHydratedCache('rider-1', receipt, storage)).toBe(false);
    expect(canResumeHydratedCache('rider-1', null, storage)).toBe(false);
  });

  it('does not claim hydration succeeded when storage is blocked', () => {
    const blocked: StorageLike = {
      getItem: () => { throw new Error('private mode'); },
      setItem: () => { throw new Error('quota'); },
      removeItem: () => { throw new Error('private mode'); }
    };

    expect(writeOperationalCache('rider-1', emptyPayload(), blocked)).toBe(false);
    expect(canResumeHydratedCache('rider-1', operationalCacheFingerprint('rider-1', blocked), blocked)).toBe(false);
  });
});
