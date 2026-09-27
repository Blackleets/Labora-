import type { CountryConfig, LaborAdvisor } from './types';
import { DEFAULT_MEXICO_CONFIG, DEFAULT_SPAIN_CONFIG, DEFAULT_USA_CONFIG } from './types';

/**
 * Catálogo global seguro.
 *
 * Regla: poder seleccionar un país NO significa que Labora+ conozca su fiscalidad,
 * tarifas de plataformas, bancos o costes locales. Los países sin un pack verificado
 * solo aportan identidad, moneda y nombre; el resto queda fail-closed.
 */
export type CountryCapability = 'legacy_configured' | 'localization_only';

interface CountrySeed {
  code: string;
  name: string;
  currency: string;
  symbol: string;
}

const emptyLaborAdvisor = (countryName: string): LaborAdvisor => ({
  tax_entity_name: 'No configurado',
  registration_steps: [],
  tax_obligations: [],
  contract_types: [],
  recommended_retention_pct: 0,
  freelancer_threshold_note: `Labora+ todavía no tiene un pack fiscal verificado para ${countryName}. Consulta una fuente oficial o tu gestoría antes de tomar decisiones fiscales.`
});

export const createLocalizationOnlyCountry = ({ code, name, currency, symbol }: CountrySeed): CountryConfig => ({
  country_code: code,
  display_name: name,
  currency,
  currency_symbol: symbol,
  min_fare: 0,
  per_km_rate: 0,
  per_min_rate: 0,
  default_commission_pct: 0,
  vat_pct: 0,
  income_tax_brackets: [],
  legal_notes: `Fiscalidad, tarifas, retenciones y costes automáticos no disponibles todavía para ${name}. Labora+ no inventa estos datos.`,
  platforms: [],
  timezone: 'UTC',
  service_fee_flat: 0,
  social_security_pct: 0,
  decimals: 2,
  avg_fuel_price: 0,
  peak_hours: { lunch_start: 0, lunch_end: 0, dinner_start: 0, dinner_end: 0 },
  banking_metadata: {
    instant_payment_options: [],
    platform_payouts: {},
    deposit_time_standard: 'No configurado',
    avg_transfer_fee: 0,
    compatible_banks: []
  },
  vehicle_benchmarks: {
    avg_insurance_cost_yr: { bicycle: 0, motorcycle: 0, car: 0 },
    avg_maintenance_yr: { bicycle: 0, motorcycle: 0, car: 0 }
  },
  labor_advisor: emptyLaborAdvisor(name),
  events: [],
  cities: [],
  map_config: {
    default_city: '',
    center: { lat: 0, lng: 0 },
    zoom: 2
  }
});

const LOCALIZATION_SEEDS: CountrySeed[] = [
  { code: 'AR', name: 'Argentina', currency: 'ARS', symbol: '$' },
  { code: 'AU', name: 'Australia', currency: 'AUD', symbol: 'A$' },
  { code: 'AT', name: 'Austria', currency: 'EUR', symbol: '€' },
  { code: 'BE', name: 'Bélgica', currency: 'EUR', symbol: '€' },
  { code: 'BR', name: 'Brasil', currency: 'BRL', symbol: 'R$' },
  { code: 'CA', name: 'Canadá', currency: 'CAD', symbol: 'C$' },
  { code: 'CL', name: 'Chile', currency: 'CLP', symbol: '$' },
  { code: 'CO', name: 'Colombia', currency: 'COP', symbol: '$' },
  { code: 'CR', name: 'Costa Rica', currency: 'CRC', symbol: '₡' },
  { code: 'CZ', name: 'Chequia', currency: 'CZK', symbol: 'Kč' },
  { code: 'DE', name: 'Alemania', currency: 'EUR', symbol: '€' },
  { code: 'DK', name: 'Dinamarca', currency: 'DKK', symbol: 'kr' },
  { code: 'EC', name: 'Ecuador', currency: 'USD', symbol: '$' },
  { code: 'FR', name: 'Francia', currency: 'EUR', symbol: '€' },
  { code: 'GB', name: 'Reino Unido', currency: 'GBP', symbol: '£' },
  { code: 'GR', name: 'Grecia', currency: 'EUR', symbol: '€' },
  { code: 'IE', name: 'Irlanda', currency: 'EUR', symbol: '€' },
  { code: 'IN', name: 'India', currency: 'INR', symbol: '₹' },
  { code: 'IT', name: 'Italia', currency: 'EUR', symbol: '€' },
  { code: 'JP', name: 'Japón', currency: 'JPY', symbol: '¥' },
  { code: 'KR', name: 'Corea del Sur', currency: 'KRW', symbol: '₩' },
  { code: 'NL', name: 'Países Bajos', currency: 'EUR', symbol: '€' },
  { code: 'NO', name: 'Noruega', currency: 'NOK', symbol: 'kr' },
  { code: 'NZ', name: 'Nueva Zelanda', currency: 'NZD', symbol: 'NZ$' },
  { code: 'PA', name: 'Panamá', currency: 'USD', symbol: '$' },
  { code: 'PE', name: 'Perú', currency: 'PEN', symbol: 'S/' },
  { code: 'PL', name: 'Polonia', currency: 'PLN', symbol: 'zł' },
  { code: 'PT', name: 'Portugal', currency: 'EUR', symbol: '€' },
  { code: 'RO', name: 'Rumanía', currency: 'RON', symbol: 'lei' },
  { code: 'SE', name: 'Suecia', currency: 'SEK', symbol: 'kr' },
  { code: 'SG', name: 'Singapur', currency: 'SGD', symbol: 'S$' },
  { code: 'CH', name: 'Suiza', currency: 'CHF', symbol: 'CHF' },
  { code: 'TR', name: 'Turquía', currency: 'TRY', symbol: '₺' },
  { code: 'UY', name: 'Uruguay', currency: 'UYU', symbol: '$U' }
];

export const LOCALIZATION_ONLY_COUNTRIES: CountryConfig[] = LOCALIZATION_SEEDS.map(createLocalizationOnlyCountry);

/**
 * ES/MX/US se conservan por compatibilidad con funcionalidades ya existentes.
 * Sus datos legacy NO habilitan por sí solos el motor automático de tarifas/impuestos.
 */
export const GLOBAL_COUNTRIES: CountryConfig[] = [
  DEFAULT_SPAIN_CONFIG,
  DEFAULT_MEXICO_CONFIG,
  DEFAULT_USA_CONFIG,
  ...LOCALIZATION_ONLY_COUNTRIES
];

const LOCALIZATION_ONLY_CODES = new Set(LOCALIZATION_ONLY_COUNTRIES.map((country) => country.country_code));

export const countryCapability = (code: string): CountryCapability =>
  LOCALIZATION_ONLY_CODES.has(code.toUpperCase()) ? 'localization_only' : 'legacy_configured';

/**
 * Ningún país queda habilitado para cálculos automáticos hasta que tenga un pack
 * versionado con fuentes oficiales, fecha de vigencia y tests de regresión.
 */
const VERIFIED_AUTOMATIC_CALCULATION_CODES = new Set<string>();

export const isAutomaticCountryCalculationEnabled = (code: string) =>
  VERIFIED_AUTOMATIC_CALCULATION_CODES.has(code.toUpperCase());

export const countryFlagForCode = (code: string): string => {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return '🌍';
  return String.fromCodePoint(...Array.from(normalized).map((char) => 127397 + char.charCodeAt(0)));
};
