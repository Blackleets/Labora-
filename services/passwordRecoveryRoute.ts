// Inspect the callback before Supabase can consume it. Never persist its credentials.
export const RECOVERY_RETURN_URL = 'https://blackleets.github.io/Labora-/';
const RECOVERY_MARKER = '#password-recovery';
export type RecoveryEntry = { kind: 'link'; accessToken: string; refreshToken: string } | { kind: 'invalid' } | null;

export const parseRecoveryEntry = (href: string): RecoveryEntry => {
  const url = new URL(href);
  const params = new URLSearchParams(url.search);
  new URLSearchParams(url.hash.slice(1)).forEach((value, key) => params.set(key, value));
  if (params.has('error') || params.has('error_code') || params.has('error_description')) return { kind: 'invalid' };
  if (params.get('type') === 'recovery') {
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    return accessToken && refreshToken ? { kind: 'link', accessToken, refreshToken } : { kind: 'invalid' };
  }
  return url.hash === RECOVERY_MARKER ? { kind: 'invalid' } : null;
};

export const shouldDetectAuthUrl = (_url: URL, params: Record<string, string>) =>
  params.type !== 'recovery' && !params.error && !params.error_code && !params.error_description && Boolean(params.access_token);

export let recoveryEntry: RecoveryEntry = typeof window === 'undefined' ? null : parseRecoveryEntry(window.location.href);

export const consumeRecoveryEntry = () => {
  const entry = recoveryEntry;
  recoveryEntry = null;
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.hash = RECOVERY_MARKER;
    ['access_token', 'refresh_token', 'expires_in', 'expires_at', 'token_type', 'type', 'code', 'error', 'error_code', 'error_description', 'provider_token', 'provider_refresh_token'].forEach(key => url.searchParams.delete(key));
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  }
  return entry;
};

export const clearRecoveryEntry = () => {
  recoveryEntry = null;
  if (typeof window !== 'undefined') window.history.replaceState(null, '', window.location.pathname + window.location.search);
};
