import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FileCheck2,
  FileText,
  ReceiptText,
  ShieldCheck
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useCountry } from '../contexts/CountryContext';
import { TaxDeclarationsViewer } from './TaxDeclarationsViewer';

interface TaxOverviewProps {
  setView?: (view: string) => void;
}

export const TaxOverview: React.FC<TaxOverviewProps> = ({ setView }) => {
  const { currentUser, calculateQuarterlyTaxes, privacyMode } = useData();
  const { selectedCountry } = useCountry();
  const [selectedQuarter, setSelectedQuarter] = useState('3T 2026');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const riderId = currentUser?.id || 'u1';
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
      description: 'Rendimiento neto y pago a cuenta del trimestre.',
      icon: FileText,
      data: model130
    },
    {
      code: '303',
      title: 'Autoliquidación IVA',
      description: 'IVA repercutido menos IVA deducible.',
      icon: ReceiptText,
      data: model303
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setView?.('dashboard')}
          className="text-xs font-semibold text-[#2E5A44] hover:underline"
        >
          ← Volver
        </button>
        <button
          onClick={() => setView?.('gestor-requirements')}
          className="text-xs font-semibold text-stone-500 hover:text-stone-700"
        >
          Ver avisos
        </button>
      </div>

      <section className="rounded-3xl border border-[#D9E2DB] bg-[#F2F6F3] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#2E5A44] border border-[#D9E2DB]">
              <ShieldCheck size={13} strokeWidth={2.1} />
              Situación censal activa
            </div>
            <h1 className="mt-4 text-2xl sm:text-3xl font-serif font-bold text-stone-900">Modelos AEAT</h1>
            <p className="mt-2 text-sm text-stone-600 max-w-2xl leading-relaxed">
              Revisa el trimestre sin mezclar obligaciones, libros y herramientas en la misma pantalla.
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-[#D9E2DB] px-4 py-3 text-sm">
            <p className="text-[10px] uppercase tracking-wide font-semibold text-stone-400">Actividad</p>
            <p className="mt-1 font-bold text-stone-800">IAE {currentUser?.iaeCode || '849.5'}</p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-800">Trimestre</h2>
          <span className="text-[11px] text-stone-400">Selecciona periodo</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['1T 2026', '2T 2026', '3T 2026', '4T 2026'].map((quarter) => (
            <button
              key={quarter}
              onClick={() => setSelectedQuarter(quarter)}
              className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-semibold border transition-colors ${
                selectedQuarter === quarter
                  ? 'bg-[#2E5A44] border-[#2E5A44] text-white'
                  : 'bg-white border-[#E2DBD0] text-stone-600 hover:border-[#CFC4B5]'
              }`}
            >
              {quarter}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {models.map(({ code, title, description, icon: Icon, data }) => (
          <article key={code} className="rounded-2xl border border-[#E2DBD0] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#EEF3EF] text-[#2E5A44] flex items-center justify-center shrink-0">
                  <Icon size={18} strokeWidth={2.1} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide font-bold text-[#2E5A44]">Modelo {code}</p>
                  <h3 className="mt-1 text-base font-bold text-stone-900">{title}</h3>
                  <p className="mt-1 text-xs text-stone-500 leading-relaxed">{description}</p>
                </div>
              </div>
              <span className="rounded-full bg-[#F5F2EC] px-2.5 py-1 text-[10px] font-semibold text-stone-500">
                {data.status === 'filed_with_tax_agency' ? 'Presentado' : 'Borrador'}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#FAF8F4] p-3">
                <p className="text-[10px] uppercase tracking-wide font-semibold text-stone-400">Ingresos</p>
                <p className="mt-1 text-sm font-bold text-stone-900">{formatCurrency(data.grossIncome)}</p>
              </div>
              <div className="rounded-xl bg-[#FAF8F4] p-3">
                <p className="text-[10px] uppercase tracking-wide font-semibold text-stone-400">Gastos</p>
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

      <section className="rounded-2xl border border-[#E2DBD0] bg-white overflow-hidden">
        <button
          onClick={() => setShowAdvanced((value) => !value)}
          className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left hover:bg-[#FBF9F5] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F4F1EB] text-stone-600 flex items-center justify-center">
              <FileCheck2 size={17} strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900">Herramientas avanzadas</p>
              <p className="text-xs text-stone-500 mt-0.5">Libros, Modelo 036/037, justificantes y detalle técnico.</p>
            </div>
          </div>
          {showAdvanced ? <ChevronUp size={18} className="text-stone-400" /> : <ChevronDown size={18} className="text-stone-400" />}
        </button>

        {showAdvanced && (
          <div className="border-t border-[#E9E2D8] p-4 bg-[#FBF9F5]">
            <TaxDeclarationsViewer />
          </div>
        )}
      </section>
    </div>
  );
};
