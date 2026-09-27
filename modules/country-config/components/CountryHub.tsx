import React, { useMemo, useState } from 'react';
import { Check, Globe2, Search, ShieldCheck } from 'lucide-react';
import { useCountry } from '../../../contexts/CountryContext';
import {
  countryCapability,
  countryFlagForCode,
  isAutomaticCountryCalculationEnabled
} from '../catalog';

export const CountryHub: React.FC = () => {
  const { countries, selectedCountry, selectCountry } = useCountry();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return countries;
    return countries.filter((country) =>
      country.country_code.toLowerCase().includes(normalized) ||
      country.display_name.toLowerCase().includes(normalized) ||
      country.currency.toLowerCase().includes(normalized)
    );
  }, [countries, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="labora-kicker">Cobertura internacional</p>
          <h2 className="mt-2 text-2xl font-bold text-[var(--labora-ink)]">País y jurisdicción</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--labora-muted)]">
            El país controla identidad, moneda y contexto local. La fiscalidad automática solo se activa cuando existe un pack versionado con fuentes oficiales y tests.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--labora-muted)]" size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="País, código o moneda"
            className="w-full rounded-xl border border-[var(--labora-border)] bg-[var(--labora-surface)] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--labora-primary)]/40"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--labora-border)] bg-[var(--labora-moss-soft)] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 shrink-0 text-[var(--labora-primary)]" size={19} />
          <div>
            <p className="text-sm font-semibold text-[var(--labora-ink)]">Global sin inventar datos</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--labora-muted)]">
              Una bandera o una moneda no significan que Labora+ conozca impuestos, retenciones, deducciones, bancos o tarifas locales. Cuando un dato no está verificado, se mantiene desactivado.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((country) => {
          const selected = selectedCountry.country_code === country.country_code;
          const automatic = isAutomaticCountryCalculationEnabled(country.country_code);
          const capability = countryCapability(country.country_code);
          return (
            <button
              type="button"
              key={country.country_code}
              onClick={() => selectCountry(country.country_code)}
              className={`relative rounded-2xl border p-4 text-left transition ${
                selected
                  ? 'border-[var(--labora-primary)]/40 bg-[var(--labora-moss-soft)] shadow-sm'
                  : 'border-[var(--labora-border)] bg-[var(--labora-surface)] hover:border-[var(--labora-primary)]/25'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--labora-canvas)] text-2xl" aria-hidden="true">
                  {countryFlagForCode(country.country_code)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-[var(--labora-ink)]">{country.display_name}</h3>
                      <p className="mt-0.5 text-xs text-[var(--labora-muted)]">{country.country_code} · {country.currency}</p>
                    </div>
                    {selected && <Check size={17} className="shrink-0 text-[var(--labora-primary)]" />}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-[var(--labora-canvas)] px-2 py-1 text-[10px] font-semibold text-[var(--labora-muted)]">
                      {capability === 'localization_only' ? 'Localización' : 'Compatibilidad legacy'}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                      automatic
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {automatic ? 'Fiscalidad verificada' : 'Fiscalidad automática OFF'}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--labora-border)] bg-[var(--labora-surface)] p-8 text-center">
          <Globe2 className="mx-auto text-[var(--labora-muted)]" size={24} />
          <p className="mt-2 text-sm font-semibold text-[var(--labora-ink)]">Sin resultados</p>
          <p className="mt-1 text-xs text-[var(--labora-muted)]">Prueba con el nombre, código ISO o moneda.</p>
        </div>
      )}
    </div>
  );
};
