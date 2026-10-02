import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { MERCHANT_BRANDS } from '../services/merchantBrands';
import { getLocalBrandMarkUrl, withBaseUrl } from './brandMarks';

const provenance = JSON.parse(readFileSync('public/brand/asset-provenance.json', 'utf8'));
afterEach(() => vi.unstubAllEnvs());

describe('bundled merchant/platform assets', () => {
  it.each(MERCHANT_BRANDS)('ships a traceable, unmodified source shape for $name', (brand) => {
    const path = `public/brand/merchants/${brand.asset}`;
    const source = provenance.assets.find((asset: any) => asset.path === path);
    expect(source?.source).toMatch(/^https:\/\//);
    const bytes = readFileSync(path);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256);
    if (brand.asset.endsWith('.svg')) {
      const svg = bytes.toString();
      expect(svg).toContain('<svg'); expect(svg).toContain('viewBox');
      expect(svg).not.toMatch(/<script|<foreignObject|\bon\w+\s*=|(?:href|url)\s*[=(]\s*["']?https?:/i);
    } else expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  });
  it('all provenance entries match files and have no active SVG content', () => {
    for (const source of provenance.assets) {
      const bytes = readFileSync(source.path);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256);
      if (source.path.endsWith('.svg')) expect(bytes.toString()).not.toMatch(/<script|<foreignObject|\bon\w+\s*=|(?:href|url)\s*[=(]\s*["']?https?:/i);
    }
  });
  it.each(['/', '/Labora-/'])('uses the web/Android/Pages base %s without remote merchant lookups', (base) => {
    vi.stubEnv('BASE_URL', base);
    expect(withBaseUrl('brand/merchants/repsol.svg')).toBe(`${base}brand/merchants/repsol.svg`);
    expect(getLocalBrandMarkUrl('cabify')).toBe(`${base}brand/platforms/cabify.svg`);
    expect(getLocalBrandMarkUrl('bolt_food')).toBeUndefined();
  });
});
