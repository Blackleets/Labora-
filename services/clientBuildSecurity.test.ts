import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const viteConfig = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8');

describe('client build security', () => {
  it('never injects server-side AI secrets into the browser bundle', () => {
    expect(viteConfig).not.toMatch(/process\.env\.(?:GEMINI_API_KEY|GOOGLE_API_KEY|API_KEY)/);
    expect(viteConfig).not.toMatch(/loadEnv\s*\(/);
  });

  it('never injects a Supabase service-role secret into the browser bundle', () => {
    expect(viteConfig).not.toMatch(/SERVICE_ROLE/i);
  });
});
