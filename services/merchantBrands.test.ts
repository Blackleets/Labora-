import { describe, expect, it } from 'vitest';
import { MERCHANT_BRANDS, merchantFilterKey, merchantFilterOptions, resolveMerchantBrand } from './merchantBrands';
import { GAS_STATION_PRESETS } from '../data/gasStations';

 describe('receipt merchant identity', () => {
  it.each(MERCHANT_BRANDS)('recognizes $name as whole words in a receipt issuer/location', (brand) => {
    expect(resolveMerchantBrand(`${brand.name.toUpperCase()} · MADRID 012`)?.id).toBe(brand.id);
  });
  it.each(GAS_STATION_PRESETS)('covers every selectable fuel brand: $name', ({ name }) => {
    expect(resolveMerchantBrand(name)).toBeDefined();
  });
  it('handles punctuation, accents and recognized spelling variations', () => {
    expect(resolveMerchantBrand('E.S. RÉPSOL ALMERÍA S.A.')?.id).toBe('repsol');
    expect(resolveMerchantBrand('McDonald’s Puerta del Sol')?.id).toBe('mcdonalds');
    expect(resolveMerchantBrand('Kentucky Fried Chicken')?.id).toBe('kfc');
    expect(resolveMerchantBrand('AUCHAN Madrid')?.id).toBe('alcampo');
  });
  it.each(['BPM Servicios', 'SHELLY RESTAURANTE', 'Repsoluciones SL', 'KFCatering', '', null, undefined])('avoids substring/empty false matches: %s', (name) => {
    expect(resolveMerchantBrand(name)).toBeUndefined();
  });
  it('leaves conflicting brands unidentified instead of picking the first one', () => {
    expect(resolveMerchantBrand('Repsol / BP')).toBeUndefined();
    expect(resolveMerchantBrand('Carrefour – Burger King')).toBeUndefined();
    expect(merchantFilterKey('Repsol / BP')).toBe('merchant:repsol / bp');
  });
  it('groups legacy/current names but keeps the historically matching image', () => {
    expect(merchantFilterKey('CEPSA Sevilla')).toBe(merchantFilterKey('MOEVE Sevilla'));
    expect(resolveMerchantBrand('CEPSA (Moeve)')?.id).toBe('cepsa');
    expect(resolveMerchantBrand('MOEVE (antes Cepsa)')?.id).toBe('moeve');
    expect(resolveMerchantBrand('MOEVE Sevilla')?.id).toBe('moeve');
    expect(merchantFilterKey('PLENOIL Madrid')).toBe(merchantFilterKey('PLENERGY Córdoba'));
    expect(resolveMerchantBrand('Plenoil')?.asset).toBe('plenoil.svg');
  });
  it('groups known locations, preserves unknown merchants, and exposes only supplied rows', () => {
    const rows = [{ merchant: 'Repsol Almería' }, { merchant: 'REPSOL Málaga' }, { merchant: 'Bar José' }, { merchant: 'bar jose' }, { merchant: 'Bar María' }, {}];
    const before = JSON.stringify(rows);
    const options = merchantFilterOptions(rows);
    expect(options).toHaveLength(4);
    expect(options).toContainEqual({ value: 'brand:repsol', label: 'Repsol' });
    expect(options).toContainEqual({ value: 'missing', label: 'Sin comercio' });
    expect(options.some((option) => option.value === 'brand:bp')).toBe(false);
    expect(merchantFilterKey('Bar José')).not.toBe(merchantFilterKey('Bar María'));
    expect(JSON.stringify(rows)).toBe(before);
  });
});
