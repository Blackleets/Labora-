import { describe, expect, it } from 'vitest';
import type { OrderLogEntry } from './orderLog';
import {
  buildImportRows,
  detectDateFormat,
  distinctValues,
  importRef,
  parseAmount,
  parseCsv,
  parseDateTime,
  reconcileImport,
  suggestMapping,
  suggestStatus
} from './orderImport';

describe('orderImport · CSV parsing', () => {
  it('handles BOM, quotes, CRLF and detects the delimiter', () => {
    const parsed = parseCsv('\uFEFFFecha;Importe;Nota\r\n21/09/2026 13:05;"4,50";"con ""comillas""; y punto y coma"\r\n\r\n22/09/2026;3;x\n');
    expect(parsed.delimiter).toBe(';');
    expect(parsed.header).toEqual(['Fecha', 'Importe', 'Nota']);
    expect(parsed.rows).toEqual([['21/09/2026 13:05', '4,50', 'con "comillas"; y punto y coma'], ['22/09/2026', '3', 'x']]);
    expect(parseCsv('a,b\n1,2').delimiter).toBe(',');
    expect(parseCsv('a\tb\n1\t2').rows[0]).toEqual(['1', '2']);
  });

  it('suggests columns only from header names', () => {
    expect(suggestMapping(['Trip ID', 'Begin Trip Time', 'Distance (miles)', 'Fare Amount', 'Status'])).toEqual({ date: 1, time: null, amount: 3, km: 2, status: 4, platform: null });
    expect(suggestMapping(['Fecha', 'Hora', 'Plataforma', 'Ganado', 'Km'])).toEqual({ date: 0, time: 1, amount: 3, km: 4, status: null, platform: 2 });
    expect(suggestMapping(['foo', 'bar'])).toEqual({ date: null, time: null, amount: null, km: null, status: null, platform: null });
  });

  it('suggests status choices conservatively', () => {
    expect(suggestStatus('completed')).toBe('accepted');
    expect(suggestStatus('Entregado')).toBe('accepted');
    expect(suggestStatus('Rechazado')).toBe('rejected');
    expect(suggestStatus('canceled')).toBe('skip');
    expect(distinctValues([['a'], ['b'], ['a']], 0)).toEqual([{ value: 'a', count: 2 }, { value: 'b', count: 1 }]);
  });
});

describe('orderImport · values', () => {
  it('detects date formats and flags ambiguity', () => {
    expect(detectDateFormat(['2026-09-21 13:00'])).toEqual({ format: 'iso', ambiguous: false });
    expect(detectDateFormat(['21/09/2026'])).toEqual({ format: 'dmy', ambiguous: false });
    expect(detectDateFormat(['09/21/2026 1:05 PM'])).toEqual({ format: 'mdy', ambiguous: false });
    expect(detectDateFormat(['03/04/2026'])).toEqual({ format: 'dmy', ambiguous: true });
  });

  it('parses local dates, 12 h clocks and explicit zones', () => {
    expect(parseDateTime('21/09/2026', '13:05', 'dmy')?.getTime()).toBe(new Date(2026, 8, 21, 13, 5).getTime());
    expect(parseDateTime('09/21/2026 1:05 PM', undefined, 'mdy')?.getTime()).toBe(new Date(2026, 8, 21, 13, 5).getTime());
    expect(parseDateTime('2026-09-21 13:05:00 +00:00', undefined, 'iso')?.toISOString()).toBe('2026-09-21T13:05:00.000Z');
    expect(parseDateTime('2026-09-21 13:05:00 UTC', undefined, 'iso')?.toISOString()).toBe('2026-09-21T13:05:00.000Z');
    expect(parseDateTime('2026-09-21', undefined, 'iso')?.getHours()).toBe(12);
    expect(parseDateTime('31/02/2026', undefined, 'dmy')).toBeNull();
    expect(parseDateTime('hola', undefined, 'dmy')).toBeNull();
  });

  it('parses Spanish and English amounts', () => {
    expect(parseAmount('4,50')).toBe(4.5);
    expect(parseAmount('€4.50')).toBe(4.5);
    expect(parseAmount('1.234,56 EUR')).toBe(1234.56);
    expect(parseAmount('1,234.56')).toBe(1234.56);
    expect(parseAmount('-2,00')).toBe(-2);
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('')).toBeNull();
  });
});

describe('orderImport · build and reconcile', () => {
  const csv = parseCsv([
    'Fecha,Importe,Distancia,Estado',
    '21/09/2026 13:05,"4,50",2.5,completed',
    '21/09/2026 13:40,3.00,,rejected',
    '21/09/2026 14:00,5,1,canceled',
    '32/09/2026 14:00,5,1,completed',
    '21/09/2026 15:00,-1,1,completed',
    '21/09/2026 16:00,,1,completed'
  ].join('\n'));
  const mapping = { date: 0, time: null, amount: 1, km: 2, status: 3, platform: null };
  const options = { dateFormat: 'dmy' as const, kmUnit: 'mi' as const, fixedPlatform: 'Uber Eats', statusMap: { completed: 'accepted' as const, rejected: 'rejected' as const, canceled: 'skip' as const }, now: new Date(2026, 8, 27) };

  it('builds candidates, skips ignored statuses and reports errors with line numbers', () => {
    const result = buildImportRows(csv, mapping, options);
    expect(result.skipped).toBe(1);
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates[0]).toMatchObject({ line: 2, platform: 'Uber Eats', status: 'accepted', amount: 4.5, km: 4.02 });
    expect(result.candidates[1]).toMatchObject({ line: 3, status: 'rejected', amount: 3 });
    expect(result.errors.map((error) => error.line)).toEqual([5, 6, 7]);
    expect(result.errors[1].message).toMatch(/negativo/);
    expect(result.errors[2].message).toMatch(/sin importe/);
  });

  it('requires a date column', () => {
    expect(buildImportRows(csv, { ...mapping, date: null }, options).errors[0].message).toMatch(/fecha/);
  });

  it('reconciles with manual orders, prior imports and in-file duplicates', async () => {
    const { candidates } = buildImportRows(csv, mapping, options);
    const twice = [...candidates, candidates[0]];
    const refs = await Promise.all(twice.map(importRef));
    expect(refs[0]).toMatch(/^[0-9a-f]{64}$/);
    expect(refs[2]).toBe(refs[0]);
    const manual: OrderLogEntry = { id: 'm1', userId: 'u', platform: 'uber eats', occurredAt: new Date(2026, 8, 21, 13, 9).toISOString(), status: 'accepted', amount: 4.5 };
    const farManual: OrderLogEntry = { id: 'm2', userId: 'u', platform: 'Uber Eats', occurredAt: new Date(2026, 8, 21, 14, 30).toISOString(), status: 'rejected' };
    const result = reconcileImport(twice, refs, [manual, farManual]);
    expect(result.manualMatches).toHaveLength(1);
    expect(result.manualMatches[0]).toMatchObject({ existing: { id: 'm1' }, minutesApart: 4 });
    expect(result.fresh.map((row) => row.line)).toEqual([3]);
    expect(result.alreadyImported.map((row) => row.line)).toEqual([2]);

    const imported: OrderLogEntry = { ...manual, id: 'i1', source: 'import', importRef: refs[1] };
    const again = reconcileImport(candidates, refs.slice(0, 2), [imported]);
    expect(again.alreadyImported.map((row) => row.line)).toEqual([3]);
    expect(again.fresh.map((row) => row.line)).toEqual([2]);
  });
});
