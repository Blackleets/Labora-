import { Expense, Income } from '../types';

export interface FiscalPeriod {
  label: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  quarterStart: string;
  quarterEnd: string;
  yearStart: string;
}

export interface FiscalSnapshot {
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
    finalAmount: null;
    status: 'requires_gestor_review';
    explanation: string;
  };
  model303: {
    deductibleInputVatRecorded: number;
    finalAmount: null;
    status: 'insufficient_verified_vat_data';
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
  const netActivityEstimate = roundMoney(Math.max(0, grossYtd - approvedYtdExpenses));

  // This is deliberately an accrued prepayment estimate only. Modelo 130 is
  // cumulative and the final amount can depend on prior instalments and other
  // adjustments that are not yet represented in the current data model.
  const provisional130 = roundMoney(Math.max(0, netActivityEstimate * 0.2 - retentionsYtd));
  const deductibleInputVat = roundMoney(
    ytdExpenses
      .filter((expense) => expense.status === 'approved')
      .reduce((sum, expense) => sum + (expense.vatAmount || 0), 0),
  );

  const pendingExpenseCount = quarterExpenses.filter((expense) => !expense.status || expense.status === 'pending_review' || expense.status === 'needs_fix').length;
  const rejectedExpenseCount = quarterExpenses.filter((expense) => expense.status === 'rejected').length;
  const warnings: string[] = [];

  if (quarterIncomes.length === 0) warnings.push('No hay ingresos verificados registrados para este trimestre.');
  if (pendingExpenseCount > 0) warnings.push(`${pendingExpenseCount} gasto(s) siguen pendientes de revisión y no se han contado como deducibles.`);
  warnings.push('El importe final del Modelo 130 requiere pagos fraccionados anteriores y revisión del gestor.');
  warnings.push('El Modelo 303 no se calcula como deuda final hasta registrar IVA repercutido y soportado con evidencia suficiente.');

  return {
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
      provisionalAccruedAmount: provisional130,
      finalAmount: null,
      status: 'requires_gestor_review',
      explanation: 'Estimación acumulada previa a pagos fraccionados anteriores y ajustes. No equivale a una autoliquidación lista para presentar.',
    },
    model303: {
      deductibleInputVatRecorded: deductibleInputVat,
      finalAmount: null,
      status: 'insufficient_verified_vat_data',
      explanation: 'Faltan campos estructurados de IVA repercutido y validación fiscal suficiente para calcular una liquidación final.',
    },
    dataQuality: {
      hasIncome: quarterIncomes.length > 0,
      hasPendingExpenses: pendingExpenseCount > 0,
      warnings,
    },
  };
};
