export type MerchantCategory = 'fuel' | 'restaurant' | 'supermarket' | 'other';

export type MerchantMatchType = 'canonical' | 'alias' | 'structured_suffix' | 'none';
export type MerchantMatchConfidence = 'high' | 'medium' | 'none';

export interface MerchantBrand {
  id: string;
  name: string;
  shortLabel: string;
  category: Exclude<MerchantCategory, 'other'>;
  aliases: readonly string[];
  /** Ticket suffixes are accepted only after one of these unambiguous aliases. */
  allowStructuredSuffix?: boolean;
  colors: {
    background: string;
    foreground: string;
    border: string;
  };
}

export interface MerchantBrandResolution {
  brand: MerchantBrand | null;
  normalizedInput: string;
  matchType: MerchantMatchType;
  matchConfidence: MerchantMatchConfidence;
  matchedAlias?: string;
}

const FUEL = {
  category: 'fuel' as const,
  allowStructuredSuffix: true,
};

const SUPERMARKET = {
  category: 'supermarket' as const,
  allowStructuredSuffix: true,
};

const RESTAURANT = {
  category: 'restaurant' as const,
  allowStructuredSuffix: true,
};

/**
 * Local visual identities for receipt organization. These are deliberately
 * typographic marks, not downloaded or reconstructed corporate logos.
 */
export const MERCHANT_BRANDS: readonly MerchantBrand[] = [
  { id: 'repsol', name: 'Repsol', shortLabel: 'R', aliases: ['repsol', 'repsol comercial'], colors: { background: '#fff4ea', foreground: '#b74b13', border: '#f2c5a5' }, ...FUEL },
  { id: 'moeve', name: 'Moeve', shortLabel: 'M', aliases: ['moeve', 'cepsa', 'cepsa moeve'], colors: { background: '#f1edff', foreground: '#4d2f91', border: '#cfc3ee' }, ...FUEL },
  { id: 'bp', name: 'BP', shortLabel: 'bp', aliases: ['bp', 'bp oil'], colors: { background: '#edf8ed', foreground: '#196b37', border: '#b8dcbf' }, ...FUEL },
  { id: 'shell', name: 'Shell', shortLabel: 'S', aliases: ['shell'], colors: { background: '#fff8dc', foreground: '#9c2d22', border: '#ead27a' }, ...FUEL },
  { id: 'galp', name: 'Galp', shortLabel: 'G', aliases: ['galp'], colors: { background: '#fff0e5', foreground: '#a63d13', border: '#edb993' }, ...FUEL },
  { id: 'petroprix', name: 'Petroprix', shortLabel: 'P', aliases: ['petroprix'], colors: { background: '#eaf3fb', foreground: '#145a8d', border: '#b5d1e8' }, ...FUEL },
  { id: 'plenoil', name: 'Plenoil', shortLabel: 'P', aliases: ['plenoil'], colors: { background: '#fff0f0', foreground: '#a5262d', border: '#e7b8bb' }, ...FUEL },
  { id: 'ballenoil', name: 'Ballenoil', shortLabel: 'B', aliases: ['ballenoil'], colors: { background: '#edf2fa', foreground: '#254b7b', border: '#bccbe0' }, ...FUEL },

  { id: 'carrefour', name: 'Carrefour', shortLabel: 'C', aliases: ['carrefour', 'carrefour express', 'carrefour market', 'carrefour gasolinera'], colors: { background: '#eef3fb', foreground: '#164b88', border: '#becde1' }, ...SUPERMARKET },
  { id: 'alcampo', name: 'Alcampo', shortLabel: 'A', aliases: ['alcampo', 'alcampo gasolinera'], colors: { background: '#fff0f1', foreground: '#a82831', border: '#e4b8bb' }, ...SUPERMARKET },
  { id: 'mercadona', name: 'Mercadona', shortLabel: 'M', aliases: ['mercadona'], colors: { background: '#edf7f0', foreground: '#22673c', border: '#b9d9c3' }, ...SUPERMARKET },
  { id: 'lidl', name: 'Lidl', shortLabel: 'L', aliases: ['lidl', 'lidl supermercado'], colors: { background: '#fff8db', foreground: '#174c8f', border: '#e6d27b' }, ...SUPERMARKET },
  { id: 'aldi', name: 'Aldi', shortLabel: 'A', aliases: ['aldi', 'aldi supermercado'], colors: { background: '#edf3fa', foreground: '#204e7c', border: '#bdcee0' }, ...SUPERMARKET },
  { id: 'dia', name: 'Dia', shortLabel: 'D', aliases: ['dia', 'dia supermercado', 'tiendas dia'], colors: { background: '#fff0f0', foreground: '#a5272d', border: '#e7b9bc' }, ...SUPERMARKET },

  { id: 'mcdonalds', name: "McDonald's", shortLabel: 'M', aliases: ['mcdonalds', 'mc donalds'], colors: { background: '#fff6df', foreground: '#9a321f', border: '#e8ca83' }, ...RESTAURANT },
  { id: 'burger-king', name: 'Burger King', shortLabel: 'BK', aliases: ['burger king'], colors: { background: '#fff1e5', foreground: '#8e3521', border: '#e6b99c' }, ...RESTAURANT },
  { id: 'kfc', name: 'KFC', shortLabel: 'KFC', aliases: ['kfc', 'kentucky fried chicken'], colors: { background: '#fff0f0', foreground: '#962b31', border: '#e1b6b9' }, ...RESTAURANT },
  { id: 'starbucks', name: 'Starbucks', shortLabel: 'S', aliases: ['starbucks', 'starbucks coffee'], colors: { background: '#eaf5f0', foreground: '#176044', border: '#afd3c2' }, ...RESTAURANT },
  { id: 'dominos', name: "Domino's", shortLabel: 'D', aliases: ['dominos', 'dominos pizza'], colors: { background: '#edf3f8', foreground: '#22567c', border: '#b9ccdc' }, ...RESTAURANT },
  { id: 'telepizza', name: 'Telepizza', shortLabel: 'T', aliases: ['telepizza'], colors: { background: '#fff0f0', foreground: '#a92b32', border: '#e5b7ba' }, ...RESTAURANT },
] as const;

