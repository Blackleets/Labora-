import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const readRepoFile = (path: string) => readFileSync(resolve(here, '..', path), 'utf8');

describe('Supabase source security contract', () => {
  const baseSchema = readRepoFile('supabase/migrations/20260916090000_baseline_schema.sql');
  const advisorTrust = readRepoFile('supabase/migrations/20260916090100_advisor_trust.sql');
  const currencyGuard = readRepoFile('supabase/migrations/20260916090200_market_currency_guard.sql');
  const hardening = readRepoFile('supabase/migrations/20260916090300_security_hardening.sql');
  const signupCountry = readRepoFile('supabase/migrations/20260916090400_signup_country_integrity.sql');
  const requirementStateMachine = readRepoFile('supabase/migrations/20260916090600_requirement_state_machine.sql');

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

  it('enforces evidence-backed requirement submission in the database', () => {
    expect(requirementStateMachine).toContain("old.status <> 'pending' or new.status <> 'submitted'");
    expect(requirementStateMachine).toContain('submitted requirement requires evidence');
    expect(requirementStateMachine).toContain('submission evidence does not belong to client workspace');
  });

  it('makes requirement resolution terminal and manager-controlled', () => {
    expect(requirementStateMachine).toContain("old.status in ('approved', 'cancelled')");
    expect(requirementStateMachine).toContain("if resolution not in ('approved','cancelled')");
    expect(requirementStateMachine).toContain("manager may approve only a submitted requirement");
    expect(requirementStateMachine).toContain("manager may cancel only an open requirement");
    expect(requirementStateMachine).not.toContain("resolution not in ('approved','cancelled','pending')");
  });

  it('preserves client submission evidence during manager resolution', () => {
    expect(requirementStateMachine).toContain('new.submitted_document_id := old.submitted_document_id;');
    expect(requirementStateMachine).toContain('new.submission_notes := old.submission_notes;');
    expect(requirementStateMachine).toContain('new.submitted_at := old.submitted_at;');
  });

  it('fails closed for unknown currencies and includes Venezuela', () => {
    expect(currencyGuard).toContain("when 'VE' then 'VES'");
    expect(currencyGuard).toContain("else 'XXX'");
    expect(currencyGuard).not.toContain("else 'USD'");
  });

  it('preserves the country selected before email confirmation', () => {
    expect(signupCountry).toContain("new.raw_user_meta_data ->> 'country_code'");
    expect(signupCountry).toContain("signup_country := 'ZZ'");
    expect(signupCountry).toContain('insert into public.profiles (user_id, full_name, country_code)');
    expect(signupCountry).toContain('insert into public.organizations (name, kind, country_code, created_by)');
  });

  it('does not let an advisor self-promote trust state', () => {
    expect(advisorTrust).toContain("state <> 'verified' or (reviewed_at is not null and reviewed_by is not null)");
    expect(advisorTrust).toContain('There are intentionally no INSERT/UPDATE/DELETE grants for advisor_trust_profiles.');
    expect(advisorTrust).not.toContain('grant update on table public.advisor_trust_profiles to authenticated');
  });
});
