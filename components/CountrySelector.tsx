
import React, { useState, useMemo } from 'react';
import { useCountry } from '../contexts/CountryContext';
import { Globe, ChevronDown, Search, X } from 'lucide-react';

interface CountrySelectorProps {
  variant?: 'dropdown' | 'cards';
}

const CountrySelector: React.FC<CountrySelectorProps> = ({ variant = 'dropdown' }) => {
  const { selectedCountry, selectCountry, countries } = useCountry();
  const [filterQuery, setFilterQuery] = useState('');

  const filteredCountries = useMemo(() => {
    const query = filterQuery.toLowerCase().trim();
    if (!query) return countries;
    return countries.filter(c => 
      c.country_code.toLowerCase().includes(query) || 
      c.display_name.toLowerCase().includes(query)
    );
  }, [countries, filterQuery]);

  const getFlag = (code: string) => {
    switch (code) {
      case 'ES': return '🇪🇸';
      case 'MX': return '🇲🇽';
      case 'US': return '🇺🇸';
      default: return '🌍';
    }
  };

  if (variant === 'cards') {
    return (
      <div className="space-y-4 w-full">
        {/* Search Bar for Cards View */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text"
            placeholder="Buscar por código (ES, MX...)"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#4285F4] focus:bg-white outline-none transition-all"
          />
          {filterQuery && (
            <button 
              onClick={() => setFilterQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {filteredCountries.map(c => (
            <button
              key={c.country_code}
              onClick={() => selectCountry(c.country_code)}
              className={`p-3 rounded-xl border text-center transition-all animate-in fade-in zoom-in-95 duration-200 ${
                selectedCountry.country_code === c.country_code 
                  ? 'border-[#4285F4] bg-blue-50 text-[#4285F4] font-bold shadow-sm' 
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl block mb-1">{getFlag(c.country_code)}</span>
              <span className="text-xs">{c.country_code}</span>
            </button>
          ))}
          {filteredCountries.length === 0 && (
            <div className="col-span-3 py-4 text-center text-xs text-gray-400 italic">
              No se encontraron países
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-full transition-colors">
        <span className="text-lg">{getFlag(selectedCountry.country_code)}</span>
        <span className="text-sm font-bold text-gray-700">{selectedCountry.country_code}</span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>
      
      <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden hidden group-hover:block z-50 animate-in fade-in zoom-in-95 duration-200">
        {/* Mini Search inside Dropdown */}
        <div className="p-2 border-b border-gray-50 bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
            <input 
              type="text"
              placeholder="Filtrar..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-[#4285F4]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto py-1">
          {filteredCountries.map(c => (
            <button
              key={c.country_code}
              onClick={() => {
                selectCountry(c.country_code);
                setFilterQuery('');
              }}
              className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between text-sm font-medium ${
                selectedCountry.country_code === c.country_code ? 'text-[#4285F4] bg-blue-50/50' : 'text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{getFlag(c.country_code)}</span>
                <span>{c.display_name}</span>
              </div>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase">
                {c.country_code}
              </span>
            </button>
          ))}
          {filteredCountries.length === 0 && (
            <div className="px-4 py-3 text-xs text-gray-400 italic text-center">
              Sin resultados
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CountrySelector;
