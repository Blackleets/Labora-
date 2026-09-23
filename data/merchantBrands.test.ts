import { describe, expect, it } from 'vitest';
import { normalizeMerchantName, resolveMerchantBrand } from './merchantBrands';

describe('merchant brand identity resolver', () => {
  it.each([
    ['REPSOL', 'repsol'],
    ['Cepsa', 'moeve'],
    ['Moeve', 'moeve'],
    ["McDonald's", 'mcdonalds'],
    ['DOMINOS PIZZA', 'dominos'],
    ['Carrefour Express', 'carrefour'],
  ])('matches a known canonical name or explicit alias: %s', (input, id) => {
    const result = resolveMerchantBrand(input);
    expect(result.brand?.id).toBe(id);
    expect(result.matchConfidence).toBe('high');
  });

  it.each([
    ['Repsol E.S. 1234', 'repsol'],
    ['Starbucks Madrid 42', 'starbucks'],
    ['Mercadona Alcobendas', 'mercadona'],
    ['Burger King Local 18', 'burger-king'],
  ])('allows only a constrained ticket/location suffix: %s', (input, id) => {
    const result = resolveMerchantBrand(input);
    expect(result.brand?.id).toBe(id);
    expect(result.matchType).toBe('structured_suffix');
    expect(result.matchConfidence).toBe('medium');
  });

  it.each([
    'Shellfish Bar',
    'BPeluquería Madrid',
    'Diana Supermercado',
    'Galpón Restaurante',
    'Aldiario Prensa',
    'Repsoluciones SL',
    'Starbucks competitor',
    'Mc Donaldson',
  ])('does not associate an ambiguous or partial merchant: %s', (input) => {
    const result = resolveMerchantBrand(input);
    expect(result.brand).toBeNull();
    expect(result.matchType).toBe('none');
    expect(result.matchConfidence).toBe('none');
  });

  it('normalizes accents, punctuation and whitespace deterministically', () => {
    expect(normalizeMerchantName('  Café—MERCADONA, S.L. ')).toBe('cafe mercadona s l');
  });
});
