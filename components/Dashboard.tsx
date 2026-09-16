import React, { useMemo, useState } from 'react';
import {
  Bell,
  ChevronRight,
  FileText,
  Fuel,
  MessageSquare,
  ReceiptText,
  ShieldCheck,
  Wallet
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useCountry } from '../contexts/CountryContext';
import { GasStationCaptureModal } from './GasStationCaptureModal';

interface DashboardProps {
  setView?: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const { currentUser, getFiscalSummary, privacyMode, requirements } = useData();
  const { selectedCountry } = useCountry();
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);

  const summary = useMemo(
    () => getFiscalSummary(currentUser?.id || 'u1'),
    [currentUser, getFiscalSummary]
  );

  const pendingRequirements = requirements.filter(
    (requirement) => requirement.riderId === currentUser?.id && requirement.status === 'pending'
  );

  const formatCurrency = (amount: number) => {
    if (privacyMode) return '••••';
    return amount.toLocaleString('es-ES', {
      style: 'currency',
      currency: selectedCountry.currency || 'EUR',
      maximumFractionDigits: 0
    });
  };

  const quickActions = [
    {
      label: 'Subir ticket',
      description: 'Gasolina o gasto',
      icon: Fuel,
      onClick: () => setIsGasModalOpen(true)
    },
    {
      label: 'Avisos',
      description: pendingRequirements.length > 0 ? `${pendingRequirements.length} pendientes` : 'Todo al día',
      icon: Bell,
      onClick: () => setView?.('gestor-requirements')
    },
    {
      label: 'Modelos AEAT',
      description: '130 y 303',
      icon: FileText,
      onClick: () => setView?.('tax-declarations')
    }
  ];

  return (
    <div id="rider-dashboard" className="max-w-5xl mx-auto space-y-5 pb-8 animate-in fade-in duration-300">
      <section className="rounded-3xl border border-[#DDD5C8] bg-[#FBF9F4] px-5 py-6 sm:px-7 sm:py-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#EAF1EC] px-3 py-1 text-[11px] font-semibold text-[#2E5A44] border border-[#D4E2D8]">
              <ShieldCheck size={13} strokeWidth={2.2} />
              Autónomo activo · {summary.quarter || '3T 2026'}
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#26231F]">
              Hola, {currentUser?.name || 'Alex'}
            </h1>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed max-w-2xl">
              Tu fiscalidad está organizada. Revisa solo lo que requiere acción y deja el resto en segundo plano.
            </p>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone-500">
              <span><strong className="text-stone-700">IAE</strong> {currentUser?.iaeCode || '849.5'}</span>
              <span><strong className="text-stone-700">RETA</strong> {currentUser?.socialSecurityType === 'tarifa_plana' ? 'Tarifa plana' : 'General'}</span>
              <span><strong className="text-stone-700">Vehículo</strong> {currentUser?.vehicleType?.toUpperCase() || 'MOTO'}</span>
            </div>
          </div>

          <button
            onClick={() => setView?.('tax-declarations')}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2E5A44] px-4 py-3 text-sm font-semibold text-white hover:bg-[#244A37] transition-colors"
          >
            <FileText size={17} strokeWidth={2.1} />
            Revisar trimestre
          </button>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-800">Acciones rápidas</h2>
          <span className="text-[11px] text-stone-400">Solo lo importante</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className="group rounded-2xl border border-[#E4DDD2] bg-white px-4 py-4 text-left shadow-sm hover:border-[#CFC4B5] transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#F0F4F1] text-[#2E5A44] flex items-center justify-center shrink-0">
                      <Icon size={19} strokeWidth={2.1} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-stone-900">{action.label}</p>
                      <p className="text-xs text-stone-500 mt-0.5 truncate">{action.description}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-stone-300 group-hover:text-stone-500 transition-colors shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => setView?.('money')}
          className="rounded-2xl border border-[#E4DDD2] bg-white p-4 text-left shadow-sm hover:border-[#CFC4B5] transition-colors"
        >
          <Wallet size={18} className="text-[#2E5A44]" strokeWidth={2.1} />
          <p className="mt-3 text-[11px] uppercase tracking-wide font-semibold text-stone-400">Ingresos</p>
          <p className="mt-1 text-xl font-bold text-stone-900">{formatCurrency(summary.totalIncome)}</p>
        </button>

        <button
          onClick={() => setView?.('money')}
          className="rounded-2xl border border-[#E4DDD2] bg-white p-4 text-left shadow-sm hover:border-[#CFC4B5] transition-colors"
        >
          <ReceiptText size={18} className="text-[#C96846]" strokeWidth={2.1} />
          <p className="mt-3 text-[11px] uppercase tracking-wide font-semibold text-stone-400">Gastos</p>
          <p className="mt-1 text-xl font-bold text-stone-900">{formatCurrency(summary.totalExpenses)}</p>
        </button>

        <button
          onClick={() => setView?.('tax-declarations')}
          className="rounded-2xl border border-[#E4DDD2] bg-white p-4 text-left shadow-sm hover:border-[#CFC4B5] transition-colors"
        >
          <ShieldCheck size={18} className="text-[#2E5A44]" strokeWidth={2.1} />
          <p className="mt-3 text-[11px] uppercase tracking-wide font-semibold text-stone-400">Beneficio neto</p>
          <p className="mt-1 text-xl font-bold text-stone-900">{formatCurrency(summary.netProfit)}</p>
        </button>

        <button
          onClick={() => setView?.('messages')}
          className="rounded-2xl border border-[#E4DDD2] bg-white p-4 text-left shadow-sm hover:border-[#CFC4B5] transition-colors"
        >
          <MessageSquare size={18} className="text-[#2E5A44]" strokeWidth={2.1} />
          <p className="mt-3 text-[11px] uppercase tracking-wide font-semibold text-stone-400">Gestoría</p>
          <p className="mt-1 text-sm font-bold text-stone-900">Mensajes</p>
        </button>
      </section>

      {pendingRequirements.length > 0 && (
        <section className="rounded-2xl border border-[#E8D7C8] bg-[#FFF9F4] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-9 h-9 rounded-xl bg-[#F7E8DE] text-[#B55D3D] flex items-center justify-center shrink-0">
                <Bell size={17} strokeWidth={2.1} />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-900">
                  {pendingRequirements.length === 1 ? 'Tienes 1 aviso pendiente' : `Tienes ${pendingRequirements.length} avisos pendientes`}
                </p>
                <p className="text-xs text-stone-500 mt-1">Tu gestor necesita una acción antes del cierre del trimestre.</p>
              </div>
            </div>
            <button
              onClick={() => setView?.('gestor-requirements')}
              className="text-xs font-bold text-[#2E5A44] whitespace-nowrap"
            >
              Ver avisos
            </button>
          </div>
        </section>
      )}

      <GasStationCaptureModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
