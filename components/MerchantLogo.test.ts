import { describe, expect, it } from 'vitest';
import { createHookHarness, elementText, findElement } from '../services/testHookHarness';
import { resolveMerchantBrand } from '../services/merchantBrands';

const setup = () => createHookHarness('components/MerchantLogo.tsx', {
  '../services/merchantBrands': { resolveMerchantBrand },
  './brandMarks': { withBaseUrl: (path: string) => `/Labora-/${path}` }
});
// Node handler harness, not React DOM or visual UAT.
describe('merchant image error fallback', () => {
  it('replaces a broken local image with a visible category icon', () => {
    const ui = setup();
    const render = () => { const child = ui.render({ merchant: 'Repsol Madrid', fallback: 'CATEGORY' }); return child.type(child.props); };
    const img = findElement(render(), n => n.type === 'img');
    expect(img.props.src).toBe('/Labora-/brand/merchants/repsol.svg');
    expect(img.props.alt).toBe('Identificador de Repsol');
    img.props.onError();
    expect(findElement(render(), n => n.type === 'img')).toBeUndefined();
    expect(elementText(render())).toBe('CATEGORY');
  });
  it('shows honest initials when no category fallback is provided', () => {
    const ui = setup();
    const render = () => { const child = ui.render({ merchant: 'BP Madrid' }); return child.type(child.props); };
    findElement(render(), n => n.type === 'img').props.onError();
    expect(elementText(render())).toBe('BP');
    expect(findElement(render(), n => n.props?.['aria-label']).props['aria-label']).toContain('imagen no disponible');
  });
  it('never sends unknown or ambiguous merchant names to an image service', () => {
    const ui = setup();
    for (const merchant of ['Bar José', 'Repsol / BP']) {
      const child = ui.render({ merchant, fallback: 'CATEGORY' });
      const tree = child.type(child.props);
      expect(findElement(tree, n => n.type === 'img')).toBeUndefined();
      expect(elementText(tree)).toBe('CATEGORY');
    }
  });
  it('gives a changed identity a new React key to reset failed image state', () => {
    const ui = setup();
    const previous = ui.render({ merchant: 'Repsol Madrid' });
    expect(ui.render({ merchant: 'BP Madrid' }).props.key).not.toBe(previous.props.key);
    expect(ui.render({ merchant: 'REPSOL Almería' }).props.key).toBe(previous.props.key);
  });
});
