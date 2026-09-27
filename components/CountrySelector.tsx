import React, { useMemo, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { useCountry } from '../contexts/CountryContext';
import { countryFlagForCode } from '../modules/country-config/catalog';

interface CountrySelectorProps {
  variant?: 'dropdown' | 'cards';
}

const CountrySelector: React.FC<CountrySelectorProps> = ({ variant = 'dropdown' }) => {
  const { selectedCountry, selectCountry, countries } = useCountry();
  const [filterQuery, setFilterQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredCountries = useMemo(() => {
    const query = filterQuery.toLowerCase().trim();
    if (!query) return countries;
    return countries.filter((country) =>
      country.country_code.toLowerCase().includes(query) ||
      country.display_name.toLowerCase().includes(query) ||
      country.currency.toLowerCase().includes(query)
    );
  }, [countries, filterQuery]);

  if (variant === 'cards') {
    return (
      <div className="space-y-4 w-full">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar país, código o moneda"
            value={filterQuery}
            onChange={(event) => setFilterQuery(event.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#4285F4] focus:bg-white outline-none transition-all"
          />
          {filterQuery && (
            <button
              type="button"
              onClick={() => setFilterQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Limpiar búsqueda de país"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {filteredCountries.map((country) => (
            <button
              type="button"
              key={country.country_code}
              onClick={() => selectCountry(country.country_code)}
              title={country.display_name}
              className={`p-3 rounded-xl border text-center transition-all animate-in fade-in zoom-in-95 duration-200 ${
                selectedCountry.country_code === country.country_code
                  ? 'border-[#4285F4] bg-blue-50 text-[#4285F4] font-bold shadow-sm'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl block mb-1" aria-hidden="true">{countryFlagForCode(country.country_code)}</span>
              <span className="text-xs">{country.country_code}</span>
            </button>
          ))}
          {filteredCountries.length === 0 && (
            <div className="col-span-3 py-4 text-center text-xs text-gray-400 italic" role="status">
              No se encontraron países
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-full transition-colors"
        aria-label={`País: ${selectedCountry.display_name}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="text-lg" aria-hidden="true">{countryFlagForCode(selectedCountry.country_code)}</span>
        <span className="text-sm font-bold text-gray-700">{selectedCountry.country_code}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 border-b border-gray-50 bg-gray-50/50">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
              <input
                type="text"
                placeholder="País, código o moneda..."
                value={filterQuery}
                onChange={(event) => setFilterQuery(event.target.value)}
                className="w-full pl-7 pr-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-[#4285F4]"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto py-1" role="listbox" aria-label="País de operación">
            {filteredCountries.map((country) => (
              <button
                type="button"
                role="option"
                aria-selected={selectedCountry.country_code === country.country_code}
                key={country.country_code}
                onClick={() => {
                  selectCountry(country.country_code);
                  setFilterQuery('');
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between text-sm font-medium ${
                  selectedCountry.country_code === country.country_code ? 'text-[#4285F4] bg-blue-50/50' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg shrink-0" aria-hidden="true">{countryFlagForCode(country.country_code)}</span>
                  <span className="truncate">{country.display_name}</span>
                </div>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase shrink-0">
                  {country.country_code}
                </span>
              </button>
            ))}
            {filteredCountries.length === 0 && (
              <div className="px-4 py-3 text-xs text-gray-400 italic text-center" role="status">
                Sin resultados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySelector;
