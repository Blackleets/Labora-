/**
 * Per-user messaging cache helpers.
 * Keys are scoped to the authenticated user so two accounts on the same browser
 * never share a cache bucket. Legacy unscoped key is purged on read.
 */

export const MESSAGE_STORAGE_PREFIX = 'labora_messages:';
export const LEGACY_SHARED_CACHE_KEY = 'labora_messages';

export type CachedMessage = {
  id: string;
  senderId?: string;
  recipientId?: string;
  message?: string;
  [key: string]: unknown;
};

export const cacheKeyFor = (userId: string): string => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('messageCache: userId requerido para aislamiento.');
  }
  return `${MESSAGE_STORAGE_PREFIX}${userId}`;
};

export const writeMessageCache = (userId: string, messages: CachedMessage[]): void => {
  try {
    localStorage.setItem(cacheKeyFor(userId), JSON.stringify(messages));
  } catch {
    /* cache is optional */
  }
};

export const readMessageCache = (userId: string): CachedMessage[] => {
  try {
    const data = localStorage.getItem(cacheKeyFor(userId));
    return data ? (JSON.parse(data) as CachedMessage[]) : [];
  } catch {
    return [];
  }
};

/** Drop legacy unscoped cache that could leak across accounts on the same browser. */
export const purgeLegacySharedCache = (): void => {
  try {
    localStorage.removeItem(LEGACY_SHARED_CACHE_KEY);
  } catch {
    /* ignore */
  }
};

/**
 * Fail-closed offline fallback: only return the current session user's cache.
 * Never merge another account's bucket; never invent messages.
 */
export const offlineFallbackFor = (sessionUserId: string | null | undefined): CachedMessage[] => {
  purgeLegacySharedCache();
  if (!sessionUserId) return [];
  return readMessageCache(sessionUserId);
};

/** True when two user ids would never share a cache key (isolation invariant). */
export const cachesAreIsolated = (userA: string, userB: string): boolean => {
  if (!userA || !userB || userA === userB) return false;
  return cacheKeyFor(userA) !== cacheKeyFor(userB);
};
