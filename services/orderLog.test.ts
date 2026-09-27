import { describe, expect, it } from 'vitest';
import type { Income, WorkSession } from '../types';
import { toCsv } from './quarterExport';
import {
  breakdownByDay,
  breakdownByPlatform,
  compareWithSettlements,
  dailySeries,
  goalProgress,
  isConverted,
  localDayKey,
  netEstimate,
  OrderLogEntry,
  orderCsvRows,
  ordersInMonth,
  ordersOnDay,
  parseDecimalInput,
  planIncomeConversion,
  rejectReasonCounts,
  settlementOverlaps,
  summarizeOrders,
  validateOrderInput,
  weekStartKey,
  weeklySeries,
  workedMsOnDay
} from './orderLog';

const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min).toISOString();
let seq = 0;
const order = (over: Partial<OrderLogEntry>): OrderLogEntry => ({
  id: over.id || `o${++seq}`,
  userId: 'u1',
  platform: 'Glovo',
  occurredAt: at(2026, 9, 27),
  status: 'accepted',
  amount: 5,
  ...over
});
const income = (over: Partial<Income>): Income => ({ id: 'i1', userId: 'u1', platform: 'Glovo', date: '2026-09-10', amount: 100, retention: 0, ...over });

describe('orderLog · validation', () => {
  const now = new Date(2026, 8, 27, 12, 0);
  it('requires platform and amount for accepted orders', () => {
    expect(validateOrderInput({ platform: ' ', occurredAt: at(2026, 9, 27, 11), status: 'accepted', amount: 3 }, now)).toMatch(/plataforma/);
    expect(validateOrderInput({ platform: 'Glovo', occurredAt: at(2026, 9, 27, 11), status: 'accepted' }, now)).toMatch(/importe/);
    expect(validateOrderInput({ platform: 'Glovo', occurredAt: at(2026, 9, 27, 11), status: 'rejected', rejectReason: 'too_far' }, now)).toBeNull();
  });
  it('rejects future timestamps, bad ranges and reasons on accepted', () => {
    expect(validateOrderInput({ platform: 'Glovo', occurredAt: at(2026, 9, 27, 13), status: 'rejected' }, now)).toMatch(/futuro/);
    expect(validateOrderInput({ platform: 'Glovo', occurredAt: at(2026, 9, 27, 11), status: 'accepted', amount: -1 }, now)).toMatch(/importe/);
    expect(validateOrderInput({ platform: 'Glovo', occurredAt: at(2026, 9, 27, 11), status: 'accepted', amount: 3, km: 2000 }, now)).toMatch(/km/);
    expect(validateOrderInput({ platform: 'Glovo', occurredAt: at(2026, 9, 27, 11), status: 'accepted', amount: 3, rejectReason: 'zone' }, now)).toMatch(/motivo/);
  });
  it('parses Spanish decimals', () => {
    expect(parseDecimalInput('4,50')).toBe(4.5);
    expect(parseDecimalInput(' 12 € ')).toBe(12);
    expect(parseDecimalInput('')).toBeUndefined();
    expect(Number.isNaN(parseDecimalInput('abc'))).toBe(true);
  });
});

describe('orderLog · summaries', () => {
  const orders = [
    order({ amount: 4.5, km: 3 }),
    order({ amount: 6, km: 2, platform: 'Uber Eats' }),
    order({ status: 'rejected', amount: undefined, rejectReason: 'low_pay' }),
    order({ status: 'rejected', amount: 2.5, rejectReason: 'too_far' })
  ];

  it('counts, acceptance rate, €/km, €/h (rejected amounts never count)', () => {
    const s = summarizeOrders(orders, 2 * 3_600_000);
    expect(s.accepted).toBe(2);
    expect(s.rejected).toBe(2);
    expect(s.acceptanceRate).toBe(0.5);
    expect(s.earnings).toBe(10.5);
    expect(s.km).toBe(5);
    expect(s.eurPerKm).toBe(2.1);
    expect(s.eurPerHour).toBe(5.25);
    expect(s.ordersPerHour).toBe(1);
    expect(s.avgPerOrder).toBe(5.25);
  });

  it('empty day gives nulls, not fake zeros', () => {
    const s = summarizeOrders([]);
    expect(s.acceptanceRate).toBeNull();
    expect(s.eurPerKm).toBeNull();
    expect(s.eurPerHour).toBeNull();
  });

  it('net estimate subtracts registered expenses only', () => {
    expect(netEstimate(10.5, 12.25)).toBe(-1.75);
  });

  it('platform and day breakdowns, reject reasons', () => {
    const byPlatform = breakdownByPlatform(orders);
    expect(byPlatform[0]).toEqual({ platform: 'Uber Eats', accepted: 1, rejected: 0, earnings: 6, km: 2 });
    expect(byPlatform[1]).toMatchObject({ platform: 'Glovo', accepted: 1, rejected: 2, earnings: 4.5 });
    const days = breakdownByDay([...orders, order({ occurredAt: at(2026, 9, 26), amount: 3 })]);
    expect(days.map((d) => d.day)).toEqual(['2026-09-27', '2026-09-26']);
    expect(rejectReasonCounts(orders)).toMatchObject({ low_pay: 1, too_far: 1, zone: 0 });
  });

  it('filters by local day and month', () => {
    const late = order({ occurredAt: at(2026, 9, 30, 23, 50) });
    expect(ordersOnDay([late], '2026-09-30')).toHaveLength(1);
    expect(ordersInMonth([late], '2026-09')).toHaveLength(1);
    expect(ordersInMonth([late], '2026-10')).toHaveLength(0);
  });

  it('worked time clips shifts to the day', () => {
    const sessions: WorkSession[] = [
      { id: 's1', userId: 'u1', startedAt: at(2026, 9, 26, 22), endedAt: at(2026, 9, 27, 2) },
      { id: 's2', userId: 'u1', startedAt: at(2026, 9, 27, 10) }
    ];
    const now = new Date(2026, 8, 27, 11, 30).getTime();
    expect(workedMsOnDay(sessions, '2026-09-27', now)).toBe(3.5 * 3_600_000);
  });

  it('goal progress', () => {
    expect(goalProgress(30, 60)).toEqual({ pct: 50, remaining: 30, reached: false });
    expect(goalProgress(70, 60)).toEqual({ pct: 100, remaining: 0, reached: true });
    expect(goalProgress(10, null)).toBeNull();
  });
});

