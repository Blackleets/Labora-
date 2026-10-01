import { hasUnsubmittedOperationalChanges } from './operationalCache';
import { StorageLike } from './safeStorage';

export type OperationalSyncPhase = 'checking' | 'pending' | 'syncing' | 'synced' | 'error' | 'blocked';
export type OperationalSyncState = { userId: string; phase: OperationalSyncPhase } | null;

export const hasPendingSessionChanges = (userId: string | undefined, pendingUserId: string | null, storage?: StorageLike) => Boolean(userId)
  && (pendingUserId === userId || hasUnsubmittedOperationalChanges(userId!, storage));

export class OperationalCacheUnavailableError extends Error {
  constructor() { super('No se pudo confirmar la copia local de los cambios.'); }
}

/** A remote completion confirms only the current actor and unchanged snapshot. */
export const confirmOperationalSync = async (options: {
  isCurrent: () => boolean;
  cacheMatches: () => boolean;
  sync: () => Promise<void>;
  markSubmitted: () => boolean;
  onPhase: (phase: OperationalSyncPhase) => void;
}) => {
  if (!options.isCurrent()) return false;
  if (!options.cacheMatches()) throw new OperationalCacheUnavailableError();
  options.onPhase('syncing');
  await options.sync();
  if (!options.isCurrent()) return false;
  if (!options.cacheMatches()) {
    options.onPhase('pending');
    return false;
  }
  if (!options.markSubmitted()) throw new OperationalCacheUnavailableError();
  options.onPhase('synced');
  return true;
};
