import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FileCheck2,
  FileText,
  ReceiptText,
  UserRound
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useCountry } from '../contexts/CountryContext';
import { UserRole } from '../types';
import { TaxDeclarationsViewer } from './TaxDeclarationsViewer';

interface TaxOverviewProps {
  setView?: (view: string) => void;
}

export const TaxOverview: React.FC<TaxOverviewProps> = ({ setView }) => {
  const { currentUser, users, calculateQuarterlyTaxes, privacyMode } = useData();
  const { selectedCountry } = useCountry();
  const isManager = currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.ADMIN;
  const riders = useMemo(() => users.filter((user) => user.role === UserRole.RIDER), [users]);
  const [selectedRiderId, setSelectedRiderId] = useState(riders[0]?.id || '');
  const [selectedQuarter, setSelectedQuarter] = useState('3T 2026');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeUser = isManager
    ? riders.find((rider) => rider.id === selectedRiderId) || riders[0]
    : currentUser;

  const riderId = activeUser?.id || 'u1';
  const { model130, model303 } = calculateQuarterlyTaxes(riderId, selectedQuarter);

  const formatCurrency = (amount: number) => {
    if (privacyMode) return '••••';
    return amount.toLocaleString('es-ES', {
      style: 'currency',
      currency: selectedCountry.currency || 'EUR',
      maximumFractionDigits: 0
    });
  };

  const models = [
    {
      code: '130',
      title: 'Pago fraccionado IRPF',
      description: 'Estimación calculada con los ingresos y gastos registrados.',
      icon: FileText,
      data: model130
    },
    {
      code: '303',
      title: 'Autoliquidación IVA',
      description: 'Estimación de IVA a partir de los movimientos registrados.',
      icon: ReceiptText,
      data: model303
    }
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Fiscalidad</p>
          <h1 className="mt-1 text-2xl font-bold text-stone-900">Modelos trimestrales</h1>
          <p className="mt-1 text-sm text-stone-500">
            Revisa los importes calculados antes de preparar cualquier presentación.
          </p>
        </div>

        {isManager && riders.length > 0 && (
          <label className="min-w-[220px]">
            <span className="mb-1.5 block text-[11px] font-semibold text-stone-500">Cliente</span>
            <div className="relative">
              <UserRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <select
                value={activeUser?.id || ''}
                onChange={(event) => setSelectedRiderId(event.target.value)}
                className="w-full appearance-none rounded-xl border border-[#DED7CC] bg-white py-2.5 pl-9 pr-3 text-xs font-semibold text-stone-700 outline-none focus:border-[#8EA796]"
              >
                {riders.map((rider) => (
                  <option key={rider.id} value={rider.id}>{rider.name}</option>
                ))}
              </select>
            </div>
          </label>
        )}
      </section>

      {activeUser && (
        <section className="rounded-2xl border border-[#E3DCD2] bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-stone-900">{activeUser.name}</p>
              <p className="mt-1 text-xs text-stone-500">
                {activeUser.nif || 'Sin NIF'}{activeUser.iaeCode ? ` · IAE ${activeUser.iaeCode}` : ''}
              </p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-[#F3F0EA] px-2.5 py-1 text-[10px] font-semibold text-stone-500">
              Información registrada en Labora+
            </span>
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-800">Periodo</h2>
          <span className="text-[11px] text-stone-400">Selecciona trimestre</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['1T 2026', '2T 2026', '3T 2026', '4T 2026'].map((quarter) => (
            <button
              key={quarter}
              onClick={() => setSelectedQuarter(quarter)}
              className={`whitespace-nowrap rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors ${
                selectedQuarter === quarter
                  ? 'border-[#2E5A44] bg-[#2E5A44] text-white'
                  : 'border-[#E2DBD0] bg-white text-stone-600 hover:border-[#CFC4B5]'
              }`}
            >
              {quarter}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {models.map(({ code, title, description, icon: Icon, data }) => (
          <article key={code} className="rounded-2xl border border-[#E2DBD0] bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF3EF] text-[#2E5A44]">
                <Icon size={18} strokeWidth={2.1} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#2E5A44]">Modelo {code}</p>
                <h3 className="mt-1 text-base font-bold text-stone-900">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-stone-500">{description}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#FAF8F4] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Ingresos</p>
                <p className="mt-1 text-sm font-bold text-stone-900">{formatCurrency(data.grossIncome)}</p>
              </div>
              <div className="rounded-xl bg-[#FAF8F4] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Gastos</p>
                <p className="mt-1 text-sm font-bold text-stone-900">{formatCurrency(data.deductibleExpenses)}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl border border-[#E7E0D6] px-3 py-3">
              <span className="text-xs font-semibold text-stone-500">Resultado estimado</span>
              <span className="text-base font-bold text-stone-900">{formatCurrency(data.taxAmount)}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#E2DBD0] bg-white">
        <button
          onClick={() => setShowAdvanced((value) => !value)}
          className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-[#FBF9F5]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F1EB] text-stone-600">
              <FileCheck2 size={17} strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900">Detalle y documentos</p>
              <p className="mt-0.5 text-xs text-stone-500">Libros, justificantes y datos técnicos.</p>
            </div>
          </div>
          {showAdvanced ? <ChevronUp size={18} className="text-stone-400" /> : <ChevronDown size={18} className="text-stone-400" />}
        </button>

        {showAdvanced && (
          <div className="border-t border-[#E9E2D8] bg-[#FBF9F5] p-4">
            <TaxDeclarationsViewer />
          </div>
        )}
      </section>

      <p className="text-[11px] leading-relaxed text-stone-400">
        Los cálculos se basan en la información guardada en la aplicación y no equivalen a una presentación ante la Agencia Tributaria.
      </p>
    </div>
  );
};