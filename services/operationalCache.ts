import {
  safeStorageGet,
  safeStorageRemove,
  safeStorageSet,
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

export class OperationalCacheConflictError extends Error {
  constructor() {
    super('Hay datos locales pendientes; se ha pausado la sincronización para evitar perderlos.');
  }
}

export const scopedOperationalKey = (base: string, userId: string) => `${base}:${userId}`;
const submittedCacheKey = (userId: string) => `labora_remote_submitted:${userId}`;

/** Records the exact local snapshot after a successful remote write or load. */
export const markOperationalCacheSubmitted = (
  userId: string,
  fingerprint: string = operationalCacheFingerprint(userId),
  storage?: StorageLike
) => safeStorageSet(submittedCacheKey(userId), fingerprint, storage);

export const hasUnsubmittedOperationalChanges = (userId: string, storage?: StorageLike) => {
  const submitted = safeStorageGet(submittedCacheKey(userId), storage);
  return submitted !== null && submitted !== operationalCacheFingerprint(userId, storage);
};

export const clearOperationalCacheSubmission = (userId: string, storage?: StorageLike) =>
  safeStorageRemove(submittedCacheKey(userId), storage);

export const purgeLegacyOperationalCache = (storage?: StorageLike) => {
  Object.values(OPERATIONAL_KEY_BASE).forEach((key) => safeStorageRemove(key, storage));
};

export const writeOperationalCache = (
  userId: string,
  payload: OperationalCachePayload,
  storage?: StorageLike
) => {
  purgeLegacyOperationalCache(storage);
  let persisted = true;
  for (const [name, base] of Object.entries(OPERATIONAL_KEY_BASE)) {
    persisted = safeStorageSetJson(
      scopedOperationalKey(base, userId),
      payload[name as keyof OperationalCachePayload],
      storage
    ) && persisted;
  }
  return persisted;
};

/** Stable comparison used to decide whether remote hydration changed this account. */
export const operationalCacheFingerprint = (userId: string, storage?: StorageLike) =>
  JSON.stringify(
    Object.values(OPERATIONAL_KEY_BASE).map((base) =>
      safeStorageGet(scopedOperationalKey(base, userId), storage)
    )
  );

/** A changed cache with records must never be replaced by an older request. */
export const hasOperationalCacheRows = (userId: string, storage?: StorageLike) =>
  Object.values(OPERATIONAL_KEY_BASE).some((base) => {
    const value = safeStorageGet(scopedOperationalKey(base, userId), storage);
    if (value === null) return false;
    try {
      const rows = JSON.parse(value);
      return !Array.isArray(rows) || rows.length > 0;
    } catch {
      return true;
    }
  });

/** Keep locally created owner records when a remote response does not contain them. */
export const hasLocalOnlyOperationalRows = (
  userId: string,
  remote: OperationalCachePayload,
  storage?: StorageLike
) => Object.entries(OPERATIONAL_KEY_BASE).some(([name, base]) => {
  const value = safeStorageGet(scopedOperationalKey(base, userId), storage);
  if (value === null) return false;

  let local: unknown;
  try {
    local = JSON.parse(value);
  } catch {
    return true;
  }

  const remoteRows = remote[name as keyof OperationalCachePayload];
  if (!Array.isArray(local) || !Array.isArray(remoteRows)) return true;
  const remoteIds = new Set(remoteRows.map((row) => row?.id));

  return local.some((row) => {
    if (!row || typeof row !== 'object') return true;
    const owned = name === 'payments'
      || row.userId === userId
      || (name === 'requirements' && (row.managerId === userId || row.riderId === userId))
      || (name === 'declarations' && row.gestorId === userId);
    return owned && (typeof row.id !== 'string' || !remoteIds.has(row.id));
  });
});

/** A reload receipt is valid only for an intact cache belonging to this user. */
export const canResumeHydratedCache = (
  userId: string,
  receipt: string | null,
  storage?: StorageLike
) => Boolean(receipt)
  && Object.values(OPERATIONAL_KEY_BASE).every((base) =>
    safeStorageGet(scopedOperationalKey(base, userId), storage) !== null
  )
  && operationalCacheFingerprint(userId, storage) === receipt;
