/**
 * Curated brand marks for Plataformas / integrations.
 * Prefer official Simple Icons CDN (verified 200) with brand hex when known.
 * Brands without a Simple Icons slug fall through to local geometric SVG,
 * Google favicon, Clearbit, then Lucide placeholder in LogoResolver.
 */

type BrandMark = {
  /** Simple Icons slug — only include slugs verified HTTP 200 on cdn.simpleicons.org */
  slug?: string;
  /** Official brand hex from Simple Icons (no #) when known */
  hex?: string;
};

/** Verified Simple Icons presence (cdn.simpleicons.org curl 2026-09-20):
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
  uber: { slug: 'uber', hex: '000000' },
  lyft: { slug: 'lyft', hex: 'FF00BF' },
  revolut: { slug: 'revolut', hex: '191C1F' },
  wise: { slug: 'wise', hex: '9FE870' },
  n26: { slug: 'n26', hex: '48AC98' },
  chase: { slug: 'chase', hex: '117ACA' },
  wellsfargo: { slug: 'wellsfargo', hex: 'D71E28' },
  stripe: { slug: 'stripe', hex: '635BFF' },
  paypal: { slug: 'paypal', hex: '002991' },
  square: { slug: 'square', hex: '3E4348' },
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

export const getCuratedBrandMarkUrl = (id: string): string | undefined => {
  const mark = BRAND_MARKS[id];
  if (!mark?.slug) return undefined;
  // Colored Simple Icons when hex known; else default brand color from CDN
  return mark.hex
    ? `https://cdn.simpleicons.org/${mark.slug}/${mark.hex}`
    : `https://cdn.simpleicons.org/${mark.slug}`;
};

export const getLocalBrandMarkUrl = (id: string): string | undefined => {
  if (!LOCAL_PLATFORM_MARKS.has(id)) return undefined;
  return `/brand/platforms/${id}.svg`;
};

export const getGoogleFaviconUrl = (domain: string): string =>
  `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;

export const getClearbitLogoUrl = (domain: string): string =>
  `https://logo.clearbit.com/${domain}`;

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
