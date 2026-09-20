import { afterEach, describe, expect, it } from 'vitest';
import { messagingSendErrorEs } from './messagingSendErrorEs';

describe('messagingSendErrorEs', () => {
  afterEach(() => {
    // restore a sane online default for other suites
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { onLine: true }
    });
  });

  it('offline copy is Spanish and never claims queueing', () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { onLine: false }
    });
    const msg = messagingSendErrorEs();
    expect(msg).toMatch(/Sin conexión/i);
    expect(msg).toMatch(/no se ha encolado/i);
    expect(msg.toLowerCase()).not.toMatch(/se encolar|en cola para|se enviará más tarde/);
  });

  it('network failures stay fail-closed without queue claims', () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { onLine: true }
    });
    const msg = messagingSendErrorEs(new Error('Failed to fetch'));
    expect(msg).toMatch(/no se envi/i);
    expect(msg).toMatch(/no se ha encolado/i);
  });

  it('passes through concrete Spanish errors', () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { onLine: true }
    });
    expect(messagingSendErrorEs(new Error('Solo puedes escribir a tu gestoría vinculada.'))).toBe(
      'Solo puedes escribir a tu gestoría vinculada.'
    );
  });
});
