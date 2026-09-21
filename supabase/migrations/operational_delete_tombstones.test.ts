import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '20260921180000_labora_operational_delete_tombstones.sql'),
  'utf8'
);

describe('operational deletion tombstones migration', () => {
  it('records deletion intent and rejects stale writes for every synced owner table', () => {
    expect(migration).toContain('create table if not exists public.operational_deletion_tombstones');
    expect(migration).toContain('create or replace function private.record_operational_deletion_tombstone()');
    expect(migration).toContain('create or replace function private.reject_tombstoned_operational_write()');
    expect(migration).toContain('create or replace function private.lock_operational_entity()');
    expect(migration).toContain('pg_advisory_xact_lock');
    for (const table of ['expenses', 'incomes', 'documents']) {
      expect(migration).toContain(`after delete on public.${table}`);
      expect(migration).toContain(`before insert or update of id, user_id on public.${table}`);
      expect(migration).toContain(`before delete on public.${table}`);
    }
  });
});
