export type PublicRuntimeEnv = Record<string, string | boolean | undefined>;

const DEFAULT_SUPABASE_URL = 'https://gggtriyvbusbpqohoukv.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_0DdTFVB74Hw0dePC2rgoqA_pPm3PUb2';

const isUsableUrl = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.includes('YOUR_PROJECT')) return false;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
};

const isUsablePublishableKey = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  const key = value.trim();
  return key.length >= 20 && !key.includes('YOUR_SUPABASE');
};

/**
 * Resolves browser-safe Supabase configuration.
 *
 * The checked-in fallback is intentionally a public publishable key. Supabase
 * Auth and RLS remain the security boundary; service-role keys must never be
 * exposed through this module or a VITE_ variable.
 */
export const resolveSupabasePublicConfig = (env: PublicRuntimeEnv) => ({
  url: isUsableUrl(env.VITE_SUPABASE_URL)
    ? env.VITE_SUPABASE_URL.trim()
    : DEFAULT_SUPABASE_URL,
  publishableKey: isUsablePublishableKey(env.VITE_SUPABASE_ANON_KEY)
    ? env.VITE_SUPABASE_ANON_KEY.trim()
    : DEFAULT_SUPABASE_PUBLISHABLE_KEY
});
