/**
 * Exportación trimestral para la gestoría — solo datos reales ya registrados en Labora+.
 * No calcula impuestos ni aplica tipos: suma importes y copia estados de revisión.
 * Formato: CSV con separador «;» y BOM UTF-8 (Excel/LibreOffice en español).
 */
import type { Expense, Income } from '../types';
import { exportFile } from './fileExport';

export type CsvCell = string | number | null | undefined;
export type CsvRow = CsvCell[];

export const parseQuarter = (quarter: string): { quarter: number; year: number } | null => {
  const match = quarter.trim().match(/^([1-4])T\s+(\d{4})$/i);
  if (!match) return null;
  return { quarter: Number(match[1]), year: Number(match[2]) };
};

export const currentQuarterLabel = (now: Date = new Date()) =>
  `${Math.floor(now.getMonth() / 3) + 1}T ${now.getFullYear()}`;

/** `date` en formato YYYY-MM-DD (o ISO); compara por texto para no depender de la zona horaria. */
export const dateInQuarter = (date: string, quarter: string) => {
  const parsed = parseQuarter(quarter);
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date || '');
  if (!parsed || !match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return false;
  return year === parsed.year && Math.floor((month - 1) / 3) + 1 === parsed.quarter;
};

/** Trimestres (más reciente primero) del año actual y de los años con datos. */
export const quarterOptionsFor = (dates: string[], now: Date = new Date()) => {
  const years = new Set<number>([now.getFullYear()]);
  for (const date of dates) {
    const year = Number(/^(\d{4})-/.exec(date || '')?.[1]);
    if (Number.isInteger(year) && year >= 2000 && year <= 2100) years.add(year);
  }
  return Array.from(years)
    .sort((a, b) => b - a)
    .flatMap((year) => [4, 3, 2, 1].map((quarter) => `${quarter}T ${year}`));
};

/**
 * Neutraliza inyección de fórmulas (CSV injection): celdas de texto que empiezan por
 * = + - @ tab o retorno se prefijan con «'». Los números se exportan tal cual.
 */
