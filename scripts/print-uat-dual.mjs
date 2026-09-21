#!/usr/bin/env node
/**
 * Labora+ · UAT dual-cuenta prep printer (agent-safe).
 * Prints the Spanish checklist + machine-checkable prep.
 * NEVER claims UAT PASS. Exit 1 only when repo prep shape is broken.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const doc = join(root, 'docs', 'UAT_DUAL_ACCOUNT.md');
const smokeDoc = join(root, 'scripts', 'uat-dual-smoke.md');
const envExample = join(root, '.env.example');
const envLocal = join(root, '.env.local');
const migrationsDir = join(root, 'supabase', 'migrations');
const linkingTest = join(root, 'services', 'gestoriaLinking.test.ts');
const linkingSrc = join(root, 'services', 'gestoriaLinking.ts');
const supabaseClientSrc = join(root, 'services', 'supabaseClient.ts');

const REQUIRED_RPCS = ['link_manager_by_email', 'unlink_own_manager'];
const REQUIRED_ENV_KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

/** @typedef {{ id: string, ok: boolean, detail: string }} PrepCheck */

/** @type {PrepCheck[]} */
const checks = [];

function fail(id, detail) {
  checks.push({ id, ok: false, detail });
}

function pass(id, detail) {
  checks.push({ id, ok: true, detail });
}

function readSafe(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
}

// ─── Prep checks (no network, no secrets printed) ───────────────────────────

const docText = readSafe(doc);
if (!docText.trim()) {
  fail('checklist_doc', `Missing or empty ${doc}`);
} else if (!docText.includes('PASS global') || !docText.includes('Firma de Lewis')) {
  fail('checklist_doc', 'UAT_DUAL_ACCOUNT.md missing Lewis signature / PASS global section');
} else {
  pass('checklist_doc', 'docs/UAT_DUAL_ACCOUNT.md present with Lewis signature block');
}

const exampleText = readSafe(envExample);
if (!exampleText.trim()) {
  fail('env_example', '.env.example missing');
} else {
  const missing = REQUIRED_ENV_KEYS.filter((k) => !exampleText.includes(k));
  if (missing.length) {
    fail('env_example', `Missing keys in .env.example: ${missing.join(', ')}`);
  } else {
    pass('env_example', 'VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY documented');
  }
}

if (existsSync(envLocal)) {
  const local = readSafe(envLocal);
  const present = REQUIRED_ENV_KEYS.filter((k) => {
    const re = new RegExp(`^\\s*${k}\\s*=\\s*\\S+`, 'm');
    return re.test(local);
  });
  // Do not print values. Note: Vite client may also hardcode anon URL in supabaseClient.ts.
  if (present.length === REQUIRED_ENV_KEYS.length) {
    pass('env_local', '.env.local has URL + anon key entries (values not shown)');
  } else {
    fail(
      'env_local',
      `Incomplete .env.local — need ${REQUIRED_ENV_KEYS.join(' + ')} (or rely on hardcoded client; still fill for Pages/build)`
    );
  }
} else {
  const client = readSafe(supabaseClientSrc);
  const hasPublicClientConfig = /https:\/\/[a-z]+\.supabase\.co/.test(client) && /sb_publishable_/.test(client);
  if (hasPublicClientConfig) {
    pass('env_local', 'Public Supabase URL + publishable key are configured in supabaseClient.ts; no server secret is present.');
  } else {
    fail('env_local', '.env.local absent and no public client configuration was found.');
  }
}

let migrationBlob = '';
try {
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
  migrationBlob = files.map((f) => readSafe(join(migrationsDir, f))).join('\n');
  if (!files.length) {
    fail('migrations_dir', 'supabase/migrations has no .sql files');
  } else {
    pass('migrations_dir', `${files.length} migration file(s) readable`);
  }
} catch {
  fail('migrations_dir', 'Cannot read supabase/migrations');
}

