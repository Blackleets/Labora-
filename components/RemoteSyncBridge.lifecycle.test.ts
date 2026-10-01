import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHookHarness } from '../services/testHookHarness';
import * as cache from '../services/operationalCache';
import * as syncState from '../services/operationalSync';

const deferred = () => { let resolve!: () => void; const promise = new Promise<void>(r => { resolve = r; }); return { resolve, promise }; };
const memory = () => { const values = new Map<string, string>(); return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } }; };
const setup = () => {
  const storage = memory(); const sessionStorage = memory(); vi.stubGlobal('localStorage', storage);
  const payload = { incomes: [], expenses: [], documents: [], requirements: [], declarations: [], payments: [] };
  const actor = { id: 'A', role: 'rider' };
  const phase = vi.fn(); const notice = vi.fn(); const write = vi.fn(async () => {}); const read = vi.fn(async () => ({ cachePersisted: true }));
  const data: any = { ...payload, currentUser: actor, users: [actor], operationalSyncAttempt: 0, setOperationalSync: phase, showNotification: notice };
  const receipt = (id: string) => { cache.writeOperationalCache(id, payload, storage); sessionStorage.setItem(`labora_remote_hydrated:${id}`, cache.operationalCacheFingerprint(id, storage)); };
  receipt('A');
  const channel: any = { on: () => channel, subscribe: vi.fn() };
  const harness = createHookHarness('components/RemoteSyncBridge.tsx', {
    '../contexts/DataContext': { useData: () => data },
    '../services/operationalCache': cache, '../services/operationalSync': syncState,
    '../services/remoteOperational': { loadRemoteOperationalData: read, syncOperationalSnapshot: write },
    '../services/supabaseClient': { supabase: { channel: () => channel, removeChannel: async () => {} } }
  }, { sessionStorage, window: { setTimeout, clearTimeout, location: { reload: vi.fn() } }, Date });
  harness.render(); harness.render();
  return { harness, data, storage, receipt, phase, notice, write, read };
};
beforeEach(() => { vi.useFakeTimers(); vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('RemoteSyncBridge actual effects', () => {
  it('keeps a slow cloud write pending and confirms it only when complete', async () => {
    const ui = setup(); const slow = deferred(); ui.write.mockReturnValueOnce(slow.promise);
    await vi.advanceTimersByTimeAsync(700);
    expect(ui.phase).toHaveBeenLastCalledWith({ userId: 'A', phase: 'syncing' });
    expect(ui.storage.getItem('labora_remote_submitted:A')).toBeNull();
    slow.resolve(); await vi.advanceTimersByTimeAsync(0);
    expect(ui.phase).toHaveBeenLastCalledWith({ userId: 'A', phase: 'synced' });
    expect(ui.storage.getItem('labora_remote_submitted:A')).not.toBeNull(); ui.harness.unmount();
  });
  it('publishes an error and explicitly retries the same snapshot without a duplicate queue', async () => {
    const ui = setup(); ui.write.mockRejectedValueOnce(new Error('network down'));
    await vi.advanceTimersByTimeAsync(700);
    expect(ui.phase).toHaveBeenLastCalledWith({ userId: 'A', phase: 'error' });
    expect(ui.storage.getItem('labora_remote_submitted:A')).toBeNull();
    ui.data.operationalSyncAttempt++; ui.harness.render(); await vi.advanceTimersByTimeAsync(700);
    expect(ui.write).toHaveBeenCalledTimes(2); expect(ui.phase).toHaveBeenLastCalledWith({ userId: 'A', phase: 'synced' }); ui.harness.unmount();
  });
  it('a later edit invalidates the old completion and only the fresh write confirms', async () => {
    const ui = setup(); const slow = deferred(); ui.write.mockReturnValueOnce(slow.promise);
    await vi.advanceTimersByTimeAsync(700);
    ui.data.documents = [{ id: 'new', userId: 'A' }];
    cache.writeOperationalCache('A', ui.data, ui.storage); ui.harness.render();
    slow.resolve(); await vi.advanceTimersByTimeAsync(0);
    expect(ui.phase).toHaveBeenLastCalledWith({ userId: 'A', phase: 'pending' });
    expect(ui.storage.getItem('labora_remote_submitted:A')).toBeNull();
    await vi.advanceTimersByTimeAsync(700); expect(ui.phase).toHaveBeenLastCalledWith({ userId: 'A', phase: 'synced' }); ui.harness.unmount();
  });
  it('never applies an old actor confirmation to the next session', async () => {
    const ui = setup(); const slow = deferred(); ui.write.mockReturnValueOnce(slow.promise);
    await vi.advanceTimersByTimeAsync(700); ui.receipt('B');
    ui.data.currentUser = { id: 'B', role: 'rider' }; ui.harness.render(); ui.harness.render();
    ui.phase.mockClear(); slow.resolve(); await vi.advanceTimersByTimeAsync(0);
    expect(ui.phase).not.toHaveBeenCalledWith({ userId: 'A', phase: 'synced' });
    expect(ui.storage.getItem('labora_remote_submitted:A')).toBeNull(); ui.harness.unmount();
  });
  it('blocks confirmation if persisting the receipt fails', async () => {
    const ui = setup(); const setItem = ui.storage.setItem;
    ui.storage.setItem = (key, value) => { if (key.startsWith('labora_remote_submitted:')) throw new Error('quota'); setItem(key, value); };
    await vi.advanceTimersByTimeAsync(700); expect(ui.phase).toHaveBeenLastCalledWith({ userId: 'A', phase: 'blocked' }); ui.harness.unmount();
  });
  it('does not overwrite a cache changed by another tab before a queued write', async () => {
    const ui = setup(); const slow = deferred(); ui.write.mockReturnValueOnce(slow.promise);
    await vi.advanceTimersByTimeAsync(700);
    ui.data.documents = [{ id: 'queued', userId: 'A' }]; cache.writeOperationalCache('A', ui.data, ui.storage); ui.harness.render();
    await vi.advanceTimersByTimeAsync(700);
    ui.storage.setItem('labora_docs:A', JSON.stringify([{ id: 'other-tab', userId: 'A' }]));
    slow.resolve(); await vi.advanceTimersByTimeAsync(0);
    expect(ui.write).toHaveBeenCalledOnce(); expect(ui.phase).toHaveBeenLastCalledWith({ userId: 'A', phase: 'blocked' }); ui.harness.unmount();
  });
});
