import { Expense } from '../types';

const REVIEW_PRIORITY: Record<NonNullable<Expense['status']>, number> = {
  needs_fix: 0,
  pending_review: 1,
  rejected: 2,
  approved: 3
};

export const sortExpensesForReview = (expenses: Expense[]) => [...expenses].sort((left, right) => {
  const statusDifference = (REVIEW_PRIORITY[left.status || 'pending_review'] ?? 1)
    - (REVIEW_PRIORITY[right.status || 'pending_review'] ?? 1);
  if (statusDifference !== 0) return statusDifference;

  const dateDifference = String(right.date || '').localeCompare(String(left.date || ''));
  if (dateDifference !== 0) return dateDifference;

  return String(left.merchant || left.category).localeCompare(String(right.merchant || right.category), 'es', {
    sensitivity: 'base'
  });
});

export const buildMerchantCounts = (
  expenses: Expense[],
  resolveMerchantId: (merchant?: string) => string
) => expenses.reduce<Record<string, number>>((counts, expense) => {
  const merchantId = resolveMerchantId(expense.merchant);
  counts[merchantId] = (counts[merchantId] || 0) + 1;
  return counts;
}, {});
