import React from 'react';
import { Search, X } from 'lucide-react';
import { formControlFocusClass } from './formA11y';

export interface MoneyFilterSelect {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

interface MoneyFilterBarProps {
  idPrefix: string;
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  selects: MoneyFilterSelect[];
  active: boolean;
  onClear: () => void;
}

const controlClass = `min-h-10 w-full rounded-[12px] border border-[var(--labora-border)] bg-[var(--labora-surface-2)] px-3 text-xs font-semibold text-[var(--labora-ink-soft)] outline-none focus:border-[var(--labora-primary-2)] ${formControlFocusClass}`;

/** Barra de búsqueda + filtros para listas de dinero. Solo filtra lo ya cargado. */
export const MoneyFilterBar: React.FC<MoneyFilterBarProps> = ({ idPrefix, query, onQueryChange, placeholder, selects, active, onClear }) => (
  <div className="grid gap-2 border-b border-[var(--labora-border)] px-4 py-3 sm:grid-cols-2 xl:grid-cols-3" role="search">
    <div className="relative">
      <label htmlFor={`${idPrefix}-q`} className="sr-only">Buscar</label>
      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--labora-muted)]" aria-hidden />
      <input
        id={`${idPrefix}-q`}
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
        className={`${controlClass} pl-8`}
      />
    </div>
    {selects.map((select) => (
      <div key={select.id}>
        <label htmlFor={`${idPrefix}-${select.id}`} className="sr-only">{select.label}</label>
        <select
          id={`${idPrefix}-${select.id}`}
          value={select.value}
          onChange={(event) => select.onChange(event.target.value)}
          className={controlClass}
          aria-label={select.label}
        >
          {select.options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    ))}
    {active && (
      <button
        type="button"
        onClick={onClear}
        className={`inline-flex min-h-10 items-center justify-center gap-1 rounded-[12px] px-3 text-[11px] font-extrabold text-[var(--labora-primary)] hover:bg-[var(--labora-moss-soft)] ${formControlFocusClass}`}
      >
        <X size={13} aria-hidden /> Quitar filtros
      </button>
    )}
  </div>
);
