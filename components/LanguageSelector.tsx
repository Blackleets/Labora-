import React from 'react';
import { Languages } from 'lucide-react';
import { Locale, useLocale } from '../contexts/LocaleContext';

interface LanguageSelectorProps {
  variant?: 'compact' | 'settings';
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'compact' }) => {
  const { locale, setLocale, text } = useLocale();
  const selectId = variant === 'settings' ? 'labora-settings-language' : 'labora-header-language';

  if (variant === 'settings') {
    return (
      <div className="rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-parchment)] p-3.5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[var(--labora-surface)] text-[var(--labora-primary)]" aria-hidden>
            <Languages size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <label htmlFor={selectId} className="block text-sm font-extrabold text-[var(--labora-ink)]">
              {text('languageAndRegion')}
            </label>
            <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--labora-muted)]">
              {text('languageDescription')}
            </p>
            <select
              id={selectId}
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
              className="mt-3 min-h-11 w-full rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3.5 text-sm font-bold text-[var(--labora-ink)] outline-none transition focus:border-[var(--labora-primary-2)] focus:ring-2 focus:ring-[var(--labora-moss-soft)] sm:max-w-xs"
            >
              <option value="es">ES · {text('spanish')}</option>
              <option value="en">EN · {text('english')}</option>
            </select>
            <p className="mt-2 text-[10px] leading-relaxed text-[var(--labora-muted)]">
              {text('coverageNotice')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <label
      htmlFor={selectId}
      className="labora-icon-btn flex h-10 shrink-0 items-center gap-1.5 rounded-2xl border border-[color:var(--labora-border,#E8DFC8)] bg-[color:var(--labora-surface,#FFFEFB)] px-2.5 text-[color:var(--labora-ink,#1E2A24)] shadow-sm"
      title={text('language')}
    >
      <Languages size={15} aria-hidden />
      <span className="sr-only">{text('language')}</span>
      <select
        id={selectId}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        aria-label={text('language')}
        className="cursor-pointer appearance-none bg-transparent pr-0.5 text-[11px] font-extrabold text-inherit outline-none"
      >
        <option value="es">ES</option>
        <option value="en">EN</option>
      </select>
    </label>
  );
};

export default LanguageSelector;
