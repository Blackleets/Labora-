import { describe, expect, it } from 'vitest';
import type { WorkSession } from '../types';
import type { OrderLogEntry } from './orderLog';
import { toCsv } from './quarterExport';
import { formatDuration, mileageCsvRows, mileageTotals, monthlyMileage, shiftCsvRows, shiftRows, validateCostPerKm, validateOdometer } from './shiftLog';

const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min).toISOString();
let seq = 0;
const order = (over: Partial<OrderLogEntry>): OrderLogEntry => ({ id: `o${++seq}`, userId: 'u', platform: 'Glovo', occurredAt: at(2026, 9, 21), status: 'accepted', amount: 5, ...over });
const session = (over: Partial<WorkSession>): WorkSession => ({ id: `s${++seq}`, userId: 'u', startedAt: at(2026, 9, 21, 12), ...over });

describe('shiftLog · shifts', () => {
  const now = new Date(2026, 8, 27, 20).getTime();
  const sessions = [
    session({ id: 'a', startedAt: at(2026, 9, 21, 12), endedAt: at(2026, 9, 21, 14), startOdometerKm: 1000, endOdometerKm: 1042.5 }),
    session({ id: 'b', startedAt: at(2026, 9, 27, 19) })
  ];
  const orders = [
    order({ occurredAt: at(2026, 9, 21, 12, 30), amount: 6, km: 3 }),
    order({ occurredAt: at(2026, 9, 21, 13, 30), amount: 8, km: 4 }),
    order({ occurredAt: at(2026, 9, 21, 13, 40), status: 'rejected', amount: undefined }),
    order({ occurredAt: at(2026, 9, 21, 18), amount: 50 }), // fuera de la jornada
    order({ occurredAt: at(2026, 9, 27, 19, 30), amount: 4 })
  ];

  it('builds one row per shift, newest first, with €/h and both km sources', () => {
    const rows = shiftRows(sessions, orders, now);
    expect(rows.map((row) => row.id)).toEqual(['b', 'a']);
    expect(rows[1]).toMatchObject({ accepted: 2, rejected: 1, earnings: 14, eurPerHour: 7, odometerKm: 42.5, orderKm: 7, ongoing: false });
    expect(rows[0]).toMatchObject({ ongoing: true, durationMs: 3_600_000, earnings: 4, eurPerHour: 4, odometerKm: null });
    expect(formatDuration(rows[1].durationMs)).toBe('2 h 00 min');
  });

  it('omits €/h for very short shifts', () => {
    const rows = shiftRows([session({ startedAt: at(2026, 9, 21, 12), endedAt: at(2026, 9, 21, 12, 10) })], [], now);
    expect(rows[0].eurPerHour).toBeNull();
  });

  it('exports shift detail rows', () => {
    const csv = toCsv(shiftCsvRows(shiftRows(sessions, orders, now)));
    expect(csv).toContain('"2026-09-21";"12:00";"14:00";"2,00";"1000,00";"1042,50";"42,50";"7,00";"2";"14,00"');
    expect(csv).toContain('En curso');
  });
});

describe('shiftLog · monthly mileage', () => {
  const sessions = [
    session({ startedAt: at(2026, 3, 2, 10), endedAt: at(2026, 3, 2, 14), startOdometerKm: 100, endOdometerKm: 160 }),
    session({ startedAt: at(2026, 3, 3, 10), endedAt: at(2026, 3, 3, 14) }),
    session({ startedAt: at(2026, 4, 3, 10), endedAt: at(2026, 4, 3, 14) })
  ];
  const orders = [
    order({ occurredAt: at(2026, 3, 2, 11), km: 5 }),
    order({ occurredAt: at(2026, 4, 3, 11), km: 7.5 }),
    order({ occurredAt: at(2026, 4, 3, 12), km: 9, status: 'rejected' })
  ];

  it('prefers odometer km, falls back to order km, and estimates cost only with the user cost', () => {
    const months = monthlyMileage(sessions, orders, 2026, 0.25);
    expect(months).toHaveLength(12);
    expect(months[2]).toMatchObject({ month: '2026-03', shifts: 2, shiftsWithOdometer: 1, odometerKm: 60, orderKm: 5, km: 60, basis: 'odometer', estimatedCost: 15 });
    expect(months[3]).toMatchObject({ month: '2026-04', odometerKm: 0, orderKm: 7.5, km: 7.5, basis: 'orders', estimatedCost: 1.88 });
    expect(months[0]).toMatchObject({ km: 0, basis: null, estimatedCost: null });
    expect(monthlyMileage(sessions, orders, 2026, null)[2].estimatedCost).toBeNull();
    expect(mileageTotals(months)).toEqual({ shifts: 3, odometerKm: 60, orderKm: 12.5, km: 67.5, estimatedCost: 16.88 });
  });

  it('labels the cost as the user estimate in the CSV', () => {
    const csv = toCsv(mileageCsvRows(monthlyMileage(sessions, orders, 2026, 0.25), 0.25));
    expect(csv).toContain('estimación propia del usuario, no es una tarifa oficial');
    expect(csv).toContain('"2026-03";"2";"1";"60,00";"5,00";"60,00";"Cuentakilómetros";"15,00"');
    expect(toCsv(mileageCsvRows(monthlyMileage(sessions, orders, 2026, null), null))).toContain('Sin coste indicado');
  });
});

describe('shiftLog · validation', () => {
  it('validates odometer readings and cost', () => {
    expect(validateOdometer(100, 150, false)).toBeNull();
    expect(validateOdometer(150, 100, false)).toMatch(/menor/);
    expect(validateOdometer(100, 150, true)).toMatch(/Termina/);
    expect(validateOdometer(-1, undefined, false)).toMatch(/no válida/);
    expect(validateOdometer(0, 5000, false)).toMatch(/revisa/);
    expect(validateCostPerKm(undefined)).toBeNull();
    expect(validateCostPerKm(0.2)).toBeNull();
    expect(validateCostPerKm(0)).toMatch(/entre/);
  });
});
