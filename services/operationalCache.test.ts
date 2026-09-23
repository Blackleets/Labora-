import { describe, expect, it } from 'vitest';
import { StorageLike } from './safeStorage';
import {
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
});