export const csvCell = (value: CsvCell): string => {
  if (value === null || value === undefined) return '""';
  if (typeof value === 'number') {
    return Number.isFinite(value) ? `"${String(value)}"` : '""';
  }
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export const toCsv = (rows: CsvRow[]) => `\uFEFF${rows.map((row) => row.map(csvCell).join(';')).join('\r\n')}`;

/** Importe con coma decimal (es-ES) como texto, para que Excel en español lo lea como número. */
export const money = (value: number | undefined | null) =>
  (Number.isFinite(value) ? Number(value) : 0).toFixed(2).replace('.', ',');

export const EXPENSE_STATUS_ES: Record<NonNullable<Expense['status']>, string> = {
  pending_review: 'Pendiente de revisión',
  approved: 'Validado por gestoría',
  rejected: 'No deducible',
  needs_fix: 'Corregir'
};

export const expenseStatusEs = (status: Expense['status']) =>
  EXPENSE_STATUS_ES[status || 'pending_review'] || EXPENSE_STATUS_ES.pending_review;

export const incomeReviewEs = (income: Income) => {
  if (income.reviewedBy && !income.needsReview) return 'Revisado por gestoría';
  if (income.needsReview) return 'Pendiente de revisión';
  return 'Registrado (sin revisión)';
};

const INCOME_SOURCE_ES: Record<string, string> = {
  manual: 'Manual',
  text_import: 'Importación texto/CSV',
  document_import: 'Documento',
  api_sync: 'Sincronización',
  bank_import: 'Banco'
};

const byDateAsc = <T extends { date: string }>(a: T, b: T) => a.date.localeCompare(b.date);

export const EXPENSE_HEADER: CsvRow = [
  'Fecha', 'Categoría', 'Proveedor', 'Nº factura', 'Importe total', 'IVA %', 'Cuota IVA',
  '% deducible asignado', 'Estado', 'Nota gestoría', 'Justificante', 'Notas autónomo'
];

export const expenseRow = (expense: Expense): CsvRow => [
  expense.date,
  String(expense.category ?? ''),
  expense.merchant || '',
  expense.invoiceNumber || '',
  money(expense.amount),
  typeof expense.vatRate === 'number' ? String(expense.vatRate) : '',
  typeof expense.vatAmount === 'number' ? money(expense.vatAmount) : '',
  typeof expense.deductiblePercentage === 'number' ? `${expense.deductiblePercentage}%` : '',
  expenseStatusEs(expense.status),
  expense.gestorNotes || '',
  expense.receiptUrl ? 'Sí (en Labora+)' : 'No',
  expense.notes || ''
];

export const INCOME_HEADER: CsvRow = ['Fecha', 'Plataforma', 'Importe bruto', 'Retención', 'Origen', 'Estado revisión', 'Nota gestoría'];

export const incomeRow = (income: Income): CsvRow => [
  income.date,
  income.platform,
  money(income.amount),
  money(income.retention),
  INCOME_SOURCE_ES[income.sourceType || 'manual'] || 'Manual',
  incomeReviewEs(income),
  income.reviewNote || ''
];

export const buildExpenseRows = (expenses: Expense[], quarter: string): CsvRow[] => [
  EXPENSE_HEADER,
  ...expenses.filter((expense) => dateInQuarter(expense.date, quarter)).sort(byDateAsc).map(expenseRow)
];

export const buildIncomeRows = (incomes: Income[], quarter: string): CsvRow[] => [
  INCOME_HEADER,
  ...incomes.filter((income) => dateInQuarter(income.date, quarter)).sort(byDateAsc).map(incomeRow)
];

export interface QuarterTotals {
  incomeCount: number;
  incomeGross: number;
  incomeRetention: number;
  incomePendingReview: number;
  expenseCount: number;
  expenseTotal: number;
  expenseVat: number;
  byStatus: Record<NonNullable<Expense['status']>, { count: number; amount: number }>;
  /** Suma de importe × % asignado solo en gastos validados. No es cálculo fiscal. */
  approvedDeductibleAmount: number;
  missingReceipt: number;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

export const quarterTotals = (expenses: Expense[], incomes: Income[], quarter: string): QuarterTotals => {
  const qExpenses = expenses.filter((expense) => dateInQuarter(expense.date, quarter));
  const qIncomes = incomes.filter((income) => dateInQuarter(income.date, quarter));
  const byStatus: QuarterTotals['byStatus'] = {
    pending_review: { count: 0, amount: 0 },
    approved: { count: 0, amount: 0 },
    rejected: { count: 0, amount: 0 },
    needs_fix: { count: 0, amount: 0 }
  };
  let approvedDeductibleAmount = 0;
  for (const expense of qExpenses) {
    const key = expense.status && expense.status in byStatus ? expense.status : 'pending_review';
    byStatus[key].count += 1;
    byStatus[key].amount = round2(byStatus[key].amount + (expense.amount || 0));
    if (key === 'approved') {
      const pct = Math.max(0, Math.min(100, expense.deductiblePercentage ?? 0));
      approvedDeductibleAmount += (expense.amount || 0) * pct / 100;
    }
  }
  return {
    incomeCount: qIncomes.length,
    incomeGross: round2(qIncomes.reduce((sum, income) => sum + (income.amount || 0), 0)),
    incomeRetention: round2(qIncomes.reduce((sum, income) => sum + (income.retention || 0), 0)),
    incomePendingReview: qIncomes.filter((income) => income.needsReview).length,
    expenseCount: qExpenses.length,
    expenseTotal: round2(qExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)),
    expenseVat: round2(qExpenses.reduce((sum, expense) => sum + (expense.vatAmount || 0), 0)),
    byStatus,
    approvedDeductibleAmount: round2(approvedDeductibleAmount),
    missingReceipt: qExpenses.filter((expense) => !expense.receiptUrl).length
  };
};

export interface QuarterClientInfo {
  name: string;
  nif?: string;
  email?: string;
}

/** Un único CSV por cliente: cabecera, resumen, gastos e ingresos del trimestre. */
export const buildQuarterPackRows = (
  client: QuarterClientInfo,
  quarter: string,
  expenses: Expense[],
  incomes: Income[],
  generatedAt: Date
): CsvRow[] => {
  const totals = quarterTotals(expenses, incomes, quarter);
  const pad = (value: number) => String(value).padStart(2, '0');
  const stamp = `${generatedAt.getFullYear()}-${pad(generatedAt.getMonth() + 1)}-${pad(generatedAt.getDate())} ${pad(generatedAt.getHours())}:${pad(generatedAt.getMinutes())}`;
  return [
    ['Labora+ · Exportación trimestral para gestoría'],
    ['Cliente', client.name],
    ['NIF', client.nif || ''],
    ['Email', client.email || ''],
    ['Trimestre', quarter],
    ['Generado', stamp],
    ['Aviso', 'Datos registrados en Labora+. No es una autoliquidación ni un cálculo oficial.'],
    [],
    ['RESUMEN'],
    ['Ingresos (nº)', totals.incomeCount],
    ['Ingresos brutos', money(totals.incomeGross)],
    ['Retenciones', money(totals.incomeRetention)],
    ['Ingresos pendientes de revisión (nº)', totals.incomePendingReview],
    ['Gastos (nº)', totals.expenseCount],
    ['Gastos importe total', money(totals.expenseTotal)],
    ['Cuota IVA registrada', money(totals.expenseVat)],
    ['Gastos validados (nº / importe)', totals.byStatus.approved.count, money(totals.byStatus.approved.amount)],
    ['Gastos pendientes (nº / importe)', totals.byStatus.pending_review.count, money(totals.byStatus.pending_review.amount)],
    ['Gastos a corregir (nº / importe)', totals.byStatus.needs_fix.count, money(totals.byStatus.needs_fix.amount)],
    ['Gastos no deducibles (nº / importe)', totals.byStatus.rejected.count, money(totals.byStatus.rejected.amount)],
    ['Importe validado × % asignado', money(totals.approvedDeductibleAmount)],
    ['Gastos sin justificante (nº)', totals.missingReceipt],
    [],
    ['GASTOS'],
    ...buildExpenseRows(expenses, quarter),
    [],
    ['INGRESOS'],
    ...buildIncomeRows(incomes, quarter)
  ];
};

const slug = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .toLowerCase()
  .slice(0, 40) || 'cliente';

export const quarterExportFilename = (kind: 'trimestre' | 'gastos' | 'ingresos', quarter: string, clientName?: string) =>
  `labora_${kind}_${quarter.replace(/\s+/g, '_')}${clientName ? `_${slug(clientName)}` : ''}.csv`;

/** Browser download or Android Save As. Callers must await the result. */
export const downloadCsv = async (filename: string, rows: CsvRow[]) => {
  return exportFile(filename, new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }));
};
