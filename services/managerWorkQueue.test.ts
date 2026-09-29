import { describe, expect, it } from 'vitest';
import { Expense, GestorRequirement, Income, User, UserRole } from '../types';
import { expenseReviewPercentage, localCalendarDay, managerWorkQueue, parseDeductiblePercentage } from './managerWorkQueue';

const client = (id: string, managerId = 'manager'): User => ({ id, managerId, role: UserRole.RIDER, name: id, email: `${id}@example.test`, platforms: [] });
const expense = (userId: string, status?: Expense['status']): Expense => ({ id: `e-${userId}`, userId, amount: 12, date: '2026-09-01', category: 'other', status });
const income = (userId: string, needsReview = true): Income => ({ id: `i-${userId}`, userId, amount: 20, retention: 0, date: '2026-09-01', platform: 'manual', needsReview });
const request = (riderId: string, status: GestorRequirement['status'], deadline: string, managerId = 'manager'): GestorRequirement => ({ id: `r-${riderId}`, riderId, managerId, managerName: 'Manager', riderName: riderId, title: 'Documento', description: '', category: 'other', status, deadline, createdAt: '2026-09-01' });
const now = new Date(2026, 8, 29, 12);

describe('manager work queue', () => {
  it('excludes other managers, unlinked users, manager profiles and wrong-owner requests', () => {
    const users = [client('own'), client('other', 'different'), { ...client('staff'), role: UserRole.MANAGER }];
    const result = managerWorkQueue('manager', users, [expense('own'), expense('other'), expense('staff')], [income('other')], [request('own', 'submitted', '2026-09-01', 'different')], now);
    expect(result).toEqual([{ clientId: 'own', clientName: 'own', expenses: 1, incomes: 0, submitted: 0, overdue: 0, total: 1 }]);
    expect(managerWorkQueue(undefined, users, [expense('own')], [], [], now)).toEqual([]);
  });
  it('prioritizes overdue requests, then submitted responses, then review volume', () => {
    const users = ['volume', 'submitted', 'overdue'].map(id => client(id));
    const result = managerWorkQueue('manager', users, [expense('volume')], [income('volume')], [request('submitted', 'submitted', '2026-09-30'), request('overdue', 'pending', '2026-09-28')], now);
    expect(result.map(row => row.clientId)).toEqual(['overdue', 'submitted', 'volume']);
  });
  it('does not treat today, future, approved or missing deadlines as overdue', () => {
    const requests = [request('own', 'pending', '2026-09-29'), request('own', 'pending', '2026-09-30'), request('own', 'approved', '2026-09-01'), request('own', 'pending', '')];
    expect(managerWorkQueue('manager', [client('own')], [], [], requests, now)).toEqual([]);
    expect(localCalendarDay(new Date(2026, 0, 2, 0, 5))).toBe('2026-01-02');
  });
  it('does not count corrections awaiting a worker or already reviewed records as manager reviews', () => {
    expect(managerWorkQueue('manager', [client('own')], [expense('own', 'needs_fix'), expense('own', 'approved'), expense('own', 'rejected')], [income('own', false)], [], now)).toEqual([]);
  });
});

describe('explicit deductible decision', () => {
  it('rejects missing, invalid and out-of-range decisions instead of clamping', () => {
    for (const value of ['', ' ', '-1', '101', 'Infinity', 'NaN', '1e2', '20%']) expect(parseDeductiblePercentage(value)).toBeNull();
  });
  it('accepts an explicit zero and fractional decisions', () => {
    expect(parseDeductiblePercentage('0')).toBe(0);
    expect(parseDeductiblePercentage('100')).toBe(100);
    expect(parseDeductiblePercentage('25,5')).toBe(25.5);
  });
  it('never proposes 100% for unknown or unreviewed expenses and preserves reviewed zero', () => {
    expect(expenseReviewPercentage(expense('own'))).toBe('');
    expect(expenseReviewPercentage({ ...expense('own'), deductiblePercentage: 0 })).toBe('');
    expect(expenseReviewPercentage({ ...expense('own'), deductiblePercentage: 0, gestorNotes: 'Confirmado' })).toBe('0');
    expect(expenseReviewPercentage({ ...expense('own'), deductiblePercentage: 40, gestorNotes: 'Confirmado' })).toBe('40');
  });
});
