/**
 * Pure helpers for owner-delete UX (expenses / incomes / documents).
 * No React / Supabase — unit-tested, fail-closed.
 */

export type LinkedIncomeRef = {
  id: string;
  userId: string;
  sourceDocumentId?: string;
};

/** Incomes owned by `ownerUserId` that cite this document as evidence. */
export const linkedIncomesForDocument = (
  incomes: LinkedIncomeRef[],
  documentId: string,
  ownerUserId: string
): LinkedIncomeRef[] =>
  incomes.filter(
    (income) =>
      income.sourceDocumentId === documentId && income.userId === ownerUserId
  );

/** Spanish confirm copy for document delete, with optional income cascade. */
export const documentDeleteConfirmMessage = (
  documentName: string,
  linkedIncomeCount: number
): string => {
  if (linkedIncomeCount > 0) {
    const n = linkedIncomeCount;
    return `Se eliminarán ${n} ${n === 1 ? 'ingreso vinculado' : 'ingresos vinculados'} y el documento «${documentName}». ¿Continuar?`;
  }
  return `¿Eliminar «${documentName}» del expediente?`;
};

/** Spanish confirm for a rider's own expense (stronger if approved). */
export const expenseDeleteConfirmMessage = (
  approved: boolean,
  label?: string
): string => {
  const name = label?.trim() ? ` «${label.trim()}»` : '';
  if (approved) {
    return `Este gasto${name} está aprobado por gestoría. ¿Eliminarlo de todas formas? Esta acción no se puede deshacer.`;
  }
  return `¿Eliminar el gasto${name}?`;
};

/** Spanish confirm for a rider's own income. */
export const incomeDeleteConfirmMessage = (label?: string): string => {
  const name = label?.trim() ? ` «${label.trim()}»` : '';
  return `¿Eliminar el ingreso${name}?`;
};

/** True when the signed-in user may delete this row (owner only; managers never). */
export const canOwnerDeleteRow = (
  rowUserId: string | undefined,
  currentUserId: string | undefined,
  isManager: boolean
): boolean => {
  if (isManager) return false;
  if (!rowUserId || !currentUserId) return false;
  return rowUserId === currentUserId;
};