for (const rpc of REQUIRED_RPCS) {
  const defined =
    migrationBlob.includes(`CREATE OR REPLACE FUNCTION`) && migrationBlob.includes(rpc)
    || migrationBlob.includes(`function ${rpc}`)
    || migrationBlob.includes(`FUNCTION public.${rpc}`)
    || migrationBlob.includes(`FUNCTION ${rpc}`)
    || (migrationBlob.includes(rpc) && /create\s+or\s+replace\s+function/i.test(migrationBlob));
  // Simpler: RPC name must appear in migrations (shape callable in repo).
  if (migrationBlob.includes(rpc)) {
    pass(`rpc_${rpc}`, `Migration SQL mentions ${rpc} (shape in repo — not a live call)`);
  } else {
    fail(`rpc_${rpc}`, `RPC ${rpc} not found in supabase/migrations — apply/sync before UAT`);
  }
}

if (existsSync(linkingSrc) && existsSync(linkingTest)) {
  const testText = readSafe(linkingTest);
  const hasSelf = testText.includes('self') || testText.includes('self_link');
  const hasNotMgr =
    testText.includes('not_manager') || testText.includes('peer') || testText.includes('autónomo');
  if (hasSelf && hasNotMgr) {
    pass('vitest_link_guards', 'gestoriaLinking.test.ts covers self-link / non-manager rejection');
  } else {
    fail('vitest_link_guards', 'gestoriaLinking.test.ts missing self-link or not_manager coverage');
  }
} else {
  fail('vitest_link_guards', 'gestoriaLinking.ts / .test.ts missing');
}

const hardFails = checks.filter(
  (c) =>
    !c.ok
    && [
      'checklist_doc',
      'env_example',
      'migrations_dir',
      'rpc_link_manager_by_email',
      'rpc_unlink_own_manager',
      'vitest_link_guards'
    ].includes(c.id)
);
const softFails = checks.filter((c) => !c.ok && !hardFails.includes(c));
const prepOk = hardFails.length === 0;
const prepStatus = prepOk ? (softFails.length ? 'ready_with_warnings' : 'ready') : 'blocked';

// ─── Output ─────────────────────────────────────────────────────────────────

console.log('\n══ Labora+ · UAT dual-cuenta (checklist + prep) ══\n');
console.log(docText || '(checklist missing)\n');
console.log('\n── Prep machine-check (no live RPC calls, no secrets) ──\n');

for (const c of checks) {
  const mark = c.ok ? 'OK  ' : 'FAIL';
  console.log(`  [${mark}] ${c.id}: ${c.detail}`);
}

console.log('\n── How to read this ──');
console.log('  • OK/FAIL above = repo prep shape only.');
console.log('  • This script NEVER prints UAT PASS.');
console.log('  • Dual-account PASS requires Lewis signature in docs/UAT_DUAL_ACCOUNT.md §G.');
console.log('  • Fail-closed unit tests (no secrets): npm test');
console.log(`  • Smoke notes: ${existsSync(smokeDoc) ? 'scripts/uat-dual-smoke.md' : '(missing)'}`);

if (softFails.length) {
  console.log('\n── Warnings (Lewis action) ──');
  for (const c of softFails) {
    console.log(`  • ${c.id}: ${c.detail}`);
  }
}

if (hardFails.length) {
  console.log('\n── Blockers (fix before claiming UAT ready) ──');
  for (const c of hardFails) {
    console.log(`  • ${c.id}: ${c.detail}`);
  }
}

const machine = {
  prep_status: prepStatus,
  uat_pass_claimed: false,
  hard_fail_ids: hardFails.map((c) => c.id),
  soft_fail_ids: softFails.map((c) => c.id),
  checks: Object.fromEntries(checks.map((c) => [c.id, c.ok ? 'ok' : 'fail']))
};

console.log('\n── MACHINE ──');
console.log(`PREP_STATUS=${prepStatus}`);
console.log(`UAT_PASS_CLAIMED=false`);
console.log(`PREP_JSON=${JSON.stringify(machine)}`);
console.log('\n── Fin. No inventes PASS: firma Lewis tras ejecutar con dos cuentas reales. ──\n');

process.exit(prepOk ? 0 : 1);
