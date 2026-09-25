import { createClient } from '@supabase/supabase-js';
import { resolveSupabasePublicConfig } from './publicRuntimeConfig';

const { url, publishableKey } = resolveSupabasePublicConfig(import.meta.env);

export const supabase = createClient(url, publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
