import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Info,
  Scale,
  ShieldCheck,
  UserRound,
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

const SUPPORTED_FISCAL_YEAR = 2026;
const today = new Date();
const defaultQuarterNumber = today.getFullYear() === SUPPORTED_FISCAL_YEAR
  ? Math.floor(today.getMonth() / 3) + 1
  : 4;
const defaultQuarter = `${defaultQuarterNumber}T ${SUPPORTED_FISCAL_YEAR}`;

export const TaxDeclarationsViewer: React.FC<TaxDeclarationsViewerProps> = ({ setView }) => {
  const { currentUser, users, incomes, expenses, showNotification } = useData();
  const [selectedQuarter, setSelectedQuarter] = useState(defaultQuarter);
  const [selectedClientId, setSelectedClientId] = useState('');

  if (!currentUser) return null;

  const isManager = currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN;
  const eligibleClients = isManager
    ? users.filter((user) => user.role === UserRole.RIDER && user.countryCode === 'ES')
    : [];

  const rider = isManager
    ? eligibleClients.find((user) => user.id === selectedClientId) || null
    : currentUser.countryCode === 'ES' ? currentUser : null;

  const riderId = rider?.id || '';
  const snapshot = useMemo(
    () => riderId ? buildFiscalSnapshot(incomes, expenses, riderId, selectedQuarter) : null,
    [incomes, expenses, riderId, selectedQuarter],
  );

  const quarterExpenses = snapshot ? expenses.filter(
    (expense) => expense.userId === riderId && expense.date >= snapshot.period.quarterStart && expense.date <= snapshot.period.quarterEnd,
  ) : [];
  const quarterIncomes = snapshot ? incomes.filter(
    (income) => income.userId === riderId && income.date >= snapshot.period.quarterStart && income.date <= snapshot.period.quarterEnd,
  ) : [];

  const exportExpenseDraft = () => {
    if (!snapshot || !rider) return;
    const rows = [
      ['BORRADOR INTERNO - NO PRESENTADO ANTE AEAT'],
      ['Titular', rider.name],
      ['Periodo', selectedQuarter],
      ['Motor fiscal', snapshot.policyId],
      [],
      ['Fecha', 'Proveedor', 'Categoría', 'Importe', 'IVA registrado', 'Deducibilidad revisada', 'Estado', 'Evidencia'],
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
    if (!snapshot || !rider) return;
    const rows = [
      ['BORRADOR INTERNO - NO PRESENTADO ANTE AEAT'],
      ['Titular', rider.name],
      ['Periodo', selectedQuarter],
      ['Motor fiscal', snapshot.policyId],
      [],
      ['Fecha', 'Plataforma', 'Importe registrado', 'Retención registrada'],
      ...quarterIncomes.map((income) => [income.date, income.platform, income.amount.toFixed(2), (income.retention || 0).toFixed(2)]),
    ];
    downloadCsv(`Labora_Borrador_Ingresos_${selectedQuarter.replace(' ', '_')}.csv`, rows);
    showNotification('success', 'Borrador de ingresos exportado. Revisa los datos con tu gestor.');
  };

  if (!rider || !snapshot) {
    return (
      <div className="space-y-6">
        {setView && <button onClick={() => setView('dashboard')} className="text-xs font-bold text-[#2E5A44] hover:underline">← Volver al panel</button>}
        <section className="rounded-3xl border border-[#345947] bg-[#213B2F] p-6 text-white shadow-sm sm:p-8">
          <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-[#BFD5C6]" /><div><h1 className="font-serif text-2xl font-bold">Centro fiscal España</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#D3E3D8]">Este módulo solo opera sobre perfiles España, cubre actualmente el ejercicio {SUPPORTED_FISCAL_YEAR} y nunca elige un cliente por ti.</p></div></div>
        </section>
        {isManager ? (
          <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-6 shadow-sm">
            <div className="flex items-center gap-2"><UserRound className="h-5 w-5 text-[#2E5A44]" /><h2 className="font-serif text-lg font-bold text-stone-900">Selecciona explícitamente un cliente de España</h2></div>
            <p className="mt-2 text-xs leading-relaxed text-stone-500">Labora+ no abrirá automáticamente el primer expediente de tu cartera.</p>
            {eligibleClients.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-[#DFD5C6] p-8 text-center text-xs text-stone-500">No tienes clientes de España vinculados con fiscalidad guiada disponible.</div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {eligibleClients.map((client) => (
                  <button key={client.id} onClick={() => setSelectedClientId(client.id)} className="rounded-2xl border border-[#E4DDD2] bg-white p-4 text-left transition hover:border-[#94B5A1] hover:bg-[#F2F7F3]"><p className="font-serif text-sm font-bold text-stone-900">{client.name}</p><p className="mt-1 text-[11px] text-stone-500">{client.nif || 'NIF pendiente'}{client.platforms.length ? ` · ${client.platforms.join(' · ')}` : ''}</p><span className="mt-3 inline-flex rounded-full bg-[#EDF5EF] px-2 py-1 text-[10px] font-bold text-[#2E5A44]">Abrir expediente fiscal</span></button>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="rounded-3xl border border-sky-200 bg-sky-50 p-6 text-sm text-sky-800">La fiscalidad guiada de este build está limitada a España. Tu cuenta conserva finanzas, documentos y colaboración con asesor sin generar conclusiones fiscales locales.</section>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {setView && <button onClick={() => setView('dashboard')} className="text-xs font-bold text-[#2E5A44] hover:underline">← Volver al panel</button>}

      <section className="rounded-3xl border border-[#345947] bg-[#213B2F] p-6 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#D8EADB]"><ShieldCheck className="h-4 w-4" /> Centro fiscal España · {rider.name}</div>
            <h2 className="font-serif text-2xl font-bold">Qué tengo, qué falta y qué debe revisar el gestor</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#D3E3D8]">Labora+ organiza datos y referencias de trabajo. Una referencia matemática nunca equivale al importe a presentar o pagar, y una declaración nunca aparece como presentada sin prueba externa verificada.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isManager && <button onClick={() => setSelectedClientId('')} className="rounded-xl border border-[#416854] bg-[#2D4E3E] px-3.5 py-2 text-xs font-semibold text-[#F3EFE6]">Cambiar cliente</button>}
            <button onClick={exportExpenseDraft} className="flex items-center gap-2 rounded-xl border border-[#416854] bg-[#2D4E3E] px-3.5 py-2 text-xs font-semibold text-[#F3EFE6]"><FileSpreadsheet className="h-4 w-4" /> Borrador gastos</button>
            <button onClick={exportIncomeDraft} className="flex items-center gap-2 rounded-xl border border-[#416854] bg-[#2D4E3E] px-3.5 py-2 text-xs font-semibold text-[#F3EFE6]"><Download className="h-4 w-4" /> Borrador ingresos</button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="font-serif text-base font-bold text-stone-900">Periodo de trabajo</h3><p className="mt-1 text-xs text-stone-500">Motor verificado: {snapshot.policyId}. Solo se usan movimientos cuya fecha cae dentro del periodo.</p></div>
          <div className="flex flex-wrap gap-2">{[1, 2, 3, 4].map((quarterNumber) => { const quarter = `${quarterNumber}T ${SUPPORTED_FISCAL_YEAR}`; return <button key={quarter} onClick={() => setSelectedQuarter(quarter)} className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${selectedQuarter === quarter ? 'bg-[#2E5A44] text-white' : 'border border-[#DFD5C6] bg-white text-stone-600'}`}>{quarter}</button>; })}</div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4"><Metric label="Ingresos registrados" value={money(snapshot.quarter.grossIncome)} /><Metric label="Gasto deducible computado" value={money(snapshot.quarter.approvedDeductibleExpenses)} /><Metric label="Gastos pendientes" value={String(snapshot.quarter.pendingExpenseCount)} emphasis={snapshot.quarter.pendingExpenseCount > 0} /><Metric label="Gastos rechazados" value={String(snapshot.quarter.rejectedExpenseCount)} /></div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Scale className="h-5 w-5 text-[#2E5A44]" /><h3 className="font-serif font-bold">Modelo 130 · referencia estándar</h3></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">NO ACCIONABLE</span></div>
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-amber-800">Referencia matemática, no cuota final</p><p className="mt-1 font-serif text-3xl font-bold text-stone-900">{money(snapshot.model130.standardRateReferenceAmount)}</p><p className="mt-2 text-[11px] leading-relaxed text-amber-800">No uses esta cifra para presentar, pagar ni decidir una obligación fiscal sin completar el contexto requerido.</p></div>
          <dl className="mt-4 space-y-2 text-sm"><Line label="Ingresos acumulados" value={money(snapshot.yearToDate.grossIncome)} /><Line label="Gasto deducible computado acumulado" value={money(snapshot.yearToDate.approvedDeductibleExpenses)} /><Line label="Retenciones registradas" value={money(snapshot.yearToDate.retentionsRecorded)} /></dl>
          <MissingInputs title="Falta antes de calcular una cuota final" items={snapshot.model130.missingInputs} />
          <p className="mt-4 flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800"><Info className="mt-0.5 h-4 w-4 shrink-0" />{snapshot.model130.explanation}</p>
        </section>

        <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Scale className="h-5 w-5 text-[#3A7596]" /><h3 className="font-serif font-bold">Modelo 303 · control de IVA</h3></div><span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">SIN CUOTA FINAL</span></div>
          <div className="mt-5 rounded-2xl bg-[#EEF4F7] p-4"><p className="text-xs text-stone-500">IVA soportado registrado en gasto aprobado</p><p className="mt-1 font-serif text-3xl font-bold text-stone-900">{money(snapshot.model303.deductibleInputVatRecorded)}</p></div>
          <MissingInputs title="Falta antes de calcular una liquidación" items={snapshot.model303.missingInputs} />
          <p className="mt-4 text-sm leading-relaxed text-stone-600">{snapshot.model303.explanation}</p>
          <p className="mt-4 flex gap-2 rounded-2xl border border-sky-200 bg-sky-50 p-3 text-xs leading-relaxed text-sky-800"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />Labora+ no mostrará una deuda final de IVA hasta disponer de datos estructurados y evidencia suficiente.</p>
        </section>
      </div>

      <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-[#2E5A44]" /><h3 className="font-serif font-bold">Control de calidad del trimestre</h3></div>
        <div className="space-y-2">{snapshot.dataQuality.warnings.length === 0 ? <div className="rounded-xl bg-[#EEF5F0] px-3 py-2.5 text-xs text-[#2E5A44]">No hay avisos de calidad detectados para este periodo.</div> : snapshot.dataQuality.warnings.map((warning) => <div key={warning} className="flex items-start gap-2 rounded-xl bg-[#F7F3EC] px-3 py-2.5 text-xs text-stone-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#C96846]" />{warning}</div>)}</div>
      </section>
    </div>
  );
};

const MissingInputs: React.FC<{ title: string; items: readonly string[] }> = ({ title, items }) => (
  <div className="mt-4 rounded-2xl border border-[#E8DFC8] bg-white p-3.5">
    <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{title}</p>
    <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-stone-700">
      {items.map((item) => <li key={item} className="flex items-start gap-2"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#C96846]" />{item}</li>)}
    </ul>
  </div>
);

const Metric: React.FC<{ label: string; value: string; emphasis?: boolean }> = ({ label, value, emphasis }) => <div className={`rounded-2xl border p-4 ${emphasis ? 'border-amber-200 bg-amber-50' : 'border-[#E8DFC8] bg-white'}`}><p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{label}</p><p className="mt-1 font-serif text-xl font-bold text-stone-900">{value}</p></div>;
const Line: React.FC<{ label: string; value: string }> = ({ label, value }) => <div className="flex items-center justify-between gap-3"><dt className="text-stone-500">{label}</dt><dd className="font-semibold text-stone-900">{value}</dd></div>;
