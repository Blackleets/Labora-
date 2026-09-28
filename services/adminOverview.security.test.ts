import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('supabase/functions/admin-overview/index.ts', 'utf8');

describe('admin overview security boundary', () => {
  it('authenticates the caller before using the service role client', () => {
    expect(source).toContain('userClient.auth.getUser()');
    expect(source).toContain("actor?.role !== 'admin'");
    expect(source).toContain("Administrator access required.");
  });

  it('returns aggregate metrics without selecting personal identity fields', () => {
    expect(source).toContain("select('role,country_code')");
    expect(source).not.toContain("select('email");
    expect(source).not.toContain("select('name");
  });
});
