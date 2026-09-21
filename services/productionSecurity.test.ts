import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');

describe('production security boundaries', () => {
  it('does not inject server AI secrets into the Vite client bundle', () => {
    const vite = read('vite.config.ts');
    expect(vite).not.toMatch(/GEMINI_API_KEY/);
    expect(vite).not.toMatch(/process\.env\.API_KEY/);
  });

  it('builds Tailwind locally instead of loading its development CDN', () => {
    const html = read('index.html');
    const css = read('index.css');
    expect(html).not.toMatch(/cdn\.tailwindcss\.com/);
    expect(css).toMatch(/@tailwind utilities/);
  });

  it('keeps billing CORS origin-scoped', () => {
    const shared = read('supabase/functions/_shared/cors.ts');
    const checkout = read('supabase/functions/create-checkout-session/index.ts');
    const portal = read('supabase/functions/create-billing-portal-session/index.ts');
    expect(shared).not.toMatch(/Access-Control-Allow-Origin['"]:\s*['"]\*/);
    expect(shared).toMatch(/LABORA_ALLOWED_ORIGINS/);
    expect(checkout).toMatch(/originAllowed/);
    expect(portal).toMatch(/originAllowed/);
  });

  it('never documents server secrets as VITE variables', () => {
    const env = read('.env.example');
    expect(env).not.toMatch(/^VITE_(STRIPE_SECRET|SUPABASE_SERVICE_ROLE|GEMINI_API_KEY)=/m);
    expect(env).toMatch(/^VITE_BILLING_ENABLED=false$/m);
  });
});
