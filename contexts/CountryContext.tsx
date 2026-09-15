
import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { CountryConfig, DEFAULT_SPAIN_CONFIG, DEFAULT_MEXICO_CONFIG, DEFAULT_USA_CONFIG, OTHER_COUNTRIES } from '../modules/country-config/types';

interface CountryContextType {
  selectedCountry: CountryConfig;
  selectCountry: (code: string) => void;
  countries: CountryConfig[];
  refreshCountries: () => Promise<void>;
}

export const CountryContext = createContext<CountryContextType | undefined>(undefined);

export const CountryProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryConfig>(DEFAULT_SPAIN_CONFIG);

  const countries = [
    DEFAULT_SPAIN_CONFIG, 
    DEFAULT_MEXICO_CONFIG, 
    DEFAULT_USA_CONFIG,
    ...OTHER_COUNTRIES
  ];

  const selectCountry = (code: string) => {
    const found = countries.find(c => c.country_code === code);
    if (found) setSelectedCountry(found);
  };

  const refreshCountries = async () => {
    // In a real app, this would fetch updated configs from an API.
    // For now, we rely on the static defaults.
    return Promise.resolve();
  };

  return (
    <CountryContext.Provider value={{ selectedCountry, selectCountry, countries, refreshCountries }}>
      {children}
    </CountryContext.Provider>
  );
};

export const useCountry = () => {
  const context = useContext(CountryContext);
  if (!context) throw new Error("useCountry must be used within a CountryProvider");
  return context;
};
