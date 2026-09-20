import { CountryConfig } from '../../country-config/types';
import { DemandForecast } from '../types';

/**
 * Offline / experiment stub only — NOT live demand or surge.
 * Previously invented zone scores and Math.random surge multipliers.
 * UI is fail-closed via HotZonesWidget; do not wire this to product surfaces.
 */
export const demandEngine = {
  calculateDemand: (_config: CountryConfig, _vehicleType: string = 'moto'): DemandForecast => {
    throw new Error(
      'demandEngine: unavailable — no verified demand feed; HotZonesWidget stays fail-closed'
    );
  }
};
