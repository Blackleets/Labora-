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
            <p className="labora-kicker text-[var(--labora-primary-2)]">
              Fiscal · {selectedCountry.display_name} · {selectedCountry.currency}
            </p>
            <h1 className="labora-display mt-1 text-2xl font-semibold text-[var(--labora-ink)] sm:text-[2rem]">
              {isSpain ? 'Modelos trimestrales' : isMexico ? 'Obligaciones fiscales (MX)' : 'Fiscal por país'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--labora-muted)]">
              {isSpain
                ? 'Revisa importes y documentación antes de preparar cualquier presentación oficial ante la AEAT.'
                : isMexico
                  ? 'Vista honesta: sin tasas inventadas. Cuando existan tablas oficiales verificadas, se conectarán aquí.'
                  : `País ${selectedCountry.display_name}: aún sin modelos oficiales cableados en Labora+.`}
            </p>
          </div>

          {isManager && riders.length > 0 && (
            <label className="min-w-[220px]">
              <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--labora-muted)]">Cliente vinculado</span>
              <div className="relative">
                <UserRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--labora-muted)]" />
                <select
                  value={activeUser?.id || ''}
                  onChange={(event) => setSelectedRiderId(event.target.value)}
                  className="w-full appearance-none rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-surface)] py-2.5 pl-9 pr-3 text-xs font-extrabold text-[var(--labora-ink-soft)] outline-none focus:border-[var(--labora-primary-2)]"
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
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]"><UserRound size={22} /></div>
          <p className="mt-3 text-sm font-extrabold text-[var(--labora-muted)]">No hay un autónomo vinculado.</p>
          <p className="mt-1 text-xs text-[var(--labora-muted)]">Cuando un cliente se vincule a esta gestoría aparecerá aquí.</p>
        </section>
      ) : isMexico ? (
        <>
          <section className="labora-card p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="labora-kicker text-[var(--labora-muted)]">Contribuyente en contexto</p>
                <p className="mt-1 text-base font-extrabold text-[var(--labora-ink)]">{activeUser.name}</p>
                <p className="mt-1 text-xs text-[var(--labora-muted)]">{activeUser.nif || 'RFC/NIF no informado'}</p>
              </div>
              <span className="inline-flex w-fit rounded-full border border-[var(--labora-border)] bg-[var(--labora-moss-soft)] px-2.5 py-1 text-[10px] font-extrabold text-[var(--labora-primary)]">
                Periodo: mensual · {currentMonthLabel()}
              </span>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {mxRegimenSlots.map((slot) => (
              <article key={slot.title} className="labora-card border-dashed p-5">
                <p className="labora-kicker text-[var(--labora-gold)]">Pendiente de datos oficiales</p>
                <h3 className="mt-2 text-sm font-extrabold text-[var(--labora-ink)]">{slot.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[var(--labora-muted)]">{slot.detail}</p>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--labora-muted)]">
                  Sin importe calculado · {selectedCountry.currency_symbol}
                </p>
              </article>
            ))}
          </section>

          <div className="rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-parchment)] px-4 py-3 text-[11px] leading-relaxed text-[var(--labora-muted)]">
            Labora+ no inventa tasas de ISR/IVA mexicanas. Los slots anteriores son marcadores de producto hasta cargar fuentes oficiales (SAT).
          </div>
        </>
      ) : isSpain ? (
        <>
          <section className="labora-card p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="labora-kicker text-[var(--labora-muted)]">Contribuyente en contexto</p>
                <p className="mt-1 text-base font-extrabold text-[var(--labora-ink)]">{activeUser.name}</p>
                <p className="mt-1 text-xs text-[var(--labora-muted)]">{activeUser.nif || 'NIF no informado'}{activeUser.iaeCode ? ` · IAE ${activeUser.iaeCode}` : ''}</p>
              </div>
              <span className="inline-flex w-fit rounded-full border border-[var(--labora-border)] bg-[var(--labora-moss-soft)] px-2.5 py-1 text-[10px] font-extrabold text-[var(--labora-primary)]">Datos registrados en Labora+</span>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <div><p className="labora-kicker text-[var(--labora-muted)]">Periodo</p><h2 className="mt-0.5 text-sm font-extrabold text-[var(--labora-ink)]">{currentYear} · trimestral (AEAT)</h2></div>
              <span className="text-[10px] font-medium text-[var(--labora-muted)]">Trimestre actual: {currentQuarterLabel()}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {quarters.map((quarter) => (
                <button
                  key={quarter}
                  onClick={() => setSelectedQuarter(quarter)}
                  className={`whitespace-nowrap rounded-[13px] border px-4 py-2.5 text-xs font-extrabold transition ${
                    selectedQuarter === quarter
                      ? 'border-[var(--labora-primary)] bg-[var(--labora-primary)] text-white shadow-sm'
                      : 'border-[var(--labora-border)] bg-[var(--labora-parchment)] text-[var(--labora-muted)] hover:bg-[var(--labora-parchment)]'
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
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]"><Icon size={19} /></div>
                  <div className="min-w-0">
                    <p className="labora-kicker text-[var(--labora-primary-2)]">Modelo {code}</p>
                    <h3 className="mt-1 text-base font-extrabold text-[var(--labora-ink)]">{title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--labora-muted)]">{description}</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <Metric label="Ingresos" value={formatCurrency(data.grossIncome)} />
                  <Metric label="Gastos computados" value={formatCurrency(data.deductibleExpenses)} />
                </div>

                <div className="mt-3 flex items-center justify-between rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-parchment)] px-3 py-3">
                  <span className="text-xs font-bold text-[var(--labora-muted)]">Resultado estimado</span>
                  <span className="text-base font-extrabold tracking-[-0.03em] text-[var(--labora-ink)]">
                    {data.calculationState === 'requires_review' ? 'Por revisar' : formatCurrency(data.taxAmount)}
                  </span>
                </div>
              </article>
            ))}
          </section>

          <section className="labora-card overflow-hidden">
            <button onClick={() => setShowAdvanced((value) => !value)} className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-[var(--labora-parchment)]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[var(--labora-surface-2)] text-[var(--labora-muted)]"><FileCheck2 size={17} /></div>
                <div><p className="text-sm font-extrabold text-[var(--labora-ink)]">Detalle y documentos</p><p className="mt-0.5 text-xs text-[var(--labora-muted)]">Registros e historial del periodo.</p></div>
              </div>
              {showAdvanced ? <ChevronUp size={18} className="text-[var(--labora-muted)]" /> : <ChevronDown size={18} className="text-[var(--labora-muted)]" />}
            </button>

            {showAdvanced && <div className="border-t border-[var(--labora-border)] bg-[var(--labora-parchment)] p-4"><TaxDeclarationsViewer userId={riderId} /></div>}
          </section>

          <div className="rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-parchment)] px-4 py-3 text-[11px] leading-relaxed text-[var(--labora-muted)]">
            Estos cálculos son orientativos y se basan en la información registrada. No equivalen a una presentación ante la Agencia Tributaria.
          </div>
        </>
      ) : (
        <section className="labora-card border-dashed p-8 text-center">
          <p className="text-sm font-extrabold text-[var(--labora-muted)]">Modelos oficiales no cableados para {selectedCountry.display_name}</p>
          <p className="mt-2 text-xs text-[var(--labora-muted)]">
            Moneda configurada: {selectedCountry.currency}. Sin tasas inventadas hasta fuentes oficiales.
          </p>
        </section>
      )}
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[14px] bg-[var(--labora-parchment)] p-3"><p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--labora-muted)]">{label}</p><p className="mt-1 truncate text-sm font-extrabold text-[var(--labora-ink)]">{value}</p></div>
);
