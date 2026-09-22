import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { useData } from './DataContext';

export type Locale = 'es' | 'en';

export const DEFAULT_LOCALE: Locale = 'es';
export const LOCALE_STORAGE_KEY = 'labora_locale';

export const isSupportedLocale = (value: unknown): value is Locale =>
  value === 'es' || value === 'en';

export const localeStorageKey = (userId?: string | null) =>
  userId ? `${LOCALE_STORAGE_KEY}:${userId}` : LOCALE_STORAGE_KEY;

export const resolveStoredLocale = (
  getItem: (key: string) => string | null,
  userId?: string | null
): Locale => {
  const userLocale = userId ? getItem(localeStorageKey(userId)) : null;
  if (isSupportedLocale(userLocale)) return userLocale;

  const globalLocale = getItem(LOCALE_STORAGE_KEY);
  return isSupportedLocale(globalLocale) ? globalLocale : DEFAULT_LOCALE;
};

type LocaleCopyKey =
  | 'language'
  | 'languageAndRegion'
  | 'languageDescription'
  | 'spanish'
  | 'english'
  | 'coverageNotice';

const copy: Record<Locale, Record<LocaleCopyKey, string>> = {
  es: {
    language: 'Idioma',
    languageAndRegion: 'Idioma y región',
    languageDescription: 'El idioma de la aplicación es independiente de tu país de actividad.',
    spanish: 'Español',
    english: 'Inglés',
    coverageNotice: 'La traducción se está incorporando por etapas. Algunas pantallas siguen en español.'
  },
  en: {
    language: 'Language',
    languageAndRegion: 'Language and region',
    languageDescription: 'The app language is independent from your country of activity.',
    spanish: 'Spanish',
    english: 'English',
    coverageNotice: 'Translation is being added in stages. Some screens are still in Spanish.'
  }
};

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  text: (key: LocaleCopyKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const readLocale = (userId?: string | null): Locale => {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    return resolveStoredLocale((key) => window.localStorage.getItem(key), userId);
  } catch {
    return DEFAULT_LOCALE;
  }
};

export const LocaleProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { currentUser } = useData();
  const userId = currentUser?.id;
  const [locale, setLocaleState] = useState<Locale>(() => readLocale(userId));

  useEffect(() => {
    setLocaleState(readLocale(userId));
  }, [userId]);

  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale: (nextLocale) => {
      if (!isSupportedLocale(nextLocale)) return;
      setLocaleState(nextLocale);
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(localeStorageKey(userId), nextLocale);
      } catch {
        // The in-memory preference remains usable when storage is unavailable.
      }
    },
    text: (key) => copy[locale][key]
  }), [locale, userId]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within a LocaleProvider');
  return context;
};
