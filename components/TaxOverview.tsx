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

const currentQuarterLabel = () => {
  const now = new Date();
  return `${Math.floor(now.getMonth() / 3) + 1}T ${now.getFullYear()}`;
};

const currentMonthLabel = () => {
  const now = new Date();
  return now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
};

export const TaxOverview: React.FC<TaxOverviewProps> = () => {
  const { currentUser, users, calculateQuarterlyTaxes, privacyMode } = useData();
  const { selectedCountry } = useCountry();
  const isManager = currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.ADMIN;
  const currentYear = new Date().getFullYear();
  const countryCode = selectedCountry.country_code;
  const isSpain = countryCode === 'ES';
  const isMexico = countryCode === 'MX';

  const riders = useMemo(() => {
    if (!currentUser || !isManager) return [];
    return users.filter(
      (user) => user.role === UserRole.RIDER && user.managerId === currentUser.id
    );
  }, [users, currentUser, isManager]);

  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarterLabel());
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeUser = isManager
    ? riders.find((rider) => rider.id === selectedRiderId) || riders[0]
    : currentUser;

  const riderId = activeUser?.id || '';
  const taxData = riderId && isSpain ? calculateQuarterlyTaxes(riderId, selectedQuarter) : null;

  const formatCurrency = (amount: number) => {
    if (privacyMode) return '••••';
    return amount.toLocaleString(isMexico ? 'es-MX' : 'es-ES', {
      style: 'currency',
      currency: selectedCountry.currency || 'EUR',
      maximumFractionDigits: 0
    });
  };

  const quarters = [1, 2, 3, 4].map((quarter) => `${quarter}T ${currentYear}`);
  const models = taxData ? [
    {
      code: '130',
      title: 'Pago fraccionado IRPF',
      description: 'Base de trabajo con ingresos y gastos registrados. El importe fiscal requiere revisión antes de mostrarse como cálculo.',
      icon: FileText,
      data: taxData.model130
    },
    {
      code: '303',
      title: 'IVA trimestral',
      description: 'Base de trabajo informativa. Labora+ no presume un tipo de IVA de salida sin evidencia suficiente.',
      icon: ReceiptText,
      data: taxData.model303
    }
  ] : [];

  const mxRegimenSlots = [
    {
      title: 'Régimen de plataformas tecnológicas',
      detail: 'Pendiente de datos oficiales (SAT). Labora+ no publica retenciones ni tasas inventadas.'
    },
    {
      title: 'ISR / IVA mensual',
      detail: 'Periodo de trabajo: mensual (según configuración MX). Sin tablas oficiales cargadas en producto.'
    },
    {
      title: 'Constancia / e.Firma',
      detail: 'Checklist informativo: RFC, e.Firma y sellos. No sustituye el trámite ante el SAT.'
    }
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-8">
      <section className="labora-card overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div>
            <p className="labora-kicker text-[#789582]">
              Fiscal · {selectedCountry.display_name} · {selectedCountry.currency}
            </p>
            <h1 className="labora-display mt-1 text-2xl font-semibold text-[#1E231F] sm:text-[2rem]">
              {isSpain ? 'Modelos trimestrales' : isMexico ? 'Obligaciones fiscales (MX)' : 'Fiscal por país'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
              {isSpain
                ? 'Revisa importes y documentación antes de preparar cualquier presentación oficial ante la AEAT.'
                : isMexico
                  ? 'Vista honesta: sin tasas inventadas. Cuando existan tablas oficiales verificadas, se conectarán aquí.'
                  : `País ${selectedCountry.display_name}: aún sin modelos oficiales cableados en Labora+.`}
            </p>
          </div>

          {isManager && riders.length > 0 && (
            <label className="min-w-[220px]">
              <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.1em] text-stone-400">Cliente vinculado</span>
              <div className="relative">
                <UserRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <select
                  value={activeUser?.id || ''}
                  onChange={(event) => setSelectedRiderId(event.target.value)}
                  className="w-full appearance-none rounded-[13px] border border-[#DED7CC] bg-white py-2.5 pl-9 pr-3 text-xs font-extrabold text-stone-700 outline-none focus:border-[#789582]"
                >
                  {riders.map((rider) => <option key={rider.id} value={rider.id}>{rider.name}</option>)}
                </select>
              </div>
            </label>
          )}
        </div>
      </section>

      {!activeUser ? (
        <section className="labora-card border-dashed p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#E7F0EA] text-[#214E3A]"><UserRound size={22} /></div>
          <p className="mt-3 text-sm font-extrabold text-stone-600">No hay un autónomo vinculado.</p>
          <p className="mt-1 text-xs text-stone-400">Cuando un cliente se vincule a esta gestoría aparecerá aquí.</p>
        </section>
      ) : isMexico ? (
        <>
          <section className="labora-card p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="labora-kicker text-stone-400">Contribuyente en contexto</p>
                <p className="mt-1 text-base font-extrabold text-[#1E231F]">{activeUser.name}</p>
                <p className="mt-1 text-xs text-stone-500">{activeUser.nif || 'RFC/NIF no informado'}</p>
              </div>
              <span className="inline-flex w-fit rounded-full border border-[#D7E5DC] bg-[#EDF4EF] px-2.5 py-1 text-[10px] font-extrabold text-[#214E3A]">
                Periodo: mensual · {currentMonthLabel()}
              </span>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {mxRegimenSlots.map((slot) => (
              <article key={slot.title} className="labora-card border-dashed p-5">
                <p className="labora-kicker text-[#855D1E]">Pendiente de datos oficiales</p>
                <h3 className="mt-2 text-sm font-extrabold text-[#1E231F]">{slot.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-stone-500">{slot.detail}</p>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.08em] text-stone-400">
                  Sin importe calculado · {selectedCountry.currency_symbol}
                </p>
              </article>
            ))}
          </section>

          <div className="rounded-[14px] border border-[#E8DFD2] bg-[#FAF7F1] px-4 py-3 text-[11px] leading-relaxed text-stone-500">
            Labora+ no inventa tasas de ISR/IVA mexicanas. Los slots anteriores son marcadores de producto hasta cargar fuentes oficiales (SAT).
          </div>
        </>
      ) : isSpain ? (
        <>
          <section className="labora-card p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="labora-kicker text-stone-400">Contribuyente en contexto</p>
                <p className="mt-1 text-base font-extrabold text-[#1E231F]">{activeUser.name}</p>
                <p className="mt-1 text-xs text-stone-500">{activeUser.nif || 'NIF no informado'}{activeUser.iaeCode ? ` · IAE ${activeUser.iaeCode}` : ''}</p>
              </div>
              <span className="inline-flex w-fit rounded-full border border-[#D7E5DC] bg-[#EDF4EF] px-2.5 py-1 text-[10px] font-extrabold text-[#214E3A]">Datos registrados en Labora+</span>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <div><p className="labora-kicker text-stone-400">Periodo</p><h2 className="mt-0.5 text-sm font-extrabold text-[#1E231F]">{currentYear} · trimestral (AEAT)</h2></div>
              <span className="text-[10px] font-medium text-stone-400">Trimestre actual: {currentQuarterLabel()}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {quarters.map((quarter) => (
                <button
                  key={quarter}
                  onClick={() => setSelectedQuarter(quarter)}
                  className={`whitespace-nowrap rounded-[13px] border px-4 py-2.5 text-xs font-extrabold transition ${
                    selectedQuarter === quarter
                      ? 'border-[#214E3A] bg-[#214E3A] text-white shadow-sm'
                      : 'border-[#E2DBD0] bg-[#FFFDF9] text-stone-600 hover:bg-[#FAF7F1]'
                  }`}
                >
                  {quarter}
                </button>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {models.map(({ code, title, description, icon: Icon, data }) => (
              <article key={code} className="labora-card p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#E7F0EA] text-[#214E3A]"><Icon size={19} /></div>
                  <div className="min-w-0">
                    <p className="labora-kicker text-[#789582]">Modelo {code}</p>
                    <h3 className="mt-1 text-base font-extrabold text-[#1E231F]">{title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-stone-500">{description}</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <Metric label="Ingresos" value={formatCurrency(data.grossIncome)} />
                  <Metric label="Gastos computados" value={formatCurrency(data.deductibleExpenses)} />
                </div>

                <div className="mt-3 flex items-center justify-between rounded-[14px] border border-[#E7E0D6] bg-[#FAF8F4] px-3 py-3">
                  <span className="text-xs font-bold text-stone-500">Resultado estimado</span>
                  <span className="text-base font-extrabold tracking-[-0.03em] text-[#1E231F]">
                    {data.calculationState === 'requires_review' ? 'Por revisar' : formatCurrency(data.taxAmount)}
                  </span>
                </div>
              </article>
            ))}
          </section>

          <section className="labora-card overflow-hidden">
            <button onClick={() => setShowAdvanced((value) => !value)} className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-[#FBF9F5]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#F1ECE3] text-stone-600"><FileCheck2 size={17} /></div>
                <div><p className="text-sm font-extrabold text-[#1E231F]">Detalle y documentos</p><p className="mt-0.5 text-xs text-stone-500">Registros e historial del periodo.</p></div>
              </div>
              {showAdvanced ? <ChevronUp size={18} className="text-stone-400" /> : <ChevronDown size={18} className="text-stone-400" />}
            </button>

            {showAdvanced && <div className="border-t border-[#E9E2D8] bg-[#FBF9F5] p-4"><TaxDeclarationsViewer userId={riderId} /></div>}
          </section>

          <div className="rounded-[14px] border border-[#E8DFD2] bg-[#FAF7F1] px-4 py-3 text-[11px] leading-relaxed text-stone-500">
            Estos cálculos son orientativos y se basan en la información registrada. No equivalen a una presentación ante la Agencia Tributaria.
          </div>
        </>
      ) : (
        <section className="labora-card border-dashed p-8 text-center">
          <p className="text-sm font-extrabold text-stone-600">Modelos oficiales no cableados para {selectedCountry.display_name}</p>
          <p className="mt-2 text-xs text-stone-500">
            Moneda configurada: {selectedCountry.currency}. Sin tasas inventadas hasta fuentes oficiales.
          </p>
        </section>
      )}
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[14px] bg-[#F8F5F0] p-3"><p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-stone-400">{label}</p><p className="mt-1 truncate text-sm font-extrabold text-[#1E231F]">{value}</p></div>
);
