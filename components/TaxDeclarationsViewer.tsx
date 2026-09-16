import React, { useMemo, useState } from 'react';
import {
  Download,
  FileCheck2,
  FileSpreadsheet,
  History,
  Info
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { UserRole } from '../types';

interface TaxDeclarationsViewerProps {
  setView?: (view: string) => void;
  userId?: string;
}

export const TaxDeclarationsViewer: React.FC<TaxDeclarationsViewerProps> = ({ userId }) => {
  const {
    currentUser,
    users,
    declarations,
    expenses,
    incomes,
    calculateQuarterlyTaxes,
    showNotification
  } = useData();

  const isManager = currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.ADMIN;
  const fallbackRider = users.find((user) => user.role === UserRole.RIDER);
  const effectiveUserId = userId || (currentUser?.role === UserRole.RIDER ? currentUser.id : fallbackRider?.id) || '';
  const effectiveUser = users.find((user) => user.id === effectiveUserId) || (currentUser?.id === effectiveUserId ? currentUser : undefined);
  const [selectedQuarter, setSelectedQuarter] = useState('3T 2026');

  const { model130, model303 } = effectiveUserId
    ? calculateQuarterlyTaxes(effectiveUserId, selectedQuarter)
    : {
        model130: null,
        model303: null
      };

  const userDeclarations = useMemo(
    () => declarations.filter((declaration) => declaration.userId === effectiveUserId),
    [declarations, effectiveUserId]
  );

  const userExpenses = useMemo(
    () => expenses.filter((expense) => expense.userId === effectiveUserId),
    [expenses, effectiveUserId]
  );

  const userIncomes = useMemo(
    () => incomes.filter((income) => income.userId === effectiveUserId),
    [incomes, effectiveUserId]
  );

  const downloadCsv = (filename: string, rows: Array<Array<string | number>>) => {
    const content = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportExpenses = () => {
    const rows: Array<Array<string | number>> = [
      ['Fecha', 'Categoría', 'Proveedor', 'Importe', 'IVA', 'Deducibilidad', 'Estado'],
      ...userExpenses.map((expense) => [
        expense.date,
        String(expense.category),
        expense.merchant || '',
        expense.amount.toFixed(2),
        (expense.vatAmount || 0).toFixed(2),
        `${expense.deductiblePercentage ?? 100}%`,
        expense.status || 'pending_review'
      ])
    ];
    downloadCsv(`labora_gastos_${selectedQuarter.replace(/\s/g, '_')}.csv`, rows);
    showNotification('success', 'Archivo de gastos descargado.');
  };

  const exportIncomes = () => {
    const rows: Array<Array<string | number>> = [
      ['Fecha', 'Plataforma', 'Importe', 'Retención'],
      ...userIncomes.map((income) => [
        income.date,
        income.platform,
        income.amount.toFixed(2),
        income.retention.toFixed(2)
      ])
    ];
    downloadCsv(`labora_ingresos_${selectedQuarter.replace(/\s/g, '_')}.csv`, rows);
    showNotification('success', 'Archivo de ingresos descargado.');
  };

  if (!effectiveUserId || !effectiveUser) {
    return (
      <div className="rounded-2xl border border-dashed border-[#DDD5CA] bg-white p-8 text-center">
        <Info size={24} className="mx-auto text-stone-300" />
        <p className="mt-3 text-sm font-semibold text-stone-600">No hay un autónomo seleccionado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[#E3DCD2] bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">Datos de trabajo</p>
            <h3 className="mt-1 text-base font-bold text-stone-900">Detalle fiscal</h3>
            <p className="mt-1 text-xs text-stone-500">{effectiveUser.name} · {effectiveUser.nif || 'NIF no registrado'}</p>
          </div>
          <select
            value={selectedQuarter}
            onChange={(event) => setSelectedQuarter(event.target.value)}
            className="rounded-xl border border-[#DED7CC] bg-white px-3 py-2 text-xs font-semibold text-stone-700 outline-none"
          >
            <option>1T 2026</option>
            <option>2T 2026</option>
            <option>3T 2026</option>
            <option>4T 2026</option>
          </select>
        </div>

        {model130 && model303 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ModelRow code="130" title="Pago fraccionado IRPF" amount={model130.taxAmount} />
            <ModelRow code="303" title="Autoliquidación IVA" amount={model303.taxAmount} />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[#E3DCD2] bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={16} className="text-[#2E5A44]" />
          <h3 className="text-sm font-bold text-stone-900">Exportar registros</h3>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-stone-500">
          Descarga los movimientos almacenados en Labora+ para revisión, archivo o trabajo con tu asesoría.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            onClick={exportExpenses}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DED7CC] bg-white px-3 py-2.5 text-xs font-semibold text-stone-700 hover:bg-[#F8F5F0]"
          >
            <Download size={14} /> Gastos CSV
          </button>
          <button
            onClick={exportIncomes}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DED7CC] bg-white px-3 py-2.5 text-xs font-semibold text-stone-700 hover:bg-[#F8F5F0]"
          >
            <Download size={14} /> Ingresos CSV
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#E3DCD2] bg-white">
        <div className="flex items-center gap-2 border-b border-[#ECE5DB] px-4 py-3.5">
          <History size={16} className="text-stone-400" />
          <h3 className="text-sm font-bold text-stone-900">Historial registrado</h3>
        </div>

        {userDeclarations.length === 0 ? (
          <div className="p-6 text-center text-xs text-stone-400">No hay presentaciones registradas en Labora+.</div>
        ) : (
          <div className="divide-y divide-[#EEE8DF]">
            {userDeclarations
              .slice()
              .sort((a, b) => b.year - a.year || b.quarter.localeCompare(a.quarter))
              .map((declaration) => (
                <div key={declaration.id} className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold text-stone-800">Modelo {declaration.modelType} · {declaration.quarter}</p>
                    <p className="mt-0.5 text-[10px] text-stone-400">
                      {declaration.status === 'filed_with_tax_agency'
                        ? 'Referencia registrada por el usuario/gestoría'
                        : declaration.status === 'reviewed_by_gestor'
                          ? 'Revisado en Labora+'
                          : 'Borrador'}
                    </p>
                  </div>
                  {declaration.filingReference && (
                    <span className="max-w-full truncate rounded-lg bg-[#F4F1EC] px-2.5 py-1 text-[10px] font-mono text-stone-500">
                      {declaration.filingReference}
                    </span>
                  )}
                </div>
              ))}
          </div>
        )}
      </section>

      <div className="flex gap-2 rounded-xl border border-[#E9E1D6] bg-[#FBF8F3] px-3 py-3 text-[11px] leading-relaxed text-stone-500">
        <FileCheck2 size={15} className="mt-0.5 shrink-0 text-stone-400" />
        <p>
          Esta vista organiza cálculos y registros guardados en Labora+. No genera justificantes oficiales ni realiza presentaciones ante la Agencia Tributaria.
        </p>
      </div>
    </div>
  );
};

const ModelRow = ({ code, title, amount }: { code: string; title: string; amount: number }) => (
  <div className="rounded-xl bg-[#F8F5F0] p-3">
    <p className="text-[10px] font-bold uppercase tracking-wide text-[#2E5A44]">Modelo {code}</p>
    <p className="mt-1 text-xs font-semibold text-stone-700">{title}</p>
    <p className="mt-2 text-base font-bold text-stone-900">
      {amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
    </p>
  </div>
);