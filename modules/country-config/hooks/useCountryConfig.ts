import { useContext } from 'react';
import { CountryContext } from '../../../contexts/CountryContext';
import { runtimeSafeCountryConfig } from '../catalog';
import { createLocalizationOnlyCountry } from '../catalog';
import type { CountryConfig } from '../types';

const SAFE_FALLBACK = createLocalizationOnlyCountry({
  code: 'ES',
  name: 'España',
  currency: 'EUR',
  symbol: '€'
});

/**
 * Single runtime boundary for modules that consume CountryConfig.
 *
 * Selecting a country exposes localization data, but economic/fiscal/banking
 * values stay stripped until that jurisdiction has a verified pack. This protects
 * legacy modules that have not yet migrated to a capability-specific API.
 */
export const useCountryConfig = (): CountryConfig => {
  const context = useContext(CountryContext);
  if (!context) return SAFE_FALLBACK;
  return runtimeSafeCountryConfig(context.selectedCountry);
};
