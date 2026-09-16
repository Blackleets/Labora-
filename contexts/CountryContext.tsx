import React, { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { CountryConfig } from '../modules/country-config/types';
import { MARKET_PROFILES, MarketProfile, getMarketProfile } from '../modules/country-config/marketProfiles';

interface CountryContextType {
  selectedCountry: CountryConfig;
  selectCountry: (code: string) => void;
  countries: CountryConfig[];
  refreshCountries: () => Promise<void>;
}

export const CountryContext = createContext<CountryContextType | undefined>(undefined);

const toSafeCountryConfig = (market: MarketProfile): CountryConfig => ({
  country_code: market.countryCode,
  display_name: market.displayName,
  currency: market.currency,
  currency_symbol: market.currencySymbol,
  min_fare: 0,
  per_km_rate: 0,
  per_min_rate: 0,
  default_commission_pct: 0,
  vat_pct: 0,
  income_tax_brackets: [],
  legal_notes: market.fiscalEngineStatus === 'verified'
    ? 'La fiscalidad se calcula en un motor separado, versionado y sujeto a revisión; este perfil no contiene tipos ni obligaciones.'
    : 'Labora+ no tiene fiscalidad local activada para este mercado. Solo control financiero, documental y colaboración con asesor.',
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
    compatible_banks: [],
  },
  vehicle_benchmarks: {
    avg_insurance_cost_yr: { bicycle: 0, motorcycle: 0, car: 0 },
    avg_maintenance_yr: { bicycle: 0, motorcycle: 0, car: 0 },
  },
  labor_advisor: {
    tax_entity_name: 'Autoridad fiscal local',
    registration_steps: [],
    tax_obligations: [],
    contract_types: [],
    recommended_retention_pct: 0,
    freelancer_threshold_note: market.fiscalEngineStatus === 'verified'
      ? 'Consulta el módulo fiscal verificado y a tu asesor antes de presentar.'
      : 'Fiscalidad local no habilitada en Labora+ para este país.',
  },
  events: [],
  cities: [],
  map_config: {
    default_city: market.displayName,
    center: { lat: 0, lng: 0 },
    zoom: 2,
  },
});

export const CountryProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [selectedCode, setSelectedCode] = useState('ES');
  const countries = useMemo(() => MARKET_PROFILES.map(toSafeCountryConfig), []);
  const selectedCountry = useMemo(
    () => toSafeCountryConfig(getMarketProfile(selectedCode)),
    [selectedCode],
  );

  const selectCountry = (code: string) => {
    if (MARKET_PROFILES.some((profile) => profile.countryCode === code)) setSelectedCode(code);
  };

  const refreshCountries = async () => Promise.resolve();

  return (
    <CountryContext.Provider value={{ selectedCountry, selectCountry, countries, refreshCountries }}>
      {children}
    </CountryContext.Provider>
  );
};

export const useCountry = () => {
  const context = useContext(CountryContext);
  if (!context) throw new Error('useCountry must be used within a CountryProvider');
  return context;
};
