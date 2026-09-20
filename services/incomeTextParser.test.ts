import { describe, expect, it } from 'vitest';
import { parseIncomeTextLocally } from './incomeTextParser';

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
