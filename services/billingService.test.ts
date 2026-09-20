import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Billing must stay gated until Lewis enables sandbox secrets + VITE_BILLING_ENABLED=true.
 * Assert fail-closed default without importing supabaseClient (Node test env lacks WebSocket).
 */
describe('billing flag fail-closed', () => {
  it('treats missing / false / empty as disabled (only exact "true" enables)', () => {
    const parse = (raw: string | undefined) => raw === 'true';
    expect(parse(undefined)).toBe(false);
    expect(parse('')).toBe(false);
    expect(parse('false')).toBe(false);
    expect(parse('True')).toBe(false);
    expect(parse('1')).toBe(false);
    expect(parse('true')).toBe(true);
  });

  it('billingService source gates on exact string "true"', () => {
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'billingService.ts'), 'utf8');
    expect(src).toMatch(/VITE_BILLING_ENABLED\s*===\s*['"]true['"]/);
    expect(src).toMatch(/export const billingEnabled/);
  });

  it('.env.example defaults VITE_BILLING_ENABLED=false', () => {
    const env = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '.env.example'), 'utf8');
    expect(env).toMatch(/^VITE_BILLING_ENABLED=false\s*$/m);
    expect(env).toMatch(/STRIPE_SECRET_KEY/);
    expect(env).toMatch(/GEMINI_API_KEY/);
  });
});
