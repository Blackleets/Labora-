/**
 * Curated brand marks for Plataformas / integrations.
 * Prefer inline Simple Icons (see brandIcons.tsx), then CDN, then local geometric SVG,
 * then Google favicon, then colored letter avatar. Never blank white tiles.
 * Clearbit Logo API is discontinued — do not use it.
 */

type BrandMark = {
  /** Simple Icons slug — only include slugs verified HTTP 200 on cdn.simpleicons.org */
  slug?: string;
  /** Official brand hex from Simple Icons (no #) when known */
  hex?: string;
  /**
   * When true, Simple Icons mark is near-black; LogoResolver uses a dark chip
   * and white glyph (#FFFFFF).
   */
  darkGlyph?: boolean;
};

/** Verified Simple Icons presence (cdn.simpleicons.org / simple-icons package):
 *  present: glovo, uber, ubereats, justeat, deliveroo, paypal, stripe, revolut,
 *           square, quickbooks, xero, wise, n26, chase, wellsfargo, lyft
 *  absent: cabify, bolt, amazon, stuart, paack, holded, banorte,
 *          freenow, rappi, didi, wolt, qonto, bbva, santander, catcher
 */
const BRAND_MARKS: Record<string, BrandMark> = {
  glovo: { slug: 'glovo', hex: 'F2CC38' },
  uber_eats: { slug: 'ubereats', hex: '06C167' },
  just_eat: { slug: 'justeat', hex: 'FF8000' },
  deliveroo: { slug: 'deliveroo', hex: '00CCBC' },
  uber: { slug: 'uber', hex: '000000', darkGlyph: true },
  lyft: { slug: 'lyft', hex: 'FF00BF' },
  revolut: { slug: 'revolut', hex: '191C1F', darkGlyph: true },
  wise: { slug: 'wise', hex: '9FE870' },
  n26: { slug: 'n26', hex: '48AC98' },
  chase: { slug: 'chase', hex: '117ACA' },
  wellsfargo: { slug: 'wellsfargo', hex: 'D71E28' },
  stripe: { slug: 'stripe', hex: '635BFF' },
  paypal: { slug: 'paypal', hex: '002991' },
  square: { slug: 'square', hex: '3E4348', darkGlyph: true },
  quickbooks: { slug: 'quickbooks', hex: '2CA01C' },
  xero: { slug: 'xero', hex: '13B5EA' }
};

/** Local geometric SVG fallbacks (abstract marks) — secondary only. */
const LOCAL_PLATFORM_MARKS = new Set([
  'glovo',
  'uber',
  'uber_eats',
  'just_eat',
  'cabify',
  'bolt',
  'bolt_food'
]);

/** Category accent for letter avatars (never blank white). */
export const CATEGORY_ACCENTS: Record<
  string,
  { bg: string; fg: string; border: string }
> = {
  delivery: { bg: '#FFF4E5', fg: '#C45C12', border: '#F0D4B0' },
  mobility: { bg: '#E8F1FB', fg: '#1D4F91', border: '#C5D8EF' },
  banking: { bg: '#EAF2ED', fg: '#245338', border: '#C5D9CC' },
  payments: { bg: '#F0ECFF', fg: '#4C3D9E', border: '#D4CCF0' },
  accounting: { bg: '#E6F6F4', fg: '#0F6B63', border: '#B8DED9' },
  other: { bg: '#F5F2ED', fg: '#2E5A44', border: '#E3DCD2' }
};

/** Vite `BASE_URL` always ends with `/` (e.g. `/` or `/Labora-/`). */
export const withBaseUrl = (path: string): string => {
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
  const normalized = path.replace(/^\//, '');
  return `${base}${normalized}`;
};

export const isDarkGlyphBrand = (id: string): boolean => Boolean(BRAND_MARKS[id]?.darkGlyph);

/**
 * Curated Simple Icons CDN URL. Always prefer this (or inline) over local geometric
 * SVGs. darkGlyph brands get white (#FFFFFF) glyph for a dark chip.
 */
export const getCuratedBrandMarkUrl = (id: string): string | undefined => {
  const mark = BRAND_MARKS[id];
  if (!mark?.slug) return undefined;
  const hex = mark.darkGlyph ? 'FFFFFF' : mark.hex;
  return hex
    ? `https://cdn.simpleicons.org/${mark.slug}/${hex}`
    : `https://cdn.simpleicons.org/${mark.slug}`;
};

export const getLocalBrandMarkUrl = (id: string): string | undefined => {
  if (!LOCAL_PLATFORM_MARKS.has(id)) return undefined;
  return withBaseUrl(`brand/platforms/${id}.svg`);
};

export const getGoogleFaviconUrl = (domain: string): string =>
  `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;

/** @deprecated Clearbit Logo API is shut down — always returns empty; kept as no-op for callers. */
export const getClearbitLogoUrl = (_domain: string): string | undefined => undefined;

/** Catalog ids that rely on favicon / letter avatar (no Simple Icons slug). */
export const LOGOS_WITHOUT_SIMPLEICONS = [
  'stuart',
  'paack',
  'catcher',
  'banorte',
  'holded',
  'cabify',
  'bolt',
  'bolt_food',
  'amazon_flex',
  'rappi',
  'didi_food',
  'didi',
  'wolt',
  'freenow',
  'qonto',
  'bbva_es',
  'bbva_mx',
  'santander_es'
] as const;
