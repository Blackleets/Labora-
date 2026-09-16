import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const readRepoFile = (path: string) => readFileSync(resolve(here, '..', path), 'utf8');

describe('Supabase source security contract', () => {
  const baseSchema = readRepoFile('supabase/migrations/20260916090000_baseline_schema.sql');
  const hardening = readRepoFile('supabase/migrations/20260916090300_security_hardening.sql');
  const currencyGuard = readRepoFile('supabase/migrations/20260916090200_market_currency_guard.sql');
  const advisorTrust = readRepoFile('supabase/migrations/20260916090100_advisor_trust.sql');

  it('keeps critical public tables behind RLS', () => {
    for (const table of [
      'profiles',
      'documents',
      'incomes',
      'platform_payouts',
      'expenses',
      'expense_reviews',
      'manager_requirements',
      'messages',
      'tax_periods',
      'filing_evidence',
      'audit_events',
    ]) {
      expect(baseSchema).toContain(`alter table public.${table} enable row level security;`);
    }
  });

  it('moves internal helpers out of the exposed public API surface', () => {
    expect(hardening).toContain('create schema if not exists private;');
    expect(hardening).toContain('alter function public.labora_can_access_client(uuid, uuid) set schema private;');
    expect(hardening).toContain('alter function public.labora_storage_path_authorized(text) set schema private;');
    expect(hardening).toContain('revoke execute on all functions in schema public from public, anon, authenticated;');
    expect(hardening).toContain('revoke execute on all functions in schema private from public, anon, authenticated;');
  });

  it('whitelists authenticated RPCs instead of relying on default EXECUTE', () => {
    for (const rpc of [
      'public.labora_bootstrap_account(text, text)',
      'public.labora_create_manager_invite()',
      'public.labora_accept_manager_invite(text)',
      'public.labora_revoke_manager_link(uuid)',
      'public.labora_submit_requirement(uuid, uuid, text)',
      'public.labora_review_requirement(uuid, text)',
      'public.labora_mark_message_read(uuid)',
      'public.labora_verify_filing_evidence(uuid, text, text)',
    ]) {
      expect(hardening).toContain(`grant execute on function ${rpc} to authenticated;`);
    }
  });

  it('enforces evidence-backed requirement transitions in the database', () => {
    expect(hardening).toContain("old.status <> 'pending' or new.status <> 'submitted'");
    expect(hardening).toContain('submitted requirement requires evidence');
    expect(hardening).toContain("old.status <> 'submitted' or new.status <> 'approved'");
    expect(hardening).toContain('new.submission_notes := old.submission_notes;');
  });

  it('fails closed for unknown currencies and includes Venezuela', () => {
    expect(currencyGuard).toContain("when 'VE' then 'VES'");
    expect(currencyGuard).toContain("else 'XXX'");
    expect(currencyGuard).not.toContain("else 'USD'");
  });

  it('does not let an advisor self-promote trust state', () => {
    expect(advisorTrust).toContain("state <> 'verified' or (reviewed_at is not null and reviewed_by is not null)");
    expect(advisorTrust).toContain('There are intentionally no INSERT/UPDATE/DELETE grants for advisor_trust_profiles.');
    expect(advisorTrust).not.toContain('grant update on table public.advisor_trust_profiles to authenticated');
  });
});
