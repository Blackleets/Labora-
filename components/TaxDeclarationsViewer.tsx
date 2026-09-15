import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Info,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { UserRole } from '../types';
import { buildFiscalSnapshot } from '../services/fiscalEngine';

interface TaxDeclarationsViewerProps {
  setView?: (view: string) => void;
}

const money = (value: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

const downloadCsv = (filename: string, rows: string[][]) => {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const content = rows.map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const TaxDeclarationsViewer: React.FC<TaxDeclarationsViewerProps> = ({ setView }) => {
  const { currentUser, users, incomes, expenses, showNotification } = useData();
  const [selectedQuarter, setSelectedQuarter] = useState('3T 2026');

  const isManager = currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.ADMIN;
  const rider = isManager
    ? users.find((user) => user.role === UserRole.RIDER)
    : currentUser;

  const riderId = rider?.id || '';
  const snapshot = useMemo(
    () => buildFiscalSnapshot(incomes, expenses, riderId, selectedQuarter),
    [incomes, expenses, riderId, selectedQuarter],
  );

  const quarterExpenses = expenses.filter(
    (expense) => expense.userId === riderId && expense.date >= snapshot.period.quarterStart && expense.date <= snapshot.period.quarterEnd,
  );
  const quarterIncomes = incomes.filter(
    (income) => income.userId === riderId && income.date >= snapshot.period.quarterStart && income.date <= snapshot.period.quarterEnd,
  );

  const exportExpenseDraft = () => {
    const rows = [
      ['BORRADOR - NO PRESENTADO ANTE AEAT'],
      ['Fecha', 'Proveedor', 'Categoría', 'Importe', 'IVA registrado', 'Deducibilidad validada', 'Estado', 'Evidencia'],
      ...quarterExpenses.map((expense) => [
        expense.date,
        expense.merchant || '',
        String(expense.category),
        expense.amount.toFixed(2),
        (expense.vatAmount || 0).toFixed(2),
        `${expense.deductiblePercentage || 0}%`,
        expense.status || 'pending_review',
        expense.receiptUrl ? 'SI' : 'NO',
      ]),
    ];
    downloadCsv(`Labora_Borrador_Gastos_${selectedQuarter.replace(' ', '_')}.csv`, rows);
    showNotification('success', 'Borrador de gastos exportado. No es un justificante de presentación.');
  };

  const exportIncomeDraft = () => {
    const rows = [
      ['BORRADOR - NO PRESENTADO ANTE AEAT'],
      ['Fecha', 'Plataforma', 'Importe registrado', 'Retención registrada'],
      ...quarterIncomes.map((income) => [income.date, income.platform, income.amount.toFixed(2), (income.retention || 0).toFixed(2)]),
    ];
    downloadCsv(`Labora_Borrador_Ingresos_${selectedQuarter.replace(' ', '_')}.csv`, rows);
    showNotification('success', 'Borrador de ingresos exportado. Revisa los datos con tu gestor.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {setView && (
        <button onClick={() => setView('dashboard')} className="text-xs font-bold text-[#2E5A44] hover:underline">
          ← Volver al panel
        </button>
      )}

      <section className="rounded-3xl border border-[#345947] bg-[#213B2F] p-6 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#D8EADB]">
              <ShieldCheck className="h-4 w-4" /> Centro fiscal basado en evidencia
            </div>
            <h2 className="font-serif text-2xl font-bold">Qué tengo, qué falta y qué debe revisar mi gestor</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#D3E3D8]">
              Labora+ organiza los datos del trimestre y calcula estimaciones de trabajo. Nunca marca una declaración como presentada ni genera un CSV de AEAT sin una prueba externa real.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={exportExpenseDraft} className="flex items-center gap-2 rounded-xl border border-[#416854] bg-[#2D4E3E] px-3.5 py-2 text-xs font-semibold text-[#F3EFE6]">
              <FileSpreadsheet className="h-4 w-4" /> Borrador gastos
            </button>
            <button onClick={exportIncomeDraft} className="flex items-center gap-2 rounded-xl border border-[#416854] bg-[#2D4E3E] px-3.5 py-2 text-xs font-semibold text-[#F3EFE6]">
              <Download className="h-4 w-4" /> Borrador ingresos
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900">Periodo de trabajo</h3>
            <p className="mt-1 text-xs text-stone-500">Solo se usan movimientos cuya fecha cae dentro del periodo correspondiente.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['1T 2026', '2T 2026', '3T 2026', '4T 2026'].map((quarter) => (
              <button key={quarter} onClick={() => setSelectedQuarter(quarter)} className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${selectedQuarter === quarter ? 'bg-[#2E5A44] text-white' : 'border border-[#DFD5C6] bg-white text-stone-600'}`}>
                {quarter}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <Metric label="Ingresos registrados" value={money(snapshot.quarter.grossIncome)} />
          <Metric label="Gastos aprobados deducibles" value={money(snapshot.quarter.approvedDeductibleExpenses)} />
          <Metric label="Gastos pendientes" value={String(snapshot.quarter.pendingExpenseCount)} emphasis={snapshot.quarter.pendingExpenseCount > 0} />
          <Metric label="Gastos rechazados" value={String(snapshot.quarter.rejectedExpenseCount)} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Scale className="h-5 w-5 text-[#2E5A44]" /><h3 className="font-serif font-bold">Modelo 130 · estimación de trabajo</h3></div>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">REQUIERE GESTOR</span>
          </div>
          <div className="mt-5 rounded-2xl bg-[#F2EDE4] p-4">
            <p className="text-xs text-stone-500">Acumulado provisional antes de pagos fraccionados anteriores</p>
            <p className="mt-1 font-serif text-3xl font-bold text-stone-900">{money(snapshot.model130.provisionalAccruedAmount)}</p>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <Line label="Ingresos acumulados" value={money(snapshot.yearToDate.grossIncome)} />
            <Line label="Gastos aprobados acumulados" value={money(snapshot.yearToDate.approvedDeductibleExpenses)} />
            <Line label="Retenciones registradas" value={money(snapshot.yearToDate.retentionsRecorded)} />
          </dl>
          <p className="mt-4 flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800"><Info className="mt-0.5 h-4 w-4 shrink-0" />{snapshot.model130.explanation}</p>
        </section>

        <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Scale className="h-5 w-5 text-[#3A7596]" /><h3 className="font-serif font-bold">Modelo 303 · control de IVA</h3></div>
            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">DATOS INCOMPLETOS</span>
          </div>
          <div className="mt-5 rounded-2xl bg-[#EEF4F7] p-4">
            <p className="text-xs text-stone-500">IVA soportado aprobado registrado</p>
            <p className="mt-1 font-serif text-3xl font-bold text-stone-900">{money(snapshot.model303.deductibleInputVatRecorded)}</p>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-stone-600">{snapshot.model303.explanation}</p>
          <p className="mt-4 flex gap-2 rounded-2xl border border-sky-200 bg-sky-50 p-3 text-xs leading-relaxed text-sky-800"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />Labora+ no mostrará una deuda de IVA “final” hasta que el backend guarde bases y cuotas verificadas de ingresos y gastos.</p>
        </section>
      </div>

      <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-[#2E5A44]" /><h3 className="font-serif font-bold">Control de calidad del trimestre</h3></div>
        <div className="space-y-2">
          {snapshot.dataQuality.warnings.map((warning) => (
            <div key={warning} className="flex items-start gap-2 rounded-xl bg-[#F7F3EC] px-3 py-2.5 text-xs text-stone-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#C96846]" />{warning}</div>
          ))}
        </div>
      </section>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string; emphasis?: boolean }> = ({ label, value, emphasis }) => (
  <div className={`rounded-2xl border p-4 ${emphasis ? 'border-amber-200 bg-amber-50' : 'border-[#E8DFC8] bg-white'}`}>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{label}</p>
    <p className="mt-1 font-serif text-xl font-bold text-stone-900">{value}</p>
  </div>
);

const Line: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3"><dt className="text-stone-500">{label}</dt><dd className="font-semibold text-stone-900">{value}</dd></div>
);