const LEGAL_SUFFIXES = new Set([
  'sa', 'sl', 'slu', 'slne', 'sau', 'sociedad', 'limitada', 'unipersonal',
]);

const STRUCTURED_SUFFIX_TOKENS = new Set([
  'e', 's', 'es', 'estacion', 'servicio', 'gasolinera', 'tienda', 'supermercado', 'market',
  'express', 'restaurante', 'restaurant', 'coffee', 'cafe', 'store', 'local',
  'madrid', 'barcelona', 'valencia', 'sevilla', 'malaga', 'zaragoza', 'bilbao',
  'alcobendas', 'getafe', 'leganes', 'mostoles', 'espana',
]);

export const normalizeMerchantName = (value: string): string => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/&/g, ' y ')
  .replace(/['’`]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .replace(/\s+/g, ' ');

const stripLegalSuffixes = (value: string): string => {
  const tokens = value.split(' ');
  while (tokens.length > 1 && LEGAL_SUFFIXES.has(tokens[tokens.length - 1])) tokens.pop();
  return tokens.join(' ');
};

const isSafeStructuredSuffix = (suffix: string): boolean => {
  const tokens = suffix.split(' ').filter(Boolean);
  if (tokens.length === 0 || tokens.length > 5) return false;
  return tokens.every((token) => /^\d{1,8}$/.test(token) || STRUCTURED_SUFFIX_TOKENS.has(token));
};

export const resolveMerchantBrand = (input: string): MerchantBrandResolution => {
  const normalizedInput = stripLegalSuffixes(normalizeMerchantName(input));
  if (!normalizedInput) return { brand: null, normalizedInput, matchType: 'none', matchConfidence: 'none' };

  for (const brand of MERCHANT_BRANDS) {
    const canonical = normalizeMerchantName(brand.name);
    if (normalizedInput === canonical) {
      return { brand, normalizedInput, matchType: 'canonical', matchConfidence: 'high', matchedAlias: canonical };
    }
    for (const rawAlias of brand.aliases) {
      const alias = normalizeMerchantName(rawAlias);
      if (normalizedInput === alias) {
        return { brand, normalizedInput, matchType: 'alias', matchConfidence: 'high', matchedAlias: alias };
      }
    }
  }

  for (const brand of MERCHANT_BRANDS) {
    if (!brand.allowStructuredSuffix) continue;
    const aliases = [...brand.aliases]
      .map(normalizeMerchantName)
      .sort((a, b) => b.length - a.length);
    for (const alias of aliases) {
      const prefix = `${alias} `;
      if (normalizedInput.startsWith(prefix) && isSafeStructuredSuffix(normalizedInput.slice(prefix.length))) {
        return { brand, normalizedInput, matchType: 'structured_suffix', matchConfidence: 'medium', matchedAlias: alias };
      }
    }
  }

  return { brand: null, normalizedInput, matchType: 'none', matchConfidence: 'none' };
};
