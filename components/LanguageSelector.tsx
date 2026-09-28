import React from 'react';
import { Languages } from 'lucide-react';
import { Language, useI18n } from '../modules/core/i18n';

const OPTIONS: Array<{ code: Language; label: string; short: string }> = [
  { code: 'es', label: 'Español', short: 'ES' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'pt', label: 'Português', short: 'PT' }
];

const COPY: Record<Language, { title: string; helper: string }> = {
  es: {
    title: 'Idioma de la aplicación',
    helper: 'Es independiente del país de operación. La preferencia se conserva en este dispositivo.'
  },
  en: {
    title: 'Application language',
    helper: 'This is independent from your operating country. The preference is saved on this device.'
  },
  pt: {
    title: 'Idioma do aplicativo',
    helper: 'É independente do país de operação. A preferência fica salva neste dispositivo.'
  }
};

const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useI18n();
  const copy = COPY[language];

  return (
    <section className="labora-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]">
          <Languages size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="labora-kicker text-[var(--labora-muted)]">{t('common.language')}</p>
          <h2 className="mt-1 text-base font-extrabold text-[var(--labora-ink)]">{copy.title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-[var(--labora-muted)]">
            {copy.helper}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label={copy.title}>
        {OPTIONS.map((option) => {
          const active = language === option.code;
          return (
            <button
              key={option.code}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setLanguage(option.code)}
              className={`rounded-[13px] border px-3 py-3 text-center transition ${
                active
                  ? 'border-[var(--labora-primary-2)] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]'
                  : 'border-[var(--labora-border)] bg-[var(--labora-surface)] text-[var(--labora-muted)] hover:bg-[var(--labora-surface-2)]'
              }`}
            >
              <span className="block text-[10px] font-black tracking-[0.08em]">{option.short}</span>
              <span className="mt-1 block text-xs font-extrabold">{option.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default LanguageSelector;
