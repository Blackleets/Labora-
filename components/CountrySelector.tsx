
import React, { useState, useMemo } from 'react';
import { useCountry } from '../contexts/CountryContext';
import { Globe, ChevronDown, Search, X } from 'lucide-react';

interface CountrySelectorProps {
  variant?: 'dropdown' | 'cards';
}

const CountrySelector: React.FC<CountrySelectorProps> = ({ variant = 'dropdown' }) => {
  const { selectedCountry, selectCountry, countries } = useCountry();
  const [filterQuery, setFilterQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filteredCountries = useMemo(() => {
    const query = filterQuery.toLowerCase().trim();
    if (!query) return countries;
    return countries.filter(c => 
      c.country_code.toLowerCase().includes(query) || 
      c.display_name.toLowerCase().includes(query)
    );
  }, [countries, filterQuery]);

  const getFlag = (code: string) => /^[A-Z]{2}$/.test(code)
    ? String.fromCodePoint(...code.split('').map((letter) => 127397 + letter.charCodeAt(0)))
    : '🌍';

  const knowledgeLabel = (status: string) => status === 'verified'
    ? 'Fiscalidad verificada'
    : status === 'under_review'
      ? 'Fiscalidad en revisión'
      : 'País disponible';

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
              <span className="block text-xs">{c.country_code}</span>
              <span className="mt-1 block text-[8px] font-medium text-[var(--labora-muted)]">{knowledgeLabel(c.knowledge.status)}</span>
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
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex min-h-10 items-center gap-2 rounded-2xl border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3 py-2 transition-colors hover:bg-[var(--labora-surface-2)]" aria-expanded={open} aria-label="Cambiar país">
        <span className="text-lg">{getFlag(selectedCountry.country_code)}</span>
        <span className="hidden text-xs font-bold text-[var(--labora-ink-soft)] sm:inline">{selectedCountry.country_code}</span>
        <ChevronDown size={14} className="text-[var(--labora-muted)]" />
      </button>
      
      {open && <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-[var(--labora-border)] bg-[var(--labora-surface)] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Mini Search inside Dropdown */}
        <div className="p-2 border-b border-gray-50 bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
            <input 
              type="text"
              placeholder="Filtrar..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full rounded-lg border border-[var(--labora-border)] bg-[var(--labora-surface)] py-1.5 pl-7 pr-2 text-xs outline-none focus:border-[var(--labora-primary)]"
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
                setOpen(false);
              }}
              className={`flex min-h-11 w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium hover:bg-[var(--labora-surface-2)] ${
                selectedCountry.country_code === c.country_code ? 'bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]' : 'text-[var(--labora-ink-soft)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{getFlag(c.country_code)}</span>
                <span><span className="block">{c.display_name}</span><span className="block text-[9px] font-medium text-[var(--labora-muted)]">{knowledgeLabel(c.knowledge.status)}</span></span>
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
      </div>}
    </div>
  );
};

export default CountrySelector;
