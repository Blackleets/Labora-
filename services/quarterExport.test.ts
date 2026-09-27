import { describe, expect, it } from 'vitest';
import type { Expense, Income } from '../types';
import {
  buildExpenseRows,
  buildIncomeRows,
  buildQuarterPackRows,
  csvCell,
  dateInQuarter,
  expenseStatusEs,
  incomeReviewEs,
  parseQuarter,
  quarterExportFilename,
  quarterOptionsFor,
  quarterTotals,
  toCsv
} from './quarterExport';

const expense = (over: Partial<Expense>): Expense => ({
  id: over.id || 'e', userId: 'u1', category: 'Gasolina', date: '2026-08-10', amount: 50, ...over
});
const income = (over: Partial<Income>): Income => ({
  id: over.id || 'i', userId: 'u1', platform: 'Glovo', date: '2026-08-10', amount: 100, retention: 0, ...over
});

describe('quarterExport', () => {
  it('parses quarters and matches dates by text', () => {
    expect(parseQuarter('3T 2026')).toEqual({ quarter: 3, year: 2026 });
    expect(parseQuarter('5T 2026')).toBeNull();
    expect(dateInQuarter('2026-07-01', '3T 2026')).toBe(true);
    expect(dateInQuarter('2026-09-30T23:59:00Z', '3T 2026')).toBe(true);
    expect(dateInQuarter('2026-10-01', '3T 2026')).toBe(false);
    expect(dateInQuarter('garbage', '3T 2026')).toBe(false);
  });

  it('quarter options include data years, newest first', () => {
    const options = quarterOptionsFor(['2025-02-01'], new Date(2026, 8, 27));
    expect(options.slice(0, 5)).toEqual(['4T 2026', '3T 2026', '2T 2026', '1T 2026', '4T 2025']);
    expect(options).toHaveLength(8);
  });

  it('neutralises CSV formula injection and escapes quotes', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('+34')).toBe(`"'+34"`);
    expect(csvCell('-1')).toBe(`"'-1"`);
    expect(csvCell('@SUM(A1)')).toBe(`"'@SUM(A1)"`);
    expect(csvCell('Repsol')).toBe('"Repsol"');
    expect(csvCell(-5)).toBe('"-5"');
    expect(csvCell(undefined)).toBe('""');
    expect(toCsv([['a', 'b'], ['c']])).toBe('\uFEFF"a";"b"\r\n"c"');
  });

  it('Spanish statuses', () => {
    expect(expenseStatusEs(undefined)).toBe('Pendiente de revisión');
    expect(expenseStatusEs('approved')).toBe('Validado por gestoría');
    expect(expenseStatusEs('needs_fix')).toBe('Corregir');
    expect(incomeReviewEs(income({ needsReview: true }))).toBe('Pendiente de revisión');
    expect(incomeReviewEs(income({ reviewedBy: 'g', needsReview: false }))).toBe('Revisado por gestoría');
  });

  it('rows are filtered to the quarter and sorted by date', () => {
    const rows = buildExpenseRows([
      expense({ id: 'b', date: '2026-09-02', merchant: '=cmd', amount: 10.5, status: 'approved', deductiblePercentage: 50 }),
      expense({ id: 'a', date: '2026-07-05' }),
      expense({ id: 'x', date: '2026-10-05' })
    ], '3T 2026');
    expect(rows).toHaveLength(3);
    expect(rows[1][0]).toBe('2026-07-05');
    expect(rows[2]).toEqual(expect.arrayContaining(['=cmd', '10,50', '50%', 'Validado por gestoría']));
    expect(toCsv(rows)).toContain(`"'=cmd"`);
    expect(buildIncomeRows([income({ date: '2026-01-01' })], '3T 2026')).toHaveLength(1);
  });

  it('totals only count the selected quarter', () => {
    const totals = quarterTotals(
      [
        expense({ amount: 100, status: 'approved', deductiblePercentage: 50, vatAmount: 17.36, receiptUrl: 'x' }),
        expense({ amount: 20, status: 'needs_fix' }),
        expense({ amount: 30 }),
        expense({ amount: 999, date: '2026-04-01' })
      ],
      [income({ amount: 200, retention: 30, needsReview: true }), income({ amount: 5, date: '2025-08-01' })],
      '3T 2026'
    );
    expect(totals.expenseCount).toBe(3);
    expect(totals.expenseTotal).toBe(150);
    expect(totals.expenseVat).toBe(17.36);
    expect(totals.byStatus.approved).toEqual({ count: 1, amount: 100 });
    expect(totals.byStatus.pending_review).toEqual({ count: 1, amount: 30 });
    expect(totals.approvedDeductibleAmount).toBe(50);
    expect(totals.missingReceipt).toBe(2);
    expect(totals.incomeGross).toBe(200);
    expect(totals.incomeRetention).toBe(30);
    expect(totals.incomePendingReview).toBe(1);
  });

  it('quarter pack has header, summary and both sections', () => {
    const rows = buildQuarterPackRows({ name: 'Ana', nif: '12345678Z' }, '3T 2026', [expense({})], [income({})], new Date(2026, 8, 27, 9, 5));
    const flat = rows.map((row) => row[0]);
    expect(flat).toEqual(expect.arrayContaining(['RESUMEN', 'GASTOS', 'INGRESOS', 'Cliente']));
    expect(rows.find((row) => row[0] === 'Generado')?.[1]).toBe('2026-09-27 09:05');
    expect(rows.find((row) => row[0] === 'Aviso')?.[1]).toMatch(/No es una autoliquidación/);
  });

  it('filenames are safe', () => {
    expect(quarterExportFilename('trimestre', '3T 2026', 'José Pérez / Glovo')).toBe('labora_trimestre_3T_2026_jose_perez_glovo.csv');
    expect(quarterExportFilename('gastos', '1T 2026')).toBe('labora_gastos_1T_2026.csv');
  });
});
