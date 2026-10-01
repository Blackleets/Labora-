import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseRecoveryEntry, shouldDetectAuthUrl } from './passwordRecoveryRoute';

describe('recovery callback routing', () => {
  it('gates a complete recovery link before ordinary Auth ingestion', () => {
    expect(parseRecoveryEntry('https://example.test/#type=recovery&access_token=a&refresh_token=r')).toEqual({ kind: 'link', accessToken: 'a', refreshToken: 'r' });
    expect(shouldDetectAuthUrl(new URL('https://example.test/'), { type: 'recovery', access_token: 'a' })).toBe(false);
  });
  it.each(['#type=recovery', '#type=recovery&access_token=a', '#error=access_denied&error_code=otp_expired'])('fails closed for incomplete/expired callback %s', hash => {
    expect(parseRecoveryEntry('https://example.test/' + hash)).toEqual({ kind: 'invalid' });
  });
  it('preserves the ordinary sign-up callback and normal entry', () => {
    expect(parseRecoveryEntry('https://example.test/#type=signup&access_token=a')).toBeNull();
    expect(shouldDetectAuthUrl(new URL('https://example.test/'), { type: 'signup', access_token: 'a' })).toBe(true);
    expect(parseRecoveryEntry('https://example.test/')).toBeNull();
  });
  it('refresh after scrubbing the credentials requires a new link', () => {
    expect(parseRecoveryEntry('https://example.test/#password-recovery')).toEqual({ kind: 'invalid' });
  });
  it('also gates credentials or errors in the query string', () => {
    expect(parseRecoveryEntry('https://example.test/?type=recovery&access_token=a&refresh_token=r')).toEqual({ kind: 'link', accessToken: 'a', refreshToken: 'r' });
    expect(parseRecoveryEntry('https://example.test/?error_code=otp_expired')).toEqual({ kind: 'invalid' });
  });
  it('never ingests an error as an ordinary authentication callback', () => {
    expect(shouldDetectAuthUrl(new URL('https://example.test/'), { error_code: 'otp_expired', access_token: 'a' })).toBe(false);
  });
});

afterEach(() => vi.unstubAllGlobals());
it('scrubs credentials from query and fragment and retains only a nonsecret recovery marker', async () => {
  vi.resetModules();
  const replace = vi.fn();
  vi.stubGlobal('window', { location: { href: 'https://example.test/Labora-/?type=recovery&access_token=qa-query&refresh_token=qa-refresh&campaign=test#access_token=qa-fragment&type=recovery', pathname: '/Labora-/', search: '?campaign=test' }, history: { replaceState: replace } });
  const route = await import('./passwordRecoveryRoute');
  expect(route.consumeRecoveryEntry()?.kind).toBe('link');
  expect(route.recoveryEntry).toBeNull();
  expect(replace).toHaveBeenLastCalledWith(null, '', '/Labora-/?campaign=test#password-recovery');
  route.clearRecoveryEntry();
  expect(replace).toHaveBeenLastCalledWith(null, '', '/Labora-/?campaign=test');
});
