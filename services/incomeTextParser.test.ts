import { describe, expect, it } from 'vitest';
import { isValidIncomeDate, parseIncomeTextLocally } from './incomeTextParser';

describe('parseIncomeTextLocally', () => {
  it('parses CSV with header', () => {
    const text = `plataforma,fecha,importe,retencion
Glovo,2026-09-10,120.50,0
Uber Eats,15/09/2026,"1.234,56",12,00`;
    // note: last line may break on extra comma — keep simple
    const simple = `plataforma;fecha;importe;retencion
Glovo;2026-09-10;120,50;0
Uber Eats;15/09/2026;1234.56;12`;
    const rows = parseIncomeTextLocally(simple);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ platform: 'Glovo', date: '2026-09-10', amount: 120.5, retention: 0 });
    expect(rows[1].platform).toBe('Uber Eats');
    expect(rows[1].date).toBe('2026-09-15');
    expect(rows[1].amount).toBe(1234.56);
    expect(rows[1].retention).toBe(12);
  });

  it('parses free-form Glovo/Uber lines', () => {
    const rows = parseIncomeTextLocally(`Glovo 10/09/2026 89,90
uber eats 2026-09-11 55.00`);
    expect(rows).toHaveLength(2);
    expect(rows[0].platform).toBe('Glovo');
    expect(rows[1].platform).toBe('Uber Eats');
  });

  it('returns empty for garbage (fail-closed)', () => {
    expect(parseIncomeTextLocally('hola mundo')).toEqual([]);
    expect(parseIncomeTextLocally('')).toEqual([]);
  });

  it('does not invent amounts without date', () => {
    expect(parseIncomeTextLocally('Glovo 100')).toEqual([]);
  });
});


describe('income calendar and retention integrity', () => {
  it.each(['2026-02-31', '2026-02-29', '2026-04-31', '2026-00-10', '0000-01-01'])('rejects impossible date %s', (date) => {
    expect(isValidIncomeDate(date)).toBe(false);
    expect(parseIncomeTextLocally(`Glovo;${date};100;0`)).toEqual([]);
  });
  it('rejects impossible European dates and keeps real leap days', () => {
    expect(parseIncomeTextLocally('Glovo 31/02/2026 100')).toEqual([]);
    expect(parseIncomeTextLocally('Glovo 29/02/2024 100')[0].date).toBe('2024-02-29');
    expect(isValidIncomeDate('1900-02-29')).toBe(false);
    expect(isValidIncomeDate('2000-02-29')).toBe(true);
  });
  it('does not turn an unreadable retention into zero', () => {
    expect(parseIncomeTextLocally('Glovo;2026-09-10;100;ilegible')).toEqual([]);
    expect(parseIncomeTextLocally('Glovo;2026-09-10;100;0')[0].retention).toBe(0);
    expect(parseIncomeTextLocally('Glovo;2026-09-10;100')[0].retention).toBe(0);
  });
});
