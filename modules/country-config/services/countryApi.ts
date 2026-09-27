import type { CountryConfig } from '../types';
import { GLOBAL_COUNTRIES } from '../catalog';

/**
 * Read-only country catalog adapter.
 *
 * This is intentionally NOT presented as a REST API and does not simulate network
 * latency or persist fiscal configuration in localStorage. Country packs that may
 * affect tax/pricing must be versioned in code and reviewed before activation.
 */
const readonlyError = () => new Error(
  'La configuración global de países es de solo lectura. Publica un pack versionado y revisado en el repositorio para cambiar datos fiscales o tarifarios.'
);

export const countryApi = {
  getAll: async (): Promise<CountryConfig[]> => GLOBAL_COUNTRIES.map((country) => ({ ...country })),

  getOne: async (code: string): Promise<CountryConfig | undefined> => {
    const normalized = code.trim().toUpperCase();
    return GLOBAL_COUNTRIES.find((country) => country.country_code === normalized);
  },

  create: async (_config: CountryConfig): Promise<CountryConfig> => {
    throw readonlyError();
  },

  update: async (_code: string, _config: CountryConfig): Promise<CountryConfig> => {
    throw readonlyError();
  },

  delete: async (_code: string): Promise<void> => {
    throw readonlyError();
  }
};
