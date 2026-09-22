import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MEXICO_CONFIG,
  DEFAULT_SPAIN_CONFIG,
  DEFAULT_USA_CONFIG,
  OTHER_COUNTRIES
} from './types';

describe('country fiscal knowledge gate', () => {
  const countries = [DEFAULT_SPAIN_CONFIG, DEFAULT_MEXICO_CONFIG, DEFAULT_USA_CONFIG, ...OTHER_COUNTRIES];

  it('never marks a country verified without official sources and review metadata', () => {
    for (const country of countries) {
      if (country.knowledge.status !== 'verified') continue;
      expect(country.knowledge.sources.length).toBeGreaterThan(0);
      expect(country.knowledge.effective_from).toBeTruthy();
      expect(country.knowledge.reviewed_at).toBeTruthy();
      expect(country.knowledge.reviewer).toBeTruthy();
    }
  });

  it('keeps identity-only countries free of inherited tax and pricing assumptions', () => {
    for (const country of OTHER_COUNTRIES) {
      expect(country.knowledge.status).toBe('identity_only');
      expect(country.income_tax_brackets).toEqual([]);
      expect(country.platforms).toEqual([]);
      expect(country.vat_pct).toBe(0);
      expect(country.social_security_pct).toBe(0);
      expect(country.min_fare).toBe(0);
    }
  });
});
