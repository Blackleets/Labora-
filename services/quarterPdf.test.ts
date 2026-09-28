import { describe, expect, it } from 'vitest';
import { ExpenseCategory, type Expense, type Income } from '../types';
import { buildQuarterPdfModel, quarterPdfFilename } from './quarterPdf';

const expense = (over: Partial<Expense>): Expense => ({ id: 'e1', userId: 'u', category: ExpenseCategory.GASOLINA, date: '2026-08-10', amount: 40, status: 'approved', vatRate: 21, vatAmount: 6.94, deductiblePercentage: 50, ...over } as Expense);
const income = (over: Partial<Income>): Income => ({ id: 'i1', userId: 'u', platform: 'Glovo', date: '2026-07-15', amount: 900, retention: 0, ...over });

describe('quarterPdf', () => {
  it('uses the same data as the CSV pack, filtered to the quarter', () => {
    const model = buildQuarterPdfModel(
      { name: 'Ana Pérez', nif: '12345678Z' },
      '3T 2026',
      [expense({}), expense({ id: 'e2', date: '2026-10-01', amount: 99 }), expense({ id: 'e3', status: 'pending_review', amount: 10, merchant: 'Taller' })],
      [income({}), income({ id: 'i2', date: '2026-04-01' })],
      new Date(2026, 8, 27, 13, 5)
    );
    expect(model.title).toBe('Exportación trimestral 3T 2026');
    expect(model.meta).toContainEqual(['Generado', '2026-09-27 13:05']);
    expect(model.meta).toContainEqual(['Email', '—']);
    expect(model.disclaimer).toMatch(/No es una autoliquidación/);
    expect(model.summary).toContainEqual(['Gastos importe total', '50,00 €']);
    expect(model.summary).toContainEqual(['Gastos validados (nº · importe)', '1 · 40,00 €']);
    expect(model.summary).toContainEqual(['Importe validado × % asignado', '20,00 €']);
    expect(model.summary).toContainEqual(['Ingresos brutos', '900,00 €']);
    expect(model.expenses.head[0]).toBe('Fecha');
    expect(model.expenses.body).toHaveLength(2);
    expect(model.expenses.body[0][4]).toBe('40,00');
    expect(model.incomes.body).toHaveLength(1);
  });

  it('names the file like the CSV pack', () => {
    expect(quarterPdfFilename('3T 2026', 'Ana Pérez')).toBe('labora_trimestre_3T_2026_ana_perez.pdf');
  });
});
