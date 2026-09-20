#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const doc = join(root, 'docs', 'UAT_DUAL_ACCOUNT.md');

console.log('\n══ Labora+ · UAT dual-cuenta (checklist) ══\n');
console.log(readFileSync(doc, 'utf8'));
console.log('\n── Fin checklist. No inventes PASS: firma Lewis tras ejecutar. ──\n');
console.log('Tests fail-closed (sin secrets): npm test');
console.log('Detalle smoke: scripts/uat-dual-smoke.md\n');
