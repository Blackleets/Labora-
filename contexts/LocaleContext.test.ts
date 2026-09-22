import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  localeStorageKey,
  resolveStoredLocale
} from './LocaleContext';

describe('LocaleContext persistence', () => {
  it('keeps country and language storage independent', () => {
    expect(localeStorageKey()).toBe('labora_locale');
    expect(localeStorageKey('user-1')).toBe('labora_locale:user-1');
    expect(localeStorageKey()).not.toBe('labora_country');
  });

  it('prefers a valid user locale over the guest preference', () => {
    const values: Record<string, string> = {
      labora_locale: 'es',
      'labora_locale:user-1': 'en'
    };
    expect(resolveStoredLocale((key) => values[key] ?? null, 'user-1')).toBe('en');
  });

  it('falls back safely to global Spanish for invalid stored values', () => {
    expect(resolveStoredLocale(() => 'fr', 'user-1')).toBe(DEFAULT_LOCALE);
    expect(isSupportedLocale('es')).toBe(true);
    expect(isSupportedLocale('en')).toBe(true);
    expect(isSupportedLocale('fr')).toBe(false);
  });
});
