import { describe, expect, it } from 'vitest';
import { buildFiscalSnapshot, parseFiscalPeriod } from '../services/fiscalEngine';
import { Expense, ExpenseCategory, Income } from '../types';

const income = (id: string, date: string, amount: number, retention = 0): Income => ({
  id,
  userId: 'u1',
  platform: 'Platform',
  date,
  amount,
  retention,
});

const expense = (
  id: string,
  date: string,
  amount: number,
  status: Expense['status'],
  deductiblePercentage: number,
  vatAmount = 0,
): Expense => ({
  id,
  userId: 'u1',
  category: ExpenseCategory.OTROS,
  date,
  amount,
  status,
  deductiblePercentage,
  vatAmount,
});

describe('Spain 2026 fiscal engine', () => {
  it('parses a quarter into exact boundaries', () => {
    expect(parseFiscalPeriod('3T 2026')).toEqual({
      label: '3T 2026',
      year: 2026,
      quarter: 3,
      quarterStart: '2026-07-01',
      quarterEnd: '2026-09-30',
      yearStart: '2026-01-01',
    });
  });

  it('refuses years that are not covered by the verified policy', () => {
    expect(() => buildFiscalSnapshot([], [], 'u1', '4T 2025')).toThrow(/solo está verificado para 2026/i);
  });

  it('counts only approved expense deductibility and never promotes pending evidence', () => {
    const snapshot = buildFiscalSnapshot(
      [income('i1', '2026-09-01', 1000)],
      [
        expense('e1', '2026-09-02', 100, 'approved', 50, 10),
        expense('e2', '2026-09-03', 200, 'pending_review', 100, 30),
        expense('e3', '2026-09-04', 50, 'rejected', 100, 5),
      ],
      'u1',
      '3T 2026',
    );

    expect(snapshot.quarter.approvedDeductibleExpenses).toBe(50);
    expect(snapshot.quarter.pendingExpenseCount).toBe(1);
    expect(snapshot.quarter.rejectedExpenseCount).toBe(1);
  });

  it('keeps Modelo 130 reference explicitly non-final and declares missing inputs', () => {
    const snapshot = buildFiscalSnapshot(
      [income('i1', '2026-08-01', 1000, 50)],
      [expense('e1', '2026-08-02', 200, 'approved', 100)],
      'u1',
      '3T 2026',
    );

    expect(snapshot.model130.standardRateReferenceAmount).toBe(110);
    expect(snapshot.model130.provisionalAccruedAmount).toBe(110);
    expect(snapshot.model130.finalAmount).toBeNull();
    expect(snapshot.model130.status).toBe('insufficient_required_context');
    expect(snapshot.model130.missingInputs.length).toBeGreaterThan(0);
  });

  it('summarizes input VAT only inside the selected quarter', () => {
    const snapshot = buildFiscalSnapshot(
      [income('i1', '2026-08-01', 1000)],
      [
        expense('old', '2026-03-20', 100, 'approved', 100, 21),
        expense('q3', '2026-08-10', 100, 'approved', 100, 21),
      ],
      'u1',
      '3T 2026',
    );

    expect(snapshot.model303.deductibleInputVatRecorded).toBe(21);
    expect(snapshot.model303.finalAmount).toBeNull();
  });
});
