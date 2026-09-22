import { describe, expect, it } from 'vitest';
import { exportService } from './ExportService';

describe('exportService', () => {
  it('does not fabricate payout rows when no operational data is supplied', async () => {
    const blob = await exportService.generatePayoutsCSV('user-1', 'ES');
    const csv = await blob.text();

    expect(csv.split('\n')).toHaveLength(1);
    expect(csv).toContain('trip_id,date,gross');
  });

  it('exports only the rows explicitly supplied by the caller', async () => {
    const blob = await exportService.generatePayoutsCSV('user-1', 'ES', [{
      trip_id: 'real-1', date: '2026-09-22', gross: 20, commission: 3, fees: 1, taxes: 0, payout: 16, currency: 'EUR'
    }]);
    const csv = await blob.text();

    expect(csv).toContain('real-1');
    expect(csv.split('\n')).toHaveLength(2);
  });
});
