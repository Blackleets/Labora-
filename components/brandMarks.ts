/**
 * Curated brand marks for Plataformas / integrations.
 * Prefer local geometric SVG (works offline + with /Labora-/ base),
 * then Simple Icons CDN, then Google favicon, then letter avatar.
 * Clearbit Logo API is discontinued — do not use it (blank images, no onError).
 */

type BrandMark = {
  /** Simple Icons slug — only include slugs verified HTTP 200 on cdn.simpleicons.org */
  slug?: string;
  /** Official brand hex from Simple Icons (no #) when known */
  hex?: string;
  /**
   * When true, Simple Icons mark is near-black; LogoResolver uses a dark chip
   * so the glyph stays visible (and prefers local SVG when available).
   */
  darkGlyph?: boolean;
};

/** Verified Simple Icons presence (cdn.simpleicons.org):
 *  200: glovo, uber, ubereats, justeat, deliveroo, paypal, stripe, revolut,
 *       square, quickbooks, xero, wise, n26, chase, wellsfargo, lyft
 *  404 / absent: cabify, bolt, amazon, stuart, paack, holded, banorte,
 *       freenow, rappi, didi, wolt, qonto, bbva, santander, catcher
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

/** Local geometric SVG fallbacks (abstract marks, not trademark artwork). */
const LOCAL_PLATFORM_MARKS = new Set([
  'glovo',
  'uber',
  'uber_eats',
  'just_eat',
  'cabify',
  'bolt',
  'bolt_food'
]);

/** Vite `BASE_URL` always ends with `/` (e.g. `/` or `/Labora-/`). */
export const withBaseUrl = (path: string): string => {
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
  const normalized = path.replace(/^\//, '');
  return `${base}${normalized}`;
};

export const isDarkGlyphBrand = (id: string): boolean => Boolean(BRAND_MARKS[id]?.darkGlyph);

export const getCuratedBrandMarkUrl = (id: string): string | undefined => {
  const mark = BRAND_MARKS[id];
  if (!mark?.slug) return undefined;
  // For near-black glyphs prefer white Simple Icons on a dark chip (see LogoResolver),
  // except when a local SVG already provides a proper brand square.
  if (mark.darkGlyph && LOCAL_PLATFORM_MARKS.has(id)) {
    return undefined; // force local geometric mark first
  }
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

/** Catalog ids that rely on favicon/local (no Simple Icons slug). */
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
