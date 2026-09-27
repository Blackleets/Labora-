import { describe, expect, it } from 'vitest';
import {
  AEAT_130_303_DEADLINES,
  daysBetween,
  formatDateEs,
  getNextAeatDeadline,
  quarterDueAfter,
  toLocalDateKey
} from './fiscalDeadlines';

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12, 0, 0);

describe('fiscalDeadlines (AEAT 130/303)', () => {
  it('table matches the AEAT 2026 calendar literally', () => {
    expect(AEAT_130_303_DEADLINES.map((d) => [d.quarter, d.directDebitUntil, d.filingUntil])).toEqual([
      ['4T 2025', '2026-01-27', '2026-01-30'],
      ['1T 2026', '2026-04-15', '2026-04-20'],
      ['2T 2026', '2026-07-15', '2026-07-20'],
      ['3T 2026', '2026-10-15', '2026-10-20']
    ]);
  });

  it('late September 2026 → 3T 2026 upcoming, 23 days to 20 Oct', () => {
    const result = getNextAeatDeadline(at(2026, 9, 27), 'ES');
    expect(result.verified).toBe(true);
    if (!result.verified) return;
    expect(result.deadline.quarter).toBe('3T 2026');
    expect(result.phase).toBe('upcoming');
    expect(result.daysToFilingEnd).toBe(23);
    expect(result.daysToDirectDebitEnd).toBe(18);
  });

  it('phases inside the filing window', () => {
    const open = getNextAeatDeadline(at(2026, 10, 15), 'ES');
    expect(open.verified && open.phase).toBe('open');
    const closed = getNextAeatDeadline(at(2026, 10, 16), 'ES');
    expect(closed.verified && closed.phase).toBe('direct_debit_closed');
    const lastDay = getNextAeatDeadline(at(2026, 10, 20), 'ES');
    expect(lastDay.verified && lastDay.daysToFilingEnd).toBe(0);
  });

  it('after the last published date → 4T 2026 pending, never invents a date', () => {
    expect(getNextAeatDeadline(at(2026, 10, 21), 'ES')).toEqual({ verified: false, quarter: '4T 2026', reason: 'not_published' });
    expect(getNextAeatDeadline(at(2026, 12, 31), 'ES')).toEqual({ verified: false, quarter: '4T 2026', reason: 'not_published' });
  });

  it('non-ES countries stay pending (no SAT dates invented)', () => {
    expect(getNextAeatDeadline(at(2026, 9, 27), 'MX')).toEqual({ verified: false, quarter: '', reason: 'country_pending' });
  });

  it('quarterDueAfter label logic', () => {
    expect(quarterDueAfter('2027-01-10')).toBe('4T 2026');
    expect(quarterDueAfter('2027-01-31')).toBe('1T 2027');
    expect(quarterDueAfter('2027-04-20')).toBe('1T 2027');
    expect(quarterDueAfter('2027-05-02')).toBe('2T 2027');
  });

  it('helpers', () => {
    expect(toLocalDateKey(at(2026, 1, 5))).toBe('2026-01-05');
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(formatDateEs('2026-10-20')).toBe('20 de octubre de 2026');
  });
});
