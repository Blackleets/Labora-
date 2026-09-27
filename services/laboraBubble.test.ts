import { beforeEach, describe, expect, it } from 'vitest';
import { NOTIFICATION_ALLOWLIST, bubbleOnShiftChange, getBubbleAutoStart, isBubbleSupported, setBubbleAutoStart, toBubbleSession } from './laboraBubble';

describe('laboraBubble (web)', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); }
    };
  });

  it('no está disponible en la web', () => {
    expect(isBubbleSupported()).toBe(false);
  });

  it('pasa solo el access token y convierte expires_at a ms', () => {
    const payload = toBubbleSession({ access_token: 'jwt', expires_at: 1_800_000_000, user: { id: 'u1' } }, 'https://x.supabase.co', 'pk');
    expect(payload).toEqual({ supabaseUrl: 'https://x.supabase.co', anonKey: 'pk', accessToken: 'jwt', userId: 'u1', expiresAtMs: 1_800_000_000_000 });
    expect(payload && 'refreshToken' in payload).toBe(false);
  });

  it('rechaza sesiones incompletas o URL sin https', () => {
    expect(toBubbleSession(null, 'https://x', 'pk')).toBeNull();
    expect(toBubbleSession({ access_token: 'jwt', expires_at: 1, user: null }, 'https://x', 'pk')).toBeNull();
    expect(toBubbleSession({ access_token: 'jwt', expires_at: 1, user: { id: 'u' } }, 'http://x', 'pk')).toBeNull();
  });

  it('autoarranque por usuario, desactivado por defecto', () => {
    expect(getBubbleAutoStart('u1')).toBe(false);
    setBubbleAutoStart('u1', true);
    expect(getBubbleAutoStart('u1')).toBe(true);
    expect(getBubbleAutoStart('u2')).toBe(false);
  });

  it('en la web la jornada no toca la burbuja', async () => {
    setBubbleAutoStart('u1', true);
    await expect(bubbleOnShiftChange('u1', true, ['Glovo'])).resolves.toBeNull();
  });

  it('lista blanca solo con apps de repartidores', () => {
    expect(NOTIFICATION_ALLOWLIST.map((item) => item.packageName)).toEqual(['com.ubercab.driver', 'com.logistics.rider.glovo', 'com.glovoapp.courier']);
    expect(NOTIFICATION_ALLOWLIST.filter((item) => item.group === 'uber').map((item) => item.packageName)).toEqual(['com.ubercab.driver']);
  });
});
