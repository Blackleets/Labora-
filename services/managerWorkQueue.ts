import { Expense, GestorRequirement, Income, User, UserRole } from '../types';

export interface ManagerWorkItem {
  clientId: string;
  clientName: string;
  expenses: number;
  incomes: number;
  submitted: number;
  overdue: number;
  total: number;
}

/** Dates are local calendar days; a deadline today is still open, not overdue. */
export function localCalendarDay(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function managerWorkQueue(managerId: string | undefined, users: User[], expenses: Expense[], incomes: Income[], requirements: GestorRequirement[], now = new Date()): ManagerWorkItem[] {
  if (!managerId) return [];
  const today = localCalendarDay(now);
  return users.filter(user => user.role === UserRole.RIDER && user.managerId === managerId)
    .map(client => {
      const requests = requirements.filter(row => row.managerId === managerId && row.riderId === client.id);
      const item = {
        clientId: client.id,
        clientName: client.name,
        expenses: expenses.filter(row => row.userId === client.id && (!row.status || row.status === 'pending_review')).length,
        incomes: incomes.filter(row => row.userId === client.id && row.needsReview === true).length,
        submitted: requests.filter(row => row.status === 'submitted').length,
        overdue: requests.filter(row => row.status === 'pending' && /^\d{4}-\d{2}-\d{2}$/.test(row.deadline) && row.deadline < today).length,
        total: 0
      };
      item.total = item.expenses + item.incomes + item.submitted + item.overdue;
      return item;
    })
    .filter(item => item.total > 0)
    .sort((a, b) => b.overdue - a.overdue || b.submitted - a.submitted || b.total - a.total || a.clientName.localeCompare(b.clientName, 'es') || a.clientId.localeCompare(b.clientId));
}

/** Never turn a missing fiscal decision into 100%, or clamp an invalid one. */
export function parseDeductiblePercentage(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d+(?:[.,]\d+)?$/.test(trimmed)) return null;
  const value = Number(trimmed.replace(',', '.'));
  return Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
}

export function expenseReviewPercentage(expense: Expense): string {
  if (!expense.gestorNotes?.trim() || expense.deductiblePercentage === undefined) return '';
  return parseDeductiblePercentage(String(expense.deductiblePercentage)) === null ? '' : String(expense.deductiblePercentage);
}
