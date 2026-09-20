import { describe, expect, it } from 'vitest';
import { getInlineBrandIcon, hasInlineBrandIcon } from './brandIcons';
import {
  CATEGORY_ACCENTS,
  getClearbitLogoUrl,
  getCuratedBrandMarkUrl,
  getGoogleFaviconUrl,
  getLocalBrandMarkUrl,
  isDarkGlyphBrand,
  withBaseUrl
} from './brandMarks';

describe('brandMarks', () => {
  it('prefers curated Uber (white glyph) even when a local geometric mark exists', () => {
    expect(isDarkGlyphBrand('uber')).toBe(true);
    const curated = getCuratedBrandMarkUrl('uber');
    expect(curated).toBe('https://cdn.simpleicons.org/uber/FFFFFF');
    expect(getLocalBrandMarkUrl('uber')).toContain('uber.svg');
  });

  it('serves curated marks for brands without a local SVG', () => {
    const lyft = getCuratedBrandMarkUrl('lyft');
    expect(lyft).toContain('cdn.simpleicons.org/lyft');
    expect(lyft).toContain('FF00BF');
  });

  it('inlines Simple Icons path data for catalog brands', () => {
    expect(hasInlineBrandIcon('uber')).toBe(true);
    expect(hasInlineBrandIcon('glovo')).toBe(true);
    expect(hasInlineBrandIcon('stuart')).toBe(false);
    const uber = getInlineBrandIcon('uber');
    expect(uber?.darkGlyph).toBe(true);
    expect(uber?.path.length).toBeGreaterThan(20);
    expect(uber?.hex).toBe('000000');
  });

  it('never returns Clearbit URLs', () => {
    expect(getClearbitLogoUrl('uber.com')).toBeUndefined();
  });

  it('builds favicon URLs for domains', () => {
    expect(getGoogleFaviconUrl('uber.com')).toContain('uber.com');
  });

  it('withBaseUrl joins without double slashes', () => {
    expect(withBaseUrl('/brand/platforms/uber.svg')).toMatch(/\/brand\/platforms\/uber\.svg$/);
  });

  it('exposes category accents for letter avatars', () => {
    expect(CATEGORY_ACCENTS.delivery.fg).toBeTruthy();
    expect(CATEGORY_ACCENTS.banking.bg).toBeTruthy();
  });
});
