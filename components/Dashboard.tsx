import React, { useMemo, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  FileText,
  Fuel,
  MessageSquare,
  ReceiptText,
  ShieldCheck,
  Wallet
} from 'lucide-react';
import { useCountry } from '../contexts/CountryContext';
import { useData } from '../contexts/DataContext';
import { GasStationCaptureModal } from './GasStationCaptureModal';

interface DashboardProps { setView?: (view: string) => void; }

const currentQuarter = () => {
  const now = new Date();
  return `${Math.floor(now.getMonth() / 3) + 1}T ${now.getFullYear()}`;
};

const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const { currentUser, getFiscalSummary, privacyMode, requirements } = useData();
  const { selectedCountry } = useCountry();
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);

  if (!currentUser) return null;

  const summary = useMemo(() => getFiscalSummary(currentUser.id), [currentUser.id, getFiscalSummary]);
  const pendingRequirements = requirements.filter(
    (requirement) => requirement.riderId === currentUser.id && requirement.status === 'pending'
  );
  const period = currentQuarter();
  const firstName = currentUser.name.trim().split(/\s+/)[0] || currentUser.name;
  const formatCurrency = (amount: number) => privacyMode
    ? '••••'
    : amount.toLocaleString('es-ES', {
        style: 'currency',
        currency: selectedCountry.currency || 'EUR',
        maximumFractionDigits: 0
      });

  const quickActions = [
    {
      label: 'Registrar gasto',
      description: 'Foto, ticket o factura',
      icon: Fuel,
      tone: 'clay',
      onClick: () => setIsGasModalOpen(true)
    },
    {
      label: 'Avisos',
      description: pendingRequirements.length ? `${pendingRequirements.length} pendientes` : 'Todo revisado',
      icon: Bell,
      tone: 'amber',
      onClick: () => setView?.('gestor-requirements')
    },
    {
      label: 'Modelos',
      description: `Periodo ${period}`,
      icon: FileText,
      tone: 'green',
      onClick: () => setView?.('tax-declarations')
    }
  ] as const;

  return (
    <div id="rider-dashboard" className="mx-auto max-w-5xl space-y-5 pb-8">
      <section className="labora-hero p-5 sm:p-7">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_230px] lg:items-end">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="labora-chip labora-kicker text-[#EAF4EE]">Autónomo · {period}</span>
              {pendingRequirements.length === 0 ? (
                <span className="labora-chip text-[11px] font-bold text-[#F8E9B7]">
                  <CheckCircle2 size={13} /> Sin tareas pendientes
                </span>
              ) : (
                <span className="labora-chip text-[11px] font-bold text-[#FFE1D5]">
                  <Bell size={13} /> {pendingRequirements.length} {pendingRequirements.length === 1 ? 'tarea pendiente' : 'tareas pendientes'}
                </span>
              )}
            </div>

            <p className="mt-5 text-sm font-semibold text-white/70">Hola, {firstName}</p>
            <h1 className="labora-display mt-1 max-w-2xl text-[2rem] font-semibold leading-[1.04] text-white sm:text-[2.65rem]">
              Tu trimestre, claro y bajo control.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/72 sm:text-[15px]">
              Gastos, modelos, documentos y tu gestoría conectados sin llenar la pantalla de ruido.
            </p>

            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-semibold text-white/70">
              {currentUser.iaeCode && <span>IAE <strong className="text-white">{currentUser.iaeCode}</strong></span>}
              {currentUser.vehicleType && <span>Vehículo <strong className="capitalize text-white">{currentUser.vehicleType}</strong></span>}
              {currentUser.nif && <span>NIF <strong className="text-white">{currentUser.nif}</strong></span>}
            </div>
          </div>

          <button
            onClick={() => setView?.('money')}
            className="relative z-10 rounded-[22px] border border-white/15 bg-white/10 p-4 text-left backdrop-blur transition hover:bg-white/15"
          >
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/55">Neto registrado</p>
            <p className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-white">{formatCurrency(summary.netProfit)}</p>
            <div className="mt-4 flex items-center justify-between text-xs font-bold text-[#F7D99B]">
              <span>Ver dinero</span>
              <ChevronRight size={15} />
            </div>
          </button>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="labora-kicker text-[#8A8E89]">Ahora</p>
            <h2 className="mt-0.5 text-base font-extrabold tracking-[-0.02em] text-[#1E231F]">Acciones rápidas</h2>
          </div>
          <span className="hidden text-xs font-medium text-stone-400 sm:block">Lo más usado, sin menús extra</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const tone = action.tone === 'clay'
              ? 'bg-[#F8EDE7] text-[#B95635] border-[#F0D8CD]'
              : action.tone === 'amber'
              ? 'bg-[#FFF5DB] text-[#8A641E] border-[#F1DFAD]'
              : 'bg-[#E7F0EA] text-[#214E3A] border-[#D2E3D8]';

            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className="labora-card labora-card-interactive group px-4 py-4 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border ${tone}`}>
                      <Icon size={19} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold tracking-[-0.015em] text-[#1E231F]">{action.label}</p>
                      <p className="mt-0.5 truncate text-xs font-medium text-[#7A807B]">{action.description}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-[#B8B5AF] transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-3">
          <p className="labora-kicker text-[#8A8E89]">Este periodo</p>
          <h2 className="mt-0.5 text-base font-extrabold tracking-[-0.02em] text-[#1E231F]">Tus números</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric onClick={() => setView?.('money')} icon={Wallet} label="Ingresos" value={formatCurrency(summary.totalIncome)} />
          <Metric onClick={() => setView?.('money')} icon={ReceiptText} label="Gastos" value={formatCurrency(summary.totalExpenses)} accent />
          <Metric onClick={() => setView?.('tax-declarations')} icon={ShieldCheck} label="Neto" value={formatCurrency(summary.netProfit)} />
          <Metric onClick={() => setView?.('messages')} icon={MessageSquare} label="Gestoría" value="Abrir chat" compact />
        </div>
      </section>

      {pendingRequirements.length > 0 && (
        <section className="rounded-[22px] border border-[#ECD8CB] bg-[#FFF7F1] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[#EED6CA] bg-[#F8E7DF] text-[#B95635]">
                <Bell size={18} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-[#1E231F]">
                  {pendingRequirements.length === 1 ? 'Tu gestoría necesita una cosa' : `Tu gestoría necesita ${pendingRequirements.length} cosas`}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#727772]">Resuélvelas aquí para mantener el trimestre al día.</p>
              </div>
            </div>
            <button onClick={() => setView?.('gestor-requirements')} className="shrink-0 rounded-xl bg-[#214E3A] px-3 py-2 text-xs font-extrabold text-white">
              Revisar
            </button>
          </div>
        </section>
      )}

      <GasStationCaptureModal isOpen={isGasModalOpen} onClose={() => setIsGasModalOpen(false)} />
    </div>
  );
};

const Metric = ({ onClick, icon: Icon, label, value, accent = false, compact = false }: any) => (
  <button onClick={onClick} className="labora-card labora-card-interactive p-4 text-left">
    <div className={`flex h-9 w-9 items-center justify-center rounded-[13px] ${accent ? 'bg-[#F8EDE7] text-[#C55E3C]' : 'bg-[#E7F0EA] text-[#214E3A]'}`}>
      <Icon size={17} strokeWidth={2.2} />
    </div>
    <p className="mt-3 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#9A9B96]">{label}</p>
    <p className={`mt-1 font-extrabold tracking-[-0.03em] text-[#1E231F] ${compact ? 'text-sm' : 'text-xl'}`}>{value}</p>
  </button>
);

export default Dashboard;
