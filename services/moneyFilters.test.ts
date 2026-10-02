import { describe, expect, it } from 'vitest';
import type { Expense, Income } from '../types';
import {
  expenseMatches,
  hasActiveExpenseFilters,
  hasActiveIncomeFilters,
  incomeMatches,
  normalizeSearch,
  sortByDateDesc,
  uniqueSorted
} from './moneyFilters';

const e = (over: Partial<Expense>): Expense => ({ id: 'e', userId: 'u1', category: 'Gasolina', date: '2026-08-10', amount: 42.5, ...over });
const i = (over: Partial<Income>): Income => ({ id: 'i', userId: 'u1', platform: 'Glovo', date: '2026-08-10', amount: 100, retention: 0, ...over });

describe('moneyFilters', () => {
  it('normalizes accents and case', () => {
    expect(normalizeSearch('  Móvil ')).toBe('movil');
  });

  it('expense search matches merchant, category, notes, invoice and amount', () => {
    expect(expenseMatches(e({ merchant: 'Repsol Almería' }), { query: 'almeria' })).toBe(true);
    expect(expenseMatches(e({ category: 'Móvil' }), { query: 'movil' })).toBe(true);
    expect(expenseMatches(e({ invoiceNumber: 'F-2026-7' }), { query: 'f-2026' })).toBe(true);
    expect(expenseMatches(e({}), { query: '42.50' })).toBe(true);
    expect(expenseMatches(e({}), { query: 'amazon' })).toBe(false);
  });

  it('expense status filter treats missing status as pending', () => {
    expect(expenseMatches(e({}), { status: 'pending_review' })).toBe(true);
    expect(expenseMatches(e({}), { status: 'to_review' })).toBe(true);
    expect(expenseMatches(e({ status: 'needs_fix' }), { status: 'to_review' })).toBe(true);
    expect(expenseMatches(e({ status: 'approved' }), { status: 'to_review' })).toBe(false);
    expect(expenseMatches(e({ status: 'rejected' }), { status: 'rejected' })).toBe(true);
    expect(expenseMatches(e({ status: 'approved' }), { status: 'all' })).toBe(true);
  });

  it('expense category and client filters', () => {
    expect(expenseMatches(e({}), { category: 'Gasolina' })).toBe(true);
    expect(expenseMatches(e({}), { category: 'Peajes' })).toBe(false);
    expect(expenseMatches(e({}), { userId: 'u2' })).toBe(false);
  });

  it('merchant filtering intersects client, status, category and search without mutating the receipt', () => {
    const receipt = e({ merchant: 'CEPSA Almería', notes: 'BP en la nota', status: 'approved' });
    const before = JSON.stringify(receipt);
    expect(expenseMatches(receipt, { merchant: 'brand:moeve', userId: 'u1', category: 'Gasolina', status: 'approved', query: 'almeria' })).toBe(true);
    expect(expenseMatches(receipt, { merchant: 'brand:bp' })).toBe(false);
    expect(expenseMatches(receipt, { merchant: 'brand:moeve', userId: 'u2' })).toBe(false);
    expect(expenseMatches(receipt, { merchant: 'brand:moeve', category: 'Comida' })).toBe(false);
    expect(expenseMatches(receipt, { merchant: 'brand:moeve', status: 'pending_review' })).toBe(false);
    expect(expenseMatches(receipt, { merchant: 'brand:moeve', query: 'madrid' })).toBe(false);
    expect(JSON.stringify(receipt)).toBe(before);
    expect(hasActiveExpenseFilters({ merchant: 'brand:moeve' })).toBe(true);
    expect(expenseMatches(e({}), { merchant: 'missing' })).toBe(true);
    expect(expenseMatches(e({ merchant: 'Bar José' }), { merchant: 'missing' })).toBe(false);
    expect(expenseMatches(e({ merchant: 'Bar José' }), { merchant: 'merchant:bar jose' })).toBe(true);
  });

  it('income filters', () => {
    expect(incomeMatches(i({}), { platform: 'Uber Eats' })).toBe(false);
    expect(incomeMatches(i({ needsReview: true }), { review: 'needs_review' })).toBe(true);
    expect(incomeMatches(i({ needsReview: false }), { review: 'needs_review' })).toBe(false);
    expect(incomeMatches(i({ reviewedBy: 'g', needsReview: false }), { review: 'reviewed' })).toBe(true);
    expect(incomeMatches(i({ needsReview: false }), { review: 'reviewed' })).toBe(false);
    expect(incomeMatches(i({}), { query: 'glo' })).toBe(true);
  });

  it('sorting and helpers', () => {
    const rows = [e({ id: 'a', date: '2026-01-01' }), e({ id: 'b', date: '2026-03-01' }), e({ id: 'c', date: '2026-03-01' })];
    expect(sortByDateDesc(rows).map((r) => r.id)).toEqual(['b', 'c', 'a']);
    expect(rows[0].id).toBe('a');
    expect(uniqueSorted(['Uber', 'Glovo', 'Uber', '', undefined])).toEqual(['Glovo', 'Uber']);
    expect(hasActiveExpenseFilters({ status: 'all', query: ' ' })).toBe(false);
    expect(hasActiveExpenseFilters({ category: 'Gasolina' })).toBe(true);
    expect(hasActiveIncomeFilters({ review: 'reviewed' })).toBe(true);
  });
});
