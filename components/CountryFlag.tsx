import React from 'react';

interface CountryFlagProps {
  code: string;
  name?: string;
  className?: string;
}

const SUPPORTED_COUNTRY_CODES = new Set(['AR', 'CL', 'CO', 'DE', 'ES', 'FR', 'GB', 'IT', 'MX', 'PE', 'US']);

export const getCountryFlagUrl = (code: string) => {
  const normalizedCode = code.trim().toUpperCase();
  if (!SUPPORTED_COUNTRY_CODES.has(normalizedCode)) return null;
  return `${import.meta.env.BASE_URL}flags/${normalizedCode.toLowerCase()}.svg`;
};

const CountryFlag: React.FC<CountryFlagProps> = ({ code, name, className = '' }) => {
  const flagUrl = getCountryFlagUrl(code);

  if (!flagUrl) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex aspect-[4/3] w-6 items-center justify-center rounded bg-[var(--labora-surface-2)] text-[10px] font-bold text-[var(--labora-muted)] ${className}`}
      >
        ·
      </span>
    );
  }

  return (
    <img
      src={flagUrl}
      alt={name ? `Bandera de ${name}` : `Bandera ${code.toUpperCase()}`}
      className={`aspect-[4/3] w-6 shrink-0 rounded-[4px] object-cover shadow-[0_0_0_1px_rgba(26,39,31,0.12)] ${className}`}
    />
  );
};

export default CountryFlag;
