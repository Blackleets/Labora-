import { describe, expect, it } from 'vitest';
import {
  safeStorageGet,
  safeStorageReadJson,
  safeStorageRemove,
  safeStorageSet,
  safeStorageSetJson,
  StorageLike
} from './safeStorage';

const memoryStorage = (): StorageLike => {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); }
  };
};

const blockedStorage: StorageLike = {
  getItem: () => { throw new Error('blocked'); },
  setItem: () => { throw new Error('quota'); },
  removeItem: () => { throw new Error('blocked'); }
};

describe('safeStorage', () => {
  it('reads, writes and removes without changing the payload', () => {
    const storage = memoryStorage();
    expect(safeStorageSet('key', 'value', storage)).toBe(true);
    expect(safeStorageGet('key', storage)).toBe('value');
    expect(safeStorageRemove('key', storage)).toBe(true);
    expect(safeStorageGet('key', storage)).toBeNull();
  });

  it('fails closed when storage is blocked or full', () => {
    expect(safeStorageGet('key', blockedStorage)).toBeNull();
    expect(safeStorageSet('key', 'value', blockedStorage)).toBe(false);
    expect(safeStorageRemove('key', blockedStorage)).toBe(false);
  });

  it('returns a fallback for corrupt JSON and catches stringify failures', () => {
    const storage = memoryStorage();
    safeStorageSet('broken', '{not-json', storage);
    expect(safeStorageReadJson('broken', { safe: true }, storage)).toEqual({ safe: true });

    const circular: { self?: unknown } = {};
    circular.self = circular;
    expect(safeStorageSetJson('circular', circular, storage)).toBe(false);
  });
});
