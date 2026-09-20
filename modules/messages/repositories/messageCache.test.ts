import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  LEGACY_SHARED_CACHE_KEY,
  MESSAGE_STORAGE_PREFIX,
  cacheKeyFor,
  cachesAreIsolated,
  offlineFallbackFor,
  purgeLegacySharedCache,
  readMessageCache,
  writeMessageCache
} from './messageCache';

const store = new Map<string, string>();

const installLocalStorage = () => {
  const localStorageMock = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear()
  };
  (globalThis as { localStorage?: typeof localStorageMock }).localStorage = localStorageMock;
};

describe('messaging cache isolation (fail-closed)', () => {
  beforeEach(() => {
    store.clear();
    installLocalStorage();
  });

  afterEach(() => {
    store.clear();
  });

  it('scopes cache keys per user id', () => {
    expect(cacheKeyFor('rider_a')).toBe(`${MESSAGE_STORAGE_PREFIX}rider_a`);
    expect(cacheKeyFor('gestoria_b')).toBe(`${MESSAGE_STORAGE_PREFIX}gestoria_b`);
    expect(cachesAreIsolated('rider_a', 'gestoria_b')).toBe(true);
  });

  it('does not share keys between distinct accounts', () => {
    writeMessageCache('rider_a', [{ id: 'm1', message: 'hola rider' }]);
    writeMessageCache('gestoria_b', [{ id: 'm2', message: 'hola gestoría' }]);

    expect(readMessageCache('rider_a')).toEqual([{ id: 'm1', message: 'hola rider' }]);
    expect(readMessageCache('gestoria_b')).toEqual([{ id: 'm2', message: 'hola gestoría' }]);
    expect(readMessageCache('rider_a')).not.toEqual(readMessageCache('gestoria_b'));
  });

  it('offline fallback never returns another account cache', () => {
    writeMessageCache('rider_a', [{ id: 'secret_rider' }]);
    writeMessageCache('gestoria_b', [{ id: 'secret_gestoria' }]);

    expect(offlineFallbackFor('rider_a').map((m) => m.id)).toEqual(['secret_rider']);
    expect(offlineFallbackFor('gestoria_b').map((m) => m.id)).toEqual(['secret_gestoria']);
    expect(offlineFallbackFor(null)).toEqual([]);
    expect(offlineFallbackFor(undefined)).toEqual([]);
  });

  it('purges legacy unscoped labora_messages key', () => {
    store.set(LEGACY_SHARED_CACHE_KEY, JSON.stringify([{ id: 'leak' }]));
    writeMessageCache('rider_a', [{ id: 'ok' }]);

    purgeLegacySharedCache();
    expect(store.has(LEGACY_SHARED_CACHE_KEY)).toBe(false);
    expect(readMessageCache('rider_a')).toEqual([{ id: 'ok' }]);
  });

  it('rejects empty userId for cache key (fail-closed)', () => {
    expect(() => cacheKeyFor('')).toThrow(/userId/);
  });
});
