import { describe, expect, it, vi } from 'vitest';
import { confirmOperationalSync, hasPendingSessionChanges, OperationalCacheUnavailableError } from './operationalSync';
import { markOperationalCacheSubmitted, operationalCacheFingerprint, writeOperationalCache } from './operationalCache';

const deferred = () => { let resolve!: () => void; const promise = new Promise<void>(r => { resolve = r; }); return { promise, resolve }; };
const setup = () => ({ isCurrent: vi.fn(() => true), cacheMatches: vi.fn(() => true), sync: vi.fn(async () => {}), markSubmitted: vi.fn(() => true), onPhase: vi.fn() });

describe('operational confirmation boundary', () => {
  it('keeps slow writes unconfirmed until remote success and a stored receipt', async () => {
    const pending = deferred(); const task = setup(); task.sync.mockReturnValue(pending.promise);
    const run = confirmOperationalSync(task);
    expect(task.onPhase.mock.calls).toEqual([['syncing']]);
    expect(task.markSubmitted).not.toHaveBeenCalled();
    pending.resolve(); expect(await run).toBe(true);
    expect(task.onPhase.mock.calls).toEqual([['syncing'], ['synced']]);
    expect(task.markSubmitted).toHaveBeenCalledOnce();
  });
  it('does not create a confirmation after a rejected database or file write', async () => {
    const task = setup(); task.sync.mockRejectedValueOnce(new Error('Storage rejected'));
    await expect(confirmOperationalSync(task)).rejects.toThrow('Storage rejected');
    expect(task.markSubmitted).not.toHaveBeenCalled();
    expect(task.onPhase).not.toHaveBeenCalledWith('synced');
    expect(await confirmOperationalSync(task)).toBe(true);
    expect(task.sync).toHaveBeenCalledTimes(2);
  });
  it('ignores an old completion after logout, a new actor or a cancelled revision', async () => {
    const pending = deferred(); const task = setup(); task.sync.mockReturnValue(pending.promise);
    const run = confirmOperationalSync(task); task.isCurrent.mockReturnValue(false); pending.resolve();
    expect(await run).toBe(false);
    expect(task.markSubmitted).not.toHaveBeenCalled();
    expect(task.onPhase).not.toHaveBeenCalledWith('synced');
  });
  it('does not confirm newer edits with an older request', async () => {
    const pending = deferred(); const task = setup(); task.sync.mockReturnValue(pending.promise);
    const run = confirmOperationalSync(task); task.cacheMatches.mockReturnValue(false); pending.resolve();
    expect(await run).toBe(false); expect(task.onPhase).toHaveBeenLastCalledWith('pending');
    expect(task.markSubmitted).not.toHaveBeenCalled();
  });
  it('refuses to write if the cache changed before the queued snapshot started', async () => {
    const task = setup(); task.cacheMatches.mockReturnValue(false);
    await expect(confirmOperationalSync(task)).rejects.toBeInstanceOf(OperationalCacheUnavailableError);
    expect(task.sync).not.toHaveBeenCalled();
  });
  it('refuses a confirmed state if recording the receipt fails', async () => {
    const task = setup(); task.markSubmitted.mockReturnValue(false);
    await expect(confirmOperationalSync(task)).rejects.toBeInstanceOf(OperationalCacheUnavailableError);
    expect(task.onPhase).not.toHaveBeenCalledWith('synced');
  });
  it('does not start a stale queued operation', async () => {
    const task = setup(); task.isCurrent.mockReturnValue(false);
    expect(await confirmOperationalSync(task)).toBe(false); expect(task.sync).not.toHaveBeenCalled();
  });
  it('warns about unsaved in-memory edits only for their owner', () => {
    expect(hasPendingSessionChanges('A', 'A')).toBe(true);
    expect(hasPendingSessionChanges('B', 'A')).toBe(false);
    expect(hasPendingSessionChanges(undefined, 'A')).toBe(false);
  });
  it('detects pending changes recovered from cache and stops warning after confirmation', () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
    const empty = { incomes: [], expenses: [], documents: [], requirements: [], declarations: [], payments: [] };
    writeOperationalCache('A', empty, storage); markOperationalCacheSubmitted('A', operationalCacheFingerprint('A', storage), storage);
    expect(hasPendingSessionChanges('A', null, storage)).toBe(false);
    writeOperationalCache('A', { ...empty, documents: [{ id: 'd' }] }, storage);
    expect(hasPendingSessionChanges('A', null, storage)).toBe(true);
    expect(hasPendingSessionChanges('B', null, storage)).toBe(false);
    markOperationalCacheSubmitted('A', operationalCacheFingerprint('A', storage), storage);
    expect(hasPendingSessionChanges('A', null, storage)).toBe(false);
  });
});
