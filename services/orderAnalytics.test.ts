import { describe, expect, it } from 'vitest';
import type { WorkSession } from '../types';
import type { OrderLogEntry } from './orderLog';
import {
  acceptanceTrend,
  bestSlots,
  hourlyPerformance,
  platformComparison,
  rejectionBreakdown,
  relativeChange,
  weekSummary,
  weekdayPerformance,
  workedMsBetween,
  workedMsByHour,
  workedMsByWeekday
} from './orderAnalytics';

const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min).toISOString();
const ms = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min).getTime();
let seq = 0;
const order = (over: Partial<OrderLogEntry>): OrderLogEntry => ({
  id: `o${++seq}`,
  userId: 'u1',
  platform: 'Glovo',
  occurredAt: at(2026, 9, 21),
  status: 'accepted',
  amount: 5,
  ...over
});
const session = (start: string, end?: string): WorkSession => ({ id: `s${++seq}`, userId: 'u1', startedAt: start, endedAt: end });
const H = 3_600_000;

describe('orderAnalytics · worked time', () => {
  // 21/09/2026 es lunes.
  const sessions = [session(at(2026, 9, 21, 12, 30), at(2026, 9, 21, 14, 15))];
  const now = ms(2026, 9, 27, 20);

  it('splits sessions at local hour boundaries', () => {
    const byHour = workedMsByHour(sessions, ms(2026, 9, 14), ms(2026, 9, 28), now);
    expect(byHour[12]).toBe(0.5 * H);
    expect(byHour[13]).toBe(H);
    expect(byHour[14]).toBe(0.25 * H);
    expect(byHour.reduce((a, b) => a + b, 0)).toBe(1.75 * H);
  });

  it('splits across midnight into weekdays (0 = lunes)', () => {
    const overnight = [session(at(2026, 9, 21, 23), at(2026, 9, 22, 1))];
    const byDay = workedMsByWeekday(overnight, ms(2026, 9, 14), ms(2026, 9, 28), now);
    expect(byDay[0]).toBe(H);
    expect(byDay[1]).toBe(H);
  });

  it('clips to the range and uses now for open sessions', () => {
    const open = [session(at(2026, 9, 27, 18))];
    expect(workedMsBetween(open, ms(2026, 9, 27), ms(2026, 9, 28), now)).toBe(2 * H);
    expect(workedMsBetween(sessions, ms(2026, 9, 21, 13), ms(2026, 9, 21, 14), now)).toBe(H);
  });
});

describe('orderAnalytics · slots', () => {
  const now = ms(2026, 9, 27, 20);
  const from = ms(2026, 9, 14);
  const to = ms(2026, 9, 28);
  const sessions = [
    session(at(2026, 9, 21, 13), at(2026, 9, 21, 15)), // lunes 13-15
    session(at(2026, 9, 26, 20), at(2026, 9, 26, 22)) // sábado 20-22
  ];
  const orders = [
    order({ occurredAt: at(2026, 9, 21, 13, 10), amount: 4, km: 2 }),
    order({ occurredAt: at(2026, 9, 21, 13, 30), amount: 5, km: 5 }),
    order({ occurredAt: at(2026, 9, 21, 13, 50), amount: 3 }),
    order({ occurredAt: at(2026, 9, 21, 14, 10), status: 'rejected', amount: undefined, rejectReason: 'too_far' }),
    order({ occurredAt: at(2026, 9, 26, 20, 5), amount: 9, km: 3 }),
    order({ occurredAt: at(2026, 9, 26, 20, 40), amount: 8, km: 4 }),
    order({ occurredAt: at(2026, 9, 26, 20, 55), amount: 7, km: 3 }),
    order({ occurredAt: at(2025, 1, 1, 13), amount: 999 }) // fuera de rango
  ];

  it('computes €/h per hour only with ≥1 h worked and €/km only from orders with km', () => {
    const hours = hourlyPerformance(orders, sessions, from, to, now);
    expect(hours[13]).toMatchObject({ accepted: 3, earnings: 12, km: 7, workedHours: 1, eurPerHour: 12, enoughData: true });
    expect(hours[13].eurPerKm).toBe(1.29); // (4+5)/7, sin el pedido sin km
    expect(hours[14]).toMatchObject({ accepted: 0, rejected: 1, eurPerHour: 0, enoughData: false });
    expect(hours[20]).toMatchObject({ accepted: 3, earnings: 24, eurPerHour: 24, eurPerKm: 2.4, enoughData: true });
    expect(hours[9]).toMatchObject({ workedHours: 0, eurPerHour: null, eurPerKm: null, enoughData: false });
  });

  it('ranks only slots with enough data', () => {
    const hours = hourlyPerformance(orders, sessions, from, to, now);
    expect(bestSlots(hours, 'eurPerHour').map((slot) => slot.label)).toEqual(['20h', '13h']);
    const days = weekdayPerformance(orders, sessions, from, to, now);
    expect(days[0]).toMatchObject({ label: 'Lunes', accepted: 3, rejected: 1, workedHours: 2, eurPerHour: 6 });
    expect(days[5]).toMatchObject({ label: 'Sábado', accepted: 3, eurPerHour: 12 });
    expect(bestSlots(days, 'eurPerKm', 1)[0].label).toBe('Sábado');
  });
});

