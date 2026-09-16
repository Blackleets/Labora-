export type LaboraProductMode = 'fiscal_guided' | 'financial_control';
export type LaboraAccountMode = 'self_employed' | 'financial_control';

export interface MarketProfile {
  countryCode: string;
  displayName: string;
  locale: string;
  currency: string;
  currencySymbol: string;
  workerLabel: string;
  advisorLabel: string;
  productMode: LaboraProductMode;
  fiscalEngineStatus: 'verified' | 'not_enabled';
  advisorWorkspace: boolean;
}

const market = (
  countryCode: string,
  displayName: string,
  locale: string,
  currency: string,
  currencySymbol: string,
  workerLabel: string,
  advisorLabel: string,
): MarketProfile => ({
  countryCode,
  displayName,
  locale,
  currency,
  currencySymbol,
  workerLabel,
  advisorLabel,
  productMode: countryCode === 'ES' ? 'fiscal_guided' : 'financial_control',
  fiscalEngineStatus: countryCode === 'ES' ? 'verified' : 'not_enabled',
  advisorWorkspace: true,
});

/**
 * Product availability is deliberately broader than tax-engine availability.
 * Labora+ can safely support income, payouts, expenses, evidence, documents and
 * advisor collaboration in a market without claiming local tax correctness.
 * Country-specific fiscal logic must be separately versioned and verified.
 */
export const MARKET_PROFILES: MarketProfile[] = [
  market('ES', 'España', 'es-ES', 'EUR', '€', 'Autónomo / independiente', 'Gestor / asesor'),
  market('PT', 'Portugal', 'pt-PT', 'EUR', '€', 'Trabalhador independente', 'Contabilista / consultor'),
  market('FR', 'France', 'fr-FR', 'EUR', '€', 'Indépendant', 'Expert-comptable / conseiller'),
  market('IT', 'Italia', 'it-IT', 'EUR', '€', 'Lavoratore autonomo', 'Commercialista / consulente'),
  market('DE', 'Deutschland', 'de-DE', 'EUR', '€', 'Selbstständig', 'Steuerberater / Berater'),
  market('NL', 'Nederland', 'nl-NL', 'EUR', '€', 'Zelfstandige', 'Boekhouder / adviseur'),
  market('BE', 'Belgique / België', 'fr-BE', 'EUR', '€', 'Indépendant / zelfstandige', 'Comptable / adviseur'),
  market('IE', 'Ireland', 'en-IE', 'EUR', '€', 'Self-employed', 'Accountant / tax adviser'),
  market('AT', 'Österreich', 'de-AT', 'EUR', '€', 'Selbstständig', 'Steuerberater / Berater'),
  market('PL', 'Polska', 'pl-PL', 'PLN', 'zł', 'Samozatrudniony', 'Księgowy / doradca'),
  market('CZ', 'Česko', 'cs-CZ', 'CZK', 'Kč', 'OSVČ / independent', 'Účetní / poradce'),
  market('RO', 'România', 'ro-RO', 'RON', 'lei', 'Independent', 'Contabil / consultant'),
  market('GR', 'Ελλάδα', 'el-GR', 'EUR', '€', 'Ελεύθερος επαγγελματίας', 'Λογιστής / σύμβουλος'),
  market('SE', 'Sverige', 'sv-SE', 'SEK', 'kr', 'Egenföretagare', 'Redovisningskonsult'),
  market('NO', 'Norge', 'nb-NO', 'NOK', 'kr', 'Selvstendig', 'Regnskapsfører / rådgiver'),
  market('FI', 'Suomi', 'fi-FI', 'EUR', '€', 'Yrittäjä', 'Kirjanpitäjä / neuvonantaja'),
  market('DK', 'Danmark', 'da-DK', 'DKK', 'kr', 'Selvstændig', 'Revisor / rådgiver'),
  market('GB', 'United Kingdom', 'en-GB', 'GBP', '£', 'Self-employed', 'Accountant / tax adviser'),
  market('US', 'United States', 'en-US', 'USD', '$', 'Independent contractor', 'Accountant / tax professional'),
  market('CA', 'Canada', 'en-CA', 'CAD', 'CA$', 'Self-employed', 'Accountant / tax professional'),
  market('MX', 'México', 'es-MX', 'MXN', '$', 'Trabajador independiente', 'Contador / asesor'),
  market('CO', 'Colombia', 'es-CO', 'COP', '$', 'Independiente', 'Contador / asesor'),
  market('VE', 'Venezuela', 'es-VE', 'VES', 'Bs.', 'Trabajador independiente', 'Contador / asesor'),
  market('AR', 'Argentina', 'es-AR', 'ARS', '$', 'Monotributista / independiente', 'Contador / asesor'),
  market('CL', 'Chile', 'es-CL', 'CLP', '$', 'Independiente', 'Contador / asesor'),
  market('PE', 'Perú', 'es-PE', 'PEN', 'S/', 'Independiente', 'Contador / asesor'),
  market('BR', 'Brasil', 'pt-BR', 'BRL', 'R$', 'Autônomo / MEI', 'Contador / consultor'),
  market('UY', 'Uruguay', 'es-UY', 'UYU', '$', 'Independiente', 'Contador / asesor'),
  market('EC', 'Ecuador', 'es-EC', 'USD', '$', 'Independiente', 'Contador / asesor'),
  market('CR', 'Costa Rica', 'es-CR', 'CRC', '₡', 'Independiente', 'Contador / asesor'),
  market('PA', 'Panamá', 'es-PA', 'USD', '$', 'Independiente', 'Contador / asesor'),
  market('AU', 'Australia', 'en-AU', 'AUD', 'A$', 'Sole trader / contractor', 'Accountant / tax adviser'),
  market('NZ', 'New Zealand', 'en-NZ', 'NZD', 'NZ$', 'Self-employed', 'Accountant / tax adviser'),
  market('AE', 'United Arab Emirates', 'en-AE', 'AED', 'AED', 'Independent professional', 'Accountant / adviser'),
  market('JP', '日本', 'ja-JP', 'JPY', '¥', '個人事業主 / independent', '会計士 / adviser'),
  market('IN', 'India', 'en-IN', 'INR', '₹', 'Self-employed / gig worker', 'Accountant / tax professional'),
];

export const DEFAULT_MARKET_PROFILE = MARKET_PROFILES[0];

/**
 * Unknown country codes must never inherit Spain's fiscal engine. `XXX` is the
 * ISO 4217 code used when there is no known currency; Intl renders a neutral
 * currency marker instead of silently claiming EUR/USD/etc.
 */
export const SAFE_UNKNOWN_MARKET_PROFILE: MarketProfile = {
  countryCode: 'ZZ',
  displayName: 'Mercado sin configurar',
  locale: 'es',
  currency: 'XXX',
  currencySymbol: '¤',
  workerLabel: 'Trabajador independiente',
  advisorLabel: 'Asesor',
  productMode: 'financial_control',
  fiscalEngineStatus: 'not_enabled',
  advisorWorkspace: true,
};

export const getMarketProfile = (countryCode?: string | null): MarketProfile => {
  if (!countryCode) return DEFAULT_MARKET_PROFILE;
  const normalized = countryCode.trim().toUpperCase();
  return MARKET_PROFILES.find((profile) => profile.countryCode === normalized)
    || { ...SAFE_UNKNOWN_MARKET_PROFILE, countryCode: normalized || 'ZZ' };
};
