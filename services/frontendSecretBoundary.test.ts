import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => vi.unstubAllEnvs());

it('does not substitute server Gemini credentials into a browser build', async () => {
  const marker = 'LABORA_FAKE_SERVER_SECRET_BUILD_SENTINEL';
  vi.stubEnv('GEMINI_API_KEY', marker);
  const fixture = await mkdtemp(path.join(tmpdir(), 'labora-secret-boundary-'));
  try {
    await writeFile(path.join(fixture, 'index.html'), '<script type="module" src="/entry.js"></script>');
    await writeFile(path.join(fixture, 'entry.js'), 'document.title = String(process.env.API_KEY) + String(process.env.GEMINI_API_KEY);');
    const result = await build({
      configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
      root: fixture,
      logLevel: 'silent',
      build: { write: false }
    });
    const outputs = Array.isArray(result) ? result : [result];
    const browserCode = outputs.flatMap(output => 'output' in output ? output.output : [])
      .map(output => output.type === 'chunk' ? output.code : String(output.source)).join('\n');
    expect(browserCode.length).toBeGreaterThan(0);
    expect(browserCode.includes(marker)).toBe(false);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