describe('orderAnalytics · trends and breakdowns', () => {
  it('weekly acceptance rate with null for empty weeks', () => {
    const orders = [
      order({ occurredAt: at(2026, 9, 21, 10) }),
      order({ occurredAt: at(2026, 9, 22, 10), status: 'rejected', amount: undefined }),
      order({ occurredAt: at(2026, 9, 8, 10) })
    ];
    const trend = acceptanceTrend(orders, '2026-09-27', 3);
    expect(trend.map((point) => point.key)).toEqual(['2026-09-07', '2026-09-14', '2026-09-21']);
    expect(trend[0].rate).toBe(1);
    expect(trend[1].rate).toBeNull();
    expect(trend[2]).toMatchObject({ total: 2, accepted: 1, rate: 0.5 });
  });

  it('rejection reasons sorted by count with shares', () => {
    const rows = rejectionBreakdown([
      order({ status: 'rejected', rejectReason: 'low_pay' }),
      order({ status: 'rejected', rejectReason: 'low_pay' }),
      order({ status: 'rejected' }),
      order({ status: 'accepted' })
    ]);
    expect(rows).toEqual([
      { reason: 'low_pay', label: 'Paga poco', count: 2, share: 2 / 3 },
      { reason: 'none', label: 'Sin motivo', count: 1, share: 1 / 3 }
    ]);
  });

  it('compares platforms without per-platform €/h', () => {
    const rows = platformComparison([
      order({ platform: 'Glovo', amount: 6, km: 3 }),
      order({ platform: 'Glovo', amount: 4 }),
      order({ platform: 'glovo', status: 'rejected', amount: undefined }),
      order({ platform: 'Uber Eats', amount: 10, km: 4 })
    ]);
    expect(rows[0]).toMatchObject({ platform: 'Glovo', accepted: 2, rejected: 1, earnings: 10, avgPerOrder: 5, eurPerKm: 2, shareOfEarnings: 0.5 });
    expect(rows[0].acceptanceRate).toBeCloseTo(2 / 3);
    expect(rows[1]).toMatchObject({ platform: 'Uber Eats', eurPerKm: 2.5, acceptanceRate: 1 });
    expect(rows[0]).not.toHaveProperty('eurPerHour');
  });
});

describe('orderAnalytics · week summary', () => {
  // Hoy: miércoles 23/09/2026 a las 18:00.
  const now = ms(2026, 9, 23, 18);
  const orders = [
    order({ occurredAt: at(2026, 9, 21, 13), amount: 20, km: 10 }),
    order({ occurredAt: at(2026, 9, 23, 13), amount: 30 }),
    order({ occurredAt: at(2026, 9, 14, 13), amount: 10 }), // lunes pasado
    order({ occurredAt: at(2026, 9, 16, 19), amount: 7 }), // miércoles pasado, después de las 18:00
    order({ occurredAt: at(2026, 9, 19, 13), amount: 40 }) // sábado pasado
  ];
  const sessions = [session(at(2026, 9, 21, 12), at(2026, 9, 21, 14)), session(at(2026, 9, 23, 12), at(2026, 9, 23, 15))];

  it('compares with last week up to the same moment and tracks the weekly goal', () => {
    const summary = weekSummary(orders, sessions, '2026-09-23', now, 100);
    expect(summary.thisWeek).toMatchObject({ from: '2026-09-21', to: '2026-09-23', accepted: 2, earnings: 50, workedHours: 5, eurPerHour: 10, eurPerKm: 2 });
    expect(summary.lastWeekSoFar.earnings).toBe(10);
    expect(summary.lastWeekFull.earnings).toBe(57);
    expect(summary.goal).toEqual({ pct: 50, remaining: 50, reached: false });
    expect(summary.daysLeft).toBe(5);
    expect(weekSummary(orders, sessions, '2026-09-23', now, null).goal).toBeNull();
  });

  it('relative change needs a positive base', () => {
    expect(relativeChange(15, 10)).toBe(0.5);
    expect(relativeChange(5, 0)).toBeNull();
    expect(relativeChange(null, 3)).toBeNull();
  });
});
