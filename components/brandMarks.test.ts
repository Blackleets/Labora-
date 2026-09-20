import { describe, expect, it } from 'vitest';
import {
  getClearbitLogoUrl,
  getCuratedBrandMarkUrl,
  getGoogleFaviconUrl,
  getLocalBrandMarkUrl,
  isDarkGlyphBrand,
  withBaseUrl
} from './brandMarks';

describe('brandMarks', () => {
  it('resolves local Uber mark with Vite BASE_URL', () => {
    const url = getLocalBrandMarkUrl('uber');
    expect(url).toBeTruthy();
    expect(url).toMatch(/brand\/platforms\/uber\.svg$/);
    expect(url!.startsWith('/')).toBe(true);
  });

  it('skips curated Uber when local geometric mark exists', () => {
    expect(isDarkGlyphBrand('uber')).toBe(true);
    expect(getCuratedBrandMarkUrl('uber')).toBeUndefined();
    expect(getLocalBrandMarkUrl('uber')).toContain('uber.svg');
  });

  it('serves curated marks for brands without a local SVG', () => {
    const lyft = getCuratedBrandMarkUrl('lyft');
    expect(lyft).toContain('cdn.simpleicons.org/lyft');
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
});
