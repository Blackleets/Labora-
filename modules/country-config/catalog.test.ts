import { describe, expect, it } from 'vitest';
import {
  GLOBAL_COUNTRIES,
  LOCALIZATION_ONLY_COUNTRIES,
  countryCapability,
  countryFlagForCode,
  isAutomaticCountryCalculationEnabled
} from './catalog';

describe('global country catalog', () => {
  it('uses unique ISO-2 country codes', () => {
    const codes = GLOBAL_COUNTRIES.map((country) => country.country_code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.every((code) => /^[A-Z]{2}$/.test(code))).toBe(true);
  });

  it('keeps localization-only countries free of inherited fiscal/platform mock data', () => {
    expect(LOCALIZATION_ONLY_COUNTRIES.length).toBeGreaterThan(20);
    for (const country of LOCALIZATION_ONLY_COUNTRIES) {
      expect(country.platforms).toEqual([]);
      expect(country.income_tax_brackets).toEqual([]);
      expect(country.vat_pct).toBe(0);
      expect(country.social_security_pct).toBe(0);
      expect(country.default_commission_pct).toBe(0);
      expect(country.min_fare).toBe(0);
      expect(country.events).toEqual([]);
      expect(country.cities).toEqual([]);
      expect(countryCapability(country.country_code)).toBe('localization_only');
    }
  });

  it('does not enable automatic tax/pricing calculations without a verified pack', () => {
    expect(isAutomaticCountryCalculationEnabled('ES')).toBe(false);
    expect(isAutomaticCountryCalculationEnabled('MX')).toBe(false);
    expect(isAutomaticCountryCalculationEnabled('US')).toBe(false);
    expect(isAutomaticCountryCalculationEnabled('CO')).toBe(false);
  });

  it('generates flags from ISO country codes without a manual switch list', () => {
    expect(countryFlagForCode('ES')).toBe('🇪🇸');
    expect(countryFlagForCode('br')).toBe('🇧🇷');
    expect(countryFlagForCode('JP')).toBe('🇯🇵');
    expect(countryFlagForCode('bad')).toBe('🌍');
  });

  it('contains a broad global localization baseline', () => {
    const codes = new Set(GLOBAL_COUNTRIES.map((country) => country.country_code));
    for (const code of ['ES', 'MX', 'US', 'BR', 'CO', 'AR', 'PE', 'GB', 'FR', 'DE', 'PT', 'CA', 'AU', 'IN', 'JP', 'KR']) {
      expect(codes.has(code)).toBe(true);
    }
  });
});
