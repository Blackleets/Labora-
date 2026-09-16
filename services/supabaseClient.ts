import { createClient } from '@supabase/supabase-js';

// The publishable key is designed for browser use. Security is enforced by Supabase Auth + RLS.
const SUPABASE_URL = 'https://gggtriyvbusbpqohoukv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_0DdTFVB74Hw0dePC2rgoqA_pPm3PUb2';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
