import { describe, expect, it } from 'vitest';
import { getCountryFlagUrl } from './CountryFlag';

describe('CountryFlag', () => {
  it('maps supported ISO2 country codes to bundled SVG flags', () => {
    expect(getCountryFlagUrl('ES')).toBeTruthy();
    expect(getCountryFlagUrl('gb')).toBeTruthy();
  });

  it('rejects invalid country codes instead of showing regional letters', () => {
    expect(getCountryFlagUrl('ESP')).toBeNull();
    expect(getCountryFlagUrl('')).toBeNull();
  });
});
