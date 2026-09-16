import { describe, expect, it } from 'vitest';
import {
  MARKET_PROFILES,
  SAFE_UNKNOWN_MARKET_PROFILE,
  getMarketProfile,
} from '../modules/country-config/marketProfiles';

describe('global market profiles', () => {
  it('enables the fiscal engine only for Spain', () => {
    const fiscalEnabled = MARKET_PROFILES.filter((profile) => profile.fiscalEngineStatus === 'verified');
    expect(fiscalEnabled.map((profile) => profile.countryCode)).toEqual(['ES']);
    expect(fiscalEnabled[0].productMode).toBe('fiscal_guided');
  });

  it('keeps every non-Spain market in financial-control mode', () => {
    for (const profile of MARKET_PROFILES.filter((item) => item.countryCode !== 'ES')) {
      expect(profile.productMode).toBe('financial_control');
      expect(profile.fiscalEngineStatus).toBe('not_enabled');
    }
  });

  it('uses unique country codes and ISO-like currency codes', () => {
    const countryCodes = MARKET_PROFILES.map((profile) => profile.countryCode);
    expect(new Set(countryCodes).size).toBe(countryCodes.length);
    for (const profile of MARKET_PROFILES) {
      expect(profile.countryCode).toMatch(/^[A-Z]{2}$/);
      expect(profile.currency).toMatch(/^[A-Z]{3}$/);
    }
  });

  it('supports Venezuela explicitly without importing Spanish tax rules', () => {
    const venezuela = getMarketProfile('ve');
    expect(venezuela.countryCode).toBe('VE');
    expect(venezuela.currency).toBe('VES');
    expect(venezuela.fiscalEngineStatus).toBe('not_enabled');
  });

  it('fails closed for an unknown country instead of falling back to Spain', () => {
    const unknown = getMarketProfile('XY');
    expect(unknown.countryCode).toBe('XY');
    expect(unknown.currency).toBe('XXX');
    expect(unknown.productMode).toBe('financial_control');
    expect(unknown.fiscalEngineStatus).toBe('not_enabled');
    expect(SAFE_UNKNOWN_MARKET_PROFILE.fiscalEngineStatus).toBe('not_enabled');
  });
});
