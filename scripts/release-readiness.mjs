import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const passes = [];

const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));

const requireFile = (relative, label = relative) => {
  if (!exists(relative)) failures.push(`${label}: missing ${relative}`);
  else passes.push(`${label}: present`);
};

const requireContains = (relative, snippet, label) => {
  if (!exists(relative)) {
    failures.push(`${label}: missing ${relative}`);
    return;
  }
  if (!read(relative).includes(snippet)) failures.push(`${label}: expected snippet not found`);
  else passes.push(`${label}: ok`);
};

const forbidContains = (relative, snippet, label) => {
  if (!exists(relative)) {
    failures.push(`${label}: missing ${relative}`);
    return;
  }
  if (read(relative).includes(snippet)) failures.push(`${label}: forbidden legacy marker found`);
  else passes.push(`${label}: clean`);
};

requireFile('supabase/migrations/20260922212049_labora_universal_worker_profile.sql', 'universal worker migration');
requireFile('supabase/migrations/20260927123351_labora_universal_worker_signup_sync.sql', 'universal signup migration');
requireFile('supabase/functions/delete-account/index.ts', 'account deletion edge function');
requireFile('docs/GLOBAL_EXPANSION.md', 'global expansion policy');
requireContains('components/Settings.tsx', 'AccountDeletionCard', 'real account deletion UI');
requireContains('modules/core/i18n/index.ts', "export type Language = 'es' | 'en' | 'pt'", 'ES/EN/PT i18n base');
requireContains('modules/country-config/catalog.ts', 'VERIFIED_AUTOMATIC_CALCULATION_CODES = new Set<string>()', 'tax automation fail-closed');
requireContains('contexts/CountryContext.tsx', 'GLOBAL_COUNTRIES', 'active country catalog is global-safe');
requireContains('.github/workflows/ci.yml', 'supabase/functions/delete-account/index.ts', 'delete-account Deno CI coverage');
forbidContains('contexts/CountryContext.tsx', 'OTHER_COUNTRIES', 'legacy mock countries not active');
forbidContains('modules/country-config/services/countryApi.ts', 'REST API SIMULATION', 'country API simulation removed');

console.log('Labora+ release-readiness static gate');
for (const pass of passes) console.log(`PASS  ${pass}`);
for (const failure of failures) console.error(`FAIL  ${failure}`);

if (failures.length > 0) {
  console.error(`\nBLOCKED: ${failures.length} release-readiness check(s) failed.`);
  process.exit(1);
}

console.log(`\nREADY_STATIC: ${passes.length} structural checks passed.`);
console.log('NOTE: This gate does not replace dual-account UAT, physical-device validation, leaked-password protection, or deployment verification.');
