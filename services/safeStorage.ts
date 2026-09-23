export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const browserStorage = (): StorageLike | undefined => {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
};

export const safeStorageGet = (key: string, storage: StorageLike | undefined = browserStorage()) => {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

export const safeStorageSet = (
  key: string,
  value: string,
  storage: StorageLike | undefined = browserStorage()
) => {
  try {
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const safeStorageRemove = (key: string, storage: StorageLike | undefined = browserStorage()) => {
  try {
    if (!storage) return false;
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

export const safeStorageReadJson = <T,>(key: string, fallback: T, storage?: StorageLike): T => {
  const value = safeStorageGet(key, storage);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const safeStorageSetJson = (key: string, value: unknown, storage?: StorageLike) => {
  try {
    return safeStorageSet(key, JSON.stringify(value), storage);
  } catch {
    return false;
  }
};
