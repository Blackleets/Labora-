/** Local, presentation-only identity. Never rewrites a receipt or infers taxes. */
export interface MerchantBrand {
  id: string;
  name: string;
  group: string;
  groupName: string;
  aliases: readonly string[];
  asset: string;
  kind: 'fuel' | 'food' | 'retail';
}

export const MERCHANT_BRANDS: readonly MerchantBrand[] = [
  { id: 'repsol', name: 'Repsol', group: 'repsol', groupName: 'Repsol', aliases: ['repsol'], asset: 'repsol.svg', kind: 'fuel' },
  { id: 'cepsa', name: 'Cepsa', group: 'moeve', groupName: 'Moeve / Cepsa', aliases: ['cepsa'], asset: 'cepsa.png', kind: 'fuel' },
  { id: 'moeve', name: 'Moeve', group: 'moeve', groupName: 'Moeve / Cepsa', aliases: ['moeve'], asset: 'moeve.svg', kind: 'fuel' },
  { id: 'bp', name: 'BP', group: 'bp', groupName: 'BP', aliases: ['bp', 'british petroleum'], asset: 'bp.png', kind: 'fuel' },
  { id: 'shell', name: 'Shell', group: 'shell', groupName: 'Shell', aliases: ['shell'], asset: 'shell.svg', kind: 'fuel' },
  { id: 'galp', name: 'Galp', group: 'galp', groupName: 'Galp', aliases: ['galp'], asset: 'galp.png', kind: 'fuel' },
  { id: 'petroprix', name: 'Petroprix', group: 'petroprix', groupName: 'Petroprix', aliases: ['petroprix'], asset: 'petroprix.svg', kind: 'fuel' },
  { id: 'plenoil', name: 'Plenoil', group: 'plenergy', groupName: 'Plenergy / Plenoil', aliases: ['plenoil'], asset: 'plenoil.svg', kind: 'fuel' },
  { id: 'plenergy', name: 'Plenergy', group: 'plenergy', groupName: 'Plenergy / Plenoil', aliases: ['plenergy'], asset: 'plenergy.png', kind: 'fuel' },
  { id: 'ballenoil', name: 'Ballenoil', group: 'ballenoil', groupName: 'Ballenoil', aliases: ['ballenoil'], asset: 'ballenoil.png', kind: 'fuel' },
  { id: 'carrefour', name: 'Carrefour', group: 'carrefour', groupName: 'Carrefour', aliases: ['carrefour'], asset: 'carrefour.svg', kind: 'retail' },
  { id: 'alcampo', name: 'Alcampo', group: 'alcampo', groupName: 'Alcampo', aliases: ['alcampo', 'auchan'], asset: 'auchan.svg', kind: 'retail' },
  { id: 'mcdonalds', name: "McDonald's", group: 'mcdonalds', groupName: "McDonald's", aliases: ['mcdonalds', "mcdonald's", 'mc donalds', "mc donald's"], asset: 'mcdonalds.svg', kind: 'food' },
  { id: 'burgerking', name: 'Burger King', group: 'burgerking', groupName: 'Burger King', aliases: ['burger king', 'burgerking'], asset: 'burgerking.svg', kind: 'food' },
  { id: 'kfc', name: 'KFC', group: 'kfc', groupName: 'KFC', aliases: ['kfc', 'kentucky fried chicken'], asset: 'kfc.svg', kind: 'food' },
  { id: 'starbucks', name: 'Starbucks', group: 'starbucks', groupName: 'Starbucks', aliases: ['starbucks'], asset: 'starbucks.svg', kind: 'food' },
  { id: 'tacobell', name: 'Taco Bell', group: 'tacobell', groupName: 'Taco Bell', aliases: ['taco bell', 'tacobell'], asset: 'tacobell.svg', kind: 'food' }
];

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const words = (value: string) => normalize(value).replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');

/** Whole words only; conflicting brands remain unidentified. No network lookup. */
export const resolveMerchantBrand = (merchant?: string | null): MerchantBrand | undefined => {
  const text = ` ${words(merchant || '')} `;
  const matches = MERCHANT_BRANDS.flatMap((brand) => {
    const positions = brand.aliases.map((alias) => text.indexOf(` ${words(alias)} `)).filter((index) => index >= 0);
    return positions.length ? [{ brand, position: Math.min(...positions) }] : [];
  });
  if (new Set(matches.map(({ brand }) => brand.group)).size !== 1) return undefined;
  // Within one family, show the first brand actually named on the receipt.
  return matches.sort((a, b) => a.position - b.position)[0]?.brand;
};

export const merchantFilterKey = (merchant?: string | null): string => {
  const brand = resolveMerchantBrand(merchant);
  if (brand) return `brand:${brand.group}`;
  const name = normalize(merchant || '').replace(/\s+/g, ' ');
  return name ? `merchant:${name}` : 'missing';
};

/** Call with already authorized/date-scoped rows; never enumerates global users. */
export const merchantFilterOptions = (rows: readonly { merchant?: string }[]) => {
  const options = new Map<string, string>();
  for (const row of rows) {
    const key = merchantFilterKey(row.merchant);
    const label = resolveMerchantBrand(row.merchant)?.groupName || row.merchant?.trim() || 'Sin comercio';
    const previous = options.get(key);
    if (!previous || label.localeCompare(previous, 'es') < 0) options.set(key, label);
  }
  return [...options].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, 'es'));
};
