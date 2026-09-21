#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'services', 'supabaseClient.ts'), 'utf8');
const url = process.env.VITE_SUPABASE_URL || source.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)/)?.[1];
const key = process.env.VITE_SUPABASE_ANON_KEY || source.match(/SUPABASE_PUBLISHABLE_KEY\s*=\s*['"]([^'"]+)/)?.[1];

if (!url || !key) {
  console.error('BLOCKED: public Supabase client configuration is missing.');
  process.exit(2);
}

const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const tables = ['profiles', 'messages', 'documents', 'requirements', 'billing_accounts', 'stripe_webhook_events'];
const results = [];

for (const table of tables) {
  const { data, error } = await client.from(table).select('*').limit(1);
  const leaked = Array.isArray(data) && data.length > 0;
  results.push({ boundary: `table:${table}`, pass: !leaked, response: error ? 'denied' : 'empty' });
}

for (const bucket of ['labora-documents', 'labora-identity']) {
  const { data, error } = await client.storage.from(bucket).list('', { limit: 1 });
  const leaked = Array.isArray(data) && data.length > 0;
  results.push({ boundary: `bucket:${bucket}`, pass: !leaked, response: error ? 'denied' : 'empty' });
}

const { error: rpcError } = await client.rpc('unlink_own_manager');
results.push({ boundary: 'rpc:unlink_own_manager', pass: Boolean(rpcError), response: rpcError ? 'denied' : 'unexpected_success' });

for (const item of results) {
  console.log(`[${item.pass ? 'PASS' : 'FAIL'}] ${item.boundary}: ${item.response}`);
}

const failed = results.filter((item) => !item.pass);
console.log(`ANON_SECURITY_JSON=${JSON.stringify({ pass: failed.length === 0, results })}`);
process.exit(failed.length ? 1 : 0);
