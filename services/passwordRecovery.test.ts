import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const actor = { id: 'recovery-owner' };
let entry: any;
let isolated: any;
let ordinary: any;
let create: any;
let signOut: any;
let clear: any;
beforeEach(() => {
  vi.resetModules();
  entry = { kind: 'link', accessToken: 'qa-access', refreshToken: 'qa-refresh' };
  ordinary = { resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }), updateUser: vi.fn() };
  isolated = {
    setSession: vi.fn().mockResolvedValue({ data: { session: { user: actor } }, error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: actor }, error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: { user: actor }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null })
  };
  create = vi.fn(() => ({ auth: isolated })); signOut = vi.fn().mockResolvedValue(undefined); clear = vi.fn();
  vi.doMock('@supabase/supabase-js', () => ({ createClient: create }));
  vi.doMock('./supabaseClient', () => ({ supabase: { auth: ordinary }, SUPABASE_URL: 'https://project.test', SUPABASE_PUBLISHABLE_KEY: 'public-test-key' }));
  vi.doMock('./authWorkspace', () => ({ signOutRemote: signOut }));
  vi.doMock('./passwordRecoveryRoute', () => ({ consumeRecoveryEntry: () => entry, clearRecoveryEntry: clear, RECOVERY_RETURN_URL: 'https://blackleets.github.io/Labora-/' }));
});
afterEach(() => vi.restoreAllMocks());

describe('password recovery service', () => {
  it('normalizes email and returns to the canonical web origin, including Android', async () => {
    const service = await import('./passwordRecovery');
    await service.requestPasswordRecovery(' Owner@Example.com ');
    expect(ordinary.resetPasswordForEmail).toHaveBeenCalledWith('owner@example.com', { redirectTo: 'https://blackleets.github.io/Labora-/' });
  });
  it('rejects a malformed email before sending', async () => {
    const service = await import('./passwordRecovery');
    await expect(service.requestPasswordRecovery('bad-address')).rejects.toThrow('correo');
    expect(ordinary.resetPasswordForEmail).not.toHaveBeenCalled();
  });
  it('does not disclose an unknown account and explains rate limiting', async () => {
    const service = await import('./passwordRecovery');
    ordinary.resetPasswordForEmail.mockResolvedValueOnce({ error: { code: 'user_not_found' } });
    await expect(service.requestPasswordRecovery('nobody@example.com')).resolves.toBeUndefined();
    ordinary.resetPasswordForEmail.mockResolvedValueOnce({ error: { status: 429 } });
    await expect(service.requestPasswordRecovery('owner@example.com')).rejects.toThrow('demasiados');
  });
  it('a double initialization exchanges the link only once and never persists credentials', async () => {
    const service = await import('./passwordRecovery');
    const [a, b] = await Promise.all([service.initializePasswordRecovery(), service.initializePasswordRecovery()]);
    expect(a).toBe(b); expect(isolated.setSession).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][2].auth).toMatchObject({ persistSession: false, autoRefreshToken: false, detectSessionInUrl: false });
  });
  it.each(['invalid', 'rejected', 'different-user'])('an %s link cannot update an existing ordinary session', async kind => {
    if (kind === 'invalid') entry = { kind: 'invalid' };
    if (kind === 'rejected') isolated.setSession.mockResolvedValue({ data: { session: null }, error: {} });
    if (kind === 'different-user') isolated.getUser.mockResolvedValue({ data: { user: { id: 'other-owner' } }, error: null });
    const service = await import('./passwordRecovery');
    await expect(service.updateRecoveredPassword('qa-password-long', 'qa-password-long')).rejects.toThrow('enlace');
    expect(ordinary.updateUser).not.toHaveBeenCalled(); expect(isolated.updateUser).not.toHaveBeenCalled();
  });
  it('requires matching and sufficiently long passwords before authentication', async () => {
    const service = await import('./passwordRecovery');
    await expect(service.updateRecoveredPassword('short', 'short')).rejects.toThrow('8');
    await expect(service.updateRecoveredPassword('qa-password-long', 'different')).rejects.toThrow('coinciden');
    expect(isolated.setSession).not.toHaveBeenCalled();
  });
  it('binds the update to the recovery client even if the ordinary account changes', async () => {
    const service = await import('./passwordRecovery');
    await service.initializePasswordRecovery();
    ordinary.user = { id: 'other-account' };
    await service.updateRecoveredPassword('qa-password-long', 'qa-password-long');
    expect(isolated.updateUser).toHaveBeenCalledWith({ password: 'qa-password-long' });
    expect(ordinary.updateUser).not.toHaveBeenCalled();
  });
  it('does not confirm a rejected password and preserves a usable recovery context for retry', async () => {
    const service = await import('./passwordRecovery');
    isolated.updateUser.mockResolvedValueOnce({ data: { user: null }, error: { code: 'weak_password' } });
    await expect(service.updateRecoveredPassword('qa-password-long', 'qa-password-long')).rejects.toThrow('seguridad');
    await service.updateRecoveredPassword('qa-password-strong', 'qa-password-strong');
    expect(isolated.setSession).toHaveBeenCalledTimes(1);
  });
  it('checks the actor again before updating', async () => {
    const service = await import('./passwordRecovery');
    await service.initializePasswordRecovery();
    isolated.getUser.mockResolvedValue({ data: { user: null }, error: {} });
    await expect(service.updateRecoveredPassword('qa-password-long', 'qa-password-long')).rejects.toThrow('enlace');
    expect(isolated.updateUser).not.toHaveBeenCalled();
  });
  it('cannot acknowledge an update without the expected returned user', async () => {
    const service = await import('./passwordRecovery');
    isolated.updateUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(service.updateRecoveredPassword('qa-password-long', 'qa-password-long')).rejects.toThrow('confirmar');
  });
  it('leaves through local sign-out only after confirmation, clearing the route marker', async () => {
    const service = await import('./passwordRecovery');
    await service.initializePasswordRecovery(); await service.exitPasswordRecovery();
    expect(isolated.signOut).toHaveBeenCalledWith({ scope: 'local' }); expect(signOut).toHaveBeenCalledWith('local'); expect(clear).toHaveBeenCalledTimes(1);
  });
  it('does not clear the gate if sign-out fails', async () => {
    const service = await import('./passwordRecovery');
    await service.initializePasswordRecovery(); isolated.signOut.mockResolvedValue({ error: { status: 500 } });
    await expect(service.exitPasswordRecovery()).rejects.toThrow(); expect(clear).not.toHaveBeenCalled();
  });
});
