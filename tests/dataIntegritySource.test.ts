import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const readRepoFile = (path: string) => readFileSync(resolve(here, '..', path), 'utf8');

describe('client ↔ database integrity contract', () => {
  const dataContext = readRepoFile('contexts/DataContext.tsx');
  const settingsHub = readRepoFile('modules/core/hubs/SettingsHub.tsx');
  const signupCountry = readRepoFile('supabase/migrations/20260916090400_signup_country_integrity.sql');
  const financialDefaults = readRepoFile('supabase/migrations/20260916090500_financial_actor_defaults.sql');

  it('sends the selected country into Auth metadata before email confirmation', () => {
    expect(dataContext).toContain("const signupCountry = String(userData.countryCode || 'ZZ').trim().toUpperCase();");
    expect(dataContext).toContain("country_code: /^[A-Z]{2}$/.test(signupCountry) ? signupCountry : 'ZZ'");
    expect(signupCountry).toContain("new.raw_user_meta_data ->> 'country_code'");
    expect(signupCountry).toContain("signup_country := 'ZZ'");
  });

  it('fails closed to ZZ instead of silently becoming Spain', () => {
    expect(dataContext).toContain("countryCode: profile.country_code || 'ZZ'");
    expect(dataContext).not.toContain("countryCode: profile.country_code || 'ES'");
  });

  it('attributes platform payout creation to the authenticated user', () => {
    expect(dataContext).toMatch(/from\('platform_payouts'\)\.insert\(\{[\s\S]*?created_by: userId,[\s\S]*?\}\);/);
    expect(financialDefaults).toContain('alter table public.platform_payouts');
    expect(financialDefaults).toContain('alter column created_by set default auth.uid();');
  });

  it('lets the worker revoke an active advisor consent link from their own account', () => {
    expect(settingsHub).toContain(".from('manager_client_links')");
    expect(settingsHub).toContain(".eq('client_user_id', currentUser.id)");
    expect(settingsHub).toContain(".eq('manager_user_id', currentUser.managerId)");
    expect(settingsHub).toContain("rpc('labora_revoke_manager_link', { link_id: data.id })");
    expect(settingsHub).toContain('Revocar acceso del gestor');
  });
});
