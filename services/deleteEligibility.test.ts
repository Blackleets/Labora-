import { describe, expect, it } from 'vitest';
import {
  canOwnerDeleteRow,
  documentDeleteConfirmMessage,
  expenseDeleteConfirmMessage,
  incomeDeleteConfirmMessage,
  linkedIncomesForDocument
} from './deleteEligibility';

describe('deleteEligibility helpers', () => {
  const incomes = [
    { id: 'i1', userId: 'rider-1', sourceDocumentId: 'doc-1' },
    { id: 'i2', userId: 'rider-1', sourceDocumentId: 'doc-1' },
    { id: 'i3', userId: 'rider-2', sourceDocumentId: 'doc-1' },
    { id: 'i4', userId: 'rider-1', sourceDocumentId: 'doc-2' },
    { id: 'i5', userId: 'rider-1' }
  ];

  it('lists only owner incomes linked to a document', () => {
    expect(linkedIncomesForDocument(incomes, 'doc-1', 'rider-1').map((i) => i.id)).toEqual([
      'i1',
      'i2'
    ]);
    expect(linkedIncomesForDocument(incomes, 'doc-1', 'rider-2').map((i) => i.id)).toEqual(['i3']);
    expect(linkedIncomesForDocument(incomes, 'missing', 'rider-1')).toEqual([]);
  });

  it('builds cascade document confirm in Spanish', () => {
    expect(documentDeleteConfirmMessage('Liq Glovo.pdf', 0)).toBe(
      '¿Eliminar «Liq Glovo.pdf» del expediente?'
    );
    expect(documentDeleteConfirmMessage('Liq Glovo.pdf', 1)).toContain('1 ingreso vinculado');
    expect(documentDeleteConfirmMessage('Liq Glovo.pdf', 3)).toContain('3 ingresos vinculados');
    expect(documentDeleteConfirmMessage('Liq Glovo.pdf', 2)).toContain('y el documento');
  });

  it('builds stronger expense confirm when approved', () => {
    expect(expenseDeleteConfirmMessage(false, 'Repsol')).toContain('¿Eliminar el gasto «Repsol»?');
    expect(expenseDeleteConfirmMessage(true, 'Repsol')).toContain('aprobado por gestoría');
    expect(expenseDeleteConfirmMessage(true)).toContain('no se puede deshacer');
  });

  it('builds income confirm', () => {
    expect(incomeDeleteConfirmMessage('Uber')).toBe('¿Eliminar el ingreso «Uber»?');
    expect(incomeDeleteConfirmMessage()).toBe('¿Eliminar el ingreso?');
  });

  it('allows delete only for non-manager owners', () => {
    expect(canOwnerDeleteRow('u1', 'u1', false)).toBe(true);
    expect(canOwnerDeleteRow('u1', 'u2', false)).toBe(false);
    expect(canOwnerDeleteRow('u1', 'u1', true)).toBe(false);
    expect(canOwnerDeleteRow(undefined, 'u1', false)).toBe(false);
    expect(canOwnerDeleteRow('u1', undefined, false)).toBe(false);
  });
});
