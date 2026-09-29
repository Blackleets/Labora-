import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./Toast.tsx', import.meta.url), 'utf8');

describe('Toast mobile layout', () => {
  it('keeps notices above the mobile navigation and restores desktop placement', () => {
    expect(source).toContain('bottom-[calc(env(safe-area-inset-bottom)+6.5rem)]');
    expect(source).toContain('sm:bottom-auto');
    expect(source).toContain('sm:top-4');
  });

  it('exposes dismiss and alert semantics', () => {
    expect(source).toContain('aria-label="Cerrar aviso"');
    expect(source).toContain("role={notif.type === 'error' ? 'alert' : 'status'}");
  });
});
