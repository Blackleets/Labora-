import {
  safeStorageGet,
  safeStorageRemove,
  safeStorageSetJson,
  StorageLike
} from './safeStorage';

export const OPERATIONAL_KEY_BASE = {
  incomes: 'labora_incomes',
  expenses: 'labora_expenses',
  documents: 'labora_docs',
  payments: 'labora_payments',
  requirements: 'labora_requirements',
  declarations: 'labora_declarations'
} as const;

export type OperationalCachePayload = Record<keyof typeof OPERATIONAL_KEY_BASE, unknown>;

export const scopedOperationalKey = (base: string, userId: string) => `${base}:${userId}`;

export const purgeLegacyOperationalCache = (storage?: StorageLike) => {
  Object.values(OPERATIONAL_KEY_BASE).forEach((key) => safeStorageRemove(key, storage));
};

export const writeOperationalCache = (
  userId: string,
  payload: OperationalCachePayload,
  storage?: StorageLike
) => {
  purgeLegacyOperationalCache(storage);
  for (const [name, base] of Object.entries(OPERATIONAL_KEY_BASE)) {
    safeStorageSetJson(
      scopedOperationalKey(base, userId),
      payload[name as keyof OperationalCachePayload],
      storage
    );
  }
};

/** Stable comparison used to decide whether remote hydration changed this account. */
export const operationalCacheFingerprint = (userId: string, storage?: StorageLike) =>
  JSON.stringify(
    Object.values(OPERATIONAL_KEY_BASE).map((base) =>
      safeStorageGet(scopedOperationalKey(base, userId), storage)
    )
  );
