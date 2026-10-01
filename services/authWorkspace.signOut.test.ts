import { afterEach, describe, expect, it, vi } from 'vitest';
const auth = vi.hoisted(() => ({ signOut: vi.fn() }));
vi.mock('./supabaseClient', () => ({ supabase: { auth } }));
import { signOutRemote } from './authWorkspace';

afterEach(() => { vi.unstubAllGlobals(); vi.resetAllMocks(); });
describe('workspace sign-out confirmation', () => {
  it('supports local exit and removes profile caches only after sign-out succeeds', async () => {
    const remove = vi.fn(); vi.stubGlobal('localStorage', { removeItem: remove }); auth.signOut.mockResolvedValue({ error: null });
    await signOutRemote('local'); expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' }); expect(remove).toHaveBeenCalledWith('labora_user');
  });
  it('rejects a server failure without claiming exit or clearing caches', async () => {
    const remove = vi.fn(); vi.stubGlobal('localStorage', { removeItem: remove }); auth.signOut.mockResolvedValue({ error: new Error('network') });
    await expect(signOutRemote()).rejects.toThrow('network'); expect(remove).not.toHaveBeenCalled();
  });
});
