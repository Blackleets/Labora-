#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(join(root, file), 'utf8');
const checks = [];
const add = (id, status, detail) => checks.push({ id, status, detail });

const envLocal = join(root, '.env.local');
const env = existsSync(envLocal) ? readFileSync(envLocal, 'utf8') : '';
const hasValue = (key) => new RegExp(`^\\s*${key}\\s*=\\s*(?!YOUR_|$)\\S+`, 'm').test(env);

add('automated_tests', 'manual', 'Run npm run verify:release for executable evidence.');
add('visual_qa', read('design-qa.md').includes('final result: passed') ? 'pass' : 'blocked', 'Authenticated mobile/desktop browser evidence required.');
const uatResultPath = join(root, 'docs', 'UAT_DUAL_ACCOUNT_RESULT.json');
let uatPassed = false;
if (existsSync(uatResultPath)) {
  try {
    const result = JSON.parse(readFileSync(uatResultPath, 'utf8'));
    uatPassed = result?.status === 'passed' && Boolean(result?.executedAt) && Boolean(result?.environment);
  } catch {
    uatPassed = false;
  }
}
add('dual_account_uat', uatPassed ? 'pass' : 'blocked', 'Requires two real accounts and a timestamped docs/UAT_DUAL_ACCOUNT_RESULT.json evidence file.');
const supabaseClient = read('services/supabaseClient.ts');
const clientConfigured = (hasValue('VITE_SUPABASE_URL') && hasValue('VITE_SUPABASE_ANON_KEY'))
  || (/https:\/\/[a-z]+\.supabase\.co/.test(supabaseClient) && /sb_publishable_/.test(supabaseClient));
add('supabase_client_config', clientConfigured ? 'pass' : 'blocked', 'Public Supabase URL and publishable key must be configured; service role stays server-only.');
add('stripe_sandbox', hasValue('VITE_BILLING_ENABLED') && /^\s*VITE_BILLING_ENABLED\s*=\s*true\s*$/m.test(env) ? 'manual' : 'blocked', 'Keep disabled until Checkout, webhook and Portal sandbox UAT passes.');
add('legal_identity', 'blocked', 'Complete docs/LEGAL_LAUNCH_INPUTS.md and obtain professional review.');
add('production_publish', 'blocked', 'No verified production deployment for this commit.');

const blockers = checks.filter((item) => item.status === 'blocked');
const verdict = blockers.length ? 'not_ready' : 'ready_with_conditions';

console.log('\nLabora+ · release readiness\n');
for (const item of checks) console.log(`[${item.status.toUpperCase()}] ${item.id}: ${item.detail}`);
console.log(`\nREADINESS_VERDICT=${verdict}`);
console.log(`READINESS_JSON=${JSON.stringify({ verdict, checks })}`);
process.exit(blockers.length ? 1 : 0);
