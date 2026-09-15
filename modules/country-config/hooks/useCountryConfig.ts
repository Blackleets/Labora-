
import { useContext } from 'react';
import { CountryContext } from '../../../contexts/CountryContext';
import { DEFAULT_SPAIN_CONFIG, CountryConfig } from '../types';

/**
 * Hook para que los módulos existentes (Simulator, Dashboard, etc.)
 * obtengan la configuración del país actual.
 * 
 * Implementa patrón de "Graceful Degradation":
 * Si la feature flag está apagada, devuelve hardcoded España.
 */
export const useCountryConfig = (): CountryConfig => {
  const context = useContext(CountryContext);
  
  // Check feature flag (mocked for now, assumes enabled if code is present)
  // En producción real: const enabled = useFeatureFlag('country_expand_v1');
  const featureEnabled = true; 

  if (!featureEnabled || !context) {
    return DEFAULT_SPAIN_CONFIG;
  }

  return context.selectedCountry;
};
