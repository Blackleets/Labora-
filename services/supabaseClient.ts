import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

const getConfig = () => {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const publishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim();
  return { url, publishableKey };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, publishableKey } = getConfig();
  return Boolean(url && publishableKey);
};

export const getSupabase = (): SupabaseClient => {
  if (client) return client;
  const { url, publishableKey } = getConfig();

  if (!url || !publishableKey) {
    throw new Error('Labora+ backend is not configured. Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY.');
  }

  client = createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
};