describe('orderLog · charts', () => {
  it('daily series covers 7 days oldest→newest', () => {
    const series = dailySeries([order({ occurredAt: at(2026, 9, 21), amount: 7 })], '2026-09-27');
    expect(series).toHaveLength(7);
    expect(series[0].key).toBe('2026-09-21');
    expect(series[0].earnings).toBe(7);
    expect(series[6].label).toBe('Dom 27');
  });
  it('weekly series uses Monday weeks', () => {
    expect(weekStartKey('2026-09-27')).toBe('2026-09-21');
    const weeks = weeklySeries([order({ occurredAt: at(2026, 9, 15), amount: 8 })], '2026-09-27', 3);
    expect(weeks.map((w) => w.key)).toEqual(['2026-09-07', '2026-09-14', '2026-09-21']);
    expect(weeks[1].earnings).toBe(8);
  });
});

describe('orderLog · conversion to incomes', () => {
  it('groups unconverted accepted orders by day + platform', () => {
    const orders = [
      order({ id: 'a', amount: 4 }),
      order({ id: 'b', amount: 6, platform: 'glovo ' }),
      order({ id: 'c', amount: 5, platform: 'Uber Eats' }),
      order({ id: 'd', amount: 9, convertedIncomeId: 'inc_live' }),
      order({ id: 'e', amount: 3, convertedIncomeId: 'inc_deleted' }),
      order({ id: 'f', status: 'rejected', amount: undefined })
    ];
    const live = new Set(['inc_live']);
    expect(isConverted(orders[3], live)).toBe(true);
    expect(isConverted(orders[4], live)).toBe(false);
    const plan = planIncomeConversion(orders, live);
    expect(plan).toEqual([
      { date: '2026-09-27', platform: 'Glovo', amount: 13, count: 3, orderIds: ['a', 'b', 'e'] },
      { date: '2026-09-27', platform: 'Uber Eats', amount: 5, count: 1, orderIds: ['c'] }
    ]);
  });

  it('warns about settlement overlap and compares logged vs settled', () => {
    const orders = [order({ amount: 40, occurredAt: at(2026, 9, 5) }), order({ amount: 10, platform: 'Uber Eats', occurredAt: at(2026, 9, 6) })];
    const incomes = [
      income({ platform: 'Glovo', amount: 35, sourceType: 'document_import' }),
      income({ id: 'i2', platform: 'Uber Eats', amount: 10, sourceType: 'manual' })
    ];
    expect(settlementOverlaps(planIncomeConversion(orders, new Set()), incomes)).toEqual(['Glovo (2026-09)']);
    expect(compareWithSettlements(orders, incomes, '2026-09')).toEqual([{ platform: 'Glovo', logged: 40, settled: 35, difference: 5 }]);
    expect(compareWithSettlements(orders, incomes, '2026-08')).toEqual([]);
  });
});

describe('orderLog · CSV', () => {
  it('exports with Spanish labels and formula-safe cells', () => {
    const rows = orderCsvRows([
      order({ platform: '=HYPERLINK("x")', note: '+34 600', occurredAt: at(2026, 9, 27, 9, 5), amount: 4.5, km: 1.2 }),
      order({ status: 'rejected', amount: undefined, rejectReason: 'zone', occurredAt: at(2026, 9, 27, 8, 0) })
    ], new Set());
    expect(rows[1]).toEqual(['2026-09-27', '08:00', 'Glovo', 'Rechazado', '', '', 'Zona', '', 'No']);
    expect(rows[2].slice(0, 6)).toEqual(['2026-09-27', '09:05', '=HYPERLINK("x")', 'Aceptado', '4,50', '1,20']);
    const csv = toCsv(rows);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain(`"'+34 600"`);
  });
  it('localDayKey handles invalid input', () => {
    expect(localDayKey('nope')).toBe('');
  });
});
