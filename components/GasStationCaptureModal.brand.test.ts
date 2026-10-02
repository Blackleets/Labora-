import { describe, expect, it, vi } from 'vitest';
import { createHookHarness, findElement } from '../services/testHookHarness';
import { ExpenseCategory } from '../types';
import { GAS_STATION_PRESETS } from '../data/gasStations';

// Real component handlers in Node. This is not live OCR or authenticated UAT.
describe('fuel OCR preserves receipt issuer when identifying a brand', () => {
  it.each(['REPSOL ALMERÍA S.A.', 'CEPSA ESTACIÓN 012', 'MOEVE (CEPSA) Sevilla', 'BP Madrid Norte', 'Bar sin marca'])('keeps %s and leaves fiscal review pending', async (merchantName) => {
    const addExpense = vi.fn();
    class Reader {
      result = 'data:image/png;base64,AA==';
      onload?: () => void;
      readAsDataURL() { this.onload?.(); }
    }
    const harness = createHookHarness('components/GasStationCaptureModal.tsx', {
      'lucide-react': new Proxy({}, { get: (_target, key) => key }),
      '../contexts/DataContext': { useData: () => ({ addExpense, expenses: [], vehicle: {}, currentUser: { id: 'rider' }, showNotification: vi.fn() }) },
      '../contexts/CountryContext': { useCountry: () => ({ selectedCountry: { currency_symbol: '€' } }) },
      '../types': { ExpenseCategory }, '../data/gasStations': { GAS_STATION_PRESETS },
      './MerchantLogo': { MerchantBrandPreview: 'brand-preview' },
      '../services/geminiService': { analyzeReceipt: async () => ({ merchantName, amount: 25, date: '2026-10-02', confidence: 0.9, needsReview: false, uncertainFields: [] }) }
    }, {
      FileReader: Reader,
      crypto: { subtle: { digest: async () => new Uint8Array([1, 2]).buffer } },
      window: { setTimeout: (fn: () => void) => fn() }
    }, 'GasStationCaptureModal');
    const render = () => harness.render({ isOpen: true, onClose: vi.fn() });
    findElement(render(), node => node.type === 'input' && node.props.id === 'labora-fuel-gallery').props.onChange({ currentTarget: { files: [{ type: 'image/png', size: 1, arrayBuffer: async () => new Uint8Array([0]).buffer }], value: 'selected' } });
    for (let n = 0; n < 20; n++) await Promise.resolve();
    const input = findElement(render(), node => node.type === 'input' && node.props.placeholder === 'Nombre que aparece en el ticket');
    expect(input.props.value).toBe(merchantName);
    findElement(render(), node => node.type === 'form').props.onSubmit({ preventDefault: vi.fn() });
    expect(addExpense).toHaveBeenCalledWith(expect.objectContaining({ merchant: merchantName, amount: 25, vatRate: 0, vatAmount: 0, deductiblePercentage: 0, status: 'pending_review' }));
  });
});
