import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('supabase/functions/admin-overview/index.ts', 'utf8');

describe('admin overview security boundary', () => {
  it('authenticates the caller before using the service role client', () => {
    expect(source).toContain('userClient.auth.getUser()');
    expect(source).toContain("actor?.role !== 'admin'");
    expect(source).toContain("Administrator access required.");
  });

  it('limits the protected directory to operational identity fields', () => {
    const roleGate = source.indexOf("actor?.role !== 'admin'");
    const directoryQuery = source.indexOf("select('id,name,email,role,country_code,manager_id')");
    expect(roleGate).toBeGreaterThan(-1);
    expect(directoryQuery).toBeGreaterThan(roleGate);
    expect(source).not.toContain('phone,nif');
    expect(source).not.toContain('vehicle_plate');
  });
});
