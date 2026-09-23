import { describe, expect, it } from 'vitest';
import { Expense, ExpenseCategory } from '../types';
import { buildMerchantCounts, sortExpensesForReview } from './expenseOrganization';

const expense = (id: string, status: Expense['status'], date: string, merchant: string): Expense => ({
  id,
  userId: 'user-1',
  category: ExpenseCategory.OTROS,
  amount: 10,
  status,
  date,
  merchant
});

describe('expense organization', () => {
  it('puts corrections and pending review ahead of completed tickets', () => {
    const sorted = sortExpensesForReview([
      expense('approved', 'approved', '2026-09-22', 'A'),
      expense('pending', 'pending_review', '2026-09-20', 'B'),
      expense('fix', 'needs_fix', '2026-09-19', 'C')
    ]);

    expect(sorted.map((item) => item.id)).toEqual(['fix', 'pending', 'approved']);
  });

  it('counts aliases under the canonical merchant id supplied by the resolver', () => {
    const counts = buildMerchantCounts([
      expense('1', 'pending_review', '2026-09-22', 'Cepsa'),
      expense('2', 'approved', '2026-09-21', 'Moeve')
    ], (merchant) => merchant === 'Cepsa' || merchant === 'Moeve' ? 'moeve' : 'other');

    expect(counts).toEqual({ moeve: 2 });
  });
});
