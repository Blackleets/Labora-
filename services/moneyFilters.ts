/** Filtros puros para listas de gastos e ingresos (búsqueda, categoría, estado, cliente). */
import type { Expense, Income } from '../types';
import { merchantFilterKey } from './merchantBrands';

export type ExpenseStatusFilter = 'all' | 'to_review' | 'pending_review' | 'needs_fix' | 'approved' | 'rejected';
export type IncomeReviewFilter = 'all' | 'needs_review' | 'reviewed';

export const EXPENSE_STATUS_FILTER_OPTIONS: Array<{ value: ExpenseStatusFilter; label: string }> = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'to_review', label: 'Por revisar (pendiente + corregir)' },
  { value: 'pending_review', label: 'Pendiente' },
  { value: 'needs_fix', label: 'Corregir' },
  { value: 'approved', label: 'Validado' },
  { value: 'rejected', label: 'No deducible' }
];

export const INCOME_REVIEW_FILTER_OPTIONS: Array<{ value: IncomeReviewFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'needs_review', label: 'Pendiente de revisión' },
  { value: 'reviewed', label: 'Revisado por gestoría' }
];

export interface ExpenseFilterOptions {
  query?: string;
  merchant?: string;
  category?: string;
  status?: ExpenseStatusFilter;
  userId?: string;
}

export interface IncomeFilterOptions {
  query?: string;
  platform?: string;
  review?: IncomeReviewFilter;
  userId?: string;
}

export const normalizeSearch = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const matchesQuery = (query: string, fields: Array<string | number | undefined | null>) => {
  const needle = normalizeSearch(query);
  if (!needle) return true;
  return fields.some((field) => field !== undefined && field !== null && normalizeSearch(String(field)).includes(needle));
};

const effectiveStatus = (expense: Expense) => expense.status || 'pending_review';

export const expenseMatches = (expense: Expense, options: ExpenseFilterOptions) => {
  if (options.userId && expense.userId !== options.userId) return false;
  if (options.merchant && merchantFilterKey(expense.merchant) !== options.merchant) return false;
  if (options.category && String(expense.category) !== options.category) return false;
  const status = options.status || 'all';
  if (status === 'to_review') {
    if (effectiveStatus(expense) !== 'pending_review' && effectiveStatus(expense) !== 'needs_fix') return false;
  } else if (status !== 'all' && effectiveStatus(expense) !== status) {
    return false;
  }
  return matchesQuery(options.query || '', [
    expense.merchant,
    String(expense.category),
    expense.notes,
    expense.invoiceNumber,
    expense.gestorNotes,
    Number.isFinite(expense.amount) ? expense.amount.toFixed(2) : ''
  ]);
};

export const incomeMatches = (income: Income, options: IncomeFilterOptions) => {
  if (options.userId && income.userId !== options.userId) return false;
  if (options.platform && income.platform !== options.platform) return false;
  const review = options.review || 'all';
  if (review === 'needs_review' && !income.needsReview) return false;
  if (review === 'reviewed' && (income.needsReview || !income.reviewedBy)) return false;
  return matchesQuery(options.query || '', [
    income.platform,
    income.reviewNote,
    income.sourceReference,
    Number.isFinite(income.amount) ? income.amount.toFixed(2) : ''
  ]);
};

/** Más reciente primero; empate estable por id. No muta la entrada. */
export const sortByDateDesc = <T extends { date: string; id: string }>(rows: T[]) =>
  [...rows].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));

export const uniqueSorted = (values: Array<string | undefined | null>) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim()))))
    .sort((a, b) => a.localeCompare(b, 'es'));

export const hasActiveExpenseFilters = (options: ExpenseFilterOptions) =>
  Boolean(options.query?.trim() || options.merchant || options.category || (options.status && options.status !== 'all') || options.userId);

export const hasActiveIncomeFilters = (options: IncomeFilterOptions) =>
  Boolean(options.query?.trim() || options.platform || (options.review && options.review !== 'all') || options.userId);
