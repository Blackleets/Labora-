import { Expense, Income } from '../types';
import { FISCAL_POLICY_ES_2026 } from './fiscalPolicyES2026';

export interface FiscalPeriod {
  label: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  quarterStart: string;
  quarterEnd: string;
  yearStart: string;
}

export interface FiscalSnapshot {
  policyId: string;
  period: FiscalPeriod;
  quarter: {
    grossIncome: number;
    approvedDeductibleExpenses: number;
    pendingExpenseCount: number;
    rejectedExpenseCount: number;
  };
  yearToDate: {
    grossIncome: number;
    approvedDeductibleExpenses: number;
    netActivityEstimate: number;
    retentionsRecorded: number;
  };
  model130: {
    provisionalAccruedAmount: number;
    standardRateReferenceAmount: number;
    finalAmount: null;
    status: 'insufficient_required_context';
    missingInputs: readonly string[];
    explanation: string;
  };
  model303: {
    deductibleInputVatRecorded: number;
    finalAmount: null;
    status: 'insufficient_verified_vat_data';
    missingInputs: readonly string[];
    explanation: string;
  };
  dataQuality: {
    hasIncome: boolean;
    hasPendingExpenses: boolean;
    warnings: string[];
  };
}

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const parseFiscalPeriod = (label: string): FiscalPeriod => {
  const match = label.trim().match(/^([1-4])T\s+(\d{4})$/i);
  if (!match) throw new Error(`Periodo fiscal no válido: ${label}`);

  const quarter = Number(match[1]) as 1 | 2 | 3 | 4;
  const year = Number(match[2]);
  const starts = ['01-01', '04-01', '07-01', '10-01'];
  const ends = ['03-31', '06-30', '09-30', '12-31'];

  return {
    label: `${quarter}T ${year}`,
    year,
    quarter,
    quarterStart: `${year}-${starts[quarter - 1]}`,
    quarterEnd: `${year}-${ends[quarter - 1]}`,
    yearStart: `${year}-01-01`,
  };
};

const isBetween = (date: string, start: string, end: string) => date >= start && date <= end;

const deductibleAmount = (expense: Expense) => {
  if (expense.status !== 'approved') return 0;
  const percentage = Math.min(100, Math.max(0, expense.deductiblePercentage ?? 0));
  return expense.amount * (percentage / 100);
};

export const buildFiscalSnapshot = (
  incomes: Income[],
  expenses: Expense[],
  userId: string,
  periodLabel: string,
): FiscalSnapshot => {
  const period = parseFiscalPeriod(periodLabel);
  if (period.year !== FISCAL_POLICY_ES_2026.taxYear) {
    throw new Error(`El motor fiscal activo solo está verificado para ${FISCAL_POLICY_ES_2026.taxYear}.`);
  }

  const userIncomes = incomes.filter((income) => income.userId === userId);
  const userExpenses = expenses.filter((expense) => expense.userId === userId);
  const quarterIncomes = userIncomes.filter((income) => isBetween(income.date, period.quarterStart, period.quarterEnd));
  const quarterExpenses = userExpenses.filter((expense) => isBetween(expense.date, period.quarterStart, period.quarterEnd));
  const ytdIncomes = userIncomes.filter((income) => isBetween(income.date, period.yearStart, period.quarterEnd));
  const ytdExpenses = userExpenses.filter((expense) => isBetween(expense.date, period.yearStart, period.quarterEnd));

  const grossQuarter = roundMoney(quarterIncomes.reduce((sum, income) => sum + income.amount, 0));
  const approvedQuarterExpenses = roundMoney(quarterExpenses.reduce((sum, expense) => sum + deductibleAmount(expense), 0));
  const grossYtd = roundMoney(ytdIncomes.reduce((sum, income) => sum + income.amount, 0));
  const approvedYtdExpenses = roundMoney(ytdExpenses.reduce((sum, expense) => sum + deductibleAmount(expense), 0));
  const retentionsYtd = roundMoney(ytdIncomes.reduce((sum, income) => sum + (income.retention || 0), 0));
  const netActivityEstimate = roundMoney(grossYtd - approvedYtdExpenses);

  // Reference only: AEAT Modelo 130 uses 20% on a positive box 03 under the
  // standard rule, but the payable amount also depends on prior instalments,
  // retentions, obligation exceptions and potentially territorial rules.
  // It MUST NOT be presented as the amount to file or pay.
  const standardRateReferenceAmount = roundMoney(
    Math.max(0, Math.max(0, netActivityEstimate) * FISCAL_POLICY_ES_2026.model130.standardPositiveNetRate - retentionsYtd),
  );

  // Modelo 303 is period-based. Only input VAT explicitly recorded on approved
  // expenses inside the selected quarter is summarized here. We deliberately do
  // not infer output VAT or a final balance from gross income.
  const deductibleInputVat = roundMoney(
    quarterExpenses
      .filter((expense) => expense.status === 'approved')
      .reduce((sum, expense) => sum + (expense.vatAmount || 0), 0),
  );

  const pendingExpenseCount = quarterExpenses.filter(
    (expense) => !expense.status || expense.status === 'pending_review' || expense.status === 'needs_fix',
  ).length;
  const rejectedExpenseCount = quarterExpenses.filter((expense) => expense.status === 'rejected').length;
  const warnings: string[] = [];

  if (quarterIncomes.length === 0) warnings.push('No hay ingresos registrados para este trimestre.');
  if (pendingExpenseCount > 0) warnings.push(`${pendingExpenseCount} gasto(s) siguen pendientes de revisión y no se han contado como deducibles.`);
  warnings.push('Modelo 130: la referencia estándar no determina obligación ni importe final; faltan pagos anteriores, situación de retenciones y circunstancias personales/territoriales.');
  warnings.push('Modelo 303: no se calcula una deuda final hasta registrar bases/cuotas repercutidas y soportadas con evidencia suficiente.');
  warnings.push('Vehículos y motocicletas: Labora+ no presupone una deducción automática del 100%; la afectación debe revisarse según el caso.');

  return {
    policyId: FISCAL_POLICY_ES_2026.id,
    period,
    quarter: {
      grossIncome: grossQuarter,
      approvedDeductibleExpenses: approvedQuarterExpenses,
      pendingExpenseCount,
      rejectedExpenseCount,
    },
    yearToDate: {
      grossIncome: grossYtd,
      approvedDeductibleExpenses: approvedYtdExpenses,
      netActivityEstimate,
      retentionsRecorded: retentionsYtd,
    },
    model130: {
      provisionalAccruedAmount: standardRateReferenceAmount,
      standardRateReferenceAmount,
      finalAmount: null,
      status: 'insufficient_required_context',
      missingInputs: FISCAL_POLICY_ES_2026.model130.requiredBeforeFinalAmount,
      explanation: 'Referencia matemática bajo la regla estándar del 20% sobre rendimiento neto positivo, menos retenciones registradas. No determina obligación, cuota final ni cantidad a presentar.',
    },
    model303: {
      deductibleInputVatRecorded: deductibleInputVat,
      finalAmount: null,
      status: 'insufficient_verified_vat_data',
      missingInputs: FISCAL_POLICY_ES_2026.model303.requiredBeforeFinalAmount,
      explanation: 'Se resume únicamente el IVA soportado registrado y aprobado dentro del trimestre. No se infiere el IVA repercutido ni una liquidación final a partir de ingresos brutos.',
    },
    dataQuality: {
      hasIncome: quarterIncomes.length > 0,
      hasPendingExpenses: pendingExpenseCount > 0,
      warnings,
    },
  };
};
