import { existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const migrationsDir = resolve(repoRoot, 'supabase', 'migrations');

const requiredChain = [
  '20260916090000_baseline_schema.sql',
  '20260916090100_advisor_trust.sql',
  '20260916090200_market_currency_guard.sql',
  '20260916090300_security_hardening.sql',
  '20260916090400_signup_country_integrity.sql',
  '20260916090500_financial_actor_defaults.sql',
  '20260916090600_requirement_state_machine.sql',
  '20260916090700_expense_deductibility_review.sql',
];

describe('Supabase migration source of truth', () => {
  it('does not keep a second standalone schema snapshot that can drift', () => {
    expect(existsSync(resolve(repoRoot, 'supabase', 'schema.sql'))).toBe(false);
  });

  it('keeps the production migration chain ordered and uniquely timestamped', () => {
    const migrations = readdirSync(migrationsDir)
      .filter((name) => name.endsWith('.sql'))
      .sort();

    expect(migrations.slice(0, requiredChain.length)).toEqual(requiredChain);
    expect(migrations.every((name) => /^\d{14}_[a-z0-9_]+\.sql$/.test(name))).toBe(true);

    const timestamps = migrations.map((name) => name.slice(0, 14));
    expect(new Set(timestamps).size).toBe(timestamps.length);
  });
});
