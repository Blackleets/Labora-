import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
describe('global Auth client recovery isolation', () => {
  it.each(['#type=recovery&access_token=qa&refresh_token=qa', '?type=recovery&code=qa', '#password-recovery'])('disables all automatic callback exchanges for %s', async suffix => {
    vi.resetModules(); const create = vi.fn((_url: string, _key: string, _options: any) => ({}));
    vi.doMock('@supabase/supabase-js', () => ({ createClient: create }));
    vi.stubGlobal('window', { location: { href: 'https://example.test/' + suffix } });
    await import('./supabaseClient');
    expect(create.mock.calls[0][2].auth.detectSessionInUrl).toBe(false);
  });
  it('keeps ordinary confirmation callback detection enabled', async () => {
    vi.resetModules(); const create = vi.fn((_url: string, _key: string, _options: any) => ({}));
    vi.doMock('@supabase/supabase-js', () => ({ createClient: create }));
    vi.stubGlobal('window', { location: { href: 'https://example.test/#type=signup&access_token=qa' } });
    await import('./supabaseClient');
    const detect = create.mock.calls[0][2].auth.detectSessionInUrl;
    expect(detect(new URL('https://example.test/'), { type: 'signup', access_token: 'qa' })).toBe(true);
  });
});
