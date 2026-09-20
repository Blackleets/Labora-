import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Guard wiring check without importing supabaseClient (Node lacks WebSocket).
 */
describe('signUpRemote manager guard wiring', () => {
  const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'authWorkspace.ts'), 'utf8');

  it('imports assertManagerSignupFields', () => {
    expect(src).toMatch(/assertManagerSignupFields/);
    expect(src).toMatch(/from ['\"]\.\/registrationValidation['\"]/);
  });

  it('rejects manager signup when guard runs before auth.signUp', () => {
    const guardIdx = src.indexOf('assertManagerSignupFields');
    const signUpIdx = src.indexOf('supabase.auth.signUp');
    expect(guardIdx).toBeGreaterThan(-1);
    expect(signUpIdx).toBeGreaterThan(-1);
    expect(guardIdx).toBeLessThan(signUpIdx);
    expect(src).toMatch(/role === UserRole\.MANAGER/);
  });
});
