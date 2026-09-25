import { describe, expect, it } from 'vitest';
import { resolveSupabasePublicConfig } from './publicRuntimeConfig';

describe('publicRuntimeConfig', () => {
  it('uses valid deployment overrides', () => {
    expect(resolveSupabasePublicConfig({
      VITE_SUPABASE_URL: 'https://preview-project.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'sb_publishable_preview_key_123456789'
    })).toEqual({
      url: 'https://preview-project.supabase.co',
      publishableKey: 'sb_publishable_preview_key_123456789'
    });
  });

  it('falls back when deployment variables are absent or still placeholders', () => {
    const absent = resolveSupabasePublicConfig({});
    const placeholders = resolveSupabasePublicConfig({
      VITE_SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY'
    });

    expect(placeholders).toEqual(absent);
    expect(absent.url).toBe('https://gggtriyvbusbpqohoukv.supabase.co');
    expect(absent.publishableKey).toMatch(/^sb_publishable_/);
  });

  it('does not accept an insecure or unrelated Supabase URL override', () => {
    const config = resolveSupabasePublicConfig({
      VITE_SUPABASE_URL: 'http://attacker.example/supabase',
      VITE_SUPABASE_ANON_KEY: 'sb_publishable_preview_key_123456789'
    });

    expect(config.url).toBe('https://gggtriyvbusbpqohoukv.supabase.co');
  });
});
