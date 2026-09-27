import { describe, expect, it } from 'vitest';
import {
  GLOBAL_COUNTRIES,
  LOCALIZATION_ONLY_COUNTRIES,
  countryCapability,
  countryFlagForCode,
  isAutomaticCountryCalculationEnabled,
  runtimeSafeCountryConfig
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

  it('strips legacy ES/MX/US economics before legacy modules can consume them', () => {
    for (const code of ['ES', 'MX', 'US']) {
      const raw = GLOBAL_COUNTRIES.find((country) => country.country_code === code);
      expect(raw).toBeDefined();
      const safe = runtimeSafeCountryConfig(raw!);
      expect(safe.country_code).toBe(code);
      expect(safe.currency).toBe(raw!.currency);
      expect(safe.min_fare).toBe(0);
      expect(safe.per_km_rate).toBe(0);
      expect(safe.per_min_rate).toBe(0);
      expect(safe.default_commission_pct).toBe(0);
      expect(safe.vat_pct).toBe(0);
      expect(safe.income_tax_brackets).toEqual([]);
      expect(safe.social_security_pct).toBe(0);
      expect(safe.avg_fuel_price).toBe(0);
      expect(safe.platforms).toEqual([]);
      expect(safe.banking_metadata.compatible_banks).toEqual([]);
      expect(safe.labor_advisor.registration_steps).toEqual([]);
      expect(safe.labor_advisor.recommended_retention_pct).toBe(0);
    }
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
