import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import type { CountryConfig } from '../modules/country-config/types';
import { DEFAULT_SPAIN_CONFIG } from '../modules/country-config/types';
import { GLOBAL_COUNTRIES } from '../modules/country-config/catalog';
import { useData } from './DataContext';

interface CountryContextType {
  selectedCountry: CountryConfig;
  selectCountry: (code: string) => void;
  countries: CountryConfig[];
  refreshCountries: () => Promise<void>;
}

export const CountryContext = createContext<CountryContextType | undefined>(undefined);

const resolveCountry = (code: string | undefined | null): CountryConfig =>
  GLOBAL_COUNTRIES.find((country) => country.country_code === code) || DEFAULT_SPAIN_CONFIG;

/**
 * Must sit under DataProvider so it can hydrate from the logged-in profile.
 * Guest / pre-login: localStorage only. Logged-in: profile.countryCode wins.
 *
 * GLOBAL_COUNTRIES separates country/localization availability from fiscal support:
 * selecting a country never implies that tax, platform pricing or banking data is verified.
 */
export const CountryProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const { currentUser } = useData();

  const [selectedCountry, setSelectedCountry] = useState<CountryConfig>(() => {
    const storedCode = typeof localStorage !== 'undefined' ? localStorage.getItem('labora_country') : null;
    return resolveCountry(storedCode);
  });

  useEffect(() => {
    if (currentUser?.countryCode) {
      const fromProfile = resolveCountry(currentUser.countryCode);
      setSelectedCountry((previous) =>
        previous.country_code === fromProfile.country_code ? previous : fromProfile
      );
      return;
    }
    const storedCode = localStorage.getItem('labora_country');
    if (storedCode) {
      const fromGuest = resolveCountry(storedCode);
      setSelectedCountry((previous) =>
        previous.country_code === fromGuest.country_code ? previous : fromGuest
      );
    }
  }, [currentUser?.id, currentUser?.countryCode]);

  const selectCountry = (code: string) => {
    const found = GLOBAL_COUNTRIES.find((country) => country.country_code === code);
    if (!found) return;
    localStorage.setItem('labora_country', found.country_code);
    setSelectedCountry(found);
  };

  const refreshCountries = async () => Promise.resolve();

  return (
    <CountryContext.Provider value={{ selectedCountry, selectCountry, countries: GLOBAL_COUNTRIES, refreshCountries }}>
      {children}
    </CountryContext.Provider>
  );
};

export const useCountry = () => {
  const context = useContext(CountryContext);
  if (!context) throw new Error('useCountry must be used within a CountryProvider');
  return context;
};
